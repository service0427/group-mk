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
    
    return null;
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
    
    return toAbsoluteUrl('/media/animal/svg/animal-default.svg');
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden flex flex-col h-[85vh] border-4 border-primary" aria-describedby={undefined}>
        <DialogHeader className="bg-gray-100 dark:bg-gray-800 py-3 px-4 border-b sticky top-0 z-20 shadow-sm">
          <DialogTitle className="text-lg font-semibold text-foreground flex items-center">
            <KeenIcon icon="eye" className="mr-2 text-primary" />
            캠페인 미리보기
          </DialogTitle>
        </DialogHeader>
        
        <DialogBody className="bg-background p-0 overflow-y-auto flex flex-col">
          {/* 배너 이미지 (있을 경우) */}
          {bannerImageUrl && (
            <div className="w-full flex-shrink-0">
              <img 
                src={bannerImageUrl} 
                alt="캠페인 배너" 
                className="w-full h-auto object-cover"
                style={{ maxHeight: '250px' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* 캠페인 헤더 정보 - 스크롤 시 고정 */}
          <div className="bg-background p-4 border-b sticky top-0 z-10 shadow-sm flex-shrink-0">
            <div className="flex items-center gap-4 mb-6">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  className="rounded-full size-16 shrink-0 object-cover"
                  alt="캠페인 로고"
                />
              ) : (
                <div className="rounded-full size-16 bg-gray-100 flex items-center justify-center text-gray-400 font-medium border border-gray-200 shadow-sm shrink-0">
                  로고
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {campaign.campaignName}
                </h2>
                <div className="mt-1 flex gap-2">
                  <span className={`badge badge-${statusInfo.color} badge-outline rounded-[30px]`}>
                    <span className={`size-1.5 rounded-full bg-${statusInfo.color} me-1.5`}></span>
                    {statusInfo.label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    마감시간: {campaign.deadline}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 스크롤 가능한 본문 내용 */}
          <div className="p-6 flex-grow overflow-y-auto">
            {/* 캠페인 주요 정보 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-muted p-4 rounded-md">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">건당 단가</h3>
                <p className="text-xl font-semibold text-primary">{unitPrice}원</p>
              </div>
              <div className="bg-muted p-4 rounded-md">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">최소 수량</h3>
                <p className="text-xl font-semibold text-primary">
                  {campaign.minQuantity ? campaign.minQuantity.replace(/[^0-9]/g, '') : '10'}개
                </p>
              </div>
            </div>
            
            {/* 캠페인 설명 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">캠페인 설명</h3>
              <div className="bg-muted p-4 rounded-md">
                <p className="text-foreground whitespace-pre-line">
                  {campaign.description}
                </p>
              </div>
            </div>
            
            {/* 캠페인 상세 설명 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">캠페인 상세 설명</h3>
              <div className="bg-muted p-4 rounded-md">
                <p className="text-foreground whitespace-pre-line">
                  {campaign.detailedDescription ? 
                    campaign.detailedDescription : 
                    (campaign.originalData?.detailed_description || campaign.description)}
                </p>
              </div>
            </div>
            
            {/* 서비스 타입 정보 (존재하는 경우) */}
            {campaign.serviceType && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">서비스 정보</h3>
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-foreground">서비스 타입: {campaign.serviceType}</p>
                  
                  {/* 추가 필드 표시 (존재하는 경우) */}
                  {campaign.additionalFields && Object.keys(campaign.additionalFields).length > 0 && (
                    <div className="mt-2 grid gap-2">
                      {Object.entries(campaign.additionalFields).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{key}:</span>
                          <span className="text-sm text-foreground">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogBody>
        
        <DialogFooter className="p-4 border-t bg-gray-100 dark:bg-gray-800 sticky bottom-0 z-10 shadow-lg">
          <Button 
            onClick={onClose}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { CampaignPreviewModal };