import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { guaranteeSlotRequestService } from '@/services/guaranteeSlotService';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';

interface GuaranteeSlotDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
}

const GuaranteeSlotDetailModal: React.FC<GuaranteeSlotDetailModalProps> = ({
  isOpen,
  onClose,
  requestId
}) => {
  const [loading, setLoading] = useState(false);
  const [requestData, setRequestData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && requestId) {
      fetchRequestDetails();
    }
  }, [isOpen, requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await guaranteeSlotRequestService.getRequestById(requestId);

      if (error) {
        console.error('견적 요청 상세 조회 실패:', error);
        return;
      }

      setRequestData(data);
    } catch (error) {
      console.error('견적 요청 상세 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }> = {
      requested: { variant: 'outline', label: '요청됨', className: 'border-blue-500 text-blue-600' },
      negotiating: { variant: 'outline', label: '협상중', className: 'border-amber-500 text-amber-600' },
      accepted: { variant: 'outline', label: '수락됨', className: 'border-green-500 text-green-600' },
      rejected: { variant: 'destructive', label: '거절됨' },
      expired: { variant: 'secondary', label: '만료됨' },
      purchased: { variant: 'default', label: '구매완료', className: 'bg-green-500 hover:bg-green-600' }
    };

    const config = statusConfig[status] || { variant: 'secondary', label: status };

    return (
      <Badge variant={config.variant} className={cn('text-xs', config.className)}>
        {config.label}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    if (!price) return '-';
    return `${price.toLocaleString()}원`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '-').replace('.', '');
  };

  // 캠페인 로고 가져오기 (관리 페이지와 동일)
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[85vh] flex flex-col"
        aria-describedby={undefined}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeenIcon icon="information-2" className="text-base text-primary" />
              <span className="text-base">보장형 슬롯 상세</span>
              {requestData?.status && getStatusBadge(requestData.status)}
            </div>
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
                <p className="text-sm text-slate-500 dark:text-gray-400">데이터를 불러오는 중입니다...</p>
              </div>
            </div>
          ) : requestData ? (
            <div className="space-y-4">
              {/* 캠페인 헤더 정보 - 카드 밖에 배치 */}
              <div className="px-1 pb-3 border-b border-slate-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCampaignLogo(requestData.campaigns?.logo) && (
                      <img
                        src={getCampaignLogo(requestData.campaigns?.logo)}
                        alt="campaign logo"
                        className="w-5 h-5 object-contain rounded"
                      />
                    )}
                    <span className="font-semibold">
                      {requestData.campaigns?.campaign_name || '-'}
                    </span>
                    {getCampaignStatusDot(requestData.campaigns)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const serviceType = requestData.campaigns?.service_type || '';
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
                  <span>요청일: {formatDate(requestData.created_at)}</span>
                  <span>수정일: {formatDate(requestData.updated_at)}</span>
                </div>
              </div>

              {/* 주요 정보 카드 - 키워드, 보장조건, 가격을 하나로 통합 */}
              <div className="card">
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 왼쪽: 키워드 & 보장 조건 */}
                    <div className="space-y-4">
                      {/* 키워드 정보 */}
                      {requestData.keywords && (
                        <div>
                          <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                            <KeenIcon icon="magnifier" className="text-sm" />
                            키워드 정보
                          </h3>
                          <div className="space-y-2 pl-5">
                            <div>
                              <span className="text-xs text-slate-500 dark:text-gray-500 block">메인</span>
                              <span className="text-sm font-medium">{requestData.keywords.main_keyword || '-'}</span>
                            </div>
                            {(requestData.keywords.keyword1 || requestData.keywords.keyword2 || requestData.keywords.keyword3) && (
                              <div>
                                <span className="text-xs text-slate-500 dark:text-gray-500 block mb-1">서브</span>
                                <div className="flex flex-wrap gap-1">
                                  {[requestData.keywords.keyword1, requestData.keywords.keyword2, requestData.keywords.keyword3]
                                    .filter(Boolean)
                                    .map((keyword, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {keyword}
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                            )}
                            {requestData.keywords.url && (
                              <div>
                                <span className="text-xs text-slate-500 dark:text-gray-500 block mb-1">URL</span>
                                <a
                                  href={requestData.keywords.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:text-primary-active inline-flex items-center gap-1"
                                >
                                  <span className="truncate max-w-[200px]">{requestData.keywords.url}</span>
                                  <KeenIcon icon="exit-up" className="text-xs" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 보장 조건 */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                          <KeenIcon icon="shield-check" className="text-sm text-primary" />
                          보장 조건
                        </h3>
                        <div className="flex gap-3 pl-5">
                          <div className="flex-1 text-center p-2.5 bg-slate-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-lg font-bold text-primary">{requestData.target_rank}위</div>
                            <div className="text-xs text-slate-500 dark:text-gray-500">목표 순위</div>
                          </div>
                          <div className="flex-1 text-center p-2.5 bg-slate-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-lg font-bold text-primary">{requestData.guarantee_period || requestData.guarantee_count}{requestData.campaigns?.guarantee_unit || '일'}</div>
                            <div className="text-xs text-slate-500 dark:text-gray-500">보장 기간</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 오른쪽: 가격 정보 */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                        <KeenIcon icon="dollar-circle" className="text-sm text-success" />
                        가격 정보
                      </h3>
                      <div className="space-y-2 pl-5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-xs text-slate-500 dark:text-gray-500">초기 예산</span>
                          <span className="font-medium">{formatPrice(requestData.initial_budget)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-xs text-slate-500 dark:text-gray-500">최종 협상가</span>
                          <span className="font-bold text-success">{formatPrice(requestData.final_daily_amount)}</span>
                        </div>
                        {requestData.final_daily_amount && (
                          <div className="pt-2 border-t border-slate-200 dark:border-gray-700 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-600 dark:text-gray-500">총 금액</span>
                              <span className="text-sm font-medium">
                                {formatPrice(requestData.final_daily_amount * (requestData.guarantee_period || requestData.guarantee_count))}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">총 예상 금액</span>
                              <div className="text-right">
                                <div className="text-base font-bold">
                                  {formatPrice(requestData.final_daily_amount * (requestData.guarantee_period || requestData.guarantee_count) * 1.1)}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-gray-500">VAT 10% 포함</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 추가 정보 - 필요한 경우만 표시 */}
              {(requestData.user_reason || requestData.additional_requirements || requestData.input_data) && (
                <div className="card">
                  <div className="card-body">
                    <div className="space-y-4">
                      {/* 추가 정보 */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                          <KeenIcon icon="document" className="text-sm" />
                          추가 정보
                        </h3>
                        <div className="space-y-3">
                          {(requestData.user_reason || requestData.additional_requirements) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {requestData.user_reason && (
                                <div>
                                  <span className="text-xs text-slate-500 dark:text-gray-500 block mb-1">요청 사유</span>
                                  <div className="p-2 bg-slate-50 dark:bg-gray-800 rounded text-sm text-slate-700 dark:text-gray-300">
                                    {requestData.user_reason}
                                  </div>
                                </div>
                              )}
                              {requestData.additional_requirements && (
                                <div>
                                  <span className="text-xs text-slate-500 dark:text-gray-500 block mb-1">추가 요구사항</span>
                                  <div className="p-2 bg-slate-50 dark:bg-gray-800 rounded text-sm text-slate-700 dark:text-gray-300">
                                    {requestData.additional_requirements}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* input_data 표시 */}
                          {requestData.input_data && (() => {
                            const passItem = ['campaign_name', 'dueDays', 'expected_deadline', 'keyword1', 'keyword2', 'keyword3', 'keywordId', 'mainKeyword', 'mid', 'price', 'service_type', 'url', 'workCount', 'keywords', 'is_manual_input'];
                            
                            let displayData: Record<string, any> = {};
                            
                            // 1. 중첩된 구조 확인 (keywords[0].input_data)
                            if (requestData.input_data.keywords?.[0]?.input_data) {
                              const nestedData = requestData.input_data.keywords[0].input_data;
                              Object.entries(nestedData).forEach(([key, value]) => {
                                if (!passItem.includes(key) && !key.endsWith('_fileName') && value) {
                                  displayData[key] = value;
                                }
                              });
                            } else {
                              // 2. 일반 input_data 구조
                              Object.entries(requestData.input_data).forEach(([key, value]) => {
                                if (!passItem.includes(key) && !key.endsWith('_fileName') && value) {
                                  displayData[key] = value;
                                }
                              });
                            }
                            
                            const userInputFields = Object.entries(displayData);

                            if (userInputFields.length === 0) return null;

                            return (
                              <div>
                                <span className="text-xs text-slate-500 dark:text-gray-500 block mb-1">사용자 입력 필드</span>
                                <div className="p-3 bg-blue-50/30 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded space-y-2">
                                  {userInputFields.map(([key, value]) => {
                                    // 파일 URL인지 확인
                                    const isFileUrl = value && typeof value === 'string' && 
                                      (value.includes('supabase.co/storage/') || value.includes('/storage/v1/object/'));
                                    
                                    // 이미지 파일인지 확인
                                    const isImage = isFileUrl && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value);
                                    
                                    // 파일명 추출 (중첩된 구조도 확인)
                                    const fileNameKey = `${key}_fileName`;
                                    let fileName = '';
                                    if (requestData.input_data.keywords?.[0]?.input_data?.[fileNameKey]) {
                                      fileName = requestData.input_data.keywords[0].input_data[fileNameKey];
                                    } else if (requestData.input_data[fileNameKey]) {
                                      fileName = requestData.input_data[fileNameKey];
                                    } else if (isFileUrl) {
                                      fileName = value.split('/').pop() || '파일';
                                    }
                                    
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
                            );
                          })()}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-gray-800 mb-4">
                  <KeenIcon icon="file-search" className="text-2xl text-slate-400 dark:text-gray-400" />
                </div>
                <p className="text-sm text-slate-600 dark:text-gray-400">데이터를 불러올 수 없습니다.</p>
              </div>
            </div>
          )}
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
  );
};

export default GuaranteeSlotDetailModal;