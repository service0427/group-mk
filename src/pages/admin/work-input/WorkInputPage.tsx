import React, { useState, useEffect } from 'react';
import { DashboardTemplate } from '@/components/pageTemplate/DashboardTemplate';
import { CampaignFilter, SlotsList } from './components';
import { Slot, FilterOptions, WorkInputFormData } from './types';
import { 
  getActiveSlots,
  addSlotWork
} from './services/workInputService';
import { toast } from 'sonner';
import { useAuthContext } from '@/auth/useAuthContext';
import { Card, CardContent } from '@/components/ui/card';

export const WorkInputPage: React.FC = () => {
  const { currentUser } = useAuthContext();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'approved',
    // service_type 제거 - 모든 서비스 타입 로드
    mat_id: '',
    campaign_id: undefined,
  });

  // 슬롯 목록 가져오기
  const fetchSlots = async () => {
    if (!currentUser?.id) return;
    
    setIsLoading(true);
    try {
      const data = await getActiveSlots(currentUser.id, filters);
      setSlots(data);
    } catch (error: any) {
      toast.error('슬롯 목록을 불러오는 중 오류가 발생했습니다.', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // 캐페인 선택 변경 시
  const handleCampaignSelect = (campaignId: number | undefined) => {
    setFilters(prev => ({ ...prev, campaign_id: campaignId }));
  };

  // 작업 입력 제출 핸들러
  const handleWorkInputSubmit = async (data: WorkInputFormData) => {
    if (!currentUser?.id) {
      toast.error('사용자 정보를 확인할 수 없습니다.');
      return;
    }

    try {
      await addSlotWork(data, currentUser.id);
      // 성공 후 슬롯 목록 새로고침
      await fetchSlots();
    } catch (error: any) {
      // 에러는 addSlotWork에서 이미 처리되므로 여기서는 re-throw
      throw error;
    }
  };

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    fetchSlots();
  }, [currentUser, filters]);

  // 페이지 제목과 설명
  const getPageTitle = () => "승인된 슬롯 목록";
  const getPageDescription = () => "모든 서비스의 승인된 슬롯 목록을 확인하는 페이지입니다.";

  return (
    <DashboardTemplate
      title={getPageTitle()}
      description={getPageDescription()}
      headerTextClass="text-white"
    >
      {/* 모든 서비스의 슬롯 목록 - 단일 영역으로 단순화 */}
      {slots.length === 0 && !isLoading ? (
        // 슬롯이 없을 경우 안내 메시지
        <Card className="mb-8">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="mb-2 text-gray-500">승인된 슬롯이 없습니다.</p>
            <p className="text-gray-400 text-sm">
              모든 서비스에 승인된 슬롯이 없습니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        // 슬롯 목록
        <SlotsList
          slots={slots}
          onSubmit={handleWorkInputSubmit}
          isLoading={isLoading}
          matId={currentUser?.id || ''}
        />
      )}
    </DashboardTemplate>
  );
};

export default WorkInputPage;