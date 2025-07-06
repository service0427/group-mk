import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { KeenIcon } from '@/components';
import { formatDateTimeKorean } from '@/utils/Date';

interface PerUnitQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  onUpdate?: () => void;
}

export const PerUnitQuoteModal: React.FC<PerUnitQuoteModalProps> = ({
  isOpen,
  onClose,
  request,
  onUpdate
}) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>단건형 견적 상세</span>
            <Badge variant={getStatusColor(request.status)}>
              {getStatusLabel(request.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 캠페인 정보 */}
          <div>
            <h4 className="font-semibold mb-3">캠페인 정보</h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-3">
                {request.campaign?.logo && (
                  <img
                    src={request.campaign.logo}
                    alt=""
                    className="size-12 rounded"
                  />
                )}
                <div>
                  <div className="font-medium">
                    {request.campaign?.campaign_name || '알 수 없음'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    서비스: {request.campaign?.service_type}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 견적 정보 */}
          <div>
            <h4 className="font-semibold mb-3">견적 정보</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">요청 수량</span>
                <span className="font-medium">{request.requested_quantity}개</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">단가</span>
                <span className="font-medium">{request.unit_price.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">총 금액</span>
                <span className="font-semibold text-lg">{request.total_price.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">작업 기간</span>
                <span className="font-medium">{request.campaign?.per_unit_campaigns?.[0]?.work_period || 0}일</span>
              </div>
            </div>
          </div>

          {/* 협상 정보 */}
          {request.negotiation_details && (
            <div>
              <h4 className="font-semibold mb-3">협상 내역</h4>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="space-y-2">
                  {request.negotiation_details.negotiated_quantity && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">협상 수량</span>
                      <span className="font-medium">{request.negotiation_details.negotiated_quantity}개</span>
                    </div>
                  )}
                  {request.negotiation_details.negotiated_price && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">협상 단가</span>
                      <span className="font-medium">{request.negotiation_details.negotiated_price.toLocaleString()}원</span>
                    </div>
                  )}
                  {request.negotiation_details.message && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm">{request.negotiation_details.message}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 요청 정보 */}
          <div>
            <h4 className="font-semibold mb-3">요청 정보</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">요청일</span>
                <span>{formatDateTimeKorean(request.created_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">최종 수정일</span>
                <span>{formatDateTimeKorean(request.updated_at)}</span>
              </div>
            </div>
          </div>

          {/* 캠페인 요구사항 */}
          {request.campaign?.per_unit_campaigns?.[0] && (
            <div>
              <h4 className="font-semibold mb-3">캠페인 요구사항</h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">최소 수량</span>
                  <span>{request.campaign.per_unit_campaigns[0].min_quantity}개</span>
                </div>
                {request.campaign.per_unit_campaigns[0].max_quantity && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">최대 수량</span>
                    <span>{request.campaign.per_unit_campaigns[0].max_quantity}개</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">가격 협상</span>
                  <span>
                    {request.campaign.per_unit_campaigns[0].is_negotiable ? (
                      <Badge variant="default">가능</Badge>
                    ) : (
                      <Badge variant="outline">불가</Badge>
                    )}
                  </span>
                </div>
                {request.campaign.per_unit_campaigns[0].is_negotiable && (
                  <>
                    {request.campaign.per_unit_campaigns[0].min_unit_price && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">최소 협상가</span>
                        <span>{request.campaign.per_unit_campaigns[0].min_unit_price.toLocaleString()}원</span>
                      </div>
                    )}
                    {request.campaign.per_unit_campaigns[0].max_unit_price && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">최대 협상가</span>
                        <span>{request.campaign.per_unit_campaigns[0].max_unit_price.toLocaleString()}원</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};