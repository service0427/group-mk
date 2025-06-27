import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { KeenIcon } from '@/components';
import { Badge } from '@/components/ui/badge';
import RefundConfirmModal from './RefundConfirmModal';
import { smartCeil } from '@/utils/mathUtils';

interface GuaranteeRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, refundAmount: number) => void;
  campaignName?: string;
  campaignLogo?: string;
  serviceType?: string;
  slotStatus?: string;
  guaranteeCount: number;
  guaranteeUnit?: string;
  completedDays?: number;
  totalAmount?: number;
  negotiatedAmount?: number; // VAT 제외 협상금액
  startDate?: string;
  endDate?: string;
  actualCompletedCount?: number; // 실제 완료 횟수
  refundSettings?: {
    type: 'immediate' | 'delayed' | 'cutoff_based';
    delay_days?: number;
    cutoff_time?: string;
  };
  currentUserRole?: 'user' | 'distributor'; // 현재 사용자 역할
}

const GuaranteeRefundModal: React.FC<GuaranteeRefundModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  campaignName,
  campaignLogo,
  serviceType,
  slotStatus,
  guaranteeCount,
  guaranteeUnit = 'daily',
  completedDays = 0,
  totalAmount = 0,
  negotiatedAmount,
  startDate,
  endDate,
  actualCompletedCount,
  refundSettings,
  currentUserRole = 'distributor',
}) => {
  const [reason, setReason] = useState<string>('');
  const [refundAmountInput, setRefundAmountInput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  // 단위에 따른 텍스트
  const isDaily = guaranteeUnit === 'daily' || guaranteeUnit === '일';
  const unitText = isDaily ? '일' : '회';
  const guaranteeLabel = isDaily ? '보장기간' : '보장횟수';
  const completedLabel = isDaily ? '작업기간 소요일' : '완료횟수';
  const remainingLabel = isDaily ? '잔여 보장기간' : '잔여 횟수';
  
  // 작업기간 계산
  const workingDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 시작일과 종료일 모두 포함
    return diffDays;
  }, [startDate, endDate]);
  
  // 잔여 작업기간 계산
  const remainingWorkDays = useMemo(() => {
    if (!endDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    if (today > end) return 0;
    const diffTime = Math.abs(end.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 오늘 포함
    return diffDays;
  }, [endDate]);

  // 실제 완료 수 (회 단위일 때는 actualCompletedCount 사용, 일 단위일 때는 completedDays 사용)
  const actualCompleted = isDaily ? completedDays : (actualCompletedCount || 0);

  // 환불 금액 계산
  const unitAmountWithVat = totalAmount > 0 && guaranteeCount > 0 ? smartCeil(totalAmount / guaranteeCount) : 0;
  const completedAmount = smartCeil(unitAmountWithVat * actualCompleted);
  const suggestedRefundAmount = Math.max(0, totalAmount - completedAmount);

  const remainingCount = Math.max(0, guaranteeCount - actualCompleted);
  const completionRate = guaranteeCount > 0 ? Math.round((actualCompleted / guaranteeCount) * 100) : 0;
  const refundRate = totalAmount > 0 ? Math.round((suggestedRefundAmount / totalAmount) * 100) : 0;

  // 캠페인 로고 처리
  const getCampaignLogo = (): string | null => {
    if (campaignLogo) {
      if (!campaignLogo.startsWith('http') && !campaignLogo.startsWith('/')) {
        return `/media/${campaignLogo}`;
      }
      return campaignLogo;
    }

    // 서비스 타입에 따른 기본 로고
    const service = serviceType || '';
    if (service.includes('naver') || service.includes('Naver')) {
      return '/media/ad-brand/naver.png';
    } else if (service.includes('coupang') || service.includes('Coupang')) {
      return '/media/ad-brand/coupang-app.png';
    } else if (service.includes('ohouse')) {
      return '/media/ad-brand/ohouse.png';
    }
    return null;
  };

  // 슬롯 상태 배지 스타일
  const getStatusBadge = () => {
    if (!slotStatus) return null;

    const statusConfig = {
      'active': { variant: 'default' as const, text: '진행중' },
      'pending': { variant: 'secondary' as const, text: '승인대기' },
      'completed': { variant: 'default' as const, text: '완료' },
      'cancelled': { variant: 'secondary' as const, text: '취소' },
      'rejected': { variant: 'destructive' as const, text: '거부' },
      'refunded': { variant: 'outline' as const, text: '환불' }
    };

    const config = statusConfig[slotStatus as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <Badge variant={config.variant} className="text-xs">
        {config.text}
      </Badge>
    );
  };

  // 역할에 따른 텍스트
  const targetUserText = currentUserRole === 'distributor' ? '사용자' : '판매자';

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('환불 사유를 입력해주세요.');
      return;
    }

    if (!refundAmountInput.trim()) {
      setError('환불 금액을 입력해주세요.');
      return;
    }

    const refundAmount = parseInt(refundAmountInput.replace(/[^0-9]/g, ''));
    if (isNaN(refundAmount) || refundAmount <= 0) {
      setError('올바른 환불 금액을 입력해주세요.');
      return;
    }

    if (refundAmount > totalAmount) {
      setError('환불 금액이 총 결제금액을 초과할 수 없습니다.');
      return;
    }

    setShowConfirm(true);
  };

  const handleFinalConfirm = () => {
    const refundAmount = parseInt(refundAmountInput.replace(/[^0-9]/g, ''));
    onConfirm(reason, refundAmount);
    setReason('');
    setRefundAmountInput('');
    setError('');
    setShowConfirm(false);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setReason('');
      setRefundAmountInput('');
      setError('');
    }
  };

  // 모달이 열릴 때 추천 환불 금액 설정
  React.useEffect(() => {
    if (isOpen && suggestedRefundAmount > 0) {
      setRefundAmountInput(suggestedRefundAmount.toLocaleString());
    }
  }, [isOpen, suggestedRefundAmount]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col" aria-describedby={undefined}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <KeenIcon icon="dollar" className="size-5 text-danger" />
              보장형 슬롯 환불
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* 왼쪽 컬럼 - 환불 정보 */}
              <div className="space-y-4">
                {/* 슬롯 정보 카드 */}
                <div className="card">
                  <div className="card-body">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
                      슬롯 정보
                    </h3>
                    {campaignName && (
                      <div className="flex items-center gap-3 mb-3">
                        {getCampaignLogo() && (
                          <img
                            src={getCampaignLogo()!}
                            alt="캠페인 로고"
                            className="w-8 h-8 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-slate-700 dark:text-gray-300 truncate">
                            {campaignName}
                          </h4>
                        </div>
                        {getStatusBadge()}
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-xs text-slate-500 dark:text-gray-500">{guaranteeLabel}</span>
                        <span className="font-medium">
                          {guaranteeCount}{unitText}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-xs text-slate-500 dark:text-gray-500">보장횟수</span>
                        <span className="font-medium">
                          {actualCompleted}{unitText}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-xs text-slate-500 dark:text-gray-500">{remainingLabel}</span>
                        <Badge variant="destructive" className="text-xs">
                          {remainingCount}{unitText} ({refundRate}%)
                        </Badge>
                      </div>
                      {startDate && endDate && (
                        <>
                          <div className="pt-2 border-t border-slate-200 dark:border-gray-700">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-xs text-slate-500 dark:text-gray-500">슬롯 작업기간</span>
                              <span className="font-medium text-xs">
                                {new Date(startDate).toLocaleDateString('ko-KR')} ~ {new Date(endDate).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                          </div>
                          {isDaily && (
                            <>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-xs text-slate-500 dark:text-gray-500">{completedLabel}</span>
                                <span className="font-medium">
                                  {workingDays}일
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-xs text-slate-500 dark:text-gray-500">잔여 작업기간</span>
                                <span className="font-medium">
                                  {remainingWorkDays}일
                                </span>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 결제 정보 카드 */}
                {totalAmount > 0 && (
                  <div className="card">
                    <div className="card-body">
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
                        결제 정보
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-xs text-slate-500 dark:text-gray-500">협상금액</span>
                          <span className="font-medium">
                            {(negotiatedAmount !== undefined && negotiatedAmount !== null ? negotiatedAmount : smartCeil(totalAmount / 1.1)).toLocaleString()}원
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 dark:text-gray-600">VAT(10%)</span>
                          <span className="text-sm text-slate-400 dark:text-gray-600">
                            {(totalAmount - (negotiatedAmount !== undefined && negotiatedAmount !== null ? negotiatedAmount : smartCeil(totalAmount / 1.1))).toLocaleString()}원
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm border-t border-slate-200 dark:border-gray-700 pt-2">
                          <span className="text-xs text-slate-500 dark:text-gray-500">총 결제금액</span>
                          <span className="font-medium">
                            {totalAmount.toLocaleString()}원
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200 dark:border-gray-700">
                          <span className="text-xs text-slate-500 dark:text-gray-500">추천 환불 금액</span>
                          <span className="font-semibold text-blue-600">
                            {suggestedRefundAmount.toLocaleString()}원
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-gray-400 text-right">
                          (VAT 포함)
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 환불 정책 안내 */}
                {refundSettings && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <KeenIcon icon="information-2" className="text-sm text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                          환불 정책
                        </h3>
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                          {refundSettings.type === 'immediate' && (
                            <p>이 캠페인은 <span className="font-semibold">즉시 환불</span> 정책이 적용됩니다.</p>
                          )}
                          {refundSettings.type === 'delayed' && (
                            <p>이 캠페인은 승인일로부터 <span className="font-semibold">{refundSettings.delay_days}일 후</span> 환불이 처리됩니다.</p>
                          )}
                          {refundSettings.type === 'cutoff_based' && (
                            <p>이 캠페인은 <span className="font-semibold">매일 {refundSettings.cutoff_time}</span> 이후 환불이 처리됩니다.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 오른쪽 컬럼 - 환불 입력 폼 */}
              <div className="space-y-4">
                {/* 환불 신청 정보 카드 */}
                <div className="card">
                  <div className="card-body">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
                      환불 신청 정보
                    </h3>

                    {/* 환불 금액 입력 */}
                    <div className="mb-4">
                      <label htmlFor="refundAmount" className="form-label text-sm mb-2">
                        환불 금액 <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="refundAmount"
                          type="text"
                          className={`input input-sm w-full pr-12 ${error && error.includes('환불 금액') ? 'border-red-500' : ''}`}
                          placeholder="환불할 금액을 입력하세요"
                          value={refundAmountInput}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            if (value) {
                              const numValue = parseInt(value);
                              // 총 결제금액 초과 검증
                              if (numValue > totalAmount) {
                                setRefundAmountInput(totalAmount.toLocaleString());
                                setError('환불 금액이 총 결제금액을 초과할 수 없습니다.');
                              } else {
                                setRefundAmountInput(numValue.toLocaleString());
                                if (error && error.includes('환불 금액')) setError('');
                              }
                            } else {
                              setRefundAmountInput('');
                            }
                          }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">원</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-slate-500 dark:text-gray-500">
                          ※ 추천 환불 금액: {suggestedRefundAmount.toLocaleString()}원 (VAT 포함)
                        </p>
                        {totalAmount > 0 && (
                          <p className="text-xs text-slate-500 dark:text-gray-500">
                            최대: {totalAmount.toLocaleString()}원
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 환불 사유 입력 */}
                    <div>
                      <label htmlFor="refundReason" className="form-label text-sm mb-2">
                        환불 사유 <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        id="refundReason"
                        className={`textarea textarea-sm resize-none ${error && error.includes('환불 사유') ? 'border-red-500' : ''}`}
                        rows={6}
                        placeholder={`환불 사유를 입력해주세요. ${targetUserText}에게 표시됩니다.`}
                        value={reason}
                        onChange={(e) => {
                          setReason(e.target.value);
                          if (e.target.value.trim() && error && error.includes('환불 사유')) setError('');
                        }}
                      />
                      <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
                        ※ {targetUserText}에게 표시되는 내용이므로 신중히 작성해주세요.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 안내 정보 카드 */}
                <div className="card">
                  <div className="card-body">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
                      안내 정보
                    </h3>

                    {/* 환불 처리 안내 */}
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-3">
                      <div className="flex items-start gap-2">
                        <KeenIcon icon="cross-circle" className="text-sm text-red-600 dark:text-red-400 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                            환불 처리 안내
                          </h4>
                          <div className="text-xs text-red-700 dark:text-red-300 space-y-1">
                            <p>환불 처리 시 다음 사항이 적용됩니다:</p>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                              <li>작업이 완료된 기간을 제외한 나머지 금액이 환불됩니다</li>
                              <li>슬롯 상태가 '환불'로 변경됩니다</li>
                              <li>{targetUserText}에게 환불 알림이 발송됩니다</li>
                              <li className="font-semibold">이 작업은 취소할 수 없습니다</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 확인 메시지 */}
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-700">
                      <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                        정말로 이 보장형 슬롯을 환불 처리하시겠습니까?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogBody>

          <div className="flex-shrink-0 flex justify-between items-center p-4 border-t border-slate-200 dark:border-gray-700">
            {error && (
              <div className="flex items-center gap-1 text-xs text-red-500">
                <KeenIcon icon="information-2" className="size-3" />
                <p>{error}</p>
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleConfirm}
                className="btn btn-danger btn-sm"
              >
                환불
              </button>
              <Button
                variant="light"
                size="sm"
                onClick={onClose}
              >
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 최종 확인 모달 */}
      <RefundConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleFinalConfirm}
        type="refund"
        campaignName={campaignName}
        refundAmount={parseInt(refundAmountInput.replace(/[^0-9]/g, '')) || 0}
        refundReason={reason}
        totalAmount={totalAmount}
        guaranteeCount={guaranteeCount}
        completedDays={actualCompleted}
      />
    </>
  );
};

export default GuaranteeRefundModal;