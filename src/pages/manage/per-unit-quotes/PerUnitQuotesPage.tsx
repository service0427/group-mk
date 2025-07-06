import React, { useState, useEffect, useMemo } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export const PerUnitQuotesPage: React.FC = () => {
  const { currentUser, userRole } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isNegotiateModalOpen, setIsNegotiateModalOpen] = useState(false);
  const [negotiationForm, setNegotiationForm] = useState({
    quantity: '',
    unitPrice: '',
    message: ''
  });

  // 데이터 조회
  const fetchRequests = async () => {
    if (!currentUser?.id) return;

    try {
      setIsLoading(true);
      let query = supabase
        .from('per_unit_slot_requests')
        .select(`
          *,
          campaign:campaign_id (
            id,
            campaign_name,
            service_type,
            logo,
            mat_id,
            per_unit_campaigns (
              *
            )
          ),
          user:user_id (
            id,
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      // 총판은 자신의 캠페인에 대한 요청만
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
          query = query.in('per_unit_campaign_id', perUnitCampaignIds);
        } else {
          // 캠페인이 없으면 빈 결과
          query = query.eq('per_unit_campaign_id', '00000000-0000-0000-0000-000000000000');
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('단건형 요청 조회 오류:', error);
      showError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentUser?.id]);

  // 상태별 색상 반환
  const getStatusColor = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'negotiating':
        return 'secondary';
      case 'accepted':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // 상태별 라벨 반환
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending':
        return '대기중';
      case 'negotiating':
        return '협상중';
      case 'accepted':
        return '수락됨';
      case 'rejected':
        return '거절됨';
      case 'in_progress':
        return '진행중';
      case 'completed':
        return '완료';
      case 'cancelled':
        return '취소됨';
      default:
        return '알 수 없음';
    }
  };

  // 요청 승인
  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('per_unit_slot_requests')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      showSuccess('견적 요청이 승인되었습니다.');
      fetchRequests();
    } catch (error) {
      console.error('승인 오류:', error);
      showError('승인 중 오류가 발생했습니다.');
    }
  };

  // 요청 거절
  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('per_unit_slot_requests')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      showSuccess('견적 요청이 거절되었습니다.');
      fetchRequests();
    } catch (error) {
      console.error('거절 오류:', error);
      showError('거절 중 오류가 발생했습니다.');
    }
  };

  // 협상 제안
  const handleNegotiate = async () => {
    if (!selectedRequest || !negotiationForm.quantity || !negotiationForm.unitPrice) {
      showError('수량과 단가를 입력해주세요.');
      return;
    }

    try {
      const negotiationDetails = {
        negotiated_quantity: parseInt(negotiationForm.quantity),
        negotiated_price: parseFloat(negotiationForm.unitPrice),
        message: negotiationForm.message,
        negotiated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('per_unit_slot_requests')
        .update({ 
          status: 'negotiating',
          negotiation_details: negotiationDetails,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      showSuccess('협상 제안이 전송되었습니다.');
      setIsNegotiateModalOpen(false);
      setSelectedRequest(null);
      setNegotiationForm({ quantity: '', unitPrice: '', message: '' });
      fetchRequests();
    } catch (error) {
      console.error('협상 오류:', error);
      showError('협상 제안 중 오류가 발생했습니다.');
    }
  };

  return (
    <DashboardTemplate
      title="단건형 슬롯 관리"
      description="단건형 견적 요청을 관리합니다."
      headerTextClass="text-white"
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">단건형 견적 요청 목록</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchRequests}
            >
              <KeenIcon icon="arrows-circle" className="size-4 mr-2" />
              새로고침
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>요청자</th>
                  <th>캠페인</th>
                  <th>요청 수량</th>
                  <th>단가</th>
                  <th>총 금액</th>
                  <th>작업 기간</th>
                  <th>상태</th>
                  <th>요청일</th>
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
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8">
                      <KeenIcon icon="information-3" className="text-5xl text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">단건형 견적 요청이 없습니다.</p>
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <div>
                          <div className="font-medium">
                            {request.user?.full_name || '알 수 없음'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {request.user?.email}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {request.campaign?.logo && (
                            <img
                              src={request.campaign.logo}
                              alt=""
                              className="size-8 rounded"
                            />
                          )}
                          <div>
                            <div className="font-medium">
                              {request.campaign?.campaign_name || '알 수 없음'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              최소: {request.campaign?.per_unit_campaigns?.[0]?.min_quantity || 0}개
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{request.requested_quantity}개</td>
                      <td>{request.unit_price.toLocaleString()}원</td>
                      <td className="font-semibold">
                        {request.total_price.toLocaleString()}원
                      </td>
                      <td>{request.campaign?.per_unit_campaigns?.[0]?.work_period || 0}일</td>
                      <td>
                        <Badge variant={getStatusColor(request.status)}>
                          {getStatusLabel(request.status)}
                        </Badge>
                        {request.status === 'negotiating' && request.negotiation_details && (
                          <div className="text-xs text-muted-foreground mt-1">
                            협상가: {request.negotiation_details.negotiated_price?.toLocaleString()}원
                          </div>
                        )}
                      </td>
                      <td>{formatDateTimeKorean(request.created_at)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {/* 상태별 액션 버튼 */}
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(request.id)}
                              >
                                승인
                              </Button>
                              {request.campaign?.per_unit_campaigns?.[0]?.is_negotiable && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setNegotiationForm({
                                      quantity: request.requested_quantity.toString(),
                                      unitPrice: request.unit_price.toString(),
                                      message: ''
                                    });
                                    setIsNegotiateModalOpen(true);
                                  }}
                                >
                                  협상
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-danger"
                                onClick={() => handleReject(request.id)}
                              >
                                거절
                              </Button>
                            </>
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

      {/* 협상 모달 */}
      <Dialog open={isNegotiateModalOpen} onOpenChange={setIsNegotiateModalOpen}>
        <DialogContent className="sm:max-w-[425px]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>협상 제안</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">수량</label>
                <Input
                  type="number"
                  value={negotiationForm.quantity}
                  onChange={(e) => setNegotiationForm(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="협상 수량"
                  min={selectedRequest?.campaign?.per_unit_campaigns?.[0]?.min_quantity || 1}
                  max={selectedRequest?.campaign?.per_unit_campaigns?.[0]?.max_quantity}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  최소: {selectedRequest?.campaign?.per_unit_campaigns?.[0]?.min_quantity || 0}개
                  {selectedRequest?.campaign?.per_unit_campaigns?.[0]?.max_quantity && 
                    `, 최대: ${selectedRequest.campaign.per_unit_campaigns[0].max_quantity}개`}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">단가</label>
                <Input
                  type="number"
                  value={negotiationForm.unitPrice}
                  onChange={(e) => setNegotiationForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                  placeholder="협상 단가"
                  min={selectedRequest?.campaign?.per_unit_campaigns?.[0]?.min_unit_price}
                  max={selectedRequest?.campaign?.per_unit_campaigns?.[0]?.max_unit_price}
                />
                {(selectedRequest?.campaign?.per_unit_campaigns?.[0]?.min_unit_price || 
                  selectedRequest?.campaign?.per_unit_campaigns?.[0]?.max_unit_price) && (
                  <div className="text-xs text-muted-foreground mt-1">
                    협상 가능 범위: {selectedRequest.campaign.per_unit_campaigns[0].min_unit_price?.toLocaleString()}원 
                    ~ {selectedRequest.campaign.per_unit_campaigns[0].max_unit_price?.toLocaleString()}원
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">메시지 (선택)</label>
                <Textarea
                  value={negotiationForm.message}
                  onChange={(e) => setNegotiationForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="협상 메시지"
                  rows={3}
                />
              </div>
              {negotiationForm.quantity && negotiationForm.unitPrice && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">협상 총액</span>
                    <span className="font-semibold">
                      {(parseInt(negotiationForm.quantity) * parseFloat(negotiationForm.unitPrice)).toLocaleString()}원
                    </span>
                  </div>
                </div>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNegotiateModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleNegotiate}>
              협상 제안
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardTemplate>
  );
};