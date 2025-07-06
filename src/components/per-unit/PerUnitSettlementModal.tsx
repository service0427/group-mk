import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { KeenIcon } from '@/components';
import { formatDateTimeKorean } from '@/utils/Date';
import { supabase } from '@/supabase';

interface PerUnitSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlement: any;
}

export const PerUnitSettlementModal: React.FC<PerUnitSettlementModalProps> = ({
  isOpen,
  onClose,
  settlement
}) => {
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  // 작업 로그 조회
  const fetchWorkLogs = async () => {
    if (!settlement?.work_log_ids) return;

    try {
      setIsLoadingLogs(true);
      const { data, error } = await supabase
        .from('per_unit_work_logs')
        .select('*')
        .in('id', settlement.work_log_ids)
        .order('work_date', { ascending: false });

      if (error) throw error;

      setWorkLogs(data || []);
    } catch (error) {
      console.error('작업 로그 조회 오류:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWorkLogs();
    }
  }, [isOpen, settlement?.id]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>정산 상세 내역</span>
            <Badge variant={getStatusColor(settlement.status)}>
              {getStatusLabel(settlement.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 정산 정보 */}
          <div>
            <h4 className="font-semibold mb-3">정산 정보</h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">정산일:</span>
                  <span className="ml-2 font-medium">{settlement.settlement_date}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">생성일:</span>
                  <span className="ml-2 font-medium">{formatDateTimeKorean(settlement.created_at)}</span>
                </div>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">작업 수량</span>
                  <span className="font-medium">{settlement.quantity.toLocaleString()}건</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">단가</span>
                  <span className="font-medium">{settlement.unit_price.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-semibold">총 정산 금액</span>
                  <span className="font-semibold text-lg text-primary">
                    {settlement.total_amount.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 캠페인 정보 */}
          {settlement.per_unit_slot?.per_unit_slot_request && (
            <div>
              <h4 className="font-semibold mb-3">캠페인 정보</h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {settlement.per_unit_slot.per_unit_slot_request.per_unit_campaign?.campaign?.logo && (
                    <img
                      src={settlement.per_unit_slot.per_unit_slot_request.per_unit_campaign.campaign.logo}
                      alt=""
                      className="size-12 rounded"
                    />
                  )}
                  <div>
                    <div className="font-medium">
                      {settlement.per_unit_slot.per_unit_slot_request.per_unit_campaign?.campaign?.campaign_name || '알 수 없음'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      서비스: {settlement.per_unit_slot.per_unit_slot_request.per_unit_campaign?.campaign?.service_type}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">광고주:</span>
                    <span className="ml-2 font-medium">
                      {settlement.per_unit_slot.per_unit_slot_request.user?.full_name} 
                      ({settlement.per_unit_slot.per_unit_slot_request.user?.email})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 포함된 작업 내역 */}
          <div>
            <h4 className="font-semibold mb-3">포함된 작업 내역</h4>
            {isLoadingLogs ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
              </div>
            ) : workLogs.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                작업 내역이 없습니다.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {workLogs.map((log, index) => (
                  <div key={log.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">#{index + 1}</span>
                          <span className="text-sm text-muted-foreground">
                            {log.work_date}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="text-sm font-medium">
                            {log.completed_quantity}건 완료
                          </span>
                        </div>
                        {log.notes && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {log.notes}
                          </div>
                        )}
                        {log.work_urls && log.work_urls.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-muted-foreground">
                              작업 URL: {log.work_urls.length}개
                            </span>
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        승인됨
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 정산 상태 정보 */}
          {settlement.status === 'completed' && settlement.completed_at && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <KeenIcon icon="check-circle" className="size-5 text-green-600" />
                <div className="text-sm">
                  <p className="font-medium">정산 완료</p>
                  <p className="text-muted-foreground">
                    완료일: {formatDateTimeKorean(settlement.completed_at)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};