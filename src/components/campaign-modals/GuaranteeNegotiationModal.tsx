import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { KeenIcon } from '@/components';
import { useAuthContext } from '@/auth';
import { supabase } from '@/supabase';
import { negotiationService, guaranteeSlotRequestService, guaranteeSlotService } from '@/services/guaranteeSlotService';
import { fileUploadService } from '@/services/fileUploadService';
import { STORAGE_CONFIG, getUploadPath } from '@/config/storage.config';
import type {
  GuaranteeSlotNegotiation,
  NegotiationMessageType,
  GuaranteeSlotRequestStatus,
  AttachmentFile
} from '@/types/guarantee-slot.types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CAMPAIGNS } from '@/config/campaign.config';
import { SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';
import { USER_ROLES, hasPermission, PERMISSION_GROUPS } from '@/config/roles.config';
import GuaranteeNegotiationCompleteModal from '@/components/guarantee-slots/GuaranteeNegotiationCompleteModal';
import GuaranteeNegotiationRejectModal from '@/components/guarantee-slots/GuaranteeNegotiationRejectModal';

interface GuaranteeNegotiationModalProps {
  open: boolean;
  onClose: () => void;
  requestId: string;
  requestData?: any;
  currentUserRole: 'user' | 'distributor';
  onStatusChange?: (status: GuaranteeSlotRequestStatus) => void;
  isPurchaseMode?: boolean; // 구매 버튼으로 열린 경우
  isFromDistributorPage?: boolean; // 보장형 슬롯 관리 페이지에서 열렸는지
}

interface NegotiationMessage extends GuaranteeSlotNegotiation {
  senderName?: string;
  sender_role?: string;
}

export const GuaranteeNegotiationModal: React.FC<GuaranteeNegotiationModalProps> = ({
  open,
  onClose,
  requestId,
  requestData,
  currentUserRole,
  onStatusChange,
  isPurchaseMode = false,
  isFromDistributorPage = false
}) => {
  const { currentUser } = useAuthContext();
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [proposedAmount, setProposedAmount] = useState('');
  const [proposedGuaranteeCount, setProposedGuaranteeCount] = useState('');
  const [proposedTargetRank, setProposedTargetRank] = useState('');
  const [proposedWorkPeriod, setProposedWorkPeriod] = useState('');
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [priceInputType, setPriceInputType] = useState<'daily' | 'total'>('daily');
  const [requestInfo, setRequestInfo] = useState<any>(null);
  const [showInputDataModal, setShowInputDataModal] = useState(false);
  const [showInputDataTooltip, setShowInputDataTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string } | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [renegotiateLoading, setRenegotiateLoading] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [showNegotiationCompleteModal, setShowNegotiationCompleteModal] = useState(false);
  const [negotiationCompleteData, setNegotiationCompleteData] = useState<{
    proposedAmount: number;
    guaranteeCount: number;
    proposedDailyAmount?: number;
    proposedTotalAmount?: number;
    budgetType?: 'daily' | 'total';
    workPeriod?: number;
    isFinalComplete?: boolean;
    targetRank?: number;
  } | null>(null);
  const [showNegotiationRejectModal, setShowNegotiationRejectModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef<boolean>(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 캠페인 로고 가져오기 (보장형 목록과 정확히 동일)
  const getCampaignLogo = (item: any): string => {
    // 캠페인 로고가 있으면 우선 사용
    if (item?.campaigns?.logo) {
      if (!item.campaigns.logo.startsWith('http') && !item.campaigns.logo.startsWith('/')) {
        return `/media/${item.campaigns.logo}`;
      }
      return item.campaigns.logo;
    }

    // 없으면 서비스 타입에 따른 기본 로고 사용
    const service = item?.campaigns?.service_type || item?.service_type || '';
    if (service.includes('naver') || service.includes('Naver')) {
      return '/media/ad-brand/naver.png';
    } else if (service.includes('coupang') || service.includes('Coupang')) {
      return '/media/ad-brand/coupang-app.png';
    } else if (service.includes('ohouse')) {
      return '/media/ad-brand/ohouse.png';
    }

    return '/media/app/mini-logo-circle-gray.svg';
  };

  // 서비스 로고와 라벨 가져오기
  const getServiceInfo = (serviceType: string) => {
    // CAMPAIGNS 설정에서 해당 서비스 타입 찾기
    for (const campaign of CAMPAIGNS) {
      const type = campaign.types.find(t => t.code === serviceType);
      if (type) {
        let logo = '';

        // 서비스 타입에 따른 로고 설정
        if (serviceType.includes('Shopping')) {
          logo = '/media/ad-brand/naver-shopping.png';
        } else if (serviceType.includes('Place')) {
          logo = '/media/ad-brand/naver-place.png';
        } else if (serviceType.includes('Blog')) {
          logo = '/media/ad-brand/naver-blog.png';
        } else if (serviceType.includes('Auto')) {
          logo = '/media/ad-brand/naver.png';
        } else if (serviceType.includes('Coupang')) {
          logo = '/media/ad-brand/coupang-app.png';
        } else {
          logo = campaign.logo || '/media/app/mini-logo-circle-gray.svg';
        }

        return {
          logo,
          label: SERVICE_TYPE_LABELS[serviceType] || type.name || serviceType
        };
      }
    }

    // 기본값
    return {
      logo: '/media/app/mini-logo-circle-gray.svg',
      label: serviceType
    };
  };

  // 컴포넌트 마운트/언마운트 관리
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 메시지가 추가되면 스크롤을 아래로 이동
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ESC 키 처리 - 통합
  useEffect(() => {
    let isProcessing = false;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !purchaseLoading && !isProcessing) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        // 중복 처리 방지
        isProcessing = true;

        // 우선순위에 따라 처리
        if (showFinalConfirm) {
          // 최종 확인 모달만 닫기
          setShowFinalConfirm(false);
          // 약간의 지연 후 플래그 리셋
          setTimeout(() => { isProcessing = false; }, 100);
        } else if (showPurchaseModal) {
          // 구매 확인 모달만 닫기
          setShowPurchaseModal(false);
          setTimeout(() => { isProcessing = false; }, 100);
        } else if (showNegotiationCompleteModal) {
          // 협상 완료 확인 모달 닫기
          setShowNegotiationCompleteModal(false);
          setTimeout(() => { isProcessing = false; }, 100);
        } else if (showNegotiationRejectModal) {
          // 협상 거절 확인 모달 닫기
          setShowNegotiationRejectModal(false);
          setTimeout(() => { isProcessing = false; }, 100);
        } else if (isImageModalOpen) {
          // 이미지 모달 닫기
          closeImageModal();
          setTimeout(() => { isProcessing = false; }, 100);
        } else {
          isProcessing = false;
        }
      }
    };

    // 모달이 하나라도 열려있을 때만 이벤트 리스너 추가
    if (showFinalConfirm || showPurchaseModal || isImageModalOpen || showNegotiationCompleteModal || showNegotiationRejectModal) {
      // capture phase에서 처리하여 이벤트 전파 차단
      window.addEventListener('keydown', handleEsc, true);
      return () => window.removeEventListener('keydown', handleEsc, true);
    }
  }, [showFinalConfirm, showPurchaseModal, isImageModalOpen, showNegotiationCompleteModal, showNegotiationRejectModal, purchaseLoading]);

  // 보장 단위 가져오기 (캐페인 설정에 따라)
  const getGuaranteeUnit = () => {
    return requestInfo?.campaigns?.guarantee_unit || requestData?.campaigns?.guarantee_unit || '일';
  };

  // 단위에 따른 표기 텍스트
  const getUnitText = () => {
    const unit = getGuaranteeUnit();
    return unit === '회' ? '회당' : '일당';
  };

  // 견적 요청 정보 가져오기
  const fetchRequestInfo = useCallback(async () => {
    if (!requestId || !isMountedRef.current) return;

    try {
      const { data, error } = await guaranteeSlotRequestService.getRequestById(requestId);
      if (error) throw error;

      if (isMountedRef.current) {
        setRequestInfo(data);
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast.error('견적 요청 정보를 불러오는데 실패했습니다.');
      }
    }
  }, [requestId, requestInfo?.campaigns?.guarantee_unit, requestData?.campaigns?.guarantee_unit, currentUserRole, currentUser?.id]);


  // 협상 메시지 가져오기 (초기 로드용)
  const fetchMessages = useCallback(async (isInitialLoad = false) => {
    if (!requestId || !isMountedRef.current) return;

    try {
      if (isInitialLoad) {
        setLoadingMessages(true);
      }

      // 1. 먼저 협상 메시지들을 가져오기
      const { data: negotiations, error } = await supabase
        .from('guarantee_slot_negotiations')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // 2. 발신자 정보를 별도로 가져오기 (데이터가 있는 경우만)
      let usersMap: Record<string, any> = {};
      if (negotiations.length > 0) {
        const senderIds = [...new Set(negotiations.map(n => n.sender_id))];
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, email, role')
          .in('id', senderIds);

        if (usersError) throw usersError;

        usersMap = users.reduce((acc: Record<string, any>, user) => {
          acc[user.id] = user;
          return acc;
        }, {});
      }

      // 3. 데이터 조합
      const data = negotiations.map(negotiation => ({
        ...negotiation,
        users: usersMap[negotiation.sender_id]
      }));

      if (isMountedRef.current) {
        const formattedMessages: NegotiationMessage[] = data.map((msg: any) => ({
          ...msg,
          senderName: msg.users?.full_name || msg.users?.email || '사용자',
          sender_role: msg.sender_type === 'user' ? 'user' :
            msg.sender_type === 'distributor' ? 'distributor' :
              msg.users?.role
        }));

        setMessages(formattedMessages);

        // 읽지 않은 메시지 읽음 처리
        const unreadMessages = formattedMessages.filter(
          msg => !msg.is_read && msg.sender_id !== currentUser?.id
        );

        if (unreadMessages.length > 0) {
          await negotiationService.markAsRead(unreadMessages.map(msg => msg.id));
        }

        // 초기 로드 시에만 스크롤
        if (isInitialLoad) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
          }, 100);
        }
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast.error('협상 내역을 불러오는데 실패했습니다.');
      }
    } finally {
      if (isMountedRef.current && isInitialLoad) {
        setLoadingMessages(false);
      }
    }
  }, [requestId, currentUser?.id]);

  // 일반 메시지 전송
  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachments.length === 0) || !currentUser?.id || loading) return;

    try {
      setLoading(true);

      const { data, error } = await negotiationService.createMessage(
        {
          request_id: requestId,
          message: inputValue.trim() || '파일을 첨부했습니다.',
          message_type: 'message',
          attachments: attachments.length > 0 ? attachments : undefined,
          isFromDistributorPage
        },
        currentUser.id,
        currentUserRole
      );

      if (error) throw error;

      if (isMountedRef.current) {
        setInputValue('');
        setAttachments([]);

        // 새 메시지를 즉시 추가 (부드러운 업데이트, 중복 체크)
        if (data) {
          const newMessage: NegotiationMessage = {
            ...data,
            senderName: currentUser.full_name || currentUser.email || '사용자',
            sender_role: currentUserRole,
            sender_type: currentUserRole as 'user' | 'distributor'
          };
          setMessages(prev => {
            // 이미 존재하는 메시지인지 확인
            if (prev.some(m => m.id === data.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }

        toast.success('메시지가 전송되었습니다.');
        // 입력 필드에 포커스 유지
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast.error('메시지 전송에 실패했습니다.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // 가격 제안 전송
  const handleSendPriceProposal = async () => {
    if (!proposedAmount.trim() || !proposedGuaranteeCount.trim() || !currentUser?.id || loading) return;

    const amount = parseInt(proposedAmount.replace(/,/g, ''));
    const guaranteeCount = parseInt(proposedGuaranteeCount);
    const targetRank = proposedTargetRank ? parseInt(proposedTargetRank) : requestInfo?.target_rank;
    const workPeriod = proposedWorkPeriod ? parseInt(proposedWorkPeriod) : (requestInfo?.guarantee_period || 1);

    if (isNaN(amount) || amount <= 0) {
      toast.error('올바른 금액을 입력해주세요.');
      return;
    }

    if (isNaN(guaranteeCount) || guaranteeCount <= 0) {
      toast.error(`올바른 보장 ${getGuaranteeUnit()}수를 입력해주세요.`);
      return;
    }

    if (proposedTargetRank && (isNaN(targetRank) || targetRank <= 0)) {
      toast.error('올바른 목표 순위를 입력해주세요.');
      return;
    }

    if (proposedWorkPeriod && (isNaN(workPeriod) || workPeriod <= 0)) {
      toast.error('올바른 작업 기간을 입력해주세요.');
      return;
    }

    // 작업기간이 보장횟수보다 적으면 안됨
    if (workPeriod < guaranteeCount) {
      toast.error(`작업 기간은 보장 ${getGuaranteeUnit()}수 이상이어야 합니다.`);
      return;
    }

    try {
      setLoading(true);

      const messageType: NegotiationMessageType = messages.some(m =>
        m.message_type === 'price_proposal' || m.message_type === 'counter_offer'
      ) ? 'counter_offer' : 'price_proposal';

      let message = '';
      let dailyAmount = amount;

      // 목표 순위와 작업 기간이 변경되었는지 확인
      const isTargetRankChanged = targetRank !== requestInfo?.target_rank;
      const isWorkPeriodChanged = workPeriod !== (requestInfo?.guarantee_period || requestInfo?.guarantee_count);

      if (priceInputType === 'total') {
        // 총액으로 입력한 경우
        message = `${currentUserRole === 'distributor' ? '제안 금액' : '희망 예산'}: ${amount.toLocaleString()}원 (총액)`;
        dailyAmount = amount; // 총액 그대로 저장 (budget_type으로 구분)
      } else {
        // 일별/회당으로 입력한 경우
        const totalAmount = amount * workPeriod;
        message = `${currentUserRole === 'distributor' ? '제안 금액' : '희망 예산'}: ${amount.toLocaleString()}원/${getGuaranteeUnit()} × ${workPeriod}${getGuaranteeUnit()} (총 ${totalAmount.toLocaleString()}원)`;
        dailyAmount = amount;
      }

      // 목표 순위와 작업 기간 변경 사항 추가
      if (isTargetRankChanged || isWorkPeriodChanged) {
        message += '\n\n[변경 사항]';
        if (isTargetRankChanged) {
          message += `\n• 목표 순위: ${requestInfo?.target_rank}위 → ${targetRank}위`;
        }
        if (isWorkPeriodChanged) {
          message += `\n• 작업 기간: ${requestInfo?.guarantee_period || requestInfo?.guarantee_count}${getGuaranteeUnit()} → ${workPeriod}${getGuaranteeUnit()}`;
        }
        if (guaranteeCount !== requestInfo?.guarantee_count) {
          message += `\n• 보장 횟수: ${requestInfo?.guarantee_count}${getGuaranteeUnit()} → ${guaranteeCount}${getGuaranteeUnit()}`;
        }
      }

      // 메시지 조합: 가격 정보는 항상 포함하고, 추가 메시지가 있으면 아래에 추가
      const finalMessage = inputValue.trim()
        ? `${message}\n\n${inputValue.trim()}`
        : message;

      const { data, error } = await negotiationService.createMessage(
        {
          request_id: requestId,
          message: finalMessage,
          message_type: messageType,
          proposed_daily_amount: dailyAmount,
          proposed_guarantee_count: guaranteeCount,
          proposed_total_amount: priceInputType === 'total' ? amount : (amount * workPeriod),
          proposed_work_period: workPeriod,
          proposed_target_rank: targetRank,
          budget_type: priceInputType,
          attachments: attachments.length > 0 ? attachments : undefined,
          isFromDistributorPage
        },
        currentUser.id,
        currentUserRole
      );

      if (error) throw error;

      if (isMountedRef.current) {
        setInputValue('');
        setProposedAmount('');
        setProposedGuaranteeCount('');
        setProposedTargetRank('');
        setProposedWorkPeriod('');
        setAttachments([]);
        setShowPriceForm(false);
        setPriceInputType('daily');

        // 새 메시지를 즉시 추가 (부드러운 업데이트, 중복 체크)
        if (data) {
          const newMessage: NegotiationMessage = {
            ...data,
            senderName: currentUser.full_name || currentUser.email || '사용자',
            sender_role: currentUserRole,
            sender_type: currentUserRole as 'user' | 'distributor'
          };
          setMessages(prev => {
            // 이미 존재하는 메시지인지 확인
            if (prev.some(m => m.id === data.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }

        toast.success('가격 제안이 전송되었습니다.');
        // 입력 필드에 포커스 유지
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast.error('가격 제안 전송에 실패했습니다.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // 협상 수락 버튼 클릭 시 확인 모달 표시
  const handleAcceptNegotiationClick = () => {
    const lastPriceMessage = [...messages]
      .reverse()
      .find(m => m.message_type === 'price_proposal' || m.message_type === 'counter_offer');

    if (!lastPriceMessage?.proposed_daily_amount) {
      toast.error('확정할 가격이 없습니다.');
      return;
    }

    const finalGuaranteeCount = lastPriceMessage.proposed_guarantee_count || requestInfo?.guarantee_count || 0;
    const finalTargetRank = lastPriceMessage.proposed_target_rank || requestInfo?.target_rank || 0;

    // budget_type 확인 (새 필드가 있으면 사용, 없으면 메시지에서 확인)
    const isTotalPrice = lastPriceMessage.budget_type === 'total' ||
      (lastPriceMessage.message?.includes('희망 예산: 총') ||
        lastPriceMessage.message?.includes('제안 금액: 총'));

    // 작업기간 (제안된 작업기간이 있으면 사용)
    const workPeriod = lastPriceMessage.proposed_work_period || requestInfo?.guarantee_period || 1;

    // 총액인 경우와 일별인 경우 구분하여 처리
    let finalDailyAmount = lastPriceMessage.proposed_daily_amount;
    let finalTotalAmount = lastPriceMessage.proposed_total_amount || lastPriceMessage.proposed_daily_amount;

    if (lastPriceMessage.budget_type === 'total') {
      // 총액으로 제안된 경우
      finalTotalAmount = lastPriceMessage.proposed_total_amount || lastPriceMessage.proposed_daily_amount;
      finalDailyAmount = Math.round(finalTotalAmount / workPeriod);
    } else {
      // 일별로 제안된 경우
      finalDailyAmount = lastPriceMessage.proposed_daily_amount;
      finalTotalAmount = lastPriceMessage.proposed_total_amount || (finalDailyAmount * workPeriod);
    }

    // 가장 최근 가격 제안 이후의 수락 메시지만 확인
    const lastPriceIndex = messages.findIndex(m => m.id === lastPriceMessage.id);
    const acceptanceMessages = messages.slice(lastPriceIndex + 1).filter(m => m.message_type === 'acceptance');

    const userAlreadyAccepted = acceptanceMessages.some(m =>
      m.sender_role === 'user' || m.sender_type === 'user'
    );
    const distributorAlreadyAccepted = acceptanceMessages.some(m =>
      m.sender_role === 'distributor' || m.sender_type === 'distributor'
    );

    // 총판이고, 양측이 모두 수락한 상태에서만 최종 협상 완료 가능
    const isFinalComplete = currentUserRole === 'distributor' && userAlreadyAccepted && distributorAlreadyAccepted;


    const completeData = {
      proposedAmount: finalDailyAmount,  // 기존 필드명 유지
      proposedDailyAmount: finalDailyAmount,
      proposedTotalAmount: finalTotalAmount,
      guaranteeCount: finalGuaranteeCount,
      targetRank: finalTargetRank,
      budgetType: lastPriceMessage.budget_type || (isTotalPrice ? 'total' as const : 'daily' as const),
      workPeriod: workPeriod,
      isFinalComplete: isFinalComplete  // 최종 협상 완료 여부
    };

    setNegotiationCompleteData(completeData);
    setShowNegotiationCompleteModal(true);
  };

  // 협상 수락 처리
  const handleAcceptNegotiation = async () => {
    if (!currentUser?.id || loading || !negotiationCompleteData) return;


    try {
      setLoading(true);

      // 최종 협상 완료 처리
      if (negotiationCompleteData.isFinalComplete) {
        // 상태를 'accepted'로 변경
        const { error } = await guaranteeSlotRequestService.updateRequestStatus(
          requestId,
          'accepted',
          negotiationCompleteData.proposedDailyAmount || negotiationCompleteData.proposedAmount,
          negotiationCompleteData.guaranteeCount,
          negotiationCompleteData.budgetType,
          negotiationCompleteData.proposedTotalAmount,
          negotiationCompleteData.targetRank,
          negotiationCompleteData.workPeriod
        );

        if (error) throw error;

        // 로컬 상태 업데이트
        setRequestInfo((prev: any) => prev ? {
          ...prev,
          status: 'accepted',
          final_daily_amount: negotiationCompleteData.proposedDailyAmount || negotiationCompleteData.proposedAmount,
          guarantee_count: negotiationCompleteData.guaranteeCount,
          final_budget_type: negotiationCompleteData.budgetType,
          final_total_amount: negotiationCompleteData.proposedTotalAmount,
          target_rank: negotiationCompleteData.targetRank,
          guarantee_period: negotiationCompleteData.workPeriod
        } : prev);

        // 최종 완료 메시지
        const dailyAmount = negotiationCompleteData.proposedDailyAmount || negotiationCompleteData.proposedAmount;
        const totalAmount = negotiationCompleteData.proposedTotalAmount || (dailyAmount * negotiationCompleteData.guaranteeCount);
        const workPeriod = negotiationCompleteData.workPeriod || negotiationCompleteData.guaranteeCount;

        let completionMessage = '';
        if (negotiationCompleteData.budgetType === 'total') {
          completionMessage = `협상이 완료되었습니다. 최종 조건: 총 ${negotiationCompleteData.proposedTotalAmount?.toLocaleString()}원 (VAT 별도, ${getUnitText()} ${dailyAmount.toLocaleString()}원 × ${workPeriod}${getGuaranteeUnit()})`;
        } else {
          completionMessage = `협상이 완료되었습니다. 최종 조건: ${dailyAmount.toLocaleString()}원/${getGuaranteeUnit()} × ${workPeriod}${getGuaranteeUnit()} (총 ${totalAmount.toLocaleString()}원, VAT 별도)`;
        }

        await negotiationService.createMessage(
          {
            request_id: requestId,
            message: completionMessage,
            message_type: 'message',
            isFromDistributorPage
          },
          currentUser.id,
          currentUserRole
        );

        if (isMountedRef.current) {
          toast.success('협상이 최종 완료되었습니다.');
          onStatusChange?.('accepted');
        }
      }
      // 사용자가 수락하는 경우
      else if (currentUserRole === 'user') {
        // 사용자 수락 메시지 전송
        let acceptanceMessage = '';
        if (negotiationCompleteData.budgetType === 'total') {
          // 총액으로 제안된 경우
          acceptanceMessage = `제안된 조건을 수락합니다. (총 ${negotiationCompleteData.proposedTotalAmount?.toLocaleString()}원, VAT 별도)`;
        } else {
          // 일별로 제안된 경우
          acceptanceMessage = `제안된 조건을 수락합니다. (${negotiationCompleteData.proposedDailyAmount?.toLocaleString() || negotiationCompleteData.proposedAmount.toLocaleString()}원/${getGuaranteeUnit()} × ${negotiationCompleteData.guaranteeCount}${getGuaranteeUnit()})`;
        }

        const { data, error } = await negotiationService.createMessage(
          {
            request_id: requestId,
            message: acceptanceMessage,
            message_type: 'acceptance',
            proposed_daily_amount: negotiationCompleteData.proposedDailyAmount || negotiationCompleteData.proposedAmount,
            proposed_guarantee_count: negotiationCompleteData.guaranteeCount,
            budget_type: negotiationCompleteData.budgetType,
            proposed_total_amount: negotiationCompleteData.proposedTotalAmount,
            proposed_work_period: negotiationCompleteData.workPeriod,
            proposed_target_rank: negotiationCompleteData.targetRank,
            isFromDistributorPage
          },
          currentUser.id,
          currentUserRole
        );

        if (error) throw error;

        if (isMountedRef.current) {
          // 새 메시지를 즉시 추가 (중복 체크)
          if (data) {
            const newMessage: NegotiationMessage = {
              ...data,
              senderName: currentUser.full_name || currentUser.email || '사용자',
              sender_role: 'user',
              sender_type: 'user' as const
            };
            setMessages(prev => {
              // 이미 존재하는 메시지인지 확인
              if (prev.some(m => m.id === data.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });
          }

          toast.success('협상 수락을 전송했습니다. 총판의 최종 승인을 기다려주세요.');
          setShowNegotiationCompleteModal(false);
          setNegotiationCompleteData(null);
        }
      }
      // 총판이 수락하는 경우
      else {
        // 총판 수락 메시지 전송
        let acceptanceMessage = '';
        if (negotiationCompleteData.budgetType === 'total') {
          acceptanceMessage = `총판이 조건을 수락했습니다. (총 ${negotiationCompleteData.proposedTotalAmount?.toLocaleString()}원, VAT 별도)`;
        } else {
          acceptanceMessage = `총판이 조건을 수락했습니다. (${negotiationCompleteData.proposedDailyAmount?.toLocaleString() || negotiationCompleteData.proposedAmount.toLocaleString()}원/${getGuaranteeUnit()} × ${negotiationCompleteData.guaranteeCount}${getGuaranteeUnit()})`;
        }

        const { data, error } = await negotiationService.createMessage(
          {
            request_id: requestId,
            message: acceptanceMessage,
            message_type: 'acceptance',
            proposed_daily_amount: negotiationCompleteData.proposedDailyAmount || negotiationCompleteData.proposedAmount,
            proposed_guarantee_count: negotiationCompleteData.guaranteeCount,
            budget_type: negotiationCompleteData.budgetType,
            proposed_total_amount: negotiationCompleteData.proposedTotalAmount,
            proposed_work_period: negotiationCompleteData.workPeriod,
            proposed_target_rank: negotiationCompleteData.targetRank,
            isFromDistributorPage
          },
          currentUser.id,
          currentUserRole
        );

        if (error) throw error;

        if (isMountedRef.current) {
          toast.success('협상 수락을 전송했습니다.');
        }

        if (isMountedRef.current) {
          setShowNegotiationCompleteModal(false);
          setNegotiationCompleteData(null);
          await fetchMessages(false); // 로딩 표시 없이 메시지만 업데이트
        }
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast.error('협상 수락에 실패했습니다.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // 협상 거절 버튼 클릭 시 확인 모달 표시
  const handleRejectNegotiationClick = () => {
    setShowNegotiationRejectModal(true);
  };

  // 협상 거절 처리
  const handleRejectNegotiation = async () => {
    if (!currentUser?.id || loading) return;

    try {
      setLoading(true);

      // 견적 상태를 거절로 변경
      const { error } = await guaranteeSlotRequestService.updateRequestStatus(requestId, 'rejected');

      if (error) throw error;

      // 거절 메시지 전송
      await negotiationService.createMessage(
        {
          request_id: requestId,
          message: '협상이 거절되었습니다.',
          message_type: 'message',
          isFromDistributorPage
        },
        currentUser.id,
        currentUserRole
      );

      if (isMountedRef.current) {
        toast.success('협상이 거절되었습니다.');
        onStatusChange?.('rejected');
        setShowNegotiationRejectModal(false);
        await fetchMessages();
        await fetchRequestInfo(); // 상태 새로고침 추가
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast.error('협상 거절에 실패했습니다.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // 모달이 열릴 때 데이터 로드, 닫힐 때 툴팁 초기화
  useEffect(() => {
    if (open && requestId) {
      fetchRequestInfo();
      fetchMessages(true); // 초기 로드임을 표시
    } else if (!open) {
      // 모달이 닫힐 때 툴팁도 닫기
      setShowInputDataTooltip(false);
    }
  }, [open, requestId]);


  // 툴팁 외부 클릭시 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      if (showInputDataTooltip) {
        setShowInputDataTooltip(false);
      }
    };

    if (showInputDataTooltip) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showInputDataTooltip]);

  // 새로운 메시지 확인 (실시간 구독 대신 효율적인 폴링)
  useEffect(() => {
    if (!open || !requestId) return;

    // 마지막으로 확인한 시간 추적
    let lastCheckedTime = new Date().toISOString();

    const checkNewMessages = async () => {
      if (!isMountedRef.current || document.hidden) return;

      try {
        // 마지막 확인 시간 이후의 메시지만 가져오기
        const { data: newMessages, error } = await supabase
          .from('guarantee_slot_negotiations')
          .select('*')
          .eq('request_id', requestId)
          .gt('created_at', lastCheckedTime)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (newMessages && newMessages.length > 0) {
          // 발신자 정보 가져오기
          const senderIds = [...new Set(newMessages.map(n => n.sender_id))];
          const { data: users } = await supabase
            .from('users')
            .select('id, full_name, email, role')
            .in('id', senderIds);

          const usersMap = users?.reduce((acc: Record<string, any>, user) => {
            acc[user.id] = user;
            return acc;
          }, {}) || {};

          const formattedNewMessages: NegotiationMessage[] = newMessages.map((msg: any) => ({
            ...msg,
            senderName: usersMap[msg.sender_id]?.full_name || usersMap[msg.sender_id]?.email || '사용자',
            sender_role: msg.sender_type || usersMap[msg.sender_id]?.role
          }));

          // 새 메시지만 추가 (깜빡임 없음)
          setMessages(prev => {
            // 중복 방지
            const existingIds = new Set(prev.map(m => m.id));
            const uniqueNewMessages = formattedNewMessages.filter(m => !existingIds.has(m.id));
            if (uniqueNewMessages.length === 0) return prev;
            return [...prev, ...uniqueNewMessages];
          });

          // 자신이 보낸 메시지가 아닌 경우 읽음 처리
          const unreadMessages = formattedNewMessages.filter(
            msg => msg.sender_id !== currentUser?.id && !msg.is_read
          );
          if (unreadMessages.length > 0) {
            await negotiationService.markAsRead(unreadMessages.map(msg => msg.id));
          }

          // 스크롤 위치 확인 후 자동 스크롤
          const container = messagesEndRef.current?.parentElement;
          if (container) {
            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
            if (isAtBottom) {
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }
          }

          // 마지막 확인 시간 업데이트
          lastCheckedTime = new Date().toISOString();

          // 협상 완료 메시지가 있으면 요청 정보도 새로고침
          const hasCompletionMessage = formattedNewMessages.some(msg =>
            msg.message?.includes('협상이 완료되었습니다')
          );

          // 재협상 메시지가 있으면 요청 정보도 새로고침
          const hasRenegotiateMessage = formattedNewMessages.some(msg =>
            msg.message?.includes('재협상을 요청합니다')
          );

          if (hasCompletionMessage || hasRenegotiateMessage) {
            await fetchRequestInfo();
          }
        }
      } catch (error) {
      }
    };

    // 2초마다 새 메시지 확인
    const interval = setInterval(checkNewMessages, 2000);

    return () => clearInterval(interval);
  }, [open, requestId, currentUser?.id]);

  // 가격 포맷팅
  const formatCurrency = (value: string) => {
    const number = value.replace(/[^0-9]/g, '');
    if (!number) return '';
    return parseInt(number).toLocaleString();
  };


  // 메시지 렌더링
  const renderMessage = (message: NegotiationMessage, index: number) => {
    // 메시지 발신자 확인
    const isDistributor = message.sender_type === 'distributor';

    // 현재 사용자가 보는 화면에 따라 메시지 위치 결정
    let isMyMessage: boolean;
    if (currentUserRole === 'user') {
      // 일반 사용자가 보는 경우: 자신이 보낸 메시지가 오른쪽(파란색)
      isMyMessage = message.sender_id === currentUser?.id;
    } else {
      // 총판/운영자가 보는 경우: 총판이 보낸 메시지가 오른쪽(파란색)
      isMyMessage = isDistributor;
    }

    const isSystemMessage = false; // 시스템 메시지는 현재 지원하지 않음
    const isPriceMessage = message.message_type === 'price_proposal' || message.message_type === 'counter_offer';
    const isAcceptanceMessage = message.message_type === 'acceptance';

    // 시간 그룹화 (기존 채팅과 동일한 로직)
    const shouldShowTime = index === 0 ||
      message.sender_id !== messages[index - 1]?.sender_id ||
      new Date(message.created_at).getTime() - new Date(messages[index - 1]?.created_at).getTime() > 5 * 60 * 1000;

    const messageClasses = [
      'chat-sticky-message',
      isMyMessage && 'chat-sticky-message-mine',
      !isMyMessage && !isSystemMessage && 'chat-sticky-message-other',
      isSystemMessage && 'chat-sticky-message-system',
      isPriceMessage && 'border-l-4 border-l-primary bg-primary/5',
      isAcceptanceMessage && 'border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/20'
    ].filter(Boolean).join(' ');

    return (
      <div key={message.id} className={messageClasses}>
        {/* 발신자 이름 - 모든 메시지에 표시 */}
        {shouldShowTime && (
          <div className="chat-sticky-message-sender flex items-center gap-2">
            <span>{message.senderName || '-'}</span>
            {(() => {
              // 메시지 발신자의 역할 확인
              const senderRole = message.sender_type === 'distributor' ?
                USER_ROLES.DISTRIBUTOR :
                message.sender_role;

              // 역할별 배지 표시
              if (senderRole === USER_ROLES.DEVELOPER) {
                return (
                  <span className="badge badge-outline rounded-[30px] text-purple-600 border-purple-600 text-xs px-2 py-0.5">
                    개발자
                  </span>
                );
              } else if (senderRole === USER_ROLES.OPERATOR) {
                return (
                  <span className="badge badge-outline rounded-[30px] text-indigo-600 border-indigo-600 text-xs px-2 py-0.5">
                    운영자
                  </span>
                );
              } else if (senderRole === USER_ROLES.DISTRIBUTOR) {
                return (
                  <span className="badge badge-outline rounded-[30px] text-amber-600 border-amber-600 text-xs px-2 py-0.5">
                    총판
                  </span>
                );
              } else {
                // 대행사, 광고주, 비기너는 모두 '사용자'로 표시
                return (
                  <span className="badge badge-outline rounded-[30px] text-blue-600 border-blue-600 text-xs px-2 py-0.5">
                    사용자
                  </span>
                );
              }
            })()}
          </div>
        )}

        {/* 메시지 내용 */}
        <div className="chat-sticky-message-content">
          {message.message}
          {/* 수락 메시지인 경우 */}
          {isAcceptanceMessage && message.proposed_daily_amount && (
            <div className="mt-2 p-2 bg-white dark:bg-gray-700 rounded border">
              <div className="flex items-center gap-2 mb-2">
                <KeenIcon icon="check-circle" className="text-green-600 size-5" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {message.sender_role === 'user' ? '사용자가' : '총판이'} 제안을 수락했습니다
                </span>
              </div>
              <div className="text-sm font-medium text-primary space-y-1">
                {/* budget_type과 proposed_total_amount 사용 */}
                {(() => {
                  const workPeriod = message.proposed_work_period || requestInfo?.guarantee_period || 1;

                  if (message.budget_type === 'total') {
                    // 총액으로 수락한 경우
                    const totalAmount = message.proposed_total_amount || message.proposed_daily_amount;
                    const dailyAmount = Math.round(totalAmount / workPeriod);
                    return (
                      <>
                        <div>수락한 금액: 총 {totalAmount.toLocaleString()}원</div>
                        <div>일별 금액: {dailyAmount.toLocaleString()}원/{getGuaranteeUnit()}</div>
                        <div>작업기간: {workPeriod}{getGuaranteeUnit()}</div>
                        <div>보장 순위: {message.proposed_target_rank || requestInfo?.target_rank || 0}위</div>
                        <div>보장 {getGuaranteeUnit()}수: {message.proposed_guarantee_count || requestInfo?.guarantee_count || 0}{getGuaranteeUnit()}</div>
                        <div className="text-green-600 font-semibold">
                          총 금액: {totalAmount.toLocaleString()}원 (VAT 별도)
                        </div>
                      </>
                    );
                  } else {
                    // 일별로 수락한 경우
                    const totalAmount = message.proposed_total_amount || (message.proposed_daily_amount * workPeriod);
                    return (
                      <>
                        <div>수락한 금액: {message.proposed_daily_amount.toLocaleString()}원/{getGuaranteeUnit()}</div>
                        <div>작업기간: {workPeriod}{getGuaranteeUnit()}</div>
                        <div>보장 순위: {message.proposed_target_rank || requestInfo?.target_rank || 0}위</div>
                        <div>보장 {getGuaranteeUnit()}수: {message.proposed_guarantee_count || requestInfo?.guarantee_count || 0}{getGuaranteeUnit()}</div>
                        <div className="text-green-600 font-semibold">
                          총 금액: {totalAmount.toLocaleString()}원 (VAT 별도)
                        </div>
                      </>
                    );
                  }
                })()}
              </div>
            </div>
          )}
          {/* 가격 제안 메시지인 경우 */}
          {isPriceMessage && message.proposed_daily_amount && (
            <div className="mt-2 p-2 bg-white dark:bg-gray-700 rounded border">
              <div className="text-sm font-medium text-primary space-y-1">
                {/* budget_type과 proposed_total_amount 사용 */}
                {(() => {
                  const workPeriod = message.proposed_work_period || requestInfo?.guarantee_period || 1;

                  if (message.budget_type === 'total') {
                    // 총액으로 제안한 경우
                    const totalAmount = message.proposed_total_amount || message.proposed_daily_amount;
                    const dailyAmount = Math.round(totalAmount / workPeriod);
                    return (
                      <>
                        <div>제안 금액: 총 {totalAmount.toLocaleString()}원</div>
                        <div>일별 금액: {dailyAmount.toLocaleString()}원/{getGuaranteeUnit()}</div>
                        <div>작업기간: {workPeriod}{getGuaranteeUnit()}</div>
                        <div>보장 순위: {message.proposed_target_rank || requestInfo?.target_rank || 0}위</div>
                        <div>보장 {getGuaranteeUnit()}수: {message.proposed_guarantee_count || requestInfo?.guarantee_count || 0}{getGuaranteeUnit()}</div>
                      </>
                    );
                  } else {
                    // 일별로 제안한 경우
                    const totalAmount = message.proposed_total_amount || (message.proposed_daily_amount * workPeriod);
                    return (
                      <>
                        <div>제안 금액: {message.proposed_daily_amount.toLocaleString()}원/{getGuaranteeUnit()}</div>
                        <div>작업기간: {workPeriod}{getGuaranteeUnit()}</div>
                        <div>보장 순위: {message.proposed_target_rank || requestInfo?.target_rank || 0}위</div>
                        <div>보장 {getGuaranteeUnit()}수: {message.proposed_guarantee_count || requestInfo?.guarantee_count || 0}{getGuaranteeUnit()}</div>
                        <div className="text-blue-600 font-semibold">
                          총 금액: {totalAmount.toLocaleString()}원 (VAT 별도)
                        </div>
                      </>
                    );
                  }
                })()}
              </div>
            </div>
          )}

          {/* 첨부파일 표시 */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, attachIndex) => (
                <div key={attachIndex} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded">
                  {fileUploadService.isImageFile({ type: attachment.type } as File) ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="w-16 h-16 object-cover rounded cursor-pointer hover:scale-110 transition-transform"
                      onClick={() => handleImageClick(attachment)}
                      title="클릭하여 원본 보기"
                    />
                  ) : (
                    <div className="w-16 h-16 flex items-center justify-center bg-orange-100 dark:bg-orange-800 rounded">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600 dark:text-orange-400">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10,9 9,9 8,9" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-gray-800 dark:text-gray-200" title={attachment.name}>
                      {attachment.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {fileUploadService.formatFileSize(attachment.size)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {attachment.type}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {/* 이미지 파일인 경우 보기 버튼 */}
                    {fileUploadService.isImageFile({ type: attachment.type } as File) && (
                      <button
                        onClick={() => handleImageClick(attachment)}
                        className="text-primary hover:text-primary-dark text-xs px-2 py-1 rounded border border-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
                        title="원본 보기"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        보기
                      </button>
                    )}

                    {/* 다운로드 버튼 (모든 파일) */}
                    <button
                      onClick={async () => {
                        if (downloadingFile) return;
                        setDownloadingFile(attachment.url);
                        const success = await fileUploadService.downloadFile(attachment.url, attachment.name);
                        if (!success) {
                          toast.error('파일 다운로드에 실패했습니다.');
                        }
                        setDownloadingFile(null);
                      }}
                      disabled={downloadingFile === attachment.url}
                      className="text-primary hover:text-primary-dark text-xs px-2 py-1 rounded border border-primary hover:bg-primary/10 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="파일 다운로드"
                    >
                      {downloadingFile === attachment.url ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                            <path d="M12 2v4m0 12v4m8-8h-4M6 12H2m15.364-6.364L14.95 8.05M9.05 14.95l-2.414 2.414M17.364 17.364L14.95 14.95M9.05 9.05L6.636 6.636" />
                          </svg>
                          처리중...
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7,10 12,15 17,10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          다운로드
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 메시지 시간 */}
        {shouldShowTime && (
          <div className="chat-sticky-message-time">
            {formatDistanceToNow(new Date(message.created_at), {
              addSuffix: true,
              locale: ko
            })}
          </div>
        )}
      </div>
    );
  };

  // 파일 선택 처리
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    setUploadingFiles(true);
    try {
      const fileArray = Array.from(files);

      // 파일 타입 및 크기 검증
      const validFiles = fileArray.filter(file => {
        if (!fileUploadService.isValidFileSize(file, STORAGE_CONFIG.LIMITS.MAX_FILE_SIZE_MB)) {
          toast.error(`${file.name}은(는) 파일 크기가 ${STORAGE_CONFIG.LIMITS.MAX_FILE_SIZE_MB}MB를 초과합니다.`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        return;
      }

      // 파일 업로드
      const { data: uploadedFiles, errors } = await fileUploadService.uploadMultipleFiles(
        validFiles,
        STORAGE_CONFIG.UPLOADS_BUCKET,
        getUploadPath.guaranteeNegotiation(requestId)
      );

      if (errors.length > 0) {
        toast.error('일부 파일 업로드에 실패했습니다.');
      }

      if (uploadedFiles.length > 0) {
        setAttachments(prev => [...prev, ...uploadedFiles]);
        toast.success(`${uploadedFiles.length}개 파일이 첨부되었습니다.`);
      }
    } catch (error) {
      toast.error('파일 업로드에 실패했습니다.');
    } finally {
      setUploadingFiles(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 첨부파일 제거
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // 파일 선택 다이얼로그 열기
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // 이미지 클릭 처리 (모달 보기)
  const handleImageClick = (attachment: AttachmentFile) => {
    setSelectedImage({
      src: attachment.url,
      title: attachment.name
    });
    setIsImageModalOpen(true);
  };

  // 이미지 모달 닫기 함수
  const closeImageModal = useCallback(() => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
  }, []);

  // ESC 키로 모달 닫기 (우선순위: 구매모달 > 이미지모달 > 메인모달)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showPurchaseModal) {
          setShowPurchaseModal(false);
        } else if (isImageModalOpen) {
          closeImageModal();
        }
      }
    };

    if (showPurchaseModal || isImageModalOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showPurchaseModal, isImageModalOpen, closeImageModal]);

  // 파일 다운로드 처리
  const handleFileDownload = async (attachment: AttachmentFile) => {
    if (downloadingFile) return; // 이미 다운로드 중이면 무시

    try {
      setDownloadingFile(attachment.url);

      if (fileUploadService.isImageFile({ type: attachment.type } as File)) {
        // 이미지는 모달에서 보기
        handleImageClick(attachment);
      } else {
        // 일반 파일은 다운로드
        const success = await fileUploadService.downloadFile(attachment.url, attachment.name);
        if (success) {
          toast.success('파일 다운로드가 시작되었습니다.');
        } else {
          toast.error('파일 다운로드에 실패했습니다.');
        }
      }
    } catch (error) {
      toast.error('파일 처리 중 오류가 발생했습니다.');
    } finally {
      setDownloadingFile(null);
    }
  };

  // 구매 처리 함수
  const handlePurchaseSlot = async () => {
    if (!currentUser?.id || !requestInfo?.final_daily_amount || purchaseLoading) return;

    // 최종 확인 모달 표시
    setShowFinalConfirm(true);
  };

  // 최종 구매 확정 처리
  const handleFinalPurchaseConfirm = async () => {
    if (!currentUser?.id || !requestInfo?.final_daily_amount || purchaseLoading) return;

    try {
      setPurchaseLoading(true);
      setShowFinalConfirm(false);

      // guaranteeSlotService를 사용하여 구매 처리
      const { data, error } = await guaranteeSlotService.purchaseSlot(
        {
          request_id: requestId,
          purchase_reason: '사용자 구매 확정'
        },
        currentUser.id
      );

      if (error) throw error;

      if (isMountedRef.current) {
        toast.success('보장형 슬롯을 성공적으로 구매했습니다!');
        setShowPurchaseModal(false);
        onStatusChange?.('purchased');
        await fetchRequestInfo(); // 상태 새로고침
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast.error('구매 처리 중 오류가 발생했습니다.');
      }
    } finally {
      if (isMountedRef.current) {
        setPurchaseLoading(false);
      }
    }
  };

  // 재협상 처리 함수
  const handleRenegotiate = async () => {
    if (!currentUser?.id || renegotiateLoading) return;

    try {
      setRenegotiateLoading(true);

      // 견적 상태를 다시 협상 중으로 변경
      const { error } = await guaranteeSlotRequestService.updateRequestStatus(requestId, 'negotiating');

      if (error) throw error;

      // 재협상 메시지 전송
      await negotiationService.createMessage(
        {
          request_id: requestId,
          message: '재협상을 요청합니다. 조건을 다시 협의해주세요.',
          message_type: 'renegotiation_request',
          isFromDistributorPage
        },
        currentUser.id,
        currentUserRole
      );

      if (isMountedRef.current) {
        toast.success('재협상이 요청되었습니다.');
        onStatusChange?.('negotiating');
        await fetchRequestInfo(); // 상태 새로고침
        await fetchMessages();
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast.error('재협상 요청에 실패했습니다.');
      }
    } finally {
      if (isMountedRef.current) {
        setRenegotiateLoading(false);
      }
    }
  };

  // 현재 상태 확인
  const currentStatus = requestInfo?.status || requestData?.status;
  const isNegotiationActive = currentStatus === 'requested' || currentStatus === 'negotiating';
  const canSendMessages = isNegotiationActive;

  // 디버깅을 위한 로깅
  React.useEffect(() => {
    if (open && requestInfo) {
    }
  }, [open, currentStatus, currentUserRole, requestInfo?.final_daily_amount, requestInfo?.guarantee_count]);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={isImageModalOpen || showPurchaseModal || showFinalConfirm || showNegotiationCompleteModal || showNegotiationRejectModal ? undefined : onClose}
      >
        <DialogContent
          className="max-w-3xl h-[80vh] flex flex-col"
          aria-describedby={undefined}
        >
          {/* 확인 모달이 열렸을 때 협상 모달을 가리는 오버레이 */}
          {(showNegotiationCompleteModal || showNegotiationRejectModal) && (
            <div className="absolute inset-0 bg-black/20 z-[10005] rounded-lg" />
          )}
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <KeenIcon icon="message-text" className="size-5 text-primary" />
              견적 협상
              {currentStatus && (
                <span className={`badge badge-sm ${currentStatus === 'accepted' ? 'badge-success' :
                  currentStatus === 'rejected' ? 'badge-danger' :
                    currentStatus === 'negotiating' ? 'badge-warning' :
                      'badge-info'
                  }`}>
                  {currentStatus === 'accepted' ? '협상 완료' :
                    currentStatus === 'rejected' ? '협상 거절' :
                      currentStatus === 'negotiating' ? '협상 중' :
                        '요청됨'}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="flex-1 flex flex-col overflow-hidden">

            {/* 요청 정보 */}
            {requestInfo && (
              <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <div className="space-y-4 text-sm">
                  {/* 첫 번째 행 - 서비스, 캠페인, 키워드 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">서비스:</span>
                      <div className="flex items-center gap-2 mt-1">
                        {(() => {
                          const serviceInfo = getServiceInfo(requestInfo.campaigns?.service_type || '');
                          return (
                            <>
                              <img
                                src={serviceInfo.logo}
                                alt="서비스 로고"
                                className="w-4 h-4 object-contain rounded flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/media/app/mini-logo-circle-gray.svg';
                                }}
                              />
                              <span className="font-medium text-sm truncate">
                                {serviceInfo.label}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">캠페인:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <img
                          src={getCampaignLogo(requestInfo)}
                          alt="캠페인 로고"
                          className="w-4 h-4 object-contain rounded flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/media/app/mini-logo-circle-gray.svg';
                          }}
                        />
                        <span className="font-medium text-sm truncate">
                          {requestInfo.campaigns?.campaign_name || `캠페인 #${requestInfo.campaign_id}`}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">키워드:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(() => {
                          const keywords = requestInfo.keywords || requestData?.keywords;
                          const keywordArray = [];

                          if (keywords?.main_keyword) {
                            keywordArray.push(keywords.main_keyword);
                          }
                          if (keywords?.keyword1) keywordArray.push(keywords.keyword1);
                          if (keywords?.keyword2) keywordArray.push(keywords.keyword2);
                          if (keywords?.keyword3) keywordArray.push(keywords.keyword3);

                          return keywordArray.length > 0 ? (
                            <>
                              <span className="badge badge-primary badge-xs">
                                {keywordArray[0]}
                              </span>
                              {keywordArray.length > 1 && (
                                <span className="badge badge-outline badge-xs">
                                  +{keywordArray.length - 1}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">없음</span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* 두 번째 행 - 목표순위, 보장기간, 희망예산, 추가정보 */}
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">목표 순위:</span>
                      <div className="font-medium">{requestInfo.target_rank}위</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">작업기간/보장:</span>
                      <div className="font-medium">
                        {requestInfo.guarantee_period || requestInfo.guarantee_count}{getGuaranteeUnit()} / {requestInfo.guarantee_count}{getGuaranteeUnit()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">희망 예산:</span>
                      <div className="font-medium">
                        {requestInfo.initial_budget ? (
                          requestInfo.budget_type === 'total'
                            ? `총 ${requestInfo.initial_budget.toLocaleString()}원`
                            : `${requestInfo.initial_budget.toLocaleString()}원/${getGuaranteeUnit()}`
                        ) : '미설정'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">추가 정보:</span>
                      <div className="flex items-center gap-2 mt-1">
                        {(() => {
                          const inputData = requestInfo.input_data || requestData?.input_data;
                          if (!inputData) return <span className="text-gray-400 text-xs">없음</span>;

                          const passItem = ['keywords', 'mainKeyword', 'keyword1', 'keyword2', 'keyword3', 'due_date', 'dueDays', 'is_manual_input'];
                          const userInputFields = Object.entries(inputData).filter(([key]) =>
                            !passItem.includes(key) && !key.endsWith('_fileName')
                          );

                          if (userInputFields.length === 0) return <span className="text-gray-400 text-xs">없음</span>;

                          return (
                            <button
                              className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                setTooltipPosition({
                                  top: rect.top - 10,
                                  left: rect.left + rect.width / 2
                                });
                                setShowInputDataTooltip(!showInputDataTooltip);
                              }}
                            >
                              {userInputFields.length}개 필드
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* 협상 완료 금액 (있는 경우만 표시) */}
                  {requestInfo.final_daily_amount && (
                    <div className="md:col-span-2">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">협상 완료 금액:</span>
                        <div className="font-medium text-green-600">
                          {requestInfo.final_daily_amount.toLocaleString()}원/{getGuaranteeUnit()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 메시지 영역 (기존 채팅과 동일한 구조) - isPurchaseMode일 때는 숨김 */}
            {!isPurchaseMode && (
              <div className="flex-1 chat-sticky-messages overflow-y-auto relative">
                {/* 양측 수락 상태 표시 - 채팅 영역 상단에 고정 오버레이 */}
                {canSendMessages && currentStatus === 'negotiating' && messages.some(m => m.message_type === 'price_proposal' || m.message_type === 'counter_offer') && (() => {
                  // 재협상 요청 메시지가 있는지 확인
                  const renegotiationRequestIndex = [...messages]
                    .reverse()
                    .findIndex(m => m.message_type === 'renegotiation_request');

                  // 마지막 가격 제안 찾기
                  const lastPriceMessage = [...messages]
                    .reverse()
                    .find(m => m.message_type === 'price_proposal' || m.message_type === 'counter_offer');

                  // 재협상 요청 후에 새로운 가격 제안이 없으면 sticky 숨김
                  if (renegotiationRequestIndex !== -1) {
                    const lastPriceIndex = messages.findIndex(m => m === lastPriceMessage);
                    const renegotiationIndex = messages.length - 1 - renegotiationRequestIndex;

                    if (lastPriceIndex < renegotiationIndex) {
                      return null; // 재협상 후 새 가격 제안이 없음
                    }
                  }

                  // 모든 acceptance 메시지 가져오기
                  const acceptanceMessages = messages.filter(m => m.message_type === 'acceptance');

                  // 마지막 가격 제안 이후의 acceptance만 유효
                  const lastPriceMessageIndex = messages.findIndex(m => m === lastPriceMessage);
                  const validAcceptances = acceptanceMessages.filter((m, idx) => {
                    const msgIndex = messages.findIndex(msg => msg === m);
                    return msgIndex > lastPriceMessageIndex;
                  });

                  const userAcceptance = validAcceptances.find(m =>
                    m.sender_role === 'user' || m.sender_type === 'user'
                  );

                  const distributorAcceptance = validAcceptances.find(m =>
                    m.sender_role === 'distributor' || m.sender_type === 'distributor'
                  );

                  if (lastPriceMessage && (userAcceptance || distributorAcceptance)) {
                    return (
                      <div className="sticky -top-1 left-0 right-0 z-20 flex justify-center pt-1 pb-2 pointer-events-none">
                        <div className="bg-indigo-600 dark:bg-indigo-700 text-white border border-indigo-700 dark:border-indigo-800 rounded-lg px-4 py-2 shadow-xl">
                          <div className="flex items-center justify-center gap-3">
                            <div className="flex items-center gap-2">
                              <KeenIcon icon={userAcceptance ? "check-circle" : "clock"}
                                className={`size-4 ${userAcceptance ? 'text-green-300' : 'text-gray-300'}`} />
                              <span className={`text-xs font-medium ${userAcceptance ? 'text-white' : 'text-gray-300'}`}>
                                사용자 {userAcceptance ? '수락' : '대기'}
                              </span>
                            </div>
                            <div className="text-indigo-300">|</div>
                            <div className="flex items-center gap-2">
                              <KeenIcon icon={distributorAcceptance ? "check-circle" : "clock"}
                                className={`size-4 ${distributorAcceptance ? 'text-green-300' : 'text-gray-300'}`} />
                              <span className={`text-xs font-medium ${distributorAcceptance ? 'text-white' : 'text-gray-300'}`}>
                                총판 {distributorAcceptance ? '수락' : '대기'}
                              </span>
                            </div>
                            {userAcceptance && distributorAcceptance && (
                              <>
                                <div className="text-indigo-300">|</div>
                                <span className="text-xs text-green-300 font-medium">
                                  양측 합의 완료
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {loadingMessages ? (
                  <div className="chat-sticky-messages-loading">
                    메시지를 불러오는 중...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-sticky-messages-empty">
                    <div className="chat-sticky-messages-empty-icon">
                      <KeenIcon icon="message-text" className="text-4xl text-gray-300" />
                    </div>
                    협상을 시작해주세요.<br />
                    {currentUserRole === 'distributor' ?
                      '가격을 제안하거나 메시지를 보내세요.' :
                      '문의사항이나 협상 내용을 입력해주세요.'
                    }
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) =>
                      renderMessage(message, index)
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            )}

            {/* 입력 영역 - isPurchaseMode일 때는 숨김 */}
            {!isPurchaseMode && canSendMessages ? (
              <div className="flex-shrink-0 space-y-3">
                {/* 가격 제안 폼 */}
                {showPriceForm && (
                  <div className="border rounded-lg p-3 bg-primary/5">
                    <div className="space-y-3">
                      {/* 입력 방식 토글 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">입력 방식</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setPriceInputType('daily')}
                            className={`px-3 py-1 text-xs rounded-l-md transition-colors ${priceInputType === 'daily'
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                          >
                            {getGuaranteeUnit() === '회' ? '회당' : '일별'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPriceInputType('total')}
                            className={`px-3 py-1 text-xs rounded-r-md transition-colors ${priceInputType === 'total'
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                          >
                            총액
                          </button>
                        </div>
                      </div>

                      {/* 가격과 보장횟수 입력 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {priceInputType === 'daily' ? `${getUnitText()} 금액` : '총 금액'}
                          </label>
                          <Input
                            type="text"
                            value={proposedAmount}
                            onChange={(e) => setProposedAmount(formatCurrency(e.target.value))}
                            placeholder={priceInputType === 'daily'
                              ? `${getUnitText()} 금액 (원/${getGuaranteeUnit()})`
                              : '총 금액 (원)'
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            보장 {getGuaranteeUnit()}수
                          </label>
                          <Input
                            type="text"
                            value={proposedGuaranteeCount}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '');
                              setProposedGuaranteeCount(value);
                            }}
                            placeholder={`보장 ${getGuaranteeUnit()}수`}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* 목표 순위와 작업 기간 입력 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            목표 순위
                          </label>
                          <Input
                            type="text"
                            value={proposedTargetRank}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '');
                              setProposedTargetRank(value);
                            }}
                            placeholder="목표 순위 (위)"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            작업 기간
                          </label>
                          <Input
                            type="text"
                            value={proposedWorkPeriod}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '');
                              setProposedWorkPeriod(value);
                            }}
                            placeholder={`작업 기간 (${getGuaranteeUnit()})`}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {priceInputType === 'daily' ? (
                          <>
                            * {getUnitText()} 단가와 보장 {getGuaranteeUnit()}수를 입력해주세요
                            {proposedGuaranteeCount && proposedAmount && (
                              <span className="font-medium text-blue-600 ml-2">
                                (총 금액: {(parseInt(proposedAmount.replace(/[^0-9]/g, '')) * (proposedWorkPeriod ? parseInt(proposedWorkPeriod) : (requestInfo?.guarantee_period || parseInt(proposedGuaranteeCount)))).toLocaleString()}원, VAT 별도)
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            * 총 금액과 보장 {getGuaranteeUnit()}수를 입력해주세요
                            {proposedGuaranteeCount && proposedAmount && (
                              <span className="font-medium text-blue-600 ml-2">
                                ({getUnitText()}: {Math.round(parseInt(proposedAmount.replace(/[^0-9]/g, '')) / (proposedWorkPeriod ? parseInt(proposedWorkPeriod) : (requestInfo?.guarantee_period || 1))).toLocaleString()}원, VAT 별도)
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* 추가 메시지 영역 */}
                      <div className="space-y-2">
                        <Textarea
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder="추가 메시지 (선택사항)"
                          rows={2}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={openFileDialog}
                            disabled={uploadingFiles}
                            className="text-xs"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49" />
                            </svg>
                            파일 첨부
                          </Button>
                          {uploadingFiles && (
                            <span className="text-xs text-gray-500">업로드 중...</span>
                          )}
                        </div>
                      </div>

                      {/* 버튼 영역 */}
                      <div className="flex gap-2 justify-end">
                        <Button
                          onClick={handleSendPriceProposal}
                          disabled={!proposedAmount.trim() || !proposedGuaranteeCount.trim() || loading}
                          size="sm"
                        >
                          제안
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowPriceForm(false);
                            setProposedAmount('');
                            setProposedGuaranteeCount('');
                            setProposedTargetRank('');
                            setProposedWorkPeriod('');
                            setPriceInputType('daily');
                          }}
                          size="sm"
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 첨부파일 미리보기 */}
                {attachments.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2">
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      첨부파일 ({attachments.length}개)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((attachment, index) => (
                        <div key={index} className="relative group">
                          {fileUploadService.isImageFile({ type: attachment.type } as File) ? (
                            <div className="relative">
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="w-16 h-16 object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => handleImageClick(attachment)}
                                title="클릭하여 원본 보기"
                              />
                              <button
                                onClick={() => handleRemoveAttachment(index)}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded min-w-0">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 dark:text-blue-400 flex-shrink-0">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14,2 14,8 20,8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10,9 9,9 8,9" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate max-w-24 text-gray-800 dark:text-gray-200" title={attachment.name}>
                                  {attachment.name}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {fileUploadService.formatFileSize(attachment.size)}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveAttachment(index)}
                                className="w-4 h-4 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center flex-shrink-0"
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 숨겨진 파일 입력 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={STORAGE_CONFIG.LIMITS.ALLOWED_TYPES.join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* 일반 메시지 입력 */}
                {!showPriceForm && (
                  <div className="chat-sticky-input-area">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="메시지를 입력하세요..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={loading}
                      className="chat-sticky-input"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={loading || (!inputValue.trim() && attachments.length === 0)}
                      className="w-8 h-8 bg-primary hover:bg-primary-dark rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={openFileDialog}
                      disabled={loading || uploadingFiles}
                      className="w-8 h-8 bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="파일 첨부"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* 액션 버튼들 */}
                <div className="flex gap-2 justify-between">
                  <div className="flex gap-2">
                    {!showPriceForm && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setShowPriceForm(true);
                            // 초기값 설정
                            setProposedTargetRank(requestInfo?.target_rank?.toString() || '');
                            setProposedWorkPeriod(requestInfo?.guarantee_period?.toString() || requestInfo?.guarantee_count?.toString() || '');
                            setProposedGuaranteeCount(requestInfo?.guarantee_count?.toString() || '');
                          }}
                          disabled={loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-1">
                            <path d="M12 2v20M2 12h20" />
                          </svg>
                          가격 제안
                        </Button>
                        <Button
                          size="sm"
                          onClick={openFileDialog}
                          disabled={loading || uploadingFiles}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-1">
                            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49" />
                          </svg>
                          파일 첨부
                        </Button>
                      </>
                    )}
                  </div>


                  {/* 수락/거절/닫기 버튼 */}
                  <div className="flex gap-2">
                    {/* 수락/거절 버튼 - 항상 표시하되 조건부 비활성화 */}
                    {messages.some(m => m.message_type === 'price_proposal' || m.message_type === 'counter_offer') && (() => {
                      // 재협상 요청 확인
                      const renegotiationRequest = [...messages]
                        .reverse()
                        .find(m => m.message_type === 'renegotiation_request');
                      const renegotiationIndex = renegotiationRequest ? messages.indexOf(renegotiationRequest) : -1;

                      // 마지막 가격 제안 정보 가져오기
                      const lastPriceMessage = [...messages]
                        .reverse()
                        .find(m => m.message_type === 'price_proposal' || m.message_type === 'counter_offer');
                      const lastPriceIndex = messages.findIndex(m => m === lastPriceMessage);

                      // 재협상 요청이 마지막 가격 제안보다 나중이면 버튼 비활성화
                      const isAfterRenegotiation = renegotiationIndex > lastPriceIndex;

                      // 마지막 제안자가 상대방인 경우
                      const lastPriceSender = lastPriceMessage?.sender_type || lastPriceMessage?.sender_role;
                      const isOtherPartyProposal = lastPriceMessage && (
                        (currentUserRole === 'distributor' && lastPriceSender === 'user') ||
                        (currentUserRole === 'user' && lastPriceSender === 'distributor')
                      );

                      // 마지막 가격 제안 이후의 acceptance 메시지만 유효
                      const acceptanceMessages = messages.filter((m, idx) =>
                        m.message_type === 'acceptance' && idx > lastPriceIndex
                      );


                      // 사용자가 이미 수락했는지 확인
                      const userAlreadyAccepted = acceptanceMessages.some(m =>
                        (m.sender_role === 'user' || m.sender_type === 'user')
                      );

                      // 총판이 이미 수락했는지 확인
                      const distributorAlreadyAccepted = acceptanceMessages.some(m =>
                        (m.sender_role === 'distributor' || m.sender_type === 'distributor')
                      );

                      // 버튼 활성화 조건
                      let canAccept = false;
                      let buttonText = '협상 수락';

                      // 재협상 요청 후 새 가격 제안이 없으면 버튼 비활성화
                      if (isAfterRenegotiation) {
                        canAccept = false;
                      } else if (currentUserRole === 'distributor') {
                        // 총판인 경우
                        if (userAlreadyAccepted && distributorAlreadyAccepted) {
                          // 양측이 모두 수락한 경우 최종 협상 완료 가능
                          canAccept = true;
                          buttonText = '최종 협상 완료';
                        } else if (!distributorAlreadyAccepted) {
                          // 총판이 아직 수락하지 않은 경우
                          // 1. 사용자가 제안한 경우
                          // 2. 총판이 제안하고 사용자가 수락한 경우
                          canAccept = isOtherPartyProposal || userAlreadyAccepted;
                        }
                      } else {
                        // 사용자인 경우
                        if (!userAlreadyAccepted) {
                          // 사용자가 아직 수락하지 않은 경우
                          // 1. 총판이 제안한 경우
                          // 2. 사용자가 제안하고 총판이 수락한 경우
                          canAccept = isOtherPartyProposal || distributorAlreadyAccepted;
                        }
                        // 양측 수락 후에는 사용자는 버튼 비활성화 (구매하기로 진행)
                      }

                      return (
                        <>
                          <Button
                            size="sm"
                            onClick={handleAcceptNegotiationClick}
                            disabled={loading || !canAccept}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            <KeenIcon icon="check-circle" className="size-4 me-1" />
                            {buttonText}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRejectNegotiationClick}
                            disabled={loading || !canAccept}
                            className="border-red-200 text-red-600 hover:bg-red-50 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            <KeenIcon icon="cross-circle" className="size-4 me-1" />
                            거절
                          </Button>
                        </>
                      );
                    })()}

                    {/* 닫기 버튼 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onClose}
                      className="border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-1">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                      닫기
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-shrink-0 space-y-4">
                {/* 재협상 안내 (협상중 상태로 변경되었을 때) */}
                {currentStatus === 'negotiating' && messages.some(msg => msg.message?.includes('재협상을 요청합니다')) && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200 mb-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                        <path d="M3 21v-5h5" />
                      </svg>
                      <span className="font-semibold">재협상이 시작되었습니다</span>
                    </div>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      {currentUserRole === 'user' ?
                        '총판이 재협상을 요청했습니다. 새로운 조건을 협의해주세요.' :
                        '재협상이 진행 중입니다. 새로운 조건을 제안해주세요.'
                      }
                    </p>
                  </div>
                )}

                {/* 구매 섹션 (협상 완료 시 광고주에게만 표시) */}
                {currentStatus === 'accepted' && currentUserRole === 'user' && requestInfo?.final_daily_amount && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                        <KeenIcon icon="dollar" className="size-4" />
                        구매 정보
                      </h4>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                          {(requestInfo.final_daily_amount * (requestInfo.guarantee_period || requestInfo.guarantee_count)).toLocaleString()}원
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          (VAT 포함: {Math.floor(requestInfo.final_daily_amount * (requestInfo.guarantee_period || requestInfo.guarantee_count) * 1.1).toLocaleString()}원)
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                      목표 {requestInfo.target_rank}위 · 보장 {requestInfo.guarantee_count}{getGuaranteeUnit()} · 작업기간 {requestInfo.guarantee_period || requestInfo.guarantee_count}{getGuaranteeUnit()} · {getUnitText()} {requestInfo.final_daily_amount.toLocaleString()}원
                    </div>

                    <div className="pt-2 border-t border-blue-200 dark:border-blue-700 flex justify-between">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleRenegotiate}
                          disabled={purchaseLoading || renegotiateLoading}
                          className="border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20 font-medium px-6"
                        >
                          {renegotiateLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                              처리 중...
                            </>
                          ) : (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                                <path d="M21 3v5h-5" />
                                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                                <path d="M3 21v-5h5" />
                              </svg>
                              재협상
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => setShowPurchaseModal(true)}
                          disabled={purchaseLoading || renegotiateLoading}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                            <rect width="20" height="14" x="2" y="5" rx="2" />
                            <line x1="2" x2="22" y1="10" y2="10" />
                          </svg>
                          구매하기
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        <KeenIcon icon="cross" className="size-4 me-1" />
                        닫기
                      </Button>
                    </div>
                  </div>
                )}

                {/* 총판용 협상 완료 안내 (협상 완료 시 총판에게만 표시, 구매 모드 제외) */}
                {currentStatus === 'accepted' && !isPurchaseMode && (currentUserRole === 'distributor' || hasPermission(currentUser?.role, PERMISSION_GROUPS.ADMIN)) && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
                      <KeenIcon icon="check-circle" className="size-5" />
                      <span className="font-semibold">협상이 완료되었습니다!</span>
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <p>최종 조건: {requestInfo?.final_daily_amount?.toLocaleString() || 0}원/{getUnitText()} × {requestInfo?.guarantee_period || requestInfo?.guarantee_count || 0}{getGuaranteeUnit()}</p>
                      <p>총 금액: {requestInfo?.final_daily_amount && requestInfo?.guarantee_period ?
                        (requestInfo.final_daily_amount * (requestInfo.guarantee_period || requestInfo.guarantee_count)).toLocaleString() : '0'}원 (VAT 별도)</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                        <KeenIcon icon="information-2" className="size-3 inline mr-1" />
                        사용자가 구매를 진행할 수 있도록 알림이 전송되었습니다.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-green-200 dark:border-green-700 flex justify-between">
                      <Button
                        variant="outline"
                        onClick={handleRenegotiate}
                        disabled={renegotiateLoading}
                        className="border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20 font-medium px-6"
                      >
                        {renegotiateLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                            처리 중...
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                              <path d="M21 3v5h-5" />
                              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                              <path d="M3 21v-5h5" />
                            </svg>
                            재협상 요청
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        <KeenIcon icon="cross" className="size-4 me-1" />
                        닫기
                      </Button>
                    </div>
                  </div>
                )}

                {/* 구매 완료 안내 (구매 완료 시 표시) */}
                {currentStatus === 'purchased' && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
                      <KeenIcon icon="check-circle" className="size-5" />
                      <span className="font-semibold">구매 완료</span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                      보장형 슬롯 구매가 완료되었습니다.
                      {currentUserRole === 'user' ?
                        ' 구매한 슬롯은 "이용 중인 서비스" 페이지에서 확인할 수 있습니다.' :
                        ' 슬롯 관리 페이지에서 진행 상황을 관리할 수 있습니다.'
                      }
                    </p>
                    <div className="pt-2 border-t border-green-200 dark:border-green-700 flex justify-end">
                      <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        <KeenIcon icon="cross" className="size-4 me-1" />
                        닫기
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogBody>
        </DialogContent>

        {/* 추가 정보 툴팁 */}
        {showInputDataTooltip && (requestInfo?.input_data || requestData?.input_data) && ReactDOM.createPortal(
          <>
            {/* 배경 클릭 시 닫기 */}
            <div
              className="fixed inset-0"
              style={{ zIndex: 9998 }}
              onClick={() => setShowInputDataTooltip(false)}
            />
            <div
              className="fixed bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 text-xs rounded p-2 w-80 max-h-64 shadow-xl border border-gray-700 dark:border-gray-600"
              style={{
                zIndex: 9999,
                left: `${tooltipPosition.left}px`,
                top: `${tooltipPosition.top}px`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <div className="flex items-center justify-between mb-2 border-b border-gray-700 dark:border-gray-600 pb-1">
                <span className="font-medium text-gray-100 dark:text-gray-200">추가 정보</span>
                <button
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInputDataTooltip(false);
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div
                className="overflow-y-auto max-h-48 pr-2"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="space-y-1">
                  {(() => {
                    const inputData = requestInfo?.input_data || requestData?.input_data;
                    const passItem = ['keywords', 'mainKeyword', 'keyword1', 'keyword2', 'keyword3', 'due_date', 'dueDays', 'is_manual_input'];
                    const userInputFields = Object.entries(inputData).filter(([key]) =>
                      !passItem.includes(key) && !key.endsWith('_fileName')
                    );

                    return userInputFields.map(([key, value]) => {
                      // 파일 URL인지 확인
                      const isFileUrl = value && typeof value === 'string' &&
                        (value.includes('supabase.co/storage/') || value.includes('/storage/v1/object/'));

                      // 이미지 파일인지 확인
                      const isImage = isFileUrl && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value);

                      // 파일명 추출
                      const fileNameKey = `${key}_fileName`;
                      const fileName = inputData[fileNameKey] || (isFileUrl ? value.split('/').pop() || '파일' : '');

                      // 필드명 한글 변환
                      const fieldNameMap: Record<string, string> = {
                        'work_days': '작업일',
                        'minimum_purchase': '최소 구매수',
                        'url': 'URL',
                        'mid': '상점 ID',
                        'productName': '상품명',
                        'mainKeyword': '메인 키워드',
                        'keywords': '서브 키워드',
                        'keyword1': '키워드1',
                        'keyword2': '키워드2',
                        'keyword3': '키워드3',
                        'quantity': '작업량',
                        'dueDays': '작업기간',
                        'workCount': '작업수',
                        'start_date': '시작일',
                        'end_date': '종료일'
                      };
                      const displayKey = fieldNameMap[key] || key;

                      return (
                        <div key={key} className="flex items-start gap-2 text-left py-1 border-b border-gray-800 dark:border-gray-700 last:border-0">
                          <span className="font-medium text-gray-300 dark:text-gray-400 min-w-[80px] shrink-0">{displayKey}</span>
                          <span className="text-gray-400 dark:text-gray-500">:</span>
                          <span className="text-gray-100 dark:text-gray-200 flex-1 break-words">
                            {isFileUrl ? (
                              isImage ? (
                                <button
                                  className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImage({ src: value, title: fileName });
                                    setIsImageModalOpen(true);
                                    setShowInputDataTooltip(false);
                                  }}
                                >
                                  {fileName}
                                </button>
                              ) : (
                                <a
                                  href={value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {fileName}
                                </a>
                              )
                            ) : (
                              value ? String(value) : '-'
                            )}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </>,
          document.body
        )}

        {/* 추가 정보 모달 */}
        <Dialog open={showInputDataModal} onOpenChange={setShowInputDataModal}>
          <DialogContent className="max-w-2xl" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeenIcon icon="information-2" className="size-5 text-primary" />
                사용자 입력 상세 정보
              </DialogTitle>
            </DialogHeader>
            <DialogBody>
              <div className="space-y-4">
                {(() => {
                  const inputData = requestInfo?.input_data || requestData?.input_data;
                  if (!inputData) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        추가 입력 정보가 없습니다.
                      </div>
                    );
                  }

                  return Object.entries(inputData).map(([key, value]) => {
                    if (!value || (typeof value === 'string' && !value.trim())) return null;

                    return (
                      <div key={key} className="border rounded-lg p-3">
                        <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </div>
                      </div>
                    );
                  }).filter(Boolean);
                })()}
              </div>
              <div className="flex justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowInputDataModal(false)}
                >
                  닫기
                </Button>
              </div>
            </DialogBody>
          </DialogContent>
        </Dialog>

        {/* 이미지 확대 모달 - Portal로 body에 직접 렌더링 */}
        {isImageModalOpen && selectedImage && ReactDOM.createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/80 p-4"
            onMouseDown={closeImageModal}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1400000 }}
          >
            <div
              className="relative max-w-4xl max-h-[90vh]"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage.src}
                alt={selectedImage.title}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl pointer-events-none"
              />
              <button
                className="absolute top-4 right-4 w-12 h-12 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  zIndex: 10000,
                  pointerEvents: 'auto'
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeImageModal();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <KeenIcon icon="cross" className="text-xl text-gray-700" />
              </button>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-white bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg inline-block shadow-lg">
                  {selectedImage.title}
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}

      </Dialog>

      {/* 구매 확인 모달 - Dialog 밖으로 이동 */}
      {showPurchaseModal && requestInfo && (() => {
        // 마지막 가격 제안 메시지에서 최종 값들 가져오기
        const lastPriceMessage = [...messages]
          .reverse()
          .find(m => m.message_type === 'price_proposal' || m.message_type === 'counter_offer');
        
        const finalTargetRank = lastPriceMessage?.proposed_target_rank || requestInfo.target_rank;
        const finalWorkPeriod = lastPriceMessage?.proposed_work_period || requestInfo.guarantee_period || requestInfo.guarantee_count;
        const finalGuaranteeCount = lastPriceMessage?.proposed_guarantee_count || requestInfo.guarantee_count;
        
        return ReactDOM.createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
          style={{ zIndex: 1500000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !purchaseLoading) {
              setShowPurchaseModal(false);
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
          >
            <div className="relative p-6">
              {/* X 버튼 추가 */}
              <button
                type="button"
                onClick={() => setShowPurchaseModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <KeenIcon icon="cross" className="size-5" />
              </button>
              <div className="flex items-center gap-3 mb-4 pr-8">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 dark:text-blue-400">
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">구매 확인</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">보장형 슬롯을 구매하시겠습니까?</p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">캠페인:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {requestInfo.campaigns?.campaign_name || `캠페인 #${requestInfo.campaign_id}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">목표 순위:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{finalTargetRank}위</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">작업 기간:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{finalWorkPeriod}{getGuaranteeUnit()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">보장 횟수:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{finalGuaranteeCount}{getGuaranteeUnit()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{getUnitText()} 금액:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {requestInfo.final_daily_amount.toLocaleString()}원
                  </span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">총 결제 금액:</span>
                    <div className="text-right">
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {(requestInfo.final_daily_amount * finalWorkPeriod).toLocaleString()}원
                      </span>
                      <div className="text-sm text-gray-500 dark:text-gray-400">(VAT 별도)</div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md">
                    <span className="text-sm font-semibold text-orange-800 dark:text-orange-300">실제 결제 금액:</span>
                    <div className="text-right">
                      <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        {Math.floor(requestInfo.final_daily_amount * finalWorkPeriod * 1.1).toLocaleString()}원
                      </span>
                      <div className="text-xs text-orange-700 dark:text-orange-300">(VAT 포함)</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6">
                <div className="flex gap-2">
                  <KeenIcon icon="information-2" className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-300">
                    <p className="font-medium mb-1">구매 안내</p>
                    <ul className="space-y-1 text-xs">
                      <li>• 구매 이후 총판(판매자) 승인 후 슬롯이 활성화됩니다</li>
                      <li>• 승인 완료 시 알림을 받으실 수 있습니다</li>
                      <li>• 목표 순위 달성 시 정산이 진행됩니다</li>
                      <li>• 미달성 시 환불 정책에 따라 처리됩니다</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handlePurchaseSlot}
                  disabled={purchaseLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  style={{ pointerEvents: purchaseLoading ? 'none' : 'auto' }}
                >
                  {purchaseLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      구매 중...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                        <path d="m9 12 2 2 4-4" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      구매 확정
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPurchaseModal(false)}
                  disabled={purchaseLoading}
                  className="flex-1"
                  style={{ pointerEvents: purchaseLoading ? 'none' : 'auto' }}
                >
                  취소
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      );
      })()}

      {/* 최종 구매 확인 모달 */}
      {showFinalConfirm && ReactDOM.createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
          style={{ zIndex: 2000000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !purchaseLoading) {
              setShowFinalConfirm(false);
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
          >
            <div className="relative p-6">
              {/* X 버튼 추가 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowFinalConfirm(false);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                disabled={purchaseLoading}
                style={{
                  pointerEvents: purchaseLoading ? 'none' : 'auto',
                  zIndex: 100
                }}
              >
                <KeenIcon icon="cross" className="size-6" />
              </button>

              <div className="flex items-center gap-3 mb-4 pr-8">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <KeenIcon icon="shield-tick" className="size-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">최종 확인</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">정말로 구매하시겠습니까?</p>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex gap-2">
                  <KeenIcon icon="information-2" className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800 dark:text-red-300">
                    <p className="font-medium mb-1">주의사항</p>
                    <ul className="space-y-1 text-xs">
                      <li>• 구매 확정 후에는 취소가 어려울 수 있습니다</li>
                      <li>• 잔액에서 <span className="font-bold">{requestInfo && Math.floor(requestInfo.final_daily_amount * (requestInfo.guarantee_period || requestInfo.guarantee_count) * 1.1).toLocaleString()}원</span> (VAT 포함)이 차감됩니다</li>
                      <li>• 구매 이후 총판(판매자) 승인 후 슬롯이 활성화됩니다</li>
                      <li>• 승인 완료 후 서비스가 시작됩니다</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleFinalPurchaseConfirm}
                  disabled={purchaseLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  style={{ pointerEvents: purchaseLoading ? 'none' : 'auto' }}
                >
                  {purchaseLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      구매 처리중...
                    </>
                  ) : (
                    <>
                      <KeenIcon icon="check" className="size-4 me-2" />
                      최종 구매 확정
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFinalConfirm(false)}
                  disabled={purchaseLoading}
                  className="flex-1"
                  style={{ pointerEvents: purchaseLoading ? 'none' : 'auto' }}
                >
                  다시 생각해보기
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}


      {/* 협상 완료 확인 모달 */}
      <GuaranteeNegotiationCompleteModal
        isOpen={showNegotiationCompleteModal}
        onClose={() => {
          setShowNegotiationCompleteModal(false);
          setNegotiationCompleteData(null);
        }}
        onConfirm={handleAcceptNegotiation}
        campaignName={requestInfo?.campaigns?.campaign_name}
        proposedAmount={negotiationCompleteData?.proposedAmount || 0}
        proposedDailyAmount={negotiationCompleteData?.proposedDailyAmount}
        proposedTotalAmount={negotiationCompleteData?.proposedTotalAmount}
        guaranteeCount={negotiationCompleteData?.guaranteeCount || 0}
        guaranteeUnit={requestInfo?.campaigns?.guarantee_unit}
        targetRank={negotiationCompleteData?.targetRank || requestInfo?.target_rank || 1}
        budgetType={negotiationCompleteData?.budgetType}
        workPeriod={negotiationCompleteData?.workPeriod}
        isLoading={loading}
      />

      {/* 협상 거절 확인 모달 */}
      <GuaranteeNegotiationRejectModal
        isOpen={showNegotiationRejectModal}
        onClose={() => {
          setShowNegotiationRejectModal(false);
        }}
        onConfirm={handleRejectNegotiation}
        campaignName={requestInfo?.campaigns?.campaign_name}
        isLoading={loading}
      />
    </>
  );
};