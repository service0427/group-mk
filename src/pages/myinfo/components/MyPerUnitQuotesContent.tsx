import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KeenIcon } from '@/components';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/auth';
import { formatDateTimeKorean } from '@/utils/Date';
import { useCustomToast } from '@/hooks/useCustomToast';
import { PerUnitQuoteModal } from '@/components/per-unit/PerUnitQuoteModal';
import { PerUnitSlotModal } from '@/components/per-unit/PerUnitSlotModal';
import { InquiryChatModal } from '@/components/inquiry';

interface MyPerUnitQuotesContentProps {
  selectedService?: string | null;
}

interface PerUnitRequest {
  id: string;
  user_id: string;
  campaign_id: number;
  requested_quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  created_at: string;
  updated_at: string;
  negotiation_details?: any;
  campaign?: {
    id: number;
      campaign_name: string;
      service_type: string;
      logo: string;
      mat_id: string;
      per_unit_campaigns?: {
        id: string;
        campaign_id: number;
        min_quantity: number;
        unit_price: number;
        max_quantity?: number;
        work_period: number;
        is_negotiable: boolean;
        min_unit_price?: number;
        max_unit_price?: number;
      }[];
    };
}

export const MyPerUnitQuotesContent: React.FC<MyPerUnitQuotesContentProps> = ({ selectedService }) => {
  const { currentUser } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();
  const [requests, setRequests] = useState<PerUnitRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PerUnitRequest | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryData, setInquiryData] = useState<{
    requestId?: string;
    campaignId?: number;
    distributorId?: string;
    title?: string;
  } | null>(null);

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
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

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

  // 서비스별 필터링
  const filteredRequests = useMemo(() => {
    if (!selectedService) return requests;
    return requests.filter(request => 
      request.campaign?.service_type === selectedService
    );
  }, [requests, selectedService]);

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

  // 견적 요청 취소
  const handleCancel = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('per_unit_slot_requests')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      showSuccess('견적 요청이 취소되었습니다.');
      fetchRequests();
    } catch (error) {
      console.error('취소 오류:', error);
      showError('취소 중 오류가 발생했습니다.');
    }
  };

  // 협상 수락
  const handleAcceptNegotiation = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('per_unit_slot_requests')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      showSuccess('협상이 수락되었습니다. 결제를 진행해주세요.');
      fetchRequests();
    } catch (error) {
      console.error('수락 오류:', error);
      showError('수락 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <Card className="mt-6">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">로딩 중...</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="mt-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">단건형 견적 내역</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchRequests}
            >
              <KeenIcon icon="arrows-circle" className="size-4 mr-2" />
              새로고침
            </Button>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <KeenIcon icon="information-3" className="text-5xl text-muted-foreground mb-4" />
              <p className="text-muted-foreground">아직 단건형 견적 요청이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table align-middle">
                <thead>
                  <tr>
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
                  {filteredRequests.map((request) => (
                    <tr key={request.id}>
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
                      </td>
                      <td>{formatDateTimeKorean(request.created_at)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {/* 상세보기 */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsQuoteModalOpen(true);
                            }}
                          >
                            <KeenIcon icon="eye" className="size-4" />
                          </Button>

                          {/* 상태별 액션 버튼 */}
                          {request.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-danger"
                              onClick={() => handleCancel(request.id)}
                            >
                              취소
                            </Button>
                          )}

                          {request.status === 'negotiating' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAcceptNegotiation(request.id)}
                            >
                              수락
                            </Button>
                          )}

                          {request.status === 'accepted' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsSlotModalOpen(true);
                              }}
                            >
                              결제
                            </Button>
                          )}

                          {/* 문의하기 */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setInquiryData({
                                requestId: request.id,
                                campaignId: request.campaign?.id,
                                distributorId: request.campaign?.mat_id,
                                title: `단건형 견적 문의: ${request.campaign?.campaign_name}`
                              });
                              setInquiryModalOpen(true);
                            }}
                          >
                            <KeenIcon icon="message-text" className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* 견적 상세 모달 */}
      {selectedRequest && (
        <PerUnitQuoteModal
          isOpen={isQuoteModalOpen}
          onClose={() => {
            setIsQuoteModalOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          onUpdate={fetchRequests}
        />
      )}

      {/* 결제 모달 */}
      {selectedRequest && (
        <PerUnitSlotModal
          isOpen={isSlotModalOpen}
          onClose={() => {
            setIsSlotModalOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          onSuccess={() => {
            setIsSlotModalOpen(false);
            setSelectedRequest(null);
            fetchRequests();
          }}
        />
      )}

      {/* 문의 모달 */}
      <InquiryChatModal
        open={inquiryModalOpen}
        onClose={() => {
          setInquiryModalOpen(false);
          setInquiryData(null);
        }}
        slotId={inquiryData?.requestId}
        campaignId={inquiryData?.campaignId}
        distributorId={inquiryData?.distributorId}
        initialTitle={inquiryData?.title}
      />
    </>
  );
};