import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { KeenIcon } from '@/components';
import { Badge } from '@/components/ui/badge';
import { smartCeil } from '@/utils/mathUtils';

interface GuaranteeCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (workMemo: string, refundAmount?: number) => void;
  campaignName?: string;
  campaignLogo?: string;
  serviceType?: string;
  slotStatus?: string;
  guaranteeCount: number;
  guaranteeUnit?: string;
  completedDays?: number;
  totalAmount?: number;
  startDate?: string;
  endDate?: string;
  actualCompletedCount?: number;
  refundSettings?: {
    type: 'immediate' | 'delayed';
    delay_days?: number;
  };
  currentUserRole?: 'user' | 'distributor';
}

const GuaranteeCompleteModal: React.FC<GuaranteeCompleteModalProps> = ({
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
  startDate,
  endDate,
  actualCompletedCount,
  refundSettings,
  currentUserRole = 'distributor',
}) => {
  const [workMemo, setWorkMemo] = useState<string>('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundAmountInput, setRefundAmountInput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  // 단위에 따른 텍스트
  const isDaily = guaranteeUnit === 'daily' || guaranteeUnit === '일';
  const unitText = isDaily ? '일' : '회';
  const guaranteeLabel = isDaily ? '보장기간' : '보장횟수';
  const completedLabel = isDaily ? '작업기간 소요일' : '완료횟수';

  // 실제 완료 수
  const actualCompleted = isDaily ? completedDays : (actualCompletedCount || 0);

  const isEarlyCompletion = actualCompleted < guaranteeCount;
  const completionRate = guaranteeCount > 0 ? Math.round((actualCompleted / guaranteeCount) * 100) : 0;

  // 환불 금액 계산 (조기완료 시)
  const unitAmountWithVat = totalAmount > 0 && guaranteeCount > 0 ? smartCeil(totalAmount / guaranteeCount) : 0;
  const remainingCount = Math.max(0, guaranteeCount - actualCompleted);
  const calculatedRefundAmount = isEarlyCompletion ? smartCeil(unitAmountWithVat * remainingCount) : 0;

  // 캠페인 로고 처리
  const getCampaignLogo = (): string | null => {
    if (campaignLogo) {
      if (!campaignLogo.startsWith('http') && !campaignLogo.startsWith('/')) {
        return `/media/${campaignLogo}`;
      }
      return campaignLogo;
    }

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

  // 슬롯 상태 배지
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

  // 초기 환불 금액 설정
  React.useEffect(() => {
    if (isOpen && isEarlyCompletion) {
      setRefundAmount(calculatedRefundAmount);
      setRefundAmountInput(calculatedRefundAmount.toLocaleString());
    }
  }, [isOpen, isEarlyCompletion, calculatedRefundAmount]);

  const handleConfirm = () => {
    if (!workMemo.trim()) {
      setError('작업 완료 메모를 입력해주세요.');
      return;
    }

    // 조기완료 시 환불 금액 검증
    if (isEarlyCompletion) {
      if (!refundAmountInput.trim()) {
        setError('환불 금액을 입력해주세요.');
        return;
      }

      const inputAmount = parseInt(refundAmountInput.replace(/[^0-9]/g, ''));
      if (isNaN(inputAmount) || inputAmount < 0) {
        setError('올바른 환불 금액을 입력해주세요.');
        return;
      }

      if (inputAmount > totalAmount) {
        setError('환불 금액이 총 결제금액을 초과할 수 없습니다.');
        return;
      }

      setRefundAmount(inputAmount);
    }

    setShowConfirm(true);
  };

  const handleFinalConfirm = () => {
    onConfirm(workMemo, isEarlyCompletion ? refundAmount : undefined);
    setWorkMemo('');
    setRefundAmount(0);
    setRefundAmountInput('');
    setError('');
    setShowConfirm(false);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setWorkMemo('');
      setRefundAmount(0);
      setRefundAmountInput('');
      setError('');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col" aria-describedby={undefined}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <KeenIcon icon="check-circle" className="size-5 text-success" />
              보장형 슬롯 완료
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* 왼쪽 컬럼 - 슬롯 정보 */}
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
                        <span className="text-xs text-slate-500 dark:text-gray-500">{completedLabel}</span>
                        <span className="font-medium">
                          {actualCompleted}{unitText}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200 dark:border-gray-700">
                        <span className="text-xs text-slate-500 dark:text-gray-500">진행률</span>
                        <Badge
                          variant="default"
                          className={cn(
                            "text-xs",
                            completionRate >= 100 ? 'bg-green-500 hover:bg-green-600' :
                              completionRate > 0 ? 'bg-amber-500 hover:bg-amber-600' :
                                'bg-red-500 hover:bg-red-600'
                          )}
                        >
                          {completionRate}%
                        </Badge>
                      </div>
                      {startDate && endDate && (
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200 dark:border-gray-700">
                          <span className="text-xs text-slate-500 dark:text-gray-500">슬롯 작업기간</span>
                          <span className="font-medium text-xs">
                            {new Date(startDate).toLocaleDateString('ko-KR')} ~ {new Date(endDate).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
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
                            {smartCeil(totalAmount / 1.1).toLocaleString()}원
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 dark:text-gray-600">VAT(10%)</span>
                          <span className="text-sm text-slate-400 dark:text-gray-600">
                            {(totalAmount - smartCeil(totalAmount / 1.1)).toLocaleString()}원
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm border-t border-slate-200 dark:border-gray-700 pt-2">
                          <span className="text-xs text-slate-500 dark:text-gray-500">총 결제금액</span>
                          <span className="font-medium">
                            {totalAmount.toLocaleString()}원
                          </span>
                        </div>
                        {isEarlyCompletion && (
                          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200 dark:border-gray-700">
                            <span className="text-xs text-slate-500 dark:text-gray-500">환불 예정 금액</span>
                            <span className="font-semibold text-blue-600">
                              {calculatedRefundAmount.toLocaleString()}원
                            </span>
                          </div>
                        )}
                        {isEarlyCompletion && (
                          <div className="text-xs text-slate-500 dark:text-gray-400 text-right">
                            (VAT 포함)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 완료 정책 안내 */}
                {refundSettings && isEarlyCompletion && (
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
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 오른쪽 컬럼 - 완료 처리 폼 */}
              <div className="space-y-4">
                {/* 완료 처리 정보 카드 */}
                <div className="card">
                  <div className="card-body">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
                      완료 처리 정보
                    </h3>

                    {/* 조기완료 시 환불 금액 입력 */}
                    {isEarlyCompletion && (
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
                            ※ 추천 환불 금액: {calculatedRefundAmount.toLocaleString()}원 (VAT 포함)
                          </p>
                          {totalAmount > 0 && (
                            <p className="text-xs text-slate-500 dark:text-gray-500">
                              최대: {totalAmount.toLocaleString()}원
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 작업 완료 메모 */}
                    <div>
                      <label htmlFor="workMemo" className="form-label text-sm mb-2">
                        작업 완료 메모 <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        id="workMemo"
                        className={`textarea textarea-sm resize-none ${error && error.includes('작업 완료') ? 'border-red-500' : ''}`}
                        rows={isEarlyCompletion ? 4 : 6}
                        placeholder={`작업 완료와 관련된 메모를 입력하세요. ${targetUserText}에게 표시됩니다.`}
                        value={workMemo}
                        onChange={(e) => {
                          setWorkMemo(e.target.value);
                          if (e.target.value.trim() && error && error.includes('작업 완료')) setError('');
                        }}
                      />
                      <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
                        ※ {targetUserText}에게 표시되는 내용이므로 신중히 작성해주세요.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 조기완료 안내 또는 완료 안내 */}
                <div className="card">
                  <div className="card-body">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
                      안내 정보
                    </h3>

                    {isEarlyCompletion ? (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <KeenIcon icon="information-2" className="text-sm text-amber-600 dark:text-amber-400 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                              조기 완료 안내
                            </h4>
                            <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                              <p>완료 처리 시 다음 사항이 적용됩니다:</p>
                              <ul className="list-disc list-inside ml-2 space-y-1">
                                <li>잔여 {remainingCount}{unitText}분은 {targetUserText}에게 환불됩니다</li>
                                <li>슬롯 상태가 '완료'로 변경됩니다</li>
                                <li>{targetUserText}에게 완료 알림이 발송됩니다</li>
                                <li className="font-semibold">이 작업은 취소할 수 없습니다</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <KeenIcon icon="check-circle" className="text-sm text-green-600 dark:text-green-400 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                              완료 처리 안내
                            </h4>
                            <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                              <p>완료 처리 시 다음 사항이 적용됩니다:</p>
                              <ul className="list-disc list-inside ml-2 space-y-1">
                                <li>보장 기간이 모두 완료되었습니다</li>
                                <li>슬롯 상태가 '완료'로 변경됩니다</li>
                                <li>{targetUserText}에게 완료 알림이 발송됩니다</li>
                                <li className="font-semibold">이 작업은 취소할 수 없습니다</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 확인 메시지 */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
                      <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                        정말로 이 보장형 슬롯을 완료 처리하시겠습니까?
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
                className="btn btn-primary btn-sm"
              >
                완료
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
      {showConfirm && (
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent className="max-w-sm" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeenIcon icon="shield-tick" className="size-5 text-success" />
                최종 확인
              </DialogTitle>
            </DialogHeader>
            <DialogBody>
              <div className="py-4">
                <p className="text-sm text-slate-700 dark:text-gray-300 mb-2">
                  정말로 이 보장형 슬롯을 완료 처리하시겠습니까?
                </p>
                {isEarlyCompletion && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mt-3">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      <strong>주의:</strong> 조기 완료로 인해 잔여 {remainingCount}{unitText}분({refundAmount.toLocaleString()}원)은 {targetUserText}에게 환불됩니다.
                    </p>
                  </div>
                )}
              </div>
            </DialogBody>
            <div className="flex justify-end items-center gap-2 p-4 border-t border-slate-200 dark:border-gray-700">
              <button
                onClick={handleFinalConfirm}
                className="btn btn-primary btn-sm"
              >
                확인
              </button>
              <Button
                variant="light"
                size="sm"
                onClick={() => setShowConfirm(false)}
              >
                취소
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default GuaranteeCompleteModal;