import React from 'react';
import { KeenIcon } from '@/components';
import { SERVICE_TYPE_LABELS } from '../types';

interface ServiceCampaignSelectorProps {
  selectedServiceCode: string;
  selectedCampaignId: number | null;
  campaigns: any[];
  loading: boolean;
  isCompactMode: boolean;
  handleServiceChange: (serviceCode: string) => void;
  setSelectedCampaignId: (id: number) => void;
  setSlotData: React.Dispatch<React.SetStateAction<any>>;
  fetchCampaignBanner: (campaign: any) => void;
}

export const ServiceCampaignSelector: React.FC<ServiceCampaignSelectorProps> = ({
  selectedServiceCode,
  selectedCampaignId,
  campaigns,
  loading,
  isCompactMode,
  handleServiceChange,
  setSelectedCampaignId,
  setSlotData,
  fetchCampaignBanner
}) => {
  if (isCompactMode) {
    return (
      <div className="flex items-center justify-between">
        {/* 좌측: 섹션 제목 - 모바일에서는 숨김 */}
        <div className="hidden sm:flex items-center gap-2">
          <KeenIcon icon="document" className="text-primary size-4" />
          <span className="text-sm font-medium text-foreground">캠페인 정보</span>
        </div>

        {/* 우측: 서비스 선택 및 캠페인 선택 - 모바일에서는 전체 너비 */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* 모바일용 아이콘 */}
          <KeenIcon icon="document" className="text-primary size-4 shrink-0 sm:hidden" />
          {/* 서비스 선택 */}
          <KeenIcon icon="category" className="text-green-500 size-4 shrink-0" />
          <div className="w-1/2 sm:w-48">
            <select
              id="service-select"
              value={selectedServiceCode}
              onChange={(e) => {
                handleServiceChange(e.target.value);
              }}
              className="select flex w-full bg-white rounded-md border border-input text-sm ring-offset-0 hover:border-gray-400 focus:border-primary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 h-8 pl-2 pr-6"
            >
              {Object.entries(SERVICE_TYPE_LABELS).map(([type, label]) => (
                <option key={type} value={type}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* 캠페인 선택 */}
          <KeenIcon icon="document" className="text-blue-500 size-4 shrink-0" />
          <div className="w-1/2 sm:w-64">
            {loading ? (
              <div className="flex items-center h-8 text-xs text-muted-foreground pl-2">로딩중...</div>
            ) : campaigns.length > 0 ? (
              <select
                id="campaign-select"
                value={selectedCampaignId || ''}
                onChange={(e) => {
                  const campId = Number(e.target.value);
                  setSelectedCampaignId(campId);
                  // 캠페인 변경 시 슬롯 데이터 업데이트
                  setSlotData((prev: any) => ({
                    ...prev,
                    campaignId: campId
                  }));
                  // 배너 정보 가져오기
                  const selected = campaigns.find(c => c.id === campId);
                  if (selected) {
                    fetchCampaignBanner(selected);
                  }
                }}
                className="select flex w-full bg-background rounded-md border border-input text-sm ring-offset-0 hover:border-gray-400 focus:border-primary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 h-8 pl-2 pr-6"
              >
                {campaigns.map((camp) => (
                  <option key={camp.id} value={camp.id}>
                    {camp.slot_type === 'guarantee' ? '[보장형] ' : '[일반형] '}{camp.campaign_name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center h-8 text-xs text-muted-foreground pl-2">없음</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 일반 모드
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center gap-2">
        <KeenIcon icon="document" className="text-primary size-4" />
        <span className="text-sm font-medium text-foreground">캠페인 정보</span>
      </div>
      <div className="flex items-center gap-3 ml-auto">
        {/* 서비스 선택 */}
        <div className="flex items-center gap-2">
          <KeenIcon icon="category" className="text-green-500 size-4" />
          <label htmlFor="service-select" className="text-sm font-medium text-muted-foreground">
            서비스:
          </label>
          <select
            id="service-select"
            value={selectedServiceCode}
            onChange={(e) => {
              handleServiceChange(e.target.value);
            }}
            className="select flex max-w-full bg-white rounded-md border border-input text-sm ring-offset-0 hover:border-gray-400 focus:border-primary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {Object.entries(SERVICE_TYPE_LABELS).map(([type, label]) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* 캠페인 선택 */}
        <div className="flex items-center gap-2">
          <KeenIcon icon="document" className="text-blue-500 size-4" />
          <label htmlFor="campaign-select" className="text-sm font-medium text-muted-foreground">
            캠페인:
          </label>
          {loading ? (
            <div className="text-sm text-muted-foreground">로딩중...</div>
          ) : campaigns.length > 0 ? (
            <select
              id="campaign-select"
              value={selectedCampaignId || ''}
              onChange={(e) => {
                const campId = Number(e.target.value);
                setSelectedCampaignId(campId);
                // 캠페인 변경 시 슬롯 데이터 업데이트
                setSlotData((prev: any) => ({
                  ...prev,
                  campaignId: campId
                }));
                // 배너 정보 가져오기
                const selected = campaigns.find(c => c.id === campId);
                if (selected) {
                  fetchCampaignBanner(selected);
                }
              }}
              className="select flex max-w-full bg-background rounded-md border border-input text-sm ring-offset-0 hover:border-gray-400 focus:border-primary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {campaigns.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.slot_type === 'guarantee' ? '[보장형] ' : '[일반형] '}{camp.campaign_name}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-sm text-muted-foreground">캠페인 없음</div>
          )}
        </div>
      </div>
    </div>
  );
};