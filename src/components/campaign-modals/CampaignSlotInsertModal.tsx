import React, { useState, useEffect } from 'react';
import { KeenIcon } from '@/components';
import { ICampaign } from './types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogBody, 
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CampaignSlotInsertModalProps {
  open: boolean;
  onClose: () => void;
  campaign: ICampaign | null;
  onSubmit: (quantity: number) => Promise<boolean>;
  maxQuantity?: number;
  minQuantity?: number;
}

/**
 * 캠페인 슬롯 등록 모달
 * 사용자가 캠페인에 참여하기 위한 슬롯 수량을 입력할 수 있는 모달
 */
const CampaignSlotInsertModal: React.FC<CampaignSlotInsertModalProps> = ({
  open,
  onClose,
  campaign,
  onSubmit,
  maxQuantity = 1000,
  minQuantity = 10
}) => {
  const [quantity, setQuantity] = useState<number>(minQuantity);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // 캠페인이 변경될 때마다 기본 수량과 총 가격 업데이트
  useEffect(() => {
    if (campaign) {
      setQuantity(minQuantity);
      
      // 단가 추출 (unitPrice 또는 originalData.unit_price 사용)
      const unitPrice = campaign.unitPrice ? 
        parseInt(campaign.unitPrice, 10) : 
        (campaign.originalData?.unit_price ? 
          parseInt(campaign.originalData.unit_price, 10) : 
          100);
      
      // 총 가격 계산
      setTotalPrice(minQuantity * unitPrice);
    }
  }, [campaign, minQuantity]);

  // 수량 변경 핸들러
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    
    // 유효한 숫자가 아니면 기본값 유지
    if (isNaN(newValue)) {
      return;
    }
    
    // 최소, 최대 범위 내로 제한
    const boundedValue = Math.max(minQuantity, Math.min(newValue, maxQuantity));
    setQuantity(boundedValue);
    
    // 단가 추출
    const unitPrice = campaign?.unitPrice ? 
      parseInt(campaign.unitPrice, 10) : 
      (campaign?.originalData?.unit_price ? 
        parseInt(campaign.originalData.unit_price, 10) : 
        100);
    
    // 총 가격 계산
    setTotalPrice(boundedValue * unitPrice);
  };

  // 수량 증가 버튼 핸들러
  const handleIncrease = () => {
    if (quantity < maxQuantity) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
      
      // 단가 추출
      const unitPrice = campaign?.unitPrice ? 
        parseInt(campaign.unitPrice, 10) : 
        (campaign?.originalData?.unit_price ? 
          parseInt(campaign.originalData.unit_price, 10) : 
          100);
      
      // 총 가격 계산
      setTotalPrice(newQuantity * unitPrice);
    }
  };

  // 수량 감소 버튼 핸들러
  const handleDecrease = () => {
    if (quantity > minQuantity) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      
      // 단가 추출
      const unitPrice = campaign?.unitPrice ? 
        parseInt(campaign.unitPrice, 10) : 
        (campaign?.originalData?.unit_price ? 
          parseInt(campaign.originalData.unit_price, 10) : 
          100);
      
      // 총 가격 계산
      setTotalPrice(newQuantity * unitPrice);
    }
  };

  // 제출 핸들러
  const handleSubmit = async () => {
    if (!campaign) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // onSubmit 함수 호출 (실제 데이터 처리)
      const success = await onSubmit(quantity);
      
      if (!success) {
        throw new Error('슬롯 등록에 실패했습니다. 다시 시도해주세요.');
      }
      
      // 성공 시 모달 닫기
      onClose();
    } catch (err) {
      // 오류 처리
      setError(err instanceof Error ? err.message : '슬롯 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 캠페인이 없는 경우 모달 렌더링 안 함
  if (!campaign) return null;

  // 단가 추출
  const unitPrice = campaign.unitPrice ? 
    parseInt(campaign.unitPrice, 10) : 
    (campaign.originalData?.unit_price ? 
      parseInt(campaign.originalData.unit_price, 10) : 
      100);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="bg-background py-4 px-6 border-b">
          <DialogTitle className="text-lg font-medium text-foreground">캠페인 슬롯 등록</DialogTitle>
        </DialogHeader>
        
        <DialogBody className="p-6 bg-background space-y-4">
          {/* 오류 메시지 */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-4 rounded-md flex items-center mb-4">
              <KeenIcon icon="warning-triangle" className="size-5 mr-2" />
              {error}
            </div>
          )}
          
          {/* 캠페인 정보 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">{campaign.campaignName}</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">단가:</div>
              <div className="text-sm font-medium text-foreground">{unitPrice.toLocaleString()}원</div>
              
              <div className="text-sm text-muted-foreground">마감시간:</div>
              <div className="text-sm font-medium text-foreground">{campaign.deadline}</div>
            </div>
          </div>
          
          {/* 수량 입력 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              슬롯 수량 <span className="text-xs text-muted-foreground">(최소 {minQuantity}개, 최대 {maxQuantity}개)</span>
            </label>
            <div className="flex items-center">
              <button
                type="button"
                onClick={handleDecrease}
                className="size-9 flex items-center justify-center rounded-l-md border border-border bg-muted hover:bg-muted/80 text-foreground"
                disabled={quantity <= minQuantity || loading}
              >
                <KeenIcon icon="minus" className="size-4" />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                min={minQuantity}
                max={maxQuantity}
                className="w-20 text-center h-9 px-2 py-1 border-y border-border bg-background text-foreground focus:ring-0 focus:outline-none"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleIncrease}
                className="size-9 flex items-center justify-center rounded-r-md border border-border bg-muted hover:bg-muted/80 text-foreground"
                disabled={quantity >= maxQuantity || loading}
              >
                <KeenIcon icon="plus" className="size-4" />
              </button>
            </div>
          </div>
          
          {/* 총 가격 표시 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-blue-700 dark:text-blue-300 font-medium">총 가격:</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-300">
                {totalPrice.toLocaleString()}원
              </span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              * 슬롯 수량 × 단가 = 총 결제 금액
            </p>
          </div>
          
          {/* 안내 메시지 */}
          <div className="text-sm text-muted-foreground">
            <p>
              슬롯 등록 시 입력하신 수량만큼 캐시가 차감되며, 이는 취소가 불가능합니다.
              충분한 캐시가 있는지 확인해 주세요.
            </p>
          </div>
        </DialogBody>
        
        <DialogFooter className="p-4 border-t flex justify-end">
          {/* 등록 버튼 */}
          <Button
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-white"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                처리 중...
              </span>
            ) : `${quantity}개 슬롯 등록하기`}
          </Button>
          
          {/* 취소 버튼 */}
          <Button
            onClick={onClose}
            variant="outline"
            disabled={loading}
            className="ml-2"
          >
            취소
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { CampaignSlotInsertModal };