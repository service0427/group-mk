import React from 'react';
import { Button } from '@/components/ui/button';

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
  // 결제 금액 계산
  const calculateTotalPrice = () => {
    const workCount = slotData.minimum_purchase || (selectedCampaign?.min_quantity ? Number(selectedCampaign.min_quantity) : 1);
    const workDays = slotData.work_days || 1;
    const unitPrice = selectedCampaign?.unit_price 
      ? (typeof selectedCampaign.unit_price === 'string' 
        ? parseFloat(selectedCampaign.unit_price) 
        : selectedCampaign.unit_price)
      : 0;
    const totalPrice = workCount * workDays * unitPrice * 1.1; // 부가세 포함
    return Math.round(totalPrice);
  };

  return (
    <div className="bg-muted/50 px-4 sm:px-6 py-3 sm:py-4 border-t flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-4">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground">
          예상 결제 금액:
        </span>
        <span className="text-base sm:text-lg font-bold text-foreground">
          {calculateTotalPrice().toLocaleString()}원
        </span>
      </div>
      <Button
        onClick={handleSaveForManualService}
        disabled={loading || saving || !selectedCampaignId}
        size="sm"
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg shadow-md transition-all duration-200 text-xs sm:text-sm"
      >
        {saving ? (
          <>
            <span className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-b-2 border-white mr-2"></span>
            구매 진행 중...
          </>
        ) : (
          `구매하기`
        )}
      </Button>
    </div>
  );
};