import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { cn } from '@/lib/utils';

interface ManualPaymentSectionProps {
  selectedCampaign: any;
  slotData: any;
  loading: boolean;
  saving: boolean;
  selectedCampaignId: number | null;
  handleSaveForManualService: () => void;
}

export const ManualPaymentSection: React.FC<ManualPaymentSectionProps> = ({
  selectedCampaign,
  slotData,
  loading,
  saving,
  selectedCampaignId,
  handleSaveForManualService
}) => {
  // 보장형 여부 확인
  const isGuarantee = selectedCampaign?.slot_type === 'guarantee' || selectedCampaign?.is_guarantee;
  
  // 결제 금액 계산 - useMemo로 slotData 변경 시 재계산
  const totalPrice = useMemo(() => {
    // 필수값이 입력되지 않았으면 0 반환
    if (!slotData.minimum_purchase || !slotData.work_days) {
      return 0;
    }
    
    const workCount = slotData.minimum_purchase;
    const workDays = slotData.work_days;
    const unitPrice = selectedCampaign?.unit_price 
      ? (typeof selectedCampaign.unit_price === 'string' 
        ? parseFloat(selectedCampaign.unit_price) 
        : selectedCampaign.unit_price)
      : 0;
    const price = workCount * workDays * unitPrice * 1.1; // 부가세 포함
    return Math.round(price);
  }, [slotData.minimum_purchase, slotData.work_days, selectedCampaign?.unit_price]);

  return (
    <div className="px-4 sm:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-3 flex-shrink-0 bg-background">
      <div className="flex items-center">
        <div className={cn(
          "flex items-center rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 border shadow-sm w-full sm:w-auto",
          isGuarantee
            ? "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-emerald-200 dark:border-emerald-800"
            : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-blue-100 dark:border-blue-900"
        )}>
          <KeenIcon icon="wallet" className={cn(
            "size-5 mr-2 translate-y-[4px]",
            isGuarantee ? "text-emerald-600 dark:text-emerald-400" : "text-primary"
          )} />
          <div className="flex items-baseline flex-wrap">
            <span className="font-semibold text-gray-600 dark:text-gray-300 text-sm">
              {isGuarantee ? '예상 금액:' : '결제 금액:'}
            </span>
            <span className={cn(
              "ml-2 font-extrabold text-base sm:text-lg",
              isGuarantee
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-primary dark:text-primary-foreground"
            )}>
              {isGuarantee ? '견적 요청 필요' : `${totalPrice.toLocaleString()}원`}
            </span>
            {!isGuarantee && (
              <span className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">(부가세 포함)</span>
            )}
          </div>
        </div>
      </div>
      <Button
        onClick={handleSaveForManualService}
        type="button"
        className={cn(
          "px-4 sm:px-6 md:px-8 text-white transition-all duration-300 h-9 sm:h-10 rounded-md shadow-sm w-full sm:w-auto",
          isGuarantee
            ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        )}
        disabled={loading || saving || !selectedCampaignId}
      >
        {saving ? (
          <>
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full me-2" role="status" aria-hidden="true"></span>
            {isGuarantee ? '요청 중...' : '구매 중...'}
          </>
        ) : (
          <>
            {isGuarantee ? (
              <>
                <KeenIcon icon="message-text" className="size-4 me-1.5" />
                견적요청
              </>
            ) : (
              <>
                <svg className="w-4 h-4 me-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                구매하기
              </>
            )}
          </>
        )}
      </Button>
    </div>
  );
};