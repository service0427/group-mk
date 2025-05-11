import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';
import { getStatusColorClass, CampaignDetailData as ICampaignDetailData } from '@/utils/CampaignFormat';
import { supabase } from '@/supabase';

// 기존 인터페이스를 유틸리티에서 가져온 인터페이스로 대체

interface CampaignDetailViewModalProps {
  open: boolean;
  onClose: () => void;
  campaign: ICampaignDetailData | null;
}

const CampaignDetailViewModal: React.FC<CampaignDetailViewModalProps> = ({
  open,
  onClose,
  campaign
}) => {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 캠페인 이름으로 Supabase에서 배너 이미지 URL 가져오기
  useEffect(() => {
    if (open && campaign && campaign.campaignName) {
      const fetchCampaignBanner = async () => {
        setLoading(true);
        try {
          
          // Supabase에서 모든 캠페인 목록 가져오기
          const { data: allCampaigns, error: allError } = await supabase
            .from('campaigns')
            .select('id, campaign_name, add_info')
            .order('id', { ascending: false });
            
          if (allError) {
            
            return;
          }
          
          // 이름이 완전히 일치하는 캠페인 찾기
          let matchedCampaign = allCampaigns?.find(c => 
            c.campaign_name === campaign.campaignName
          );
          
          // 일치하는 캠페인이 없으면 대소문자 무시하고 검색
          if (!matchedCampaign) {
            matchedCampaign = allCampaigns?.find(c => 
              c.campaign_name.toLowerCase() === campaign.campaignName.toLowerCase()
            );
          }
          
          // 아직도 없으면 이름에 포함되는지 검색
          if (!matchedCampaign) {
            matchedCampaign = allCampaigns?.find(c => 
              c.campaign_name.toLowerCase().includes(campaign.campaignName.toLowerCase()) ||
              campaign.campaignName.toLowerCase().includes(c.campaign_name.toLowerCase())
            );
          }
          
          if (matchedCampaign) {
            
            // add_info에서 배너 URL 가져오기
            let bannerUrl = null;
            if (matchedCampaign.add_info) {
              
              if (typeof matchedCampaign.add_info === 'string') {
                try {
                  const addInfo = JSON.parse(matchedCampaign.add_info);
                  bannerUrl = addInfo.banner_url || null;
                } catch (e) {
                  
                }
              } else {
                bannerUrl = matchedCampaign.add_info.banner_url || null;
              }
            }
            
            setBannerUrl(bannerUrl);
          }
          
        } catch (err) {
          
        } finally {
          setLoading(false);
        }
      };

      fetchCampaignBanner();
    }
  }, [open, campaign]);

  if (!campaign) return null;

  // 캠페인 ID는 업데이트 조건으로만 사용
  const campaignId = campaign.id;
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden overflow-y-auto max-h-[90vh] border-4 border-primary">
        <DialogHeader className="bg-gray-100 dark:bg-gray-800 py-3 px-4 border-b sticky top-0 z-10 shadow-sm">
          <DialogTitle className="text-lg font-semibold text-foreground flex items-center">
            <KeenIcon icon="eye" className="mr-2 text-primary" />
            캠페인 정보
          </DialogTitle>
        </DialogHeader>
        
        <div className="bg-background">
          {/* 배너 이미지 (Supabase에서 직접 가져옴) */}
          {loading ? (
            <div className="w-full h-[180px] bg-gray-100 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : bannerUrl ? (
            <div className="w-full">
              <img 
                src={bannerUrl}
                alt="캠페인 배너" 
                className="w-full h-auto object-cover"
                style={{ maxHeight: '250px' }}
                onError={(e) => {
                  // 이미지 로드 실패 시 기본 배경으로 대체
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.className = "w-full h-[180px] bg-gradient-to-r from-primary/20 to-blue-500/20 flex items-center justify-center";
                  
                  // 로고 이미지 추가
                  const logoImg = document.createElement('img');
                  logoImg.src = toAbsoluteUrl('/media/app/mini-logo-primary.svg');
                  logoImg.alt = '캠페인 로고';
                  logoImg.className = 'h-16 w-auto opacity-50';
                  e.currentTarget.parentElement!.appendChild(logoImg);
                }}
              />
            </div>
          ) : (
            <div className="w-full">
              <div className="w-full h-[180px] bg-gradient-to-r from-primary/20 to-blue-500/20 flex items-center justify-center">
                <img 
                  src={toAbsoluteUrl('/media/app/mini-logo-primary.svg')}
                  alt="캠페인 배너" 
                  className="h-16 w-auto opacity-50"
                />
              </div>
            </div>
          )}
          
          <div className="p-6">
            {/* 캠페인 ID 숨김 처리 */}
            <input type="hidden" value={campaignId} />
            
            {/* 캠페인 헤더 정보 */}
            <div className="flex items-center gap-4 mb-6">
              <img
                src={campaign.logo.startsWith('/media') || campaign.logo.startsWith('http') 
                  ? campaign.logo 
                  : toAbsoluteUrl(`/media/${campaign.logo}`)}
                className="rounded-full size-16 shrink-0 object-cover"
                alt={campaign.campaignName}
                onError={(e) => {
                  // 이미지 로드 실패 시 기본 이미지 사용
                  (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/animal/svg/lion.svg');
                }}
              />
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {campaign.campaignName}
                </h2>
                <div className="mt-1 flex gap-2">
                  <span className={`badge ${campaign.status.color} badge-outline rounded-[30px]`}>
                    <span className={`size-1.5 rounded-full bg-${getStatusColorClass(campaign.status.color)} me-1.5`}></span>
                    {campaign.status.label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    마감시간: {campaign.deadline || '18:00'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* 캠페인 주요 정보 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-muted p-4 rounded-md">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">건당 단가</h3>
                <p className="text-xl font-semibold text-primary">
                  {campaign.unitPrice ? (campaign.unitPrice.endsWith('원') ? campaign.unitPrice : `${campaign.unitPrice}원`) : '1,000원'}
                </p>
              </div>
              <div className="bg-muted p-4 rounded-md">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">마감 시간</h3>
                <p className="text-xl font-semibold text-primary">{campaign.deadline}</p>
              </div>
            </div>
            
            {/* 캠페인 설명 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">캠페인 설명</h3>
              <div className="bg-muted p-4 rounded-md">
                <p className="text-foreground whitespace-pre-line">
                  {campaign.description || '설명이 없습니다.'}
                </p>
              </div>
            </div>
            
            {/* 캠페인 상세 설명 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">캠페인 상세 설명</h3>
              <div className="bg-muted p-4 rounded-md">
                <p className="text-foreground whitespace-pre-line">
                  {campaign.detailedDescription || campaign.description || '상세 설명이 없습니다.'}
                </p>
              </div>
            </div>
            
            {/* 가이드라인 정보 */}
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md text-blue-600 dark:text-blue-300 mb-6">
              <div className="flex items-start">
                <KeenIcon icon="information-circle" className="size-5 mr-2 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">캠페인 가이드라인</p>
                  <ul className="text-sm mt-1 list-disc list-inside space-y-1">
                    <li>해당 캠페인 건당 단가는 {campaign.unitPrice || '1,000'}원입니다.</li>
                    <li>캠페인 접수 시간은 {campaign.deadline}까지 입니다.</li>
                    <li>데이터는 24시간 내에 집계되며, 결과는 대시보드에서 확인할 수 있습니다.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end p-4 border-t bg-gray-100 dark:bg-gray-800 sticky bottom-0 shadow-lg">
            <Button 
              onClick={onClose}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              확인
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { CampaignDetailViewModal };