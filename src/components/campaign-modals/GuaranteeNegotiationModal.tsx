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
import { negotiationService, guaranteeSlotRequestService } from '@/services/guaranteeSlotService';
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

interface GuaranteeNegotiationModalProps {
  open: boolean;
  onClose: () => void;
  requestId: string;
  requestData?: any;
  currentUserRole: 'user' | 'distributor';
  onStatusChange?: (status: GuaranteeSlotRequestStatus) => void;
}

interface NegotiationMessage extends GuaranteeSlotNegotiation {
  senderName?: string;
}

export const GuaranteeNegotiationModal: React.FC<GuaranteeNegotiationModalProps> = ({
  open,
  onClose,
  requestId,
  requestData,
  currentUserRole,
  onStatusChange
}) => {
  const { currentUser } = useAuthContext();
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [proposedAmount, setProposedAmount] = useState('');
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [requestInfo, setRequestInfo] = useState<any>(null);
  const [showInputDataModal, setShowInputDataModal] = useState(false);
  const [showInputDataTooltip, setShowInputDataTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string } | null>(null);
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
      return '/media/ad-brand/naver-ci.png';
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
          logo = '/media/ad-brand/naver-ci.png';
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
      console.error('견적 요청 정보 조회 실패:', error);
      if (isMountedRef.current) {
        toast.error('견적 요청 정보를 불러오는데 실패했습니다.');
      }
    }
  }, [requestId]);

  // 협상 메시지 가져오기
  const fetchMessages = useCallback(async () => {
    if (!requestId || !isMountedRef.current) return;

    try {
      setLoadingMessages(true);

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
          .select('id, full_name, email')
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
          senderName: msg.users?.full_name || msg.users?.email || '사용자'
        }));
        setMessages(formattedMessages);

        // 읽지 않은 메시지 읽음 처리
        const unreadMessages = formattedMessages.filter(
          msg => !msg.is_read && msg.sender_id !== currentUser?.id
        );
        
        if (unreadMessages.length > 0) {
          await negotiationService.markAsRead(unreadMessages.map(msg => msg.id));
        }
      }
    } catch (error) {
      console.error('협상 메시지 조회 실패:', error);
      if (isMountedRef.current) {
        toast.error('협상 내역을 불러오는데 실패했습니다.');
      }
    } finally {
      if (isMountedRef.current) {
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
          attachments: attachments.length > 0 ? attachments : undefined
        },
        currentUser.id,
        currentUserRole
      );

      if (error) throw error;

      if (isMountedRef.current) {
        setInputValue('');
        setAttachments([]);
        
        // 새 메시지를 즉시 추가 (부드러운 업데이트)
        if (data) {
          const newMessage: NegotiationMessage = {
            ...data,
            senderName: currentUser.full_name || currentUser.email || '사용자'
          };
          setMessages(prev => [...prev, newMessage]);
        }
        
        toast.success('메시지가 전송되었습니다.');
        // 입력 필드에 포커스 유지
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error);
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
    if (!proposedAmount.trim() || !currentUser?.id || loading) return;

    const amount = parseInt(proposedAmount.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) {
      toast.error('올바른 금액을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);

      const messageType: NegotiationMessageType = messages.some(m => 
        m.message_type === 'price_proposal' || m.message_type === 'counter_offer'
      ) ? 'counter_offer' : 'price_proposal';

      const message = `${currentUserRole === 'distributor' ? '제안 가격' : '희망 가격'}: ${amount.toLocaleString()}원`;

      const { data, error } = await negotiationService.createMessage(
        {
          request_id: requestId,
          message: inputValue.trim() || message,
          message_type: messageType,
          proposed_daily_amount: amount,
          attachments: attachments.length > 0 ? attachments : undefined
        },
        currentUser.id,
        currentUserRole
      );

      if (error) throw error;

      if (isMountedRef.current) {
        setInputValue('');
        setProposedAmount('');
        setAttachments([]);
        setShowPriceForm(false);
        
        // 새 메시지를 즉시 추가 (부드러운 업데이트)
        if (data) {
          const newMessage: NegotiationMessage = {
            ...data,
            senderName: currentUser.full_name || currentUser.email || '사용자'
          };
          setMessages(prev => [...prev, newMessage]);
        }
        
        toast.success('가격 제안이 전송되었습니다.');
        // 입력 필드에 포커스 유지
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (error) {
      console.error('가격 제안 전송 실패:', error);
      if (isMountedRef.current) {
        toast.error('가격 제안 전송에 실패했습니다.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // 협상 수락
  const handleAcceptNegotiation = async () => {
    if (!currentUser?.id || loading) return;

    const lastPriceMessage = [...messages]
      .reverse()
      .find(m => m.message_type === 'price_proposal' || m.message_type === 'counter_offer');

    if (!lastPriceMessage?.proposed_daily_amount) {
      toast.error('확정할 가격이 없습니다.');
      return;
    }

    try {
      setLoading(true);

      // 견적 상태를 수락으로 변경
      const { error } = await guaranteeSlotRequestService.updateRequestStatus(
        requestId,
        'accepted',
        lastPriceMessage.proposed_daily_amount
      );

      if (error) throw error;

      // 수락 메시지 전송
      await negotiationService.createMessage(
        {
          request_id: requestId,
          message: `협상이 완료되었습니다. 최종 가격: ${lastPriceMessage.proposed_daily_amount.toLocaleString()}원`,
          message_type: 'message'
        },
        currentUser.id,
        currentUserRole
      );

      if (isMountedRef.current) {
        toast.success('협상이 완료되었습니다.');
        onStatusChange?.('accepted');
        await fetchMessages();
      }
    } catch (error) {
      console.error('협상 수락 실패:', error);
      if (isMountedRef.current) {
        toast.error('협상 수락에 실패했습니다.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // 협상 거절
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
          message_type: 'message'
        },
        currentUser.id,
        currentUserRole
      );

      if (isMountedRef.current) {
        toast.success('협상이 거절되었습니다.');
        onStatusChange?.('rejected');
        await fetchMessages();
      }
    } catch (error) {
      console.error('협상 거절 실패:', error);
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
      fetchMessages();
    } else if (!open) {
      // 모달이 닫힐 때 툴팁도 닫기
      setShowInputDataTooltip(false);
    }
  }, [open, requestId, fetchRequestInfo, fetchMessages]);

  // 메시지가 로드되거나 모달이 열릴 때 스크롤을 맨 아래로
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0 && open) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

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

  // 실시간 구독 설정
  useEffect(() => {
    if (!open || !requestId) return;

    const channel = supabase
      .channel(`guarantee_negotiations_${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'guarantee_slot_negotiations',
          filter: `request_id=eq.${requestId}`
        },
        () => {
          if (isMountedRef.current) {
            fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, requestId, fetchMessages]);

  // 가격 포맷팅
  const formatCurrency = (value: string) => {
    const number = value.replace(/[^0-9]/g, '');
    if (!number) return '';
    return parseInt(number).toLocaleString();
  };

  // 메시지 렌더링
  const renderMessage = (message: NegotiationMessage, index: number) => {
    const isMyMessage = message.sender_id === currentUser?.id;
    const isSystemMessage = false; // 시스템 메시지는 현재 지원하지 않음
    const isPriceMessage = message.message_type === 'price_proposal' || message.message_type === 'counter_offer';

    // 시간 그룹화 (기존 채팅과 동일한 로직)
    const shouldShowTime = index === 0 || 
      message.sender_id !== messages[index - 1]?.sender_id ||
      new Date(message.created_at).getTime() - new Date(messages[index - 1]?.created_at).getTime() > 5 * 60 * 1000;

    const messageClasses = [
      'chat-sticky-message',
      isMyMessage && 'chat-sticky-message-mine',
      !isMyMessage && !isSystemMessage && 'chat-sticky-message-other',
      isSystemMessage && 'chat-sticky-message-system',
      isPriceMessage && 'border-l-4 border-l-primary bg-primary/5'
    ].filter(Boolean).join(' ');

    return (
      <div key={message.id} className={messageClasses}>
        {/* 발신자 이름 (내 메시지가 아닌 경우) */}
        {!isMyMessage && !isSystemMessage && shouldShowTime && (
          <div className="chat-sticky-message-sender">
            {message.senderName}
          </div>
        )}
        
        {/* 메시지 내용 */}
        <div className="chat-sticky-message-content">
          {message.message}
          {isPriceMessage && message.proposed_daily_amount && (
            <div className="mt-2 p-2 bg-white dark:bg-gray-700 rounded border">
              <div className="text-sm font-medium text-primary">
                제안 금액: {message.proposed_daily_amount.toLocaleString()}원
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
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
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
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
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
                            <path d="M12 2v4m0 12v4m8-8h-4M6 12H2m15.364-6.364L14.95 8.05M9.05 14.95l-2.414 2.414M17.364 17.364L14.95 14.95M9.05 9.05L6.636 6.636"/>
                          </svg>
                          처리중...
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
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
        console.error('일부 파일 업로드 실패:', errors);
        toast.error('일부 파일 업로드에 실패했습니다.');
      }

      if (uploadedFiles.length > 0) {
        setAttachments(prev => [...prev, ...uploadedFiles]);
        toast.success(`${uploadedFiles.length}개 파일이 첨부되었습니다.`);
      }
    } catch (error) {
      console.error('파일 업로드 에러:', error);
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

  // ESC 키로 이미지 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isImageModalOpen) {
        closeImageModal();
      }
    };

    if (isImageModalOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isImageModalOpen, closeImageModal]);

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
      console.error('파일 처리 실패:', error);
      toast.error('파일 처리 중 오류가 발생했습니다.');
    } finally {
      setDownloadingFile(null);
    }
  };

  // 현재 상태 확인
  const currentStatus = requestInfo?.status || requestData?.status;
  const isNegotiationActive = currentStatus === 'requested' || currentStatus === 'negotiating';
  const canSendMessages = isNegotiationActive;

  return (
    <Dialog open={open} onOpenChange={isImageModalOpen ? undefined : onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col" aria-describedby={undefined}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon="message-text" className="size-5 text-primary" />
            견적 협상
            {currentStatus && (
              <span className={`badge badge-sm ${
                currentStatus === 'accepted' ? 'badge-success' :
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
                    <span className="text-gray-600 dark:text-gray-400">보장 기간:</span>
                    <div className="font-medium">{requestInfo.guarantee_count}일</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">희망 예산:</span>
                    <div className="font-medium">
                      {requestInfo.initial_budget ? 
                        `${requestInfo.initial_budget.toLocaleString()}원` : 
                        '미설정'
                      }
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">추가 정보:</span>
                    <div className="flex items-center gap-2 mt-1">
                      {requestInfo.input_data || requestData?.input_data ? (
                        <>
                          <button
                            className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors cursor-pointer"
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
                            <KeenIcon icon="information-2" className="size-3 mr-1" />
                            보기
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs">없음</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 협상 완료 금액 (있는 경우만 표시) */}
                {requestInfo.final_daily_amount && (
                  <div className="md:col-span-2">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">협상 완료 금액:</span>
                      <div className="font-medium text-green-600">
                        {requestInfo.final_daily_amount.toLocaleString()}원/일
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 메시지 영역 (기존 채팅과 동일한 구조) */}
          <div className="flex-1 chat-sticky-messages overflow-y-auto">
            {loadingMessages ? (
              <div className="chat-sticky-messages-loading">
                메시지를 불러오는 중...
              </div>
            ) : messages.length === 0 ? (
              <div className="chat-sticky-messages-empty">
                <div className="chat-sticky-messages-empty-icon">
                  <KeenIcon icon="message-text" className="text-4xl text-gray-300" />
                </div>
                협상을 시작해주세요.<br/>
                {currentUserRole === 'distributor' ? 
                  '가격을 제안하거나 메시지를 보내세요.' :
                  '문의사항이나 협상 내용을 입력해주세요.'
                }
              </div>
            ) : (
              <>
                {messages.map(renderMessage)}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* 입력 영역 */}
          {canSendMessages ? (
            <div className="flex-shrink-0 space-y-3">
              {/* 가격 제안 폼 */}
              {showPriceForm && (
                <div className="border rounded-lg p-3 bg-primary/5">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={proposedAmount}
                        onChange={(e) => setProposedAmount(formatCurrency(e.target.value))}
                        placeholder="제안 금액 (원)"
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendPriceProposal}
                        disabled={!proposedAmount.trim() || loading}
                        size="sm"
                      >
                        제안
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowPriceForm(false)}
                        size="sm"
                      >
                        취소
                      </Button>
                    </div>
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
                            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
                          </svg>
                          파일 첨부
                        </Button>
                        {uploadingFiles && (
                          <span className="text-xs text-gray-500">업로드 중...</span>
                        )}
                      </div>
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
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14,2 14,8 20,8"/>
                              <line x1="16" y1="13" x2="8" y2="13"/>
                              <line x1="16" y1="17" x2="8" y2="17"/>
                              <polyline points="10,9 9,9 8,9"/>
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
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
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
                        onClick={() => setShowPriceForm(true)}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-1">
                          <path d="M12 2v20M2 12h20"/>
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
                          <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
                        </svg>
                        파일 첨부
                      </Button>
                    </>
                  )}
                </div>

                {/* 수락/거절/닫기 버튼 */}
                <div className="flex gap-2">
                  {/* 수락/거절 버튼 (협상 완료 권한이 있는 경우만) */}
                  {currentUserRole === 'distributor' && messages.some(m => 
                    m.message_type === 'price_proposal' || m.message_type === 'counter_offer'
                  ) && (
                    <>
                      <Button
                        size="sm"
                        onClick={handleAcceptNegotiation}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <KeenIcon icon="check-circle" className="size-4 me-1" />
                        협상 완료
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRejectNegotiation}
                        disabled={loading}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <KeenIcon icon="cross-circle" className="size-4 me-1" />
                        거절
                      </Button>
                    </>
                  )}
                  
                  {/* 닫기 버튼 */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-1">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                    닫기
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-shrink-0 p-4 bg-gray-100 dark:bg-gray-800 text-center text-gray-500 font-medium rounded">
              {currentStatus === 'accepted' ? 
                '협상이 완료되었습니다. 이제 구매를 진행할 수 있습니다.' :
                currentStatus === 'rejected' ?
                '협상이 거절되었습니다.' :
                '협상이 종료되었습니다.'
              }
            </div>
          )}
        </DialogBody>
      </DialogContent>
      
      {/* 추가 정보 툴팁 */}
      {showInputDataTooltip && (requestInfo?.input_data || requestData?.input_data) && ReactDOM.createPortal(
        <div 
          className="fixed z-[9999] bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg max-w-sm"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            transform: 'translate(-50%, -100%)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            {(() => {
              const inputData = requestInfo?.input_data || requestData?.input_data;
              
              return Object.entries(inputData).map(([key, value]) => {
                if (!value || (typeof value === 'string' && !value.trim())) return null;
                
                return (
                  <div key={key} className="border-b border-gray-600 pb-1 last:border-b-0">
                    <div className="font-medium text-gray-300 mb-1">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                    <div className="text-white">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </div>
                  </div>
                );
              }).filter(Boolean);
            })()}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
        </div>,
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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
          onMouseDown={closeImageModal}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
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
                console.log('X 버튼 클릭됨'); // 디버깅용
                e.preventDefault();
                e.stopPropagation();
                closeImageModal();
              }}
              onMouseDown={(e) => {
                console.log('X 버튼 마우스다운됨'); // 디버깅용
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
  );
};