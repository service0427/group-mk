import React from 'react';
import { KeenIcon } from '@/components';
import { ICampaign } from './types';
import { toAbsoluteUrl } from '@/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CampaignPreviewModalProps {
  open: boolean;
  onClose: () => void;
  campaign: ICampaign | null;
}

/**
 * 캠페인 미리보기 모달
 * 캠페인의 상세 정보를 볼 수 있는 모달 컴포넌트
 */
const CampaignPreviewModal: React.FC<CampaignPreviewModalProps> = ({
  open,
  onClose,
  campaign
}) => {
  if (!campaign) return null;

  // 배너 이미지 URL 가져오기
  const getBannerImageUrl = () => {
    if (campaign.originalData?.add_info?.banner_url) {
      return campaign.originalData.add_info.banner_url;
    }

    if (campaign.bannerImage) {
      return typeof campaign.bannerImage === 'string' && campaign.bannerImage.startsWith('http')
        ? campaign.bannerImage
        : toAbsoluteUrl(`/media/${campaign.bannerImage}`);
    }

    // 배너가 없으면 기본 배너 이미지 반환
    return toAbsoluteUrl('/media/campaign/default-banner.jpg');
  };

  // 로고 URL 가져오기
  const getLogoUrl = () => {
    if (campaign.originalData?.add_info?.logo_url) {
      return campaign.originalData.add_info.logo_url;
    }

    if (campaign.logo) {
      return typeof campaign.logo === 'string' && campaign.logo.startsWith('http')
        ? campaign.logo
        : toAbsoluteUrl(`/media/${campaign.logo}`);
    }

    // 로고가 없으면 랜덤 동물 SVG 사용
    const animalLogos = [
      'bear', 'cat', 'cow', 'crocodile', 'dolphin', 'elephant',
      'flamingo', 'giraffe', 'horse', 'kangaroo', 'koala',
      'leopard', 'lion', 'llama', 'owl', 'pelican', 'penguin',
      'sheep', 'teddy-bear', 'turtle'
    ];
    const randomAnimal = animalLogos[Math.floor(Math.random() * animalLogos.length)];
    return toAbsoluteUrl(`/media/animal/svg/${randomAnimal}.svg`);
  };

  // 상태 정보 가져오기
  const getStatusInfo = () => {
    if (typeof campaign.status === 'object' && campaign.status !== null) {
      return {
        label: campaign.status.label || '준비중',
        color: campaign.status.color || 'info',
        status: campaign.status.status || 'pending'
      };
    }

    return {
      label: '준비중',
      color: 'info',
      status: 'pending'
    };
  };

  // 단가 정보 가져오기
  const getUnitPrice = () => {
    if (campaign.unitPrice) {
      return campaign.unitPrice;
    }

    if (campaign.originalData?.unit_price) {
      return campaign.originalData.unit_price.toString();
    }

    return '100';
  };

  const statusInfo = getStatusInfo();
  const bannerImageUrl = getBannerImageUrl();
  const logoUrl = getLogoUrl();
  const unitPrice = getUnitPrice();

  // 보장형 서비스 여부 확인
  const isGuaranteeType = campaign.originalData?.slot_type === 'guarantee' || campaign.slotType === 'guarantee';
  const guaranteeCount = campaign.originalData?.guarantee_count || campaign.guaranteeCount;
  const guaranteeUnit = campaign.originalData?.guarantee_unit || campaign.guaranteeUnit || '일';
  const minGuaranteePrice = campaign.originalData?.min_guarantee_price || campaign.minGuaranteePrice;
  const maxGuaranteePrice = campaign.originalData?.max_guarantee_price || campaign.maxGuaranteePrice;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[900px] p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="bg-background py-3 px-5">
          <DialogTitle className="text-lg font-medium text-foreground">캠페인 상세정보 (미리보기)</DialogTitle>
        </DialogHeader>
        <div className="bg-background flex flex-col h-[85vh] w-full">
          <div className="flex-shrink-0">
            {/* 배너 이미지 영역 - 상세보기 모달과 동일한 구조 */}
            <div className="w-full relative h-[220px]">
              <div className="absolute inset-0 overflow-hidden">
                {/* 배경 이미지(블러용) */}
                <img
                  src={bannerImageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ filter: 'blur(8px) brightness(0.9)', transform: 'scale(1.1)' }}
                  onError={(e) => {
                    e.currentTarget.src = toAbsoluteUrl('/media/brand-logos/marketing-standard-icon.svg');
                  }}
                />
                {/* 배경 오버레이 */}
                <div className="absolute inset-0 bg-black/20"></div>
              </div>
              {/* 실제 이미지 (블러 없음) */}
              <div className="relative z-10 flex justify-center items-center h-full">
                <img
                  src={bannerImageUrl}
                  alt="캠페인 배너"
                  className="object-contain max-h-[180px] max-w-[90%] shadow-lg rounded-md"
                  onError={(e) => {
                    e.currentTarget.src = toAbsoluteUrl('/media/brand-logos/marketing-standard-icon.svg');
                  }}
                />
              </div>
            </div>

            {/* 캠페인 헤더 정보 - 개선된 디자인 */}
            <div className={`border-b px-5 py-4 ${isGuaranteeType
                ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800'
                : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
              }`}>
              <div className="flex items-center gap-4">
                {/* 로고 이미지 - 크기 증가 */}
                <div className="relative">
                  <img
                    src={logoUrl}
                    className="rounded-xl size-16 shrink-0 object-cover border-2 border-gray-200 shadow-md"
                    alt={campaign?.campaignName}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/animal/svg/lion.svg');
                    }}
                  />
                </div>

                {/* 캠페인 정보 */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    {campaign?.campaignName}
                  </h2>

                  {/* 배지들 - 아이콘 포함 */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isGuaranteeType
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                      <KeenIcon icon={isGuaranteeType ? 'shield-tick' : 'element-11'} className="mr-1.5 size-3.5" />
                      {isGuaranteeType ? '보장형' : '일반형'}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
                        statusInfo.color === 'danger' ? 'bg-red-50 text-red-700 border-red-200' :
                          statusInfo.color === 'warning' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                      <span className={`size-2 rounded-full mr-1.5 ${statusInfo.color === 'success' ? 'bg-green-500' :
                          statusInfo.color === 'danger' ? 'bg-red-500' :
                            statusInfo.color === 'warning' ? 'bg-yellow-500' :
                              'bg-blue-500'
                        }`}></span>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 스크롤 가능한 콘텐츠 영역 - 상세보기 모달과 동일한 구조 */}
          <div className="flex-grow overflow-y-auto p-6">
            <div className="space-y-6">
              {/* 상단: 주요 정보 요약 카드 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <KeenIcon icon="rocket" className="text-green-500 size-5" />
                    <h3 className="text-sm text-muted-foreground">상승효율</h3>
                  </div>
                  <p className="text-xl font-bold text-green-600">
                    {campaign.efficiency || '60%'}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <KeenIcon icon="wallet" className="text-primary size-5" />
                    <h3 className="text-sm text-muted-foreground">
                      {isGuaranteeType ? '가격범위' : '건당단가'}
                    </h3>
                  </div>
                  <p className={`font-bold text-primary ${isGuaranteeType ? 'text-sm' : 'text-xl'}`}>
                    {isGuaranteeType ? (
                      minGuaranteePrice && maxGuaranteePrice ? (
                        (() => {
                          const min = Number(minGuaranteePrice);
                          const max = Number(maxGuaranteePrice);

                          // 금액이 너무 크면 축약 표기
                          const formatPrice = (price: number) => {
                            if (price >= 100000000) { // 1억 이상
                              const billions = price / 100000000;
                              return billions % 1 === 0 ? `${billions}억` : `${billions.toFixed(1)}억`;
                            } else if (price >= 10000000) { // 1천만 이상
                              const tenMillions = price / 10000000;
                              return tenMillions % 1 === 0 ? `${tenMillions}천만` : `${tenMillions.toFixed(1)}천만`;
                            } else if (price >= 10000) { // 1만 이상
                              const tenThousands = price / 10000;
                              return tenThousands % 1 === 0 ? `${tenThousands}만` : `${tenThousands.toFixed(1)}만`;
                            }
                            return price.toLocaleString();
                          };

                          return `${formatPrice(min)} ~ ${formatPrice(max)}원`;
                        })()
                      ) : '-'
                    ) : (
                      `${unitPrice}원`
                    )}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <KeenIcon icon="basket" className="text-orange-500 size-5" />
                    <h3 className="text-sm text-muted-foreground">
                      {isGuaranteeType ? '보장' : '최소수량'}
                    </h3>
                  </div>
                  <p className="text-xl font-bold text-orange-600">
                    {isGuaranteeType ? (
                      guaranteeCount ? `${guaranteeCount}${guaranteeUnit}` : '-'
                    ) : (
                      (() => {
                        const minQty = campaign.minQuantity || '100';
                        // 이미 "개"가 포함된 경우 그대로 사용
                        if (String(minQty).includes('개')) {
                          return minQty;
                        }
                        // 숫자만 있는 경우 "개" 추가
                        return `${minQty.replace(/[^0-9]/g, '')}개`;
                      })()
                    )}
                  </p>
                </div>
              </div>

              {/* 캠페인 정보 */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">캠페인 정보</h3>
                <div className="bg-white border border-border p-5 rounded-xl">
                  <div className="mb-4">
                    <h4 className="font-medium text-primary mb-2">설명</h4>
                    <p className="text-sm whitespace-pre-line text-gray-700 bg-blue-50/50 p-3 rounded-md border border-blue-100/50">
                      {campaign.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-primary mb-2">상세 설명</h4>
                    <div className="max-h-[200px] overflow-y-auto pr-2 rounded-md p-3 bg-blue-50/30">
                      <p className="whitespace-pre-line text-gray-700 text-sm">
                        {campaign.detailedDescription ?
                          campaign.detailedDescription :
                          (campaign.originalData?.detailed_description || campaign.description)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-background sticky bottom-0 z-10 shadow-lg">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-primary font-medium">
              <KeenIcon icon="information-2" className="mr-1 size-4" />
              이 화면은 미리보기 모드입니다
            </p>
            <Button
              onClick={onClose}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              확인
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { CampaignPreviewModal };