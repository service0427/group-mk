import React, { useState, useEffect } from 'react';
import { DashboardTemplate } from '@/components/pageTemplate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KeenIcon } from '@/components';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/auth';
import { formatDateTimeKorean } from '@/utils/Date';
import { useCustomToast } from '@/hooks/useCustomToast';
import { USER_ROLES } from '@/config/roles.config';
import { PerUnitWorkLogModal } from '@/components/per-unit/PerUnitWorkLogModal';

interface PerUnitSlot {
  id: string;
  request_id: string;
  quantity: number;
  unit_price: number;
  completed_quantity: number;
  status: string;
  work_start_date: string;
  created_at: string;
  per_unit_slot_request?: {
    per_unit_campaign?: {
      campaign?: {
        id: number;
        campaign_name: string;
        service_type: string;
        logo: string;
      };
      work_period_days: number;
    };
    user?: {
      id: string;
      email: string;
      full_name: string;
    };
  };
  work_logs?: any[];
}

export const PerUnitWorksPage: React.FC = () => {
  const { currentUser, userRole } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();
  const [slots, setSlots] = useState<PerUnitSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<PerUnitSlot | null>(null);
  const [isWorkLogModalOpen, setIsWorkLogModalOpen] = useState(false);

  // 진행 중인 슬롯 조회
  const fetchSlots = async () => {
    if (!currentUser?.id) return;

    try {
      setIsLoading(true);
      let query = supabase
        .from('per_unit_slots')
        .select(`
          *,
          per_unit_slot_request:request_id (
            per_unit_campaign:per_unit_campaign_id (
              campaign:campaign_id (
                id,
                campaign_name,
                service_type,
                logo,
                mat_id
              ),
              work_period_days
            ),
            user:user_id (
              id,
              email,
              full_name
            )
          ),
          work_logs:per_unit_work_logs (
            id,
            work_date,
            completed_quantity,
            status,
            created_at
          )
        `)
        .in('status', ['in_progress', 'completed'])
        .order('created_at', { ascending: false });

      // 총판은 자신의 캠페인만
      if (userRole === USER_ROLES.DISTRIBUTOR) {
        const { data: myCampaigns } = await supabase
          .from('campaigns')
          .select('id')
          .eq('mat_id', currentUser.id);

        const campaignIds = myCampaigns?.map(c => c.id) || [];
        
        if (campaignIds.length > 0) {
          const { data: perUnitCampaigns } = await supabase
            .from('per_unit_campaigns')
            .select('id')
            .in('campaign_id', campaignIds);

          const perUnitCampaignIds = perUnitCampaigns?.map(c => c.id) || [];
          
          // per_unit_slot_requests를 통해 필터링
          const { data: myRequests } = await supabase
            .from('per_unit_slot_requests')
            .select('id')
            .in('per_unit_campaign_id', perUnitCampaignIds);
          
          const requestIds = myRequests?.map(r => r.id) || [];
          query = query.in('request_id', requestIds);
        } else {
          query = query.eq('request_id', '00000000-0000-0000-0000-000000000000');
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      setSlots(data || []);
    } catch (error) {
      console.error('단건형 슬롯 조회 오류:', error);
      showError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [currentUser?.id]);

  // 진행률 계산
  const getProgressPercentage = (slot: PerUnitSlot): number => {
    if (slot.quantity === 0) return 0;
    return Math.round((slot.completed_quantity / slot.quantity) * 100);
  };

  // 상태별 색상
  const getStatusColor = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // 상태별 라벨
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'in_progress':
        return '진행중';
      case 'completed':
        return '완료';
      default:
        return '알 수 없음';
    }
  };

  // 작업 기간 경과일 계산
  const getElapsedDays = (startedAt: string): number => {
    const start = new Date(startedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <DashboardTemplate
      title="단건형 작업 관리"
      description="단건형 슬롯의 작업 실적을 관리합니다."
      headerTextClass="text-white"
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">진행 중인 단건형 작업</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchSlots}
            >
              <KeenIcon icon="arrows-circle" className="size-4 mr-2" />
              새로고침
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>캠페인</th>
                  <th>광고주</th>
                  <th>전체/완료</th>
                  <th>진행률</th>
                  <th>단가</th>
                  <th>작업 기간</th>
                  <th>상태</th>
                  <th>시작일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="mt-4 text-muted-foreground">로딩 중...</p>
                    </td>
                  </tr>
                ) : slots.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8">
                      <KeenIcon icon="information-3" className="text-5xl text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">진행 중인 단건형 작업이 없습니다.</p>
                    </td>
                  </tr>
                ) : (
                  slots.map((slot) => {
                    const progressPercentage = getProgressPercentage(slot);
                    const elapsedDays = getElapsedDays(slot.work_start_date);
                    const totalDays = slot.per_unit_slot_request?.per_unit_campaign?.work_period_days || 30;
                    
                    return (
                      <tr key={slot.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            {slot.per_unit_slot_request?.per_unit_campaign?.campaign?.logo && (
                              <img
                                src={slot.per_unit_slot_request.per_unit_campaign.campaign.logo}
                                alt=""
                                className="size-8 rounded"
                              />
                            )}
                            <div>
                              <div className="font-medium">
                                {slot.per_unit_slot_request?.per_unit_campaign?.campaign?.campaign_name || '알 수 없음'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {slot.per_unit_slot_request?.per_unit_campaign?.campaign?.service_type}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="font-medium">
                              {slot.per_unit_slot_request?.user?.full_name || '알 수 없음'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {slot.per_unit_slot_request?.user?.email}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="font-medium">
                            {slot.completed_quantity.toLocaleString()} / {slot.quantity.toLocaleString()}건
                          </div>
                        </td>
                        <td>
                          <div className="w-24">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${progressPercentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{progressPercentage}%</span>
                            </div>
                          </div>
                        </td>
                        <td>{slot.unit_price.toLocaleString()}원</td>
                        <td>
                          <div>
                            <div className="font-medium">{elapsedDays} / {totalDays}일</div>
                            {elapsedDays > totalDays && (
                              <div className="text-xs text-danger">기간 초과</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge variant={getStatusColor(slot.status)}>
                            {getStatusLabel(slot.status)}
                          </Badge>
                        </td>
                        <td>{formatDateTimeKorean(slot.work_start_date)}</td>
                        <td>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedSlot(slot);
                              setIsWorkLogModalOpen(true);
                            }}
                            disabled={slot.status === 'completed'}
                          >
                            <KeenIcon icon="document" className="size-4 mr-1" />
                            작업 입력
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 작업 실적 입력 모달 */}
      {selectedSlot && (
        <PerUnitWorkLogModal
          isOpen={isWorkLogModalOpen}
          onClose={() => {
            setIsWorkLogModalOpen(false);
            setSelectedSlot(null);
          }}
          slot={selectedSlot}
          onSuccess={() => {
            setIsWorkLogModalOpen(false);
            setSelectedSlot(null);
            fetchSlots();
          }}
        />
      )}
    </DashboardTemplate>
  );
};