import React from 'react';
import { KeenIcon } from '@/components';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaymentSummarySectionProps {
  selectedKeywords: number[];
  selectedCampaign: any;
  totalPaymentAmount: number;
  loading: boolean;
  saving: boolean;
  selectedCampaignId: number | null;
  handleSave: () => void;
}

export const PaymentSummarySection: React.FC<PaymentSummarySectionProps> = ({
  selectedKeywords,
  selectedCampaign,
  totalPaymentAmount,
  loading,
  saving,
  selectedCampaignId,
  handleSave
}) => {
  return (
    <div className="px-4 sm:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-3 flex-shrink-0 bg-background">
      <div className="flex items-center">
        {selectedKeywords.length > 0 && (
          <div className={cn(
            "flex items-center rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 border shadow-sm w-full sm:w-auto",
            selectedCampaign?.slot_type === 'guarantee'
              ? "bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/40 border-purple-200 dark:border-purple-800"
              : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-blue-100 dark:border-blue-900"
          )}>
            <KeenIcon icon="wallet" className={cn(
              "size-5 mr-2 translate-y-[4px]",
              selectedCampaign?.slot_type === 'guarantee' ? "text-purple-600 dark:text-purple-400" : "text-primary"
            )} />
            <div className="flex items-baseline flex-wrap">
              <span className="font-semibold text-gray-600 dark:text-gray-300 text-sm">
                {selectedCampaign?.slot_type === 'guarantee' ? '예상 금액:' : '결제 금액:'}
              </span>
              <span className={cn(
                "ml-2 font-extrabold text-base sm:text-lg",
                selectedCampaign?.slot_type === 'guarantee'
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-primary dark:text-primary-foreground"
              )}>
                {selectedCampaign?.slot_type === 'guarantee' ? '견적 요청 필요' : `${totalPaymentAmount.toLocaleString()}원`}
              </span>
              {selectedCampaign?.slot_type !== 'guarantee' && (
                <span className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">(부가세 포함)</span>
              )}
            </div>
          </div>
        )}
      </div>
      <Button
        onClick={handleSave}
        type="button"
        className={cn(
          "px-4 sm:px-6 md:px-8 text-white transition-all duration-300 h-9 sm:h-10 rounded-md shadow-sm w-full sm:w-auto",
          selectedCampaign?.slot_type === 'guarantee'
            ? "bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
            : "bg-primary hover:bg-primary/90"
        )}
        disabled={loading || saving || !selectedCampaignId || selectedKeywords.length === 0}
      >
        {saving ? (
          <>
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full me-2" role="status" aria-hidden="true"></span>
            {selectedCampaign?.slot_type === 'guarantee' ? '요청 중...' : '구매 중...'}
          </>
        ) : (
          <>
            {selectedCampaign?.slot_type === 'guarantee' ? (
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