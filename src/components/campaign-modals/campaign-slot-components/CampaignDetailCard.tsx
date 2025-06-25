import React from 'react';
import { KeenIcon } from '@/components';
import { cn } from '@/lib/utils';
import { getStatusLabel, getStatusColor } from '../types';

interface CampaignDetailCardProps {
  selectedCampaign: any;
  bannerUrl: string | null;
  setBannerUrl: (url: string | null) => void;
  isCompactMode: boolean;
}

export const CampaignDetailCard: React.FC<CampaignDetailCardProps> = ({
  selectedCampaign,
  bannerUrl,
  setBannerUrl,
  isCompactMode
}) => {
  if (!selectedCampaign) return null;

  // 컴팩트 모드
  if (isCompactMode) {
    return (
      <div className="flex gap-2 border-2 rounded-md overflow-hidden border-gray-200 dark:border-gray-700">
        <div className={cn(
          "flex-1 flex flex-col gap-2 px-3 py-2",
          selectedCampaign.slot_type === 'guarantee'
            ? "bg-purple-50 dark:bg-purple-900/20"
            : "bg-blue-50 dark:bg-blue-900/20"
        )}>
          {/* 캠페인명과 상태 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {/* 캠페인 로고 */}
              <div className="w-8 h-8 shrink-0 rounded-md overflow-hidden flex items-center justify-center bg-white border border-gray-200">
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt={selectedCampaign.campaign_name}
                    className="w-6 h-6 object-contain"
                    onError={() => setBannerUrl(null)}
                  />
                ) : (
                  <KeenIcon icon="image" className="size-4 text-gray-400" />
                )}
              </div>
              {/* 캠페인명 */}
              <h3 className="text-sm font-semibold text-foreground truncate flex-1">
                {selectedCampaign.campaign_name}
              </h3>
            </div>
            {/* 서비스 타입 배지 */}
            <span className={`badge ${selectedCampaign.slot_type === 'guarantee'
              ? 'badge-info'
              : 'badge-primary'
              } badge-outline rounded-[30px] h-auto py-0.5 px-2 text-xs shrink-0`}>
              <KeenIcon icon={selectedCampaign.slot_type === 'guarantee' ? 'shield-tick' : 'element-11'} className="size-3 me-1" />
              {selectedCampaign.slot_type === 'guarantee' ? '보장형' : '일반형'}
            </span>
            {/* 상태 배지 */}
            <span className={`badge badge-${getStatusColor(selectedCampaign.status)} badge-outline rounded-[30px] h-auto py-0.5 px-2 text-xs shrink-0`}>
              <span className={`size-1.5 rounded-full bg-${getStatusColor(selectedCampaign.status)} me-1`}></span>
              {getStatusLabel(selectedCampaign.status)}
            </span>
          </div>
          {/* 캠페인 상세 정보 */}
          <div className={cn(
            "text-xs flex flex-wrap items-center gap-x-3 gap-y-1",
            selectedCampaign.slot_type === 'guarantee'
              ? "text-purple-700 dark:text-purple-300"
              : "text-blue-700 dark:text-blue-300"
          )}>
            {selectedCampaign.slot_type === 'guarantee' ? (
              <>
                <span className="flex items-center gap-1">
                  <KeenIcon icon="wallet" className="text-primary size-3" />
                  <span className="text-purple-600 dark:text-purple-400">가격:</span>
                  <span className="font-semibold text-primary">
                    {(() => {
                      const minPrice = Number(selectedCampaign.min_guarantee_price?.toString().replace(/[^\d]/g, '') || 0);
                      const maxPrice = Number(selectedCampaign.max_guarantee_price?.toString().replace(/[^\d]/g, '') || 0);

                      if (minPrice && maxPrice) {
                        const formatPrice = (price: number) => {
                          if (price >= 100000000) {
                            const billions = price / 100000000;
                            return billions % 1 === 0 ? `${billions}억` : `${billions.toFixed(1)}억`;
                          } else if (price >= 10000000) {
                            const tenMillions = price / 10000000;
                            return tenMillions % 1 === 0 ? `${tenMillions}천만` : `${tenMillions.toFixed(1)}천만`;
                          } else if (price >= 10000) {
                            const tenThousands = price / 10000;
                            return tenThousands % 1 === 0 ? `${tenThousands}만` : `${tenThousands.toFixed(1)}만`;
                          }
                          return price.toLocaleString();
                        };

                        return `${formatPrice(minPrice)}~${formatPrice(maxPrice)}원`;
                      }
                      return '가격 협의';
                    })()}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <KeenIcon icon="shield-tick" className="text-purple-500 size-3" />
                  <span className="text-purple-600 dark:text-purple-400">{selectedCampaign.guarantee_unit === '회' ? '보장:' : '보장:'}</span>
                  <span className="font-semibold">{selectedCampaign.guarantee_count || 30}{selectedCampaign.guarantee_unit || '일'}</span>
                </span>
                {selectedCampaign.guarantee_period && (
                  <span className="flex items-center gap-1">
                    <KeenIcon icon="calendar-tick" className="text-purple-500 size-3" />
                    <span className="text-purple-600 dark:text-purple-400">작업:</span>
                    <span className="font-semibold">{selectedCampaign.guarantee_period}일</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <KeenIcon icon="rocket" className="text-green-500 size-3" />
                  <span className="text-purple-600 dark:text-purple-400">효율:</span>
                  <span className="font-semibold text-green-600">{selectedCampaign.efficiency || '-%'}</span>
                </span>
                {/* 보장 요약 정보 - 효율 오른쪽에 표시 */}
                {selectedCampaign.guarantee_period && selectedCampaign.guarantee_count && (
                  <span className="flex items-center gap-1">
                    <KeenIcon icon="check" className="size-3 text-purple-500" />
                    <span className="font-semibold text-purple-700 dark:text-purple-300">
                      {selectedCampaign.guarantee_unit === '일' 
                        ? `${selectedCampaign.guarantee_period}일 안에 ${selectedCampaign.target_rank || '__'}위 ${selectedCampaign.guarantee_count}일`
                        : `${selectedCampaign.guarantee_period}일 안에 ${selectedCampaign.guarantee_count}회`
                      }
                    </span>
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="flex items-center gap-1">
                  <KeenIcon icon="wallet" className="text-primary size-3" />
                  <span className="text-blue-600 dark:text-blue-400">단가:</span>
                  <span className="font-semibold text-primary">{selectedCampaign.unit_price ? `${Number(selectedCampaign.unit_price.toString().replace(/[^\d]/g, '')).toLocaleString()}원` : '1,000원'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <KeenIcon icon="purchase" className="text-orange-500 size-3" />
                  <span className="text-blue-600 dark:text-blue-400">최소:</span>
                  <span className="font-semibold">{selectedCampaign.min_quantity ? `${Number(selectedCampaign.min_quantity.toString().replace(/[^\d]/g, '')).toLocaleString()}개` : '1개'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <KeenIcon icon="rocket" className="text-green-500 size-3" />
                  <span className="text-blue-600 dark:text-blue-400">효율:</span>
                  <span className="font-semibold text-green-600">{selectedCampaign.efficiency || '-%'}</span>
                </span>
              </>
            )}
          </div>
        </div>
        {/* 환불 정책 표시 - 컴팩트 모드 우측 배치 */}
        {selectedCampaign.refund_settings && selectedCampaign.refund_settings.enabled && (
          <div className="w-[350px] shrink-0 bg-amber-50 dark:bg-amber-900/20 p-2">
            <div>
              <div className="flex items-start gap-1">
                <KeenIcon icon="shield-tick" className="text-amber-600 size-3.5 mt-0.5 shrink-0" />
                <div className="text-xs text-gray-700 space-y-1">
                  <div className="font-medium text-amber-700">환불 정책</div>
                  <div className="space-y-0.5">
                    <div>
                      • {selectedCampaign.refund_settings.type === 'immediate' ? '즉시 환불' : 
                        selectedCampaign.refund_settings.type === 'delayed' ? `${selectedCampaign.refund_settings.delay_days}일 후 환불` : 
                        `마감시간(${selectedCampaign.refund_settings.cutoff_time}) 기준 환불`}
                    </div>
                    {selectedCampaign.refund_settings.refund_rules && (
                      <div>
                        • 사용 {selectedCampaign.refund_settings.refund_rules.min_usage_days || 0}일 이상, {selectedCampaign.refund_settings.refund_rules.max_refund_days || 7}일 이내 환불 가능
                      </div>
                    )}
                    {selectedCampaign.refund_settings.requires_approval && (
                      <div className="text-orange-600">• 총판 승인 필요</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 일반 모드
  return (
    <div className={cn(
      "w-full bg-white rounded-lg shadow-sm p-3 sm:p-4 mt-3",
      selectedCampaign?.slot_type === 'guarantee'
        ? "border-2 border-purple-400 dark:border-purple-600"
        : "border-2 border-blue-400 dark:border-blue-600"
    )}>
      {selectedCampaign ? (
        <div className="flex gap-4">
          <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] shrink-0 rounded-md overflow-hidden flex items-center justify-center bg-gray-50">
            {bannerUrl && (
              <img
                src={bannerUrl}
                alt="캠페인 로고"
                className="size-[60px] sm:size-[70px] object-contain"
                onError={() => {
                  // 로고 로드 실패 시 상태 초기화
                  setBannerUrl(null);
                }}
              />
            )}
            {!bannerUrl && (
              <div className="text-xs text-gray-400 text-center">
                로고 없음
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex gap-3">
            <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-bold text-foreground truncate">
                {selectedCampaign.campaign_name}
              </h2>
              {/* 서비스 타입 배지 */}
              <span className={`badge ${selectedCampaign.slot_type === 'guarantee'
                ? 'badge-info'
                : 'badge-primary'
                } badge-outline rounded-[30px] h-auto py-1`}>
                <KeenIcon icon={selectedCampaign.slot_type === 'guarantee' ? 'shield-tick' : 'element-11'} className="size-3.5 me-1.5" />
                {selectedCampaign.slot_type === 'guarantee' ? '보장형' : '일반형'}
              </span>
              <span className={`badge badge-${getStatusColor(selectedCampaign.status)} badge-outline rounded-[30px] h-auto py-1`}>
                <span className={`size-1.5 rounded-full bg-${getStatusColor(selectedCampaign.status)} me-1.5`}></span>
                {getStatusLabel(selectedCampaign.status)}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm mb-2">
              {selectedCampaign.slot_type === 'guarantee' ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <KeenIcon icon="wallet" className="text-primary size-4" />
                    <span className="text-muted-foreground">가격범위:</span>
                    <span className="font-bold text-primary">
                      {(() => {
                        const minPrice = Number(selectedCampaign.min_guarantee_price?.toString().replace(/[^\d]/g, '') || 0);
                        const maxPrice = Number(selectedCampaign.max_guarantee_price?.toString().replace(/[^\d]/g, '') || 0);

                        if (minPrice && maxPrice) {
                          const formatPrice = (price: number) => {
                            if (price >= 100000000) {
                              const billions = price / 100000000;
                              return billions % 1 === 0 ? `${billions}억` : `${billions.toFixed(1)}억`;
                            } else if (price >= 10000000) {
                              const tenMillions = price / 10000000;
                              return tenMillions % 1 === 0 ? `${tenMillions}천만` : `${tenMillions.toFixed(1)}천만`;
                            } else if (price >= 10000) {
                              const tenThousands = price / 10000;
                              return tenThousands % 1 === 0 ? `${tenThousands}만` : `${tenThousands.toFixed(1)}만`;
                            }
                            return price.toLocaleString();
                          };

                          return `${formatPrice(minPrice)}~${formatPrice(maxPrice)}원`;
                        }
                        return '가격 협의';
                      })()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <KeenIcon icon="shield-tick" className="text-purple-500 size-4" />
                    <span className="text-muted-foreground">{selectedCampaign.guarantee_unit === '회' ? '보장횟수:' : '보장일수:'}</span>
                    <span className="font-bold">
                      {selectedCampaign.guarantee_count || 30}{selectedCampaign.guarantee_unit || '일'}
                    </span>
                  </div>

                  {selectedCampaign.guarantee_period && (
                    <div className="flex items-center gap-1.5">
                      <KeenIcon icon="calendar-tick" className="text-purple-500 size-4" />
                      <span className="text-muted-foreground">작업일수:</span>
                      <span className="font-bold">
                        {selectedCampaign.guarantee_period}일
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <KeenIcon icon="rocket" className="text-green-500 size-4" />
                    <span className="text-muted-foreground">효율:</span>
                    <span className="font-bold text-green-600">
                      {selectedCampaign.efficiency || '-%'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <KeenIcon icon="wallet" className="text-primary size-4" />
                    <span className="text-muted-foreground">단가:</span>
                    <span className="font-bold text-primary">
                      {selectedCampaign.unit_price
                        ? `${Number(selectedCampaign.unit_price.toString().replace(/[^\d]/g, '')).toLocaleString()}원`
                        : '1,000원'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <KeenIcon icon="purchase" className="text-orange-500 size-4" />
                    <span className="text-muted-foreground">최소:</span>
                    <span className="font-bold">
                      {selectedCampaign.min_quantity
                        ? `${Number(selectedCampaign.min_quantity.toString().replace(/[^\d]/g, '')).toLocaleString()}개`
                        : '1개'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <KeenIcon icon="rocket" className="text-green-500 size-4" />
                    <span className="text-muted-foreground">효율:</span>
                    <span className="font-bold text-green-600">
                      {selectedCampaign.efficiency || '-%'}
                    </span>
                  </div>
                </>
              )}
            </div>

              <div className="text-sm">
                <div className="bg-blue-50/50 p-2 rounded border border-blue-100/50 text-gray-700 line-clamp-2">
                  {selectedCampaign.description || '설명이 없습니다.'}
                </div>
              </div>

              {/* 보장 요약 정보 - 보장형일 때만 표시 */}
              {selectedCampaign.slot_type === 'guarantee' && selectedCampaign.guarantee_period && selectedCampaign.guarantee_count && (
                <div className="mt-2">
                  <div className="bg-purple-50/50 p-2 rounded border border-purple-100/50">
                    <div className="flex items-center gap-1.5">
                      <KeenIcon icon="check" className="size-4 text-purple-500 flex-shrink-0" />
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        {selectedCampaign.guarantee_unit === '일' 
                          ? `작업 시작 후 ${selectedCampaign.guarantee_period}일 안에 순위 ${selectedCampaign.target_rank || '__'}위권을 ${selectedCampaign.guarantee_count}일 이상 유지하도록 보장합니다.`
                          : `작업 시작 후 ${selectedCampaign.guarantee_period}일 안에 ${selectedCampaign.guarantee_count}회 이상 작업을 보장합니다.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* 환불 정책 표시 - 오른쪽에 배치 */}
            <div className="w-[350px] shrink-0">
              {selectedCampaign.refund_settings && selectedCampaign.refund_settings.enabled ? (
                <div className="bg-amber-50/50 p-2 rounded border border-amber-100/50 h-full">
                  <div className="flex items-start gap-1.5">
                    <KeenIcon icon="shield-tick" className="text-amber-600 size-4 mt-0.5 shrink-0" />
                    <div className="text-sm text-gray-700 space-y-1">
                      <div className="font-medium text-amber-700">환불 정책</div>
                      <div>
                        • {selectedCampaign.refund_settings.type === 'immediate' ? '즉시 환불' : 
                          selectedCampaign.refund_settings.type === 'delayed' ? `${selectedCampaign.refund_settings.delay_days}일 후 환불` : 
                          `마감시간(${selectedCampaign.refund_settings.cutoff_time}) 기준 환불`}
                      </div>
                      {selectedCampaign.refund_settings.refund_rules && (
                        <div>
                          • 사용 {selectedCampaign.refund_settings.refund_rules.min_usage_days || 0}일 이상, {selectedCampaign.refund_settings.refund_rules.max_refund_days || 7}일 이내 환불 가능
                        </div>
                      )}
                      {selectedCampaign.refund_settings.requires_approval && (
                        <div className="text-orange-600">• 총판 승인 필요</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50/50 p-2 rounded border border-gray-100/50 h-full">
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    환불 정책 없음
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground text-sm">선택된 캠페인이 없거나 로딩 중입니다.</p>
        </div>
      )}
    </div>
  );
};