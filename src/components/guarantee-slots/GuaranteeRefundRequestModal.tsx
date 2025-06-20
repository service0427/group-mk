import React, { useState } from 'react';
import { KeenIcon } from '@/components';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import RefundConfirmModal from './RefundConfirmModal';

interface GuaranteeRefundRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (notes?: string) => void;
  onReject: (notes: string) => void;
  campaignName?: string;
  refundAmount: number;
  refundReason: string;
  requesterName?: string;
  loading?: boolean;
  // 환불 상세 정보
  guaranteeCount?: number;
  guaranteeUnit?: string;
  completedDays?: number;
  totalAmount?: number;
  requestDate?: string;
}

const GuaranteeRefundRequestModal: React.FC<GuaranteeRefundRequestModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  onReject,
  campaignName,
  refundAmount,
  refundReason,
  requesterName,
  loading = false,
  guaranteeCount = 0,
  guaranteeUnit = 'daily',
  completedDays = 0,
  totalAmount = 0,
  requestDate,
}) => {
  const [notes, setNotes] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  // 환불 상세 정보 계산
  const remainingDays = Math.max(0, guaranteeCount - completedDays);
  const completionRate = guaranteeCount > 0 ? Math.round((completedDays / guaranteeCount) * 100) : 0;
  const refundRate = guaranteeCount > 0 ? Math.round((remainingDays / guaranteeCount) * 100) : 100;

  // 숫자를 천 단위 콤마로 포맷팅하는 함수
  const formatNumber = (num: number): string => {
    return num.toLocaleString('ko-KR');
  };


  const handleClose = () => {
    setNotes('');
    setValidationMessage('');
    setShowApproveConfirm(false);
    setShowRejectConfirm(false);
    onClose();
  };

  const handleApproveClick = () => {
    setValidationMessage('');
    setShowApproveConfirm(true);
  };

  const handleRejectClick = () => {
    if (!notes.trim()) {
      setValidationMessage('거절 시에는 거절 사유를 입력해주세요.');
      return;
    }
    setValidationMessage('');
    setShowRejectConfirm(true);
  };

  const handleApproveConfirm = () => {
    onApprove(notes || undefined);
    setShowApproveConfirm(false);
  };

  const handleRejectConfirm = () => {
    onReject(notes);
    setShowRejectConfirm(false);
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col" aria-describedby={undefined}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon="wallet" className="size-5 text-warning" />
            환불 요청 처리
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* 왼쪽 컬럼: 요청 정보 */}
            <div className="space-y-4">
              {/* 요청자 정보 카드 */}
              <div className="card">
                <div className="card-body">
                  {campaignName && (
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
                      {campaignName}
                    </h3>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-xs text-slate-500 dark:text-gray-500">신청자</span>
                      <span className="font-medium">{requesterName || '-'}</span>
                    </div>
                    {requestDate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-xs text-slate-500 dark:text-gray-500">신청일</span>
                        <span className="font-medium">
                          {new Date(requestDate).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    )}
                    {guaranteeCount > 0 && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-xs text-slate-500 dark:text-gray-500">보장기간</span>
                          <span className="font-medium">
                            {guaranteeCount}{guaranteeUnit === 'daily' ? '일' : '회'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-xs text-slate-500 dark:text-gray-500">완료 기간</span>
                          <span className="font-medium">
                            {completedDays}{guaranteeUnit === 'daily' ? '일' : '회'} ({completionRate}%)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-xs text-slate-500 dark:text-gray-500">잔여 기간</span>
                          <Badge variant="destructive" className="text-xs">
                            {remainingDays}{guaranteeUnit === 'daily' ? '일' : '회'} ({refundRate}%)
                          </Badge>
                        </div>
                      </>
                    )}
                    <div className="pt-2 border-t border-slate-200 dark:border-gray-700">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-xs text-slate-500 dark:text-gray-500">원래 결제금액</span>
                        <span className="font-medium">
                          {formatNumber(totalAmount)}원
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-xs text-slate-500 dark:text-gray-500">환불 신청액</span>
                        <span className="font-semibold text-danger">
                          {formatNumber(refundAmount)}원
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 환불 신청 사유 카드 */}
              <div className="card">
                <div className="card-body">
                  <label className="form-label text-sm mb-2">
                    환불 신청 사유
                  </label>
                  <div className="bg-slate-50 dark:bg-gray-900 rounded border p-3 text-sm text-slate-800 dark:text-gray-200 min-h-[60px]">
                    {refundReason}
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽 컬럼: 환불 계산 상세 */}
            <div className="space-y-4">
              {/* 환불 계산 상세 정보 카드 */}
              {totalAmount > 0 && guaranteeCount > 0 ? (
                <div className="card">
                  <div className="card-body">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <KeenIcon icon="calculator" className="text-blue-600" />
                      환불 금액 계산
                    </h3>
                    <div className="space-y-3">
                      {/* 간단한 계산 공식 */}
                      <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-3">
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span>전체 결제금액:</span>
                            <span className="font-medium">{formatNumber(totalAmount)}원</span>
                          </div>
                          <div className="flex justify-between">
                            <span>전체 보장기간:</span>
                            <span className="font-medium">{guaranteeCount}일</span>
                          </div>
                          <div className="flex justify-between">
                            <span>완료 기간:</span>
                            <span className="font-medium">{completedDays}일</span>
                          </div>
                          <div className="flex justify-between">
                            <span>잔여 기간:</span>
                            <span className="font-medium text-orange-600">{remainingDays}일</span>
                          </div>
                          <hr className="border-slate-200 dark:border-gray-700" />
                          <div className="flex justify-between text-sm">
                            <span>계산식:</span>
                            <span className="font-mono text-xs text-slate-600 dark:text-gray-400">
                              ({formatNumber(totalAmount)} ÷ {guaranteeCount}) × {remainingDays}
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold text-base">
                            <span>환불 예상액:</span>
                            <span className="text-red-600">
                              {formatNumber(Math.round((totalAmount / guaranteeCount) * remainingDays))}원
                            </span>
                          </div>
                          {refundAmount !== Math.round((totalAmount / guaranteeCount) * remainingDays) && (
                            <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                              ※ 실제 환불 신청액: {formatNumber(refundAmount)}원 (캠페인 정책 적용)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* 환불 계산 정보가 없을 때 */
                <div className="card">
                  <div className="card-body text-center py-6">
                    <KeenIcon icon="information-2" className="text-3xl text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">환불 계산 정보를 불러올 수 없습니다.</p>
                  </div>
                </div>
              )}

              {/* 처리 메모 입력 */}
              <div className="card">
                <div className="card-body">
                  <label className="form-label text-sm mb-2">
                    처리 메모
                  </label>
                  <Textarea
                    className="textarea textarea-sm resize-none"
                    rows={3}
                    placeholder="승인 또는 거절 시 사용자에게 전달할 메모를 입력하세요..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
                    ※ 거절 시 필수, 승인 시 선택사항
                  </p>
                </div>
              </div>
            </div>

          </div>
        </DialogBody>

        {/* DialogFooter로 분리된 푸터 */}
        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            {/* 왼쪽 validation 메시지 */}
            <div className="flex items-center text-sm text-red-600">
              {validationMessage && (
                <>
                  <KeenIcon icon="information-2" className="text-base mr-2" />
                  <span>{validationMessage}</span>
                </>
              )}
            </div>

            {/* 오른쪽 버튼들 */}
            <div className="flex space-x-2">
              <Button
                onClick={handleApproveClick}
                className="bg-green-500 hover:bg-green-600 text-white"
                disabled={loading}
              >
                {loading ? (
                  <KeenIcon icon="loading" className="animate-spin text-base mr-2" />
                ) : (
                  <KeenIcon icon="check" className="text-base mr-2" />
                )}
                승인
              </Button>
              <Button
                onClick={handleRejectClick}
                className="bg-red-500 hover:bg-red-600 text-white"
                disabled={loading}
              >
                {loading ? (
                  <KeenIcon icon="loading" className="animate-spin text-base mr-2" />
                ) : (
                  <KeenIcon icon="cross" className="text-base mr-2" />
                )}
                거절
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                취소
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* 승인 확인 모달 */}
    <RefundConfirmModal
      isOpen={showApproveConfirm}
      onClose={() => setShowApproveConfirm(false)}
      onConfirm={handleApproveConfirm}
      type="approve"
      loading={loading}
      campaignName={campaignName}
      refundAmount={refundAmount}
      refundReason={refundReason}
      totalAmount={totalAmount}
      guaranteeCount={guaranteeCount}
      completedDays={completedDays}
      requesterName={requesterName}
    />

    {/* 거절 확인 모달 */}
    <RefundConfirmModal
      isOpen={showRejectConfirm}
      onClose={() => setShowRejectConfirm(false)}
      onConfirm={handleRejectConfirm}
      type="reject"
      loading={loading}
      campaignName={campaignName}
      refundAmount={refundAmount}
      refundReason={refundReason}
      totalAmount={totalAmount}
      guaranteeCount={guaranteeCount}
      completedDays={completedDays}
      requesterName={requesterName}
    />
  </>
  );
};

export default GuaranteeRefundRequestModal;