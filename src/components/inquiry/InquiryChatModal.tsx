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
import { KeenIcon } from '@/components';
import { useAuthContext } from '@/auth';
import { supabase } from '@/supabase';
import { inquiryService, inquiryMessageService } from '@/services/inquiryService';
import { fileUploadService } from '@/services/fileUploadService';
import { STORAGE_CONFIG, getUploadPath } from '@/config/storage.config';
import type {
  Inquiry,
  InquiryMessage,
  InquiryAttachment,
  InquirySenderRole
} from '@/types/inquiry.types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';
import { USER_ROLES, hasPermission, PERMISSION_GROUPS } from '@/config/roles.config';

interface InquiryChatModalProps {
  open: boolean;
  onClose: () => void;
  inquiryId?: string;
  slotId?: string;
  guaranteeSlotId?: string; // 보장형 슬롯 ID 추가
  campaignId?: number;
  distributorId?: string;
  initialTitle?: string;
  onStatusChange?: (status: string) => void;
}

export const InquiryChatModal: React.FC<InquiryChatModalProps> = ({
  open,
  onClose,
  inquiryId,
  slotId,
  guaranteeSlotId,
  campaignId,
  distributorId,
  initialTitle = '',
  onStatusChange
}) => {
  const { currentUser } = useAuthContext();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [messages, setMessages] = useState<InquiryMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<InquiryAttachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string } | null>(null);
  const [showInputDataTooltip, setShowInputDataTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // 새 문의 생성 관련
  const [isNewInquiry, setIsNewInquiry] = useState(!inquiryId);
  const [slotInfo, setSlotInfo] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subscriptionRef = useRef<any>(null);

  // 현재 사용자의 역할 결정
  const currentUserRole: InquirySenderRole = (() => {
    if (!currentUser) return 'user';
    if (hasPermission(currentUser.role, PERMISSION_GROUPS.ADMIN)) return 'admin';
    if (currentUser.role === USER_ROLES.DISTRIBUTOR) return 'distributor';
    return 'user';
  })();

  // 캠페인 로고 가져오기 (견적 협상 모달과 동일)
  const getCampaignLogo = (info: any): string => {
    // 캠페인 로고가 있으면 우선 사용
    if (info?.campaign_logo) {
      if (!info.campaign_logo.startsWith('http') && !info.campaign_logo.startsWith('/')) {
        return `/media/${info.campaign_logo}`;
      }
      return info.campaign_logo;
    }

    // 없으면 서비스 타입에 따른 기본 로고 사용
    const service = info?.service_type || '';
    if (service.includes('naver') || service.includes('Naver')) {
      return '/media/ad-brand/naver.png';
    } else if (service.includes('coupang') || service.includes('Coupang')) {
      return '/media/ad-brand/coupang-app.png';
    } else if (service.includes('ohouse')) {
      return '/media/ad-brand/ohouse.png';
    }

    return '/media/app/mini-logo-circle-gray.svg';
  };

  // 문의 정보 가져오기
  const fetchInquiry = useCallback(async () => {
    if (!inquiryId) return;

    try {
      setLoading(true);
      const { data, error } = await inquiryService.getInquiry(inquiryId);

      if (error) throw error;

      setInquiry(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [inquiryId]);

  // 메시지 목록 가져오기
  const fetchMessages = useCallback(async (idToFetch?: string, isInitialLoad = false) => {
    const id = idToFetch || inquiryId || inquiry?.id;
    if (!id) return;

    try {
      // 초기 로드 시에만 로딩 표시
      if (isInitialLoad) {
        setLoadingMessages(true);
      }

      const { data, error } = await inquiryMessageService.getMessages(id);

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
    } finally {
      if (isInitialLoad) {
        setLoadingMessages(false);
      }
    }
  }, [inquiryId, inquiry]);

  // 슬롯 정보 가져오기 (새 문의인 경우)
  const fetchSlotInfo = useCallback(async () => {
    if (!slotId && !guaranteeSlotId) return;


    try {
      // 보장형 슬롯인 경우
      if (guaranteeSlotId) {
        const { data: slotData, error } = await supabase
          .from('guarantee_slots')
          .select(`
            id,
            status,
            start_date,
            end_date,
            guarantee_slot_requests(
              id,
              target_rank,
              guarantee_count,
              guarantee_period,
              initial_budget,
              final_daily_amount,
              final_budget_type,
              final_total_amount,
              input_data,
              campaigns(
                id,
                campaign_name,
                service_type,
                logo,
                guarantee_unit
              ),
              keywords:keyword_id(
                id,
                main_keyword,
                keyword1,
                keyword2,
                keyword3,
                url,
                mid
              )
            )
          `)
          .eq('id', guaranteeSlotId)
          .single();

        if (error) throw error;

        if (slotData && slotData.guarantee_slot_requests) {
          // guarantee_slot_requests가 배열인 경우 첫 번째 요소 사용
          const requests = Array.isArray(slotData.guarantee_slot_requests)
            ? slotData.guarantee_slot_requests
            : [slotData.guarantee_slot_requests];

          if (requests.length > 0) {
            const request = requests[0];
            const campaigns = Array.isArray(request.campaigns) ? request.campaigns : [request.campaigns];
            const campaign = campaigns[0];
            const keywords = Array.isArray(request.keywords) ? request.keywords : [request.keywords];
            const keyword = keywords[0];

            const slotInfoData = {
              service_type: campaign?.service_type,
              campaign_name: campaign?.campaign_name,
              campaign_logo: campaign?.logo,
              guarantee_unit: campaign?.guarantee_unit,
              start_date: slotData.start_date,
              end_date: slotData.end_date,
              target_rank: request.target_rank,
              guarantee_count: request.guarantee_count,
              initial_budget: request.initial_budget,
              final_daily_amount: request.final_daily_amount,
              final_budget_type: request.final_budget_type,
              final_total_amount: request.final_total_amount,
              guarantee_period: request.guarantee_period,
              input_data: request.input_data,
              keywords: keyword
            };

            setSlotInfo(slotInfoData);
          }
        }
      }
      // 일반 슬롯인 경우
      else if (slotId) {
        const { data: slotData, error } = await supabase
          .from('slots')
          .select(`
            id,
            status,
            start_date,
            end_date,
            input_data,
            campaigns:product_id(
              id,
              campaign_name,
              service_type,
              logo
            )
          `)
          .eq('id', slotId)
          .single();

        if (error) throw error;

        if (slotData) {
          const campaigns = Array.isArray(slotData.campaigns) ? slotData.campaigns : [slotData.campaigns];
          const campaign = campaigns[0];
          const inputData = slotData.input_data || {};

          const slotInfoData = {
            service_type: campaign?.service_type,
            campaign_name: campaign?.campaign_name,
            campaign_logo: campaign?.logo,
            start_date: slotData.start_date,
            end_date: slotData.end_date,
            input_data: inputData,
            keywords: {
              main_keyword: inputData.mainKeyword || inputData.keyword1,
              keyword1: inputData.keyword1,
              keyword2: inputData.keyword2,
              keyword3: inputData.keyword3,
              url: inputData.url,
              mid: inputData.mid
            }
          };

          setSlotInfo(slotInfoData);
        }
      }
    } catch (error) {
    }
  }, [slotId, guaranteeSlotId]);

  // 기존 문의 확인
  const checkExistingInquiry = useCallback(async () => {
    if (!slotId && !guaranteeSlotId) return;

    try {
      let existingInquiryQuery = supabase
        .from('inquiries')
        .select('*');

      if (slotId) {
        existingInquiryQuery = existingInquiryQuery.eq('slot_id', slotId);
      } else if (guaranteeSlotId) {
        existingInquiryQuery = existingInquiryQuery.eq('guarantee_slot_id', guaranteeSlotId);
      }

      const { data: existingInquiries } = await existingInquiryQuery;

      if (existingInquiries && existingInquiries.length > 0) {
        // 기존 문의가 있으면 해당 문의 사용
        const existingInquiry = existingInquiries[0];
        setIsNewInquiry(false);
        setInquiry(existingInquiry as Inquiry);
        fetchMessages(existingInquiry.id, true);
      } else {
        // 기존 문의가 없으면 새 문의 모드
        setIsNewInquiry(true);
        setInquiry(null);
        setMessages([]);
      }
    } catch (error) {
      // 오류 시 새 문의 모드
      setIsNewInquiry(true);
      setInquiry(null);
      setMessages([]);
    }
  }, [slotId, guaranteeSlotId, fetchMessages]);

  useEffect(() => {
    if (open && (inquiryId || slotId || guaranteeSlotId)) {
      if (inquiryId) {
        fetchInquiry();
        fetchMessages(inquiryId, true); // 초기 로드임을 표시
      } else {
        fetchSlotInfo();
        // 기존 문의가 있는지 확인
        checkExistingInquiry();
      }
    } else if (!open) {
      // 모달이 닫힐 때 툴팁도 닫기
      setShowInputDataTooltip(false);
    }
  }, [open, inquiryId, slotId, guaranteeSlotId]);

  // 메시지 실시간 업데이트 (폴링 방식)
  useEffect(() => {
    if (!open) return;
    const currentInquiryId = inquiryId || inquiry?.id;
    if (!currentInquiryId) return;

    // 마지막으로 확인한 시간 추적
    let lastCheckedTime = new Date().toISOString();

    const checkNewMessages = async () => {
      const currentInquiryId = inquiryId || inquiry?.id;
      if (!currentInquiryId || document.hidden) return;

      try {
        // 마지막 확인 시간 이후의 메시지만 가져오기 (발신자 정보 별도 조회)
        const { data: newMessages, error } = await supabase
          .from('inquiry_messages')
          .select('*')
          .eq('inquiry_id', currentInquiryId)
          .gt('created_at', lastCheckedTime)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (newMessages && newMessages.length > 0) {
          // 발신자 정보 별도 조회
          const senderIds = [...new Set(newMessages.map(msg => msg.sender_id))];
          const { data: senders } = await supabase
            .from('users')
            .select('id, email, full_name')
            .in('id', senderIds);

          // 발신자 정보 맵 생성
          const senderMap = new Map(
            senders?.map(sender => [sender.id, sender]) || []
          );

          // 발신자 정보 매핑
          const formattedNewMessages = newMessages.map((msg: any) => {
            const sender = senderMap.get(msg.sender_id);
            return {
              ...msg,
              sender: sender,
              senderName: sender?.full_name || sender?.email || '알 수 없음',
              senderEmail: sender?.email
            };
          });

          // 새 메시지만 추가 (깜빡임 없음)
          setMessages(prev => {
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
            await inquiryMessageService.markAsRead(currentInquiryId, currentUser?.id || '');
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
        }
      } catch (error) {
        // 에러 처리 (로그만)
      }
    };

    // 2초마다 새 메시지 확인
    const interval = setInterval(checkNewMessages, 2000);

    return () => clearInterval(interval);
  }, [open, inquiryId, inquiry?.id, currentUser?.id]);

  // 스크롤 자동 이동
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 새 문의 생성
  const handleCreateInquiry = async () => {
    // 메시지 내용이나 첨부파일 중 하나는 있어야 함
    if (!inputValue.trim() && attachments.length === 0) {
      return;
    }

    try {
      setLoading(true);

      // 먼저 해당 슬롯에 대한 기존 문의가 있는지 확인
      if (slotId || guaranteeSlotId) {
        let existingInquiryQuery = supabase
          .from('inquiries')
          .select('id, status');

        if (slotId) {
          existingInquiryQuery = existingInquiryQuery.eq('slot_id', slotId);
        } else if (guaranteeSlotId) {
          existingInquiryQuery = existingInquiryQuery.eq('guarantee_slot_id', guaranteeSlotId);
        }

        const { data: existingInquiries } = await existingInquiryQuery;

        if (existingInquiries && existingInquiries.length > 0) {
          // 기존 문의가 있으면 해당 문의로 전환
          const existingInquiry = existingInquiries[0];
          setIsNewInquiry(false);
          setInquiry(existingInquiry as Inquiry);

          // 기존 문의에 메시지 추가
          const messageData = {
            inquiry_id: existingInquiry.id,
            content: inputValue.trim() || '', // 빈 문자열이라도 허용 (첨부파일만 보내는 경우)
            sender_role: currentUserRole,
            attachments
          };

          const { error: messageError } = await inquiryMessageService.sendMessage(messageData, currentUser?.id || '', currentUserRole);

          if (messageError) throw messageError;

          // Optimistic UI를 위해 메시지 직접 추가
          const tempMessage = {
            id: `temp-${Date.now()}`,
            inquiry_id: existingInquiry.id,
            sender_id: currentUser?.id || '',
            sender_role: currentUserRole,
            message: inputValue.trim(),
            attachments,
            is_read: true,
            created_at: new Date().toISOString(),
            sender: {
              id: currentUser?.id || '',
              email: currentUser?.email || '',
              full_name: currentUser?.full_name || ''
            },
            senderName: currentUser?.full_name || currentUser?.email || '알 수 없음',
            senderEmail: currentUser?.email
          };

          setMessages(prev => [...prev, tempMessage]);
          setInputValue('');
          setAttachments([]);
          return;
        }
      }

      const inquiryData: any = {
        title: initialTitle || '1:1 문의',
        category: '일반문의',
        priority: 'normal' as const,
        campaign_id: campaignId,
        distributor_id: distributorId,
        status: 'open' as const
      };

      // 일반 슬롯 또는 보장형 슬롯 ID 설정
      if (slotId) {
        inquiryData.slot_id = slotId;
      }
      if (guaranteeSlotId) {
        inquiryData.guarantee_slot_id = guaranteeSlotId;
      }

      const { data: newInquiry, error: inquiryError } = await inquiryService.createInquiry(inquiryData, currentUser?.id || '');

      if (inquiryError) throw inquiryError;

      // 첫 메시지 전송
      const messageData = {
        inquiry_id: newInquiry.id,
        content: inputValue.trim() || '', // 빈 문자열이라도 허용 (첨부파일만 보내는 경우)
        sender_role: currentUserRole,
        attachments
      };

      const { error: messageError } = await inquiryMessageService.sendMessage(messageData, currentUser?.id || '', currentUserRole);

      if (messageError) throw messageError;

      setIsNewInquiry(false);
      setInquiry(newInquiry);
      setInputValue('');
      setAttachments([]);

      // 메시지 다시 가져오기
      await fetchMessages(newInquiry.id, false);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // 메시지 전송
  const handleSendMessage = async () => {
    // 메시지 내용이나 첨부파일 중 하나는 있어야 함
    if (!inputValue.trim() && attachments.length === 0) return;

    const currentInquiryId = inquiryId || inquiry?.id;
    if (!currentInquiryId) return;

    // 먼저 입력 필드 초기화
    const messageContent = inputValue.trim();
    const messageAttachments = attachments;
    setInputValue('');
    setAttachments([]);

    // Optimistic UI: 메시지를 먼저 화면에 추가
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      inquiry_id: currentInquiryId,
      sender_id: currentUser?.id || '',
      sender_role: currentUserRole,
      message: messageContent,
      attachments: messageAttachments,
      is_read: true,
      created_at: new Date().toISOString(),
      sender: {
        id: currentUser?.id || '',
        email: currentUser?.email || '',
        full_name: currentUser?.full_name || ''
      },
      senderName: currentUser?.full_name || currentUser?.email || '알 수 없음',
      senderEmail: currentUser?.email
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const messageData = {
        inquiry_id: currentInquiryId,
        content: messageContent || '', // 빈 문자열이라도 허용 (첨부파일만 보내는 경우)
        sender_role: currentUserRole,
        attachments: messageAttachments
      };

      const { data: sentMessage, error } = await inquiryMessageService.sendMessage(messageData, currentUser?.id || '', currentUserRole);

      if (error) throw error;

      // 성공 시 임시 메시지를 실제 메시지로 교체
      if (sentMessage) {
        setMessages(prev => prev.map(msg =>
          msg.id === tempId ? { ...sentMessage, sender: optimisticMessage.sender, senderName: optimisticMessage.senderName, senderEmail: optimisticMessage.senderEmail } : msg
        ));
      }
    } catch (error) {
      // 실패 시 임시 메시지 제거
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };

  // 파일 업로드
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
        getUploadPath.inquiryAttachments(inquiryId || inquiry?.id)
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

  // 파일 다이얼로그 열기
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // 첨부파일 제거
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // 이미지 클릭 처리 (모달 보기)
  const handleImageClick = (attachment: InquiryAttachment) => {
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

  // ESC 키로 모달 닫기 (우선순위: 이미지모달 > 메인모달)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isImageModalOpen) {
          closeImageModal();
        }
      }
    };

    if (isImageModalOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isImageModalOpen, closeImageModal]);

  // 상태 변경
  const handleStatusChange = async (status: string) => {
    if (!inquiryId) return;

    try {
      const { error } = await inquiryService.updateInquiryStatus({
        inquiry_id: inquiryId,
        status: status as any,
        resolved_by: currentUser?.id
      });

      if (error) throw error;

      toast.success('문의 상태가 변경되었습니다.');
      fetchInquiry();
      onStatusChange?.(status);
    } catch (error) {
      console.error('상태 변경 실패:', error);
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  // 메시지 렌더링
  const renderMessage = (message: InquiryMessage, index: number) => {
    const isMyMessage = message.sender_id === currentUser?.id;
    const shouldShowTime = index === 0 ||
      message.sender_id !== messages[index - 1]?.sender_id ||
      new Date(message.created_at).getTime() - new Date(messages[index - 1]?.created_at).getTime() > 5 * 60 * 1000;

    const messageClasses = [
      'chat-sticky-message',
      isMyMessage && 'chat-sticky-message-mine',
      !isMyMessage && 'chat-sticky-message-other'
    ].filter(Boolean).join(' ');

    return (
      <div key={message.id} className={messageClasses}>
        {/* 발신자 이름 */}
        {shouldShowTime && (
          <div className="chat-sticky-message-sender flex items-center gap-2">
            <span>{message.sender_name || message.senderName || '-'}</span>
            {(() => {
              const senderRole = message.sender_role;

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
          {message.message || (message.attachments && message.attachments.length > 0 ? '' : '메시지 없음')}

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

        {/* 시간 표시 */}
        {shouldShowTime && (
          <div className="chat-sticky-message-time">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: ko })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog 
        open={open} 
        onOpenChange={isImageModalOpen || showInputDataTooltip ? undefined : (isOpen) => {
          if (!isOpen) {
            // 모달을 닫을 때 상태 초기화
            setIsNewInquiry(!inquiryId);
            setInquiry(null);
            setMessages([]);
            setInputValue('');
            setAttachments([]);
            setShowInputDataTooltip(false); // 툴팁 닫기
            onClose();
          }
        }}
      >
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col" aria-describedby={undefined}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <KeenIcon icon="messages" className="size-5 text-primary" />
              1:1 문의
              {inquiry?.status && (
                <span className={`badge badge-sm ${inquiry.status === 'open' ? 'badge-primary' :
                  inquiry.status === 'resolved' ? 'badge-success' :
                    inquiry.status === 'closed' ? 'badge-neutral' : 'badge-warning'
                  }`}>
                  {inquiry.status === 'open' ? '열림' :
                    inquiry.status === 'resolved' ? '해결됨' :
                      inquiry.status === 'closed' ? '종료됨' : '진행중'}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="flex-1 flex flex-col gap-4 min-h-0">
            {/* 정보 패널 */}
            {(() => {
              const info = inquiry?.slot_info || slotInfo;
              if (!info && !slotId && !guaranteeSlotId && !campaignId) return null;

              return (
                <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                  <div className="space-y-4 text-sm">
                    {/* 첫 번째 행 - 서비스, 캠페인, 키워드 */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">서비스:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-medium">
                            {info?.service_type ? (SERVICE_TYPE_LABELS[info.service_type as keyof typeof SERVICE_TYPE_LABELS] || info.service_type) : '보장형 서비스'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">캠페인:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <img
                            src={getCampaignLogo(info || {})}
                            alt="캠페인 로고"
                            className="w-4 h-4 object-contain rounded flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/media/app/mini-logo-circle-gray.svg';
                            }}
                          />
                          <span className="font-medium text-sm truncate">
                            {info?.campaign_name || '캠페인 정보'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">키워드:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(() => {
                            const keywords = info?.keywords;
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

                    {/* 두 번째 행 - 목표순위, 보장기간, 추가정보 */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">목표 순위:</span>
                        <div className="font-medium">{info?.target_rank || '-'}위</div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">보장:</span>
                        <div className="font-medium">{info?.guarantee_count || '-'}{info?.guarantee_unit || '일'}</div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">추가 정보:</span>
                        <div className="flex items-center gap-2 mt-1">
                          {(() => {
                            const inputData = info?.input_data;
                            if (!inputData) return <span className="text-gray-400 text-xs">없음</span>;

                            const passItem = ['keywords', 'mainKeyword', 'keyword1', 'keyword2', 'keyword3', 'due_date', 'dueDays', 'is_manual_input'];
                            const userInputFields = Object.entries(inputData).filter(([key]) =>
                              !passItem.includes(key) && !key.endsWith('_fileName')
                            );

                            if (userInputFields.length === 0) return <span className="text-gray-400 text-xs">없음</span>;

                            return (
                              <button
                                className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline cursor-pointer"
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
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

                    {/* 세 번째 행 - 시작일, 종료일, 협상완료금액 */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">시작일:</span>
                        <div className="font-medium text-green-600">
                          {info?.start_date ? new Date(info.start_date).toLocaleDateString() : '-'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">종료일:</span>
                        <div className="font-medium text-red-600">
                          {info?.end_date ? new Date(info.end_date).toLocaleDateString() : '-'}
                        </div>
                      </div>
                      {info?.final_daily_amount && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">협상 완료 금액:</span>
                          <div className="font-medium text-green-600">
                            {(() => {
                              const guaranteeUnit = info?.guarantee_unit || '일';
                              const unitText = (guaranteeUnit === 'daily' || guaranteeUnit === '일') ? '일' : '회';
                              const period = info?.guarantee_period || info?.guarantee_count || 1;

                              if (info?.final_budget_type === 'total' && info?.final_total_amount) {
                                const dailyAmount = Math.round(info.final_total_amount / period);
                                return `총 ${info.final_total_amount.toLocaleString()}원 (${dailyAmount.toLocaleString()}원/${unitText}, 총액협상)`;
                              } else {
                                const totalAmount = info?.final_daily_amount * period;
                                return `총 ${totalAmount.toLocaleString()}원 (${info?.final_daily_amount?.toLocaleString()}원/${unitText}, 일별협상)`;
                              }
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}


            {/* 메시지 영역 */}
            <div className="flex-1 chat-sticky-messages overflow-y-auto relative">
              {loadingMessages ? (
                <div className="chat-sticky-messages-loading">
                  메시지를 불러오는 중...
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-sticky-messages-empty">
                  <div className="chat-sticky-messages-empty-icon">
                    <KeenIcon icon="message-text" className="text-4xl text-gray-300" />
                  </div>
                  1:1 문의를 시작해주세요.<br />
                  문의사항을 입력해주세요.
                </div>
              ) : (
                <>
                  {messages.map((message, index) => renderMessage(message, index))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* 입력 영역 */}
            <div className="flex-shrink-0 space-y-3">
              {/* 첨부 파일 미리보기 */}
              {attachments.length > 0 && (
                <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">첨부 파일</h4>
                  <div className="space-y-2">
                    {attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                        {fileUploadService.isImageFile({ type: attachment.type } as File) ? (
                          <img
                            src={attachment.url}
                            alt={attachment.name}
                            className="w-12 h-12 object-cover rounded cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => handleImageClick(attachment)}
                            title="클릭하여 원본 보기"
                          />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center bg-orange-100 dark:bg-orange-800 rounded">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600 dark:text-orange-400">
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
                        </div>
                        <div className="flex gap-1">
                          {fileUploadService.isImageFile({ type: attachment.type } as File) && (
                            <button
                              onClick={() => handleImageClick(attachment)}
                              className="text-primary hover:text-primary-dark text-xs px-2 py-1 rounded border border-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
                              title="미리보기"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              보기
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveAttachment(index)}
                            className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors flex items-center gap-1"
                            title="파일 제거"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            제거
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={STORAGE_CONFIG.LIMITS.ALLOWED_TYPES.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* 메시지 입력 */}
              <div className="chat-sticky-input-area">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={isNewInquiry ? "문의 내용을 입력하세요..." : "메시지를 입력하세요..."}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (isNewInquiry) {
                        handleCreateInquiry();
                      } else {
                        handleSendMessage();
                      }
                    }
                  }}
                  disabled={loading || (!isNewInquiry && inquiry?.status === 'closed')}
                  className="chat-sticky-input"
                />
                <button
                  onClick={isNewInquiry ? handleCreateInquiry : handleSendMessage}
                  disabled={loading || (!inputValue.trim() && attachments.length === 0) || (!isNewInquiry && inquiry?.status === 'closed')}
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

              {/* 액션 버튼들 */}
              <div className="flex gap-2 justify-between">
                <div className="flex gap-2">
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
                </div>

                <div className="flex gap-2">
                  {!isNewInquiry && inquiry && (currentUserRole === 'admin' || currentUserRole === 'distributor') &&
                    inquiry.status !== 'closed' && inquiry.status !== 'resolved' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange('resolved')}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <KeenIcon icon="check-circle" className="size-4 me-1" />
                        해결됨으로 표시
                      </Button>
                    )}

                  {!isNewInquiry && inquiry && inquiry.status === 'resolved' && currentUser?.id === inquiry.user_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange('closed')}
                      disabled={loading}
                      className="border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      <KeenIcon icon="cross-circle" className="size-4 me-1" />
                      문의 종료
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    <KeenIcon icon="cross" className="size-4 me-1" />
                    닫기
                  </Button>
                </div>
              </div>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>

      {/* 추가 정보 툴팁 */}
      {showInputDataTooltip && (inquiry?.slot_info?.input_data || slotInfo?.input_data) && ReactDOM.createPortal(
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
                onClick={() => setShowInputDataTooltip(false)}
                style={{ pointerEvents: 'auto', zIndex: 10000 }}
                type="button"
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
                  const inputData = inquiry?.slot_info?.input_data || slotInfo?.input_data;
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
                      // 기본 필드
                      'work_days': '작업일',
                      'minimum_purchase': '최소 구매수',
                      'url': 'URL',
                      'mid': '상점 ID',
                      'productName': '상품명',
                      'mainKeyword': '메인 키워드',
                      'main_keyword': '메인 키워드',
                      'keywords': '서브 키워드',
                      'keyword1': '키워드1',
                      'keyword2': '키워드2',
                      'keyword3': '키워드3',
                      'quantity': '작업량',
                      'dueDays': '작업기간',
                      'due_days': '작업기간',
                      'workCount': '작업수',
                      'work_count': '작업수',
                      'start_date': '시작일',
                      'end_date': '종료일',
                      'deadline': '마감일',
                      'price': '가격',
                      'unit_price': '단가',
                      'total_price': '총 가격',
                      'budget': '예산',
                      'daily_amount': '일일 금액',
                      'monthly_amount': '월별 금액',
                      'guarantee_days': '보장일수',
                      'guarantee_count': '보장횟수',
                      'target_rank': '목표순위',
                      'current_rank': '현재순위',
                      'work_period': '작업기간',
                      'refund_policy': '환불정책',
                      'guarantee_summary': '보장요약정보',
                      'cash_amount': '캐시 지급액',
                      'cash_info': '캐시 지급 안내',
                      'point_amount': '포인트 금액',
                      'note': '비고',
                      'description': '설명',
                      'requirements': '요구사항',
                      'additional_info': '추가정보',
                      'company_name': '회사명',
                      'business_number': '사업자번호',
                      'contact': '연락처',
                      'email': '이메일',
                      'phone': '전화번호'
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

      {/* 이미지 미리보기 모달 */}
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

    </>
  );
};