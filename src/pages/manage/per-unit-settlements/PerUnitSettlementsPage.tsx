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
import { PerUnitSettlementModal } from '@/components/per-unit/PerUnitSettlementModal';

interface Settlement {
  id: string;
  slot_id: string;
  work_log_ids: string[];
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: string;
  settlement_date: string;
  created_at: string;
  per_unit_slot?: {
    per_unit_slot_request?: {
      per_unit_campaign?: {
        campaign?: {
          campaign_name: string;
          service_type: string;
          logo: string;
        };
      };
      user?: {
        full_name: string;
        email: string;
      };
    };
  };
}

export const PerUnitSettlementsPage: React.FC = () => {
  const { currentUser, userRole } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [pendingWorkLogs, setPendingWorkLogs] = useState<any[]>([]);

  // 정산 내역 조회
  const fetchSettlements = async () => {
    if (!currentUser?.id) return;

    try {
      setIsLoading(true);
      
      // 정산 내역 조회
      let query = supabase
        .from('per_unit_settlements')
        .select(`
          *,
          per_unit_slot:slot_id (
            per_unit_slot_request:request_id (
              per_unit_campaign:per_unit_campaign_id (
                campaign:campaign_id (
                  campaign_name,
                  service_type,
                  logo,
                  mat_id
                )
              ),
              user:user_id (
                full_name,
                email
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      // 총판은 자신의 캠페인만
      if (userRole === USER_ROLES.DISTRIBUTOR) {
        // 자신의 캠페인 ID 가져오기
        const { data: myCampaigns } = await supabase
          .from('campaigns')
          .select('id')
          .eq('mat_id', currentUser.id);

        const campaignIds = myCampaigns?.map(c => c.id) || [];
        
        if (campaignIds.length === 0) {
          setSettlements([]);
          setPendingWorkLogs([]);
          setIsLoading(false);
          return;
        }

        // per_unit_campaigns를 통해 필터링
        const { data: perUnitCampaigns } = await supabase
          .from('per_unit_campaigns')
          .select('id')
          .in('campaign_id', campaignIds);

        const perUnitCampaignIds = perUnitCampaigns?.map(c => c.id) || [];
        
        // 관련 슬롯 찾기
        const { data: mySlots } = await supabase
          .from('per_unit_slot_requests')
          .select('id')
          .in('per_unit_campaign_id', perUnitCampaignIds);
        
        const requestIds = mySlots?.map(s => s.id) || [];
        
        const { data: slotIds } = await supabase
          .from('per_unit_slots')
          .select('id')
          .in('request_id', requestIds);
        
        const slotIdList = slotIds?.map(s => s.id) || [];
        query = query.in('slot_id', slotIdList);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSettlements(data || []);

      // 정산 대기 중인 작업 로그 조회
      await fetchPendingWorkLogs();
    } catch (error) {
      console.error('정산 내역 조회 오류:', error);
      showError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 정산 대기 중인 작업 로그 조회
  const fetchPendingWorkLogs = async () => {
    if (!currentUser?.id) return;

    try {
      let query = supabase
        .from('per_unit_work_logs')
        .select(`
          *,
          per_unit_slot:slot_id (
            id,
            unit_price,
            per_unit_slot_request:request_id (
              per_unit_campaign:per_unit_campaign_id (
                campaign:campaign_id (
                  id,
                  campaign_name,
                  mat_id
                )
              ),
              user:user_id (
                full_name,
                email
              )
            )
          )
        `)
        .eq('status', 'approved')
        .is('settlement_id', null);

      const { data, error } = await query;
      if (error) throw error;

      // 총판은 자신의 캠페인만 필터링
      if (userRole === USER_ROLES.DISTRIBUTOR) {
        const filteredLogs = data?.filter(log => 
          log.per_unit_slot?.per_unit_slot_request?.per_unit_campaign?.campaign?.mat_id === currentUser.id
        ) || [];
        setPendingWorkLogs(filteredLogs);
      } else {
        setPendingWorkLogs(data || []);
      }
    } catch (error) {
      console.error('대기 중인 작업 로그 조회 오류:', error);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [currentUser?.id]);

  // 상태별 색상
  const getStatusColor = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // 상태별 라벨
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending':
        return '정산 대기';
      case 'completed':
        return '정산 완료';
      case 'cancelled':
        return '정산 취소';
      default:
        return '알 수 없음';
    }
  };

  // 정산 처리
  const handleSettlement = async () => {
    if (pendingWorkLogs.length === 0) {
      showError('정산할 작업 내역이 없습니다.');
      return;
    }

    try {
      // 슬롯별로 그룹화
      const slotGroups = pendingWorkLogs.reduce((acc, log) => {
        const slotId = log.slot_id;
        if (!acc[slotId]) {
          acc[slotId] = {
            slot: log.per_unit_slot,
            logs: []
          };
        }
        acc[slotId].logs.push(log);
        return acc;
      }, {} as any);

      // 각 슬롯별로 정산 생성
      for (const slotId in slotGroups) {
        const group = slotGroups[slotId];
        const totalQuantity = group.logs.reduce((sum: number, log: any) => sum + log.completed_quantity, 0);
        const unitPrice = group.slot.unit_price;
        const totalAmount = totalQuantity * unitPrice;
        const workLogIds = group.logs.map((log: any) => log.id);

        // 정산 생성
        const { data: settlementData, error: settlementError } = await supabase
          .from('per_unit_settlements')
          .insert({
            slot_id: slotId,
            work_log_ids: workLogIds,
            quantity: totalQuantity,
            unit_price: unitPrice,
            total_amount: totalAmount,
            status: 'pending',
            settlement_date: new Date().toISOString().split('T')[0],
            created_by: currentUser?.id
          })
          .select()
          .single();

        if (settlementError) throw settlementError;

        // 작업 로그 업데이트
        const { error: updateError } = await supabase
          .from('per_unit_work_logs')
          .update({
            settlement_id: settlementData.id,
            updated_at: new Date().toISOString()
          })
          .in('id', workLogIds);

        if (updateError) throw updateError;
      }

      showSuccess('정산이 생성되었습니다.');
      fetchSettlements();
    } catch (error) {
      console.error('정산 처리 오류:', error);
      showError('정산 처리 중 오류가 발생했습니다.');
    }
  };

  // 정산 완료 처리
  const handleCompleteSettlement = async (settlementId: string) => {
    try {
      const { error } = await supabase
        .from('per_unit_settlements')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', settlementId);

      if (error) throw error;

      showSuccess('정산이 완료되었습니다.');
      fetchSettlements();
    } catch (error) {
      console.error('정산 완료 처리 오류:', error);
      showError('정산 완료 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <DashboardTemplate
      title="단건형 정산 관리"
      description="단건형 작업의 정산을 관리합니다."
      headerTextClass="text-white"
    >
      {/* 정산 대기 작업 */}
      {pendingWorkLogs.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">정산 대기 작업</h3>
              <Button onClick={handleSettlement}>
                <KeenIcon icon="dollar" className="size-4 mr-2" />
                정산 생성
              </Button>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <KeenIcon icon="information-2" className="size-5 text-yellow-600" />
                <p className="text-sm">
                  승인된 작업 {pendingWorkLogs.length}건이 정산 대기 중입니다.
                  총 {pendingWorkLogs.reduce((sum, log) => sum + log.completed_quantity, 0).toLocaleString()}건
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 정산 내역 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">정산 내역</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchSettlements}
            >
              <KeenIcon icon="arrows-circle" className="size-4 mr-2" />
              새로고침
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>정산일</th>
                  <th>캠페인</th>
                  <th>광고주</th>
                  <th>작업 수량</th>
                  <th>단가</th>
                  <th>정산 금액</th>
                  <th>상태</th>
                  <th>생성일</th>
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
                ) : settlements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8">
                      <KeenIcon icon="information-3" className="text-5xl text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">정산 내역이 없습니다.</p>
                    </td>
                  </tr>
                ) : (
                  settlements.map((settlement) => (
                    <tr key={settlement.id}>
                      <td>{settlement.settlement_date}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {settlement.per_unit_slot?.per_unit_slot_request?.per_unit_campaign?.campaign?.logo && (
                            <img
                              src={settlement.per_unit_slot.per_unit_slot_request.per_unit_campaign.campaign.logo}
                              alt=""
                              className="size-8 rounded"
                            />
                          )}
                          <div className="font-medium">
                            {settlement.per_unit_slot?.per_unit_slot_request?.per_unit_campaign?.campaign?.campaign_name || '알 수 없음'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="font-medium">
                            {settlement.per_unit_slot?.per_unit_slot_request?.user?.full_name || '알 수 없음'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {settlement.per_unit_slot?.per_unit_slot_request?.user?.email}
                          </div>
                        </div>
                      </td>
                      <td>{settlement.quantity.toLocaleString()}건</td>
                      <td>{settlement.unit_price.toLocaleString()}원</td>
                      <td className="font-semibold">{settlement.total_amount.toLocaleString()}원</td>
                      <td>
                        <Badge variant={getStatusColor(settlement.status)}>
                          {getStatusLabel(settlement.status)}
                        </Badge>
                      </td>
                      <td>{formatDateTimeKorean(settlement.created_at)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSettlement(settlement);
                              setIsSettlementModalOpen(true);
                            }}
                          >
                            <KeenIcon icon="eye" className="size-4" />
                          </Button>
                          {settlement.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleCompleteSettlement(settlement.id)}
                            >
                              정산 완료
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
        </CardContent>
      </Card>

      {/* 정산 상세 모달 */}
      {selectedSettlement && (
        <PerUnitSettlementModal
          isOpen={isSettlementModalOpen}
          onClose={() => {
            setIsSettlementModalOpen(false);
            setSelectedSettlement(null);
          }}
          settlement={selectedSettlement}
        />
      )}
    </DashboardTemplate>
  );
};