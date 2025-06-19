import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { Slot } from './types';
import { formatDate } from './constants';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';

interface SlotDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: Slot | null;
  selectedServiceType: string;
}

const SlotDetailModal: React.FC<SlotDetailModalProps> = ({
  isOpen,
  onClose,
  slot,
  selectedServiceType
}) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

  // ESC 키로 이미지 모달 닫기 - Hook을 조건문 밖으로 이동
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && imageModalOpen) {
        setImageModalOpen(false);
        setSelectedImage(null);
      }
    };
    
    if (imageModalOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [imageModalOpen]);

  // ESC 키로 메인 모달 닫기
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !imageModalOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, imageModalOpen, onClose]);

  // slot이 없으면 null 반환 - Hook 호출 이후로 이동
  if (!slot) return null;

  const inputData = slot.input_data || {};

  // 필수 필드를 제외한 추가 필드만 필터링 (_fileName으로 끝나는 필드도 제외)
  const excludeFields = [
    'campaign_name', 'dueDays', 'expected_deadline', 
    'keyword1', 'keyword2', 'keyword3', 'keywordId', 
    'mainKeyword', 'mid', 'price', 'service_type', 
    'url', 'workCount', 'keywords', 'productName',
    'quantity', 'due_date', 'product_url', 'ohouse_url'
  ];
  
  const additionalFields = Object.entries(inputData).filter(
    ([key]) => !excludeFields.includes(key) && !key.endsWith('_fileName')
  );

  // 키워드 목록 가져오기
  const getKeywords = () => {
    const keywords = [];
    
    // keywords 배열 확인
    if (inputData.keywords && Array.isArray(inputData.keywords)) {
      keywords.push(...inputData.keywords);
    }
    
    // 개별 키워드 필드 확인
    if (inputData.mainKeyword) keywords.push(inputData.mainKeyword);
    if (inputData.keyword1) keywords.push(inputData.keyword1);
    if (inputData.keyword2) keywords.push(inputData.keyword2);
    if (inputData.keyword3) keywords.push(inputData.keyword3);
    
    return [...new Set(keywords)]; // 중복 제거
  };

  const keywords = getKeywords();

  // 이미지 클릭 핸들러
  const handleImageClick = (url: string, title: string) => {
    setSelectedImage({ url, title });
    setImageModalOpen(true);
  };


  // 상태 배지 스타일 통일
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }> = {
      pending: { variant: 'outline', label: '대기중', className: 'border-gray-500 text-gray-600' },
      submitted: { variant: 'outline', label: '검토중', className: 'border-yellow-500 text-yellow-600' },
      approved: { variant: 'outline', label: '승인', className: 'border-blue-500 text-blue-600' },
      rejected: { variant: 'destructive', label: '반려' },
      completed: { variant: 'outline', label: '완료', className: 'border-green-500 text-green-600' },
      success: { variant: 'outline', label: '완료', className: 'border-blue-500 text-blue-600' },
      refund: { variant: 'outline', label: '환불', className: 'border-purple-500 text-purple-600' }
    };

    const config = statusConfig[status] || { variant: 'secondary', label: status };

    return (
      <Badge variant={config.variant} className={cn('text-xs', config.className)}>
        {config.label}
      </Badge>
    );
  };

  // 캠페인 로고 가져오기
  const getCampaignLogo = (logo?: string): string | undefined => {
    if (!logo) return undefined;

    // animal/svg/ 형태의 경로면 /media/ 추가
    if (logo.includes('animal/svg/') && !logo.startsWith('/media/')) {
      return `/media/${logo}`;
    }
    // http로 시작하거나 /로 시작하면 그대로 사용
    if (logo.startsWith('http') || logo.startsWith('/')) {
      return logo;
    }
    // 단순 동물 이름이면 경로 구성
    if (!logo.includes('/')) {
      return `/media/animal/svg/${logo}.svg`;
    }
    return logo;
  };

  // 캠페인 상태 점 표시
  const getCampaignStatusDot = (campaign?: { status?: string }) => {
    if (!campaign?.status) return null;

    const statusConfig = {
      active: { color: 'bg-green-500', text: '진행중' },
      paused: { color: 'bg-yellow-500', text: '일시중지' },
      completed: { color: 'bg-gray-500', text: '종료' },
      pending: { color: 'bg-blue-500', text: '대기중' }
    };

    const config = statusConfig[campaign.status as keyof typeof statusConfig] ||
      { color: 'bg-gray-400', text: '알 수 없음' };

    return (
      <span
        className={`inline-block w-2 h-2 rounded-full ${config.color}`}
        title={config.text}
      />
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-2xl max-h-[85vh] flex flex-col"
          aria-describedby={undefined}
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeenIcon icon="information-2" className="text-base text-primary" />
                <span className="text-base">일반형 슬롯 상세</span>
                {slot && getStatusBadge(slot.status)}
              </div>
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {/* 캠페인 헤더 정보 - 카드 밖에 배치 */}
              <div className="px-1 pb-3 border-b border-slate-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCampaignLogo(slot.campaign_logo) && (
                      <img
                        src={getCampaignLogo(slot.campaign_logo)}
                        alt="campaign logo"
                        className="w-5 h-5 object-contain rounded"
                      />
                    )}
                    <span className="font-semibold">
                      {slot.campaign_name || '-'}
                    </span>
                    {getCampaignStatusDot(slot.campaign)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const serviceType = slot.campaign?.service_type || selectedServiceType || '';
                      let logo = '/media/app/mini-logo-circle-gray.svg';

                      if (serviceType.includes('NaverShopping')) {
                        logo = '/media/ad-brand/naver-shopping.png';
                      } else if (serviceType.includes('NaverPlace')) {
                        logo = '/media/ad-brand/naver-place.png';
                      } else if (serviceType.includes('NaverBlog')) {
                        logo = '/media/ad-brand/naver-blog.png';
                      } else if (serviceType.includes('Naver')) {
                        logo = '/media/ad-brand/naver.png';
                      } else if (serviceType.includes('Coupang')) {
                        logo = '/media/ad-brand/coupang-app.png';
                      } else if (serviceType.includes('Instagram')) {
                        logo = '/media/ad-brand/instagram.png';
                      }

                      return (
                        <>
                          <img
                            src={logo}
                            alt="service logo"
                            className="w-4 h-4 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/media/app/mini-logo-circle-gray.svg';
                            }}
                          />
                          <Badge variant="outline" className="text-xs">
                            {SERVICE_TYPE_LABELS[serviceType] || serviceType || '-'}
                          </Badge>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-gray-400">
                  <span>요청일: {formatDate(slot.created_at)}</span>
                  <span>처리일: {slot.processed_at ? formatDate(slot.processed_at) : '-'}</span>
                </div>
              </div>

              {/* 기본 정보 카드 */}
              <div className="card">
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 왼쪽: 사용자 정보 & 상태 */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                          <KeenIcon icon="user" className="text-sm" />
                          사용자 정보
                        </h3>
                        <div className="space-y-2 pl-5">
                          <div>
                            <span className="text-xs text-slate-500 dark:text-gray-500 block">이름</span>
                            <span className="text-sm font-medium">{slot.user?.full_name || '알 수 없음'}</span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 dark:text-gray-500 block">이메일</span>
                            <span className="text-sm">{slot.user?.email || '-'}</span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 dark:text-gray-500 block">상태</span>
                            <div className="mt-1">{getStatusBadge(slot.status)}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 오른쪽: 작업 정보 */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                        <KeenIcon icon="briefcase" className="text-sm" />
                        작업 정보
                      </h3>
                      <div className="space-y-2 pl-5">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-gray-500 block">상품명</span>
                          <span className="text-sm font-medium">{inputData.productName || slot.campaign_name || '-'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 dark:text-gray-500 block">작업수</span>
                          <span className="text-sm font-medium">
                            {slot.quantity ? slot.quantity.toLocaleString() : 
                             inputData.quantity ? inputData.quantity.toLocaleString() : 
                             inputData.workCount ? inputData.workCount.toLocaleString() : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 dark:text-gray-500 block">작업 기간</span>
                          <span className="text-sm font-medium">
                            {slot.start_date && slot.end_date ? (
                              <>{formatDate(slot.start_date)} ~ {formatDate(slot.end_date)}</>
                            ) : inputData.dueDays ? (
                              `${inputData.dueDays}일`
                            ) : '-'}
                          </span>
                        </div>
                        {(inputData.url || inputData.product_url || inputData.ohouse_url) && (
                          <div>
                            <span className="text-xs text-slate-500 dark:text-gray-500 block mb-1">URL</span>
                            <a
                              href={inputData.url || inputData.product_url || inputData.ohouse_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:text-primary-active inline-flex items-center gap-1"
                            >
                              <span className="truncate max-w-[200px]">{inputData.url || inputData.product_url || inputData.ohouse_url}</span>
                              <KeenIcon icon="exit-up" className="text-xs" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 키워드 정보 */}
              {keywords.length > 0 && (
                <div className="card">
                  <div className="card-body">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                      <KeenIcon icon="magnifier" className="text-sm" />
                      키워드 정보
                    </h3>
                    <div className="flex flex-wrap gap-2 pl-5">
                      {keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-blue-500 text-blue-600">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 추가 정보 */}
              {additionalFields.length > 0 && (
                <div className="card">
                  <div className="card-body">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                          <KeenIcon icon="document" className="text-sm" />
                          추가 정보
                        </h3>
                        <div className="space-y-3">
                          {additionalFields.map(([key, value]) => {
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
                              <div key={key} className="flex items-start gap-2 text-sm">
                                <span className="font-medium text-slate-600 dark:text-gray-400 min-w-[100px]">{displayKey}:</span>
                                <span className="text-slate-700 dark:text-gray-300 flex-1 break-words">
                                  {isFileUrl ? (
                                    isImage ? (
                                      <span className="text-blue-600 dark:text-blue-400">
                                        {fileName} (이미지)
                                      </span>
                                    ) : (
                                      <a
                                        href={value}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:underline"
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
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 메모 */}
              {(slot.mat_reason || slot.user_reason) && (
                <div className="card">
                  <div className="card-body">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                      <KeenIcon icon="message-text" className="text-sm" />
                      메모
                    </h3>
                    <div className="space-y-3">
                      {slot.mat_reason && (
                        <div>
                          <span className="text-xs text-slate-500 dark:text-gray-500 block mb-1">관리자 메모</span>
                          <div className="p-2 bg-slate-50 dark:bg-gray-800 rounded text-sm text-slate-700 dark:text-gray-300">
                            {slot.mat_reason}
                          </div>
                        </div>
                      )}
                      {slot.user_reason && (
                        <div>
                          <span className="text-xs text-slate-500 dark:text-gray-500 block mb-1">사용자 메모</span>
                          <div className="p-2 bg-slate-50 dark:bg-gray-800 rounded text-sm text-slate-700 dark:text-gray-300">
                            {slot.user_reason}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 반려 사유 */}
              {slot.rejection_reason && (
                <div className="card border-red-200 dark:border-red-800">
                  <div className="card-body">
                    <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-3 flex items-center gap-1.5">
                      <KeenIcon icon="shield-cross" className="text-sm text-red-600" />
                      반려 사유
                    </h3>
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-400">
                      {slot.rejection_reason}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogBody>

          <div className="flex-shrink-0 flex justify-end p-4 border-t border-slate-200 dark:border-gray-700">
            <Button
              variant="light"
              size="sm"
              onClick={onClose}
            >
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    
    {/* 이미지 모달 - SlotList와 동일한 스타일 */}
    {imageModalOpen && selectedImage && createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
        onClick={() => {
          setImageModalOpen(false);
          setSelectedImage(null);
        }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div className="relative max-w-4xl max-h-[90vh]">
          <img
            src={selectedImage.url}
            alt={selectedImage.title}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-2 right-2 btn btn-sm btn-light shadow-lg"
            onClick={() => {
              setImageModalOpen(false);
              setSelectedImage(null);
            }}
          >
            <KeenIcon icon="cross" className="text-lg" />
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

export default SlotDetailModal;