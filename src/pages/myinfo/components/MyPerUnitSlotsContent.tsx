import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KeenIcon } from '@/components';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/auth';
import { formatDateTimeKorean } from '@/utils/Date';
import { useCustomToast } from '@/hooks/useCustomToast';
import { PerUnitRefundModal } from '@/components/per-unit/PerUnitRefundModal';
import { InquiryChatModal } from '@/components/inquiry';

interface MyPerUnitSlotsContentProps {
  selectedService?: string | null;
}

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
        mat_id: string;
      };
      work_period_days: number;
    };
  };
}

export const MyPerUnitSlotsContent: React.FC<MyPerUnitSlotsContentProps> = ({ selectedService }) => {
  const { currentUser } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();
  const [slots, setSlots] = useState<PerUnitSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<PerUnitSlot | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryData, setInquiryData] = useState<{
    slotId?: string;
    campaignId?: number;
    distributorId?: string;
    title?: string;
  } | null>(null);

  // 데이터 조회
  const fetchSlots = async () => {
    if (!currentUser?.id) return;

    try {
      setIsLoading(true);
      const { data: requestsData } = await supabase
        .from('per_unit_slot_requests')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('status', 'in_progress');

      const requestIds = requestsData?.map(r => r.id) || [];

      if (requestIds.length === 0) {
        setSlots([]);
        return;
      }

      const { data, error } = await supabase
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
            )
          )
        `)
        .in('request_id', requestIds)
        .order('created_at', { ascending: false });

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

  // 서비스별 필터링
  const filteredSlots = useMemo(() => {
    if (!selectedService) return slots;
    return slots.filter(slot => 
      slot.per_unit_slot_request?.per_unit_campaign?.campaign?.service_type === selectedService
    );
  }, [slots, selectedService]);

  // 진행률 계산
  const getProgressPercentage = (slot: PerUnitSlot): number => {
    if (slot.quantity === 0) return 0;
    return Math.round((slot.completed_quantity / slot.quantity) * 100);
  };

  // 상태별 색상 반환
  const getStatusColor = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'refund_requested':
        return 'destructive';
      case 'refunded':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // 상태별 라벨 반환
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'in_progress':
        return '진행중';
      case 'completed':
        return '완료';
      case 'refund_requested':
        return '환불 요청중';
      case 'refunded':
        return '환불 완료';
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

          {filteredSlots.length === 0 ? (
            <div className="text-center py-8">
              <KeenIcon icon="information-3" className="text-5xl text-muted-foreground mb-4" />
              <p className="text-muted-foreground">진행 중인 단건형 작업이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSlots.map((slot) => {
                const progressPercentage = getProgressPercentage(slot);
                const elapsedDays = getElapsedDays(slot.work_start_date);
                const totalDays = slot.per_unit_slot_request?.per_unit_campaign?.work_period_days || 30;
                
                return (
                  <div key={slot.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {slot.per_unit_slot_request?.per_unit_campaign?.campaign?.logo && (
                          <img
                            src={slot.per_unit_slot_request.per_unit_campaign.campaign.logo}
                            alt=""
                            className="size-12 rounded"
                          />
                        )}
                        <div>
                          <h4 className="font-semibold">
                            {slot.per_unit_slot_request?.per_unit_campaign?.campaign?.campaign_name || '알 수 없음'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {slot.per_unit_slot_request?.per_unit_campaign?.campaign?.service_type}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(slot.status)}>
                        {getStatusLabel(slot.status)}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {/* 진행률 */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-muted-foreground">진행률</span>
                          <span className="text-sm font-medium">
                            {slot.completed_quantity.toLocaleString()} / {slot.quantity.toLocaleString()}건 ({progressPercentage}%)
                          </span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* 작업 기간 */}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">작업 기간</span>
                        <span className={elapsedDays > totalDays ? 'text-danger font-medium' : ''}>
                          {elapsedDays} / {totalDays}일
                        </span>
                      </div>

                      {/* 금액 정보 */}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">총 금액</span>
                        <span className="font-medium">
                          {(slot.quantity * slot.unit_price).toLocaleString()}원 (건당 {slot.unit_price.toLocaleString()}원)
                        </span>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      {/* 문의하기 */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setInquiryData({
                            slotId: slot.id,
                            campaignId: slot.per_unit_slot_request?.per_unit_campaign?.campaign?.id,
                            distributorId: slot.per_unit_slot_request?.per_unit_campaign?.campaign?.mat_id,
                            title: `단건형 작업 문의: ${slot.per_unit_slot_request?.per_unit_campaign?.campaign?.campaign_name}`
                          });
                          setInquiryModalOpen(true);
                        }}
                      >
                        <KeenIcon icon="message-text" className="size-4 mr-2" />
                        문의하기
                      </Button>

                      {/* 환불 요청 */}
                      {slot.status === 'in_progress' && slot.completed_quantity < slot.quantity && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-danger"
                          onClick={() => {
                            setSelectedSlot(slot);
                            setIsRefundModalOpen(true);
                          }}
                        >
                          <KeenIcon icon="wallet" className="size-4 mr-2" />
                          환불 요청
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* 환불 요청 모달 */}
      {selectedSlot && (
        <PerUnitRefundModal
          isOpen={isRefundModalOpen}
          onClose={() => {
            setIsRefundModalOpen(false);
            setSelectedSlot(null);
          }}
          slot={selectedSlot}
          onSuccess={() => {
            setIsRefundModalOpen(false);
            setSelectedSlot(null);
            fetchSlots();
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
        slotId={inquiryData?.slotId}
        campaignId={inquiryData?.campaignId}
        distributorId={inquiryData?.distributorId}
        initialTitle={inquiryData?.title}
      />
    </>
  );
};