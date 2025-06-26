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
  onApprove: (notes?: string, refundAmount?: number) => void;
  onReject: (notes: string) => void;
  campaignName?: string;
  campaignLogo?: string;
  serviceType?: string;
  slotStatus?: string;
  refundAmount: number;
  refundReason: string;
  requesterName?: string;
  loading?: boolean;
  guaranteeCount?: number;
  guaranteeUnit?: string;
  completedDays?: number;
  actualCompletedCount?: number;
  totalAmount?: number;
  startDate?: string;
  endDate?: string;
  requestDate?: string;
  refundSettings?: {
    type: 'immediate' | 'delayed' | 'cutoff_based';
    delay_days?: number;
    cutoff_time?: string;
  };
  currentUserRole?: 'user' | 'distributor';
}

const GuaranteeRefundRequestModal: React.FC<GuaranteeRefundRequestModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  onReject,
  campaignName,
  campaignLogo,
  serviceType,
  slotStatus,
  refundAmount,
  refundReason,
  requesterName,
  loading = false,
  guaranteeCount = 0,
  guaranteeUnit = 'daily',
  completedDays = 0,
  actualCompletedCount,
  totalAmount = 0,
  startDate,
  endDate,
  requestDate,
  refundSettings,
  currentUserRole = 'distributor',
}) => {
  const [notes, setNotes] = useState('');
  const [refundAmountInput, setRefundAmountInput] = useState<string>('');
  const [finalRefundAmount, setFinalRefundAmount] = useState<number>(refundAmount);
  const [validationMessage, setValidationMessage] = useState('');
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  // 단위에 따른 텍스트
  const isDaily = guaranteeUnit === 'daily' || guaranteeUnit === '일';
  const unitText = isDaily ? '일' : '회';
  const guaranteeLabel = isDaily ? '보장기간' : '보장횟수';
  const completedLabel = isDaily ? '작업기간 소요일' : '완료횟수';
  const remainingLabel = isDaily ? '잔여 작업기간' : '잔여 횟수';
  
  // 실제 완료 수
  const actualCompleted = isDaily ? completedDays : (actualCompletedCount || 0);
  
  // 환불 상세 정보 계산
  const remainingCount = Math.max(0, guaranteeCount - actualCompleted);
  const completionRate = guaranteeCount > 0 ? Math.round((actualCompleted / guaranteeCount) * 100) : 0;
  const refundRate = totalAmount > 0 ? Math.round((finalRefundAmount / totalAmount) * 100) : 0;

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
    if (isOpen) {
      setRefundAmountInput(refundAmount.toLocaleString());
      setFinalRefundAmount(refundAmount);
    }
  }, [isOpen, refundAmount]);


  const handleClose = () => {
    setNotes('');
    setRefundAmountInput('');
    setFinalRefundAmount(refundAmount);
    setValidationMessage('');
    setShowApproveConfirm(false);
    setShowRejectConfirm(false);
    onClose();
  };

  const handleApproveClick = () => {
    setValidationMessage('');
    
    // 환불 금액 검증
    if (!refundAmountInput.trim()) {
      setValidationMessage('환불 금액을 입력해주세요.');
      return;
    }
    
    const inputAmount = parseInt(refundAmountInput.replace(/[^0-9]/g, ''));
    if (isNaN(inputAmount) || inputAmount < 0) {
      setValidationMessage('올바른 환불 금액을 입력해주세요.');
      return;
    }
    
    if (inputAmount > totalAmount) {
      setValidationMessage('환불 금액이 총 결제금액을 초과할 수 없습니다.');
      return;
    }
    
    setFinalRefundAmount(inputAmount);
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
    onApprove(notes || undefined, finalRefundAmount !== refundAmount ? finalRefundAmount : undefined);
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

            {/* 왼쪽 컬럼 - 환불 요청 정보 */}
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
                          <span className="text-xs text-slate-500 dark:text-gray-500">{guaranteeLabel}</span>
                          <span className="font-medium">
                            {guaranteeCount}{unitText}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-xs text-slate-500 dark:text-gray-500">{completedLabel}</span>
                          <span className="font-medium">
                            {actualCompleted}{unitText} ({completionRate}%)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-xs text-slate-500 dark:text-gray-500">{remainingLabel}</span>
                          <Badge variant="destructive" className="text-xs">
                            {remainingCount}{unitText} ({refundRate}%)
                          </Badge>
                        </div>
                      </>
                    )}
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
                        <span className="text-xs text-slate-500 dark:text-gray-500">협상금액 (VAT 제외)</span>
                        <span className="font-medium">
                          {Math.floor(totalAmount / 1.1).toLocaleString()}원
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 dark:text-gray-600">VAT(10%)</span>
                        <span className="text-sm text-slate-400 dark:text-gray-600">
                          {(totalAmount - Math.floor(totalAmount / 1.1)).toLocaleString()}원
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm border-t border-slate-200 dark:border-gray-700 pt-2">
                        <span className="text-xs text-slate-500 dark:text-gray-500">총 결제금액</span>
                        <span className="font-medium">
                          {totalAmount.toLocaleString()}원
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200 dark:border-gray-700">
                        <span className="text-xs text-slate-500 dark:text-gray-500">환불 신청액</span>
                        <span className="font-semibold text-red-600">
                          {refundAmount.toLocaleString()}원
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-gray-400 text-right">
                        (VAT 포함)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 환불 신청 사유 카드 */}
              <div className="card">
                <div className="card-body">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
                    환불 신청 사유
                  </h3>
                  <div className="bg-slate-50 dark:bg-gray-900 rounded border p-3 text-sm text-slate-800 dark:text-gray-200 min-h-[60px]">
                    {refundReason}
                  </div>
                </div>
              </div>

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

            {/* 오른쪽 컬럼 - 환불 처리 폼 */}
            <div className="space-y-4">
              {/* 환불 처리 정보 카드 */}
              <div className="card">
                <div className="card-body">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
                    환불 처리 정보
                  </h3>
                  
                  {/* 환불 금액 입력 */}
                  <div className="mb-4">
                    <label htmlFor="refundAmountInput" className="form-label text-sm mb-2">
                      환불 금액 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="refundAmountInput"
                        type="text"
                        className={`input input-sm w-full pr-12 ${validationMessage && validationMessage.includes('환불 금액') ? 'border-red-500' : ''}`}
                        placeholder="환불할 금액을 입력하세요"
                        value={refundAmountInput}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          if (value) {
                            const numValue = parseInt(value);
                            // 총 결제금액 초과 검증
                            if (numValue > totalAmount) {
                              setRefundAmountInput(totalAmount.toLocaleString());
                              setValidationMessage('환불 금액이 총 결제금액을 초과할 수 없습니다.');
                            } else {
                              setRefundAmountInput(numValue.toLocaleString());
                              if (validationMessage && validationMessage.includes('환불 금액')) setValidationMessage('');
                            }
                          } else {
                            setRefundAmountInput('');
                          }
                        }}
                        disabled={loading}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">원</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-slate-500 dark:text-gray-500">
                        ※ 신청 금액: {refundAmount.toLocaleString()}원 (VAT 포함)
                      </p>
                      {totalAmount > 0 && (
                        <p className="text-xs text-slate-500 dark:text-gray-500">
                          최대: {totalAmount.toLocaleString()}원
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 처리 메모 */}
                  <div>
                    <label htmlFor="processingNotes" className="form-label text-sm mb-2">
                      처리 메모 {validationMessage && validationMessage.includes('거절 사유') && <span className="text-red-500">*</span>}
                    </label>
                    <Textarea
                      id="processingNotes"
                      className={`textarea textarea-sm resize-none ${validationMessage && validationMessage.includes('거절 사유') ? 'border-red-500' : ''}`}
                      rows={4}
                      placeholder={`승인 또는 거절 시 ${targetUserText}에게 전달할 메모를 입력하세요...`}
                      value={notes}
                      onChange={(e) => {
                        setNotes(e.target.value);
                        if (e.target.value.trim() && validationMessage && validationMessage.includes('거절 사유')) setValidationMessage('');
                      }}
                      disabled={loading}
                    />
                    <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
                      ※ 거절 시 필수, 승인 시 선택사항 ({targetUserText}에게 표시됩니다)
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
                  
                  {/* 처리 안내 */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <KeenIcon icon="information-2" className="text-sm text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                          환불 요청 처리 안내
                        </h4>
                        <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                          <p>환불 요청 처리 시 다음 사항이 적용됩니다:</p>
                          <ul className="list-disc list-inside ml-2 space-y-1">
                            <li><span className="font-semibold">승인</span> 시 설정한 금액으로 환불이 진행됩니다</li>
                            <li><span className="font-semibold">거절</span> 시 환불 요청이 취소됩니다</li>
                            <li>{targetUserText}에게 처리 결과 알림이 발송됩니다</li>
                            <li className="font-semibold">이 작업은 취소할 수 없습니다</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 확인 메시지 */}
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-700">
                    <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                      환불 요청을 승인하시겠습니까?
                    </p>
                  </div>
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
      refundAmount={finalRefundAmount}
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