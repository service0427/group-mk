import React, { useState, useEffect } from 'react';
import { Campaign, getCampaignsByServiceType, getServiceTypeName } from '../services/workInputService';
import { useAuthContext } from '@/auth/useAuthContext';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface CampaignFilterProps {
  serviceType: string;
  selectedCampaignId?: number;
  onCampaignSelect: (campaignId: number | undefined) => void;
  isLoading: boolean;
}

const CampaignFilter: React.FC<CampaignFilterProps> = ({
  serviceType,
  selectedCampaignId,
  onCampaignSelect,
  isLoading
}) => {
  const { currentUser } = useAuthContext();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 캠페인 목록 로드
  useEffect(() => {
    const loadCampaigns = async () => {
      if (!currentUser?.id || !serviceType) return;
      
      setLoading(true);
      try {
        const data = await getCampaignsByServiceType(currentUser.id, serviceType);
        console.log('캠페인 데이터:', data, '서비스 타입:', serviceType);
        setCampaigns(data);
      } catch (error) {
        console.error('캠페인 목록 로드 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCampaigns();
  }, [currentUser?.id, serviceType]);

  // 캠페인 ID를 문자열로 변환 (Select 컴포넌트용)
  const campaignIdToString = (id: number | undefined) => {
    return id !== undefined ? id.toString() : 'all';
  };

  // 문자열을 캠페인 ID로 변환 (Select 컴포넌트용)
  const stringToCampaignId = (value: string) => {
    return value && value !== 'all' ? parseInt(value) : undefined;
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
          {getServiceTypeName(serviceType)}
        </Badge>
        <span className="mx-2 text-gray-500">캠페인:</span>
      </div>
      
      <div className="flex-grow max-w-xs">
        <Select
          value={campaignIdToString(selectedCampaignId)}
          onValueChange={(value) => onCampaignSelect(stringToCampaignId(value))}
          disabled={loading || isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="모든 캠페인" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 캠페인</SelectItem>
            {campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id.toString()}>
                  {campaign.campaign_name} ({campaign.slot_count})
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-4 text-center text-gray-500 text-sm">
                {loading ? '캠페인 로딩 중...' : '사용 가능한 캠페인이 없습니다'}
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CampaignFilter;