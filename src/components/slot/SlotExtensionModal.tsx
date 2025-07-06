import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/alert';
import { KeenIcon } from '@/components';
import { supabase } from '@/supabase';
import { useCustomToast } from '@/hooks/useCustomToast';
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { checkExtensionEligibility, createExtensionRequest } from '@/pages/admin/slots/services/slotService';
import { Slot } from '@/pages/admin/slots/components/types';

interface SlotExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: Slot;
  onSuccess: () => void;
}

export const SlotExtensionModal: React.FC<SlotExtensionModalProps> = ({
  isOpen,
  onClose,
  slot,
  onSuccess,
}) => {
  const { showSuccess, showError } = useCustomToast();
  const [extensionDays, setExtensionDays] = useState<number>(7); // 기본 7일
  const [isProcessing, setIsProcessing] = useState(false);
  const [userBalance, setUserBalance] = useState({ free: 0, paid: 0, total: 0 });
  const [campaignPrice, setCampaignPrice] = useState(0);
  const [eligibilityCheck, setEligibilityCheck] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 초기 연장 기간 설정 (원본 슬롯의 작업 기간과 동일하게)
  useEffect(() => {
    if (slot.start_date && slot.end_date) {
      const originalDays = Math.ceil(
        (new Date(slot.end_date).getTime() - new Date(slot.start_date).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      setExtensionDays(originalDays);
    }
  }, [slot]);

  // 사용자 잔액 및 캠페인 가격 조회
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return;

      try {
        // 사용자 잔액 조회
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          const { data: balance } = await supabase
            .from('user_balances')
            .select('free_balance, paid_balance, total_balance')
            .eq('user_id', user.id)
            .single();

          if (balance) {
            setUserBalance({
              free: Number(balance.free_balance) || 0,
              paid: Number(balance.paid_balance) || 0,
              total: Number(balance.total_balance) || 0
            });
          }
        }

        // 캠페인 정보 조회
        if (slot.product_id) {
          const { data: campaign, error: campaignError } = await supabase
            .from('campaigns')
            .select('unit_price')
            .eq('id', slot.product_id)
            .single();

          if (campaignError) {
            console.error('Campaign fetch error:', campaignError);
          }
          
          if (campaign) {
            const price = Number(campaign.unit_price) || 0;
            setCampaignPrice(price);
            console.log('Campaign price set to:', price);
          }
        }

        // 연장 가능 여부 체크
        const eligibility = await checkExtensionEligibility(slot.id);
        setEligibilityCheck(eligibility);
      } catch (error) {
        console.error('데이터 조회 오류:', error);
      }
    };

    fetchData();
  }, [isOpen, slot]);

  // 총 비용 계산 (VAT 포함)
  const calculateTotalCost = () => {
    // 캠페인 가격이 없으면 0 반환
    if (!campaignPrice) {
      console.log('Campaign price not loaded');
      return 0;
    }
    
    // workCount를 일일 작업량으로 사용 (NaverShoppingTraffic 등의 경우)
    const quantity = slot.input_data?.workCount || 
                    slot.input_data?.['작업량'] ||
                    slot.input_data?.quantity || 
                    slot.input_data?.['타수'] || 
                    slot.input_data?.['일일 타수'] || 
                    slot.input_data?.['일일타수'] ||
                    slot.quantity || 
                    0;
    
    // 연장 기간 동안의 총 비용 계산 (단가 * 일수 * 일일작업량)
    const totalCostWithoutVAT = campaignPrice * extensionDays * Number(quantity);
    // VAT 10% 추가
    const totalCost = Math.ceil(totalCostWithoutVAT * 1.1);
    
    console.log('Cost calculation:', {
      campaignPrice,
      extensionDays,
      quantity,
      totalCostWithoutVAT,
      totalCost,
      inputData: slot.input_data,
      serviceType: slot.input_data?.service_type
    });
    
    return totalCost;
  };

  // 예상 시작일/종료일 계산
  const calculateNewDates = () => {
    if (!slot.end_date) return { start: '', end: '' };
    
    const originalEndDate = new Date(slot.end_date);
    const newStartDate = addDays(originalEndDate, 1);
    const newEndDate = addDays(newStartDate, extensionDays - 1);
    
    return {
      start: format(newStartDate, 'yyyy-MM-dd'),
      end: format(newEndDate, 'yyyy-MM-dd')
    };
  };

  const handleExtensionRequest = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      // 잔액 확인
      const totalCost = calculateTotalCost();
      if (userBalance.paid < totalCost) {
        showError('잔액이 부족합니다. 충전 후 다시 시도해주세요.');
        return;
      }

      // 사용자 ID 확인
      if (!currentUserId) {
        showError('사용자 정보를 확인할 수 없습니다.');
        return;
      }

      // 연장 요청 생성
      const result = await createExtensionRequest(
        slot.id,
        currentUserId,
        extensionDays,
        ''
      );

      if (!result.success) {
        showError(result.message || '연장 신청 중 오류가 발생했습니다.');
        return;
      }

      showSuccess('슬롯 연장 신청이 완료되었습니다. 총판 승인을 기다려주세요.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('연장 신청 오류:', error);
      showError('연장 신청 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const newDates = calculateNewDates();
  const totalCost = calculateTotalCost();
  const isEligible = eligibilityCheck?.isEligible ?? false;
  const eligibilityMessage = eligibilityCheck?.message || '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-3">
            <div className="size-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 shadow-lg flex items-center justify-center">
              <KeenIcon icon="calendar-tick" className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">슬롯 연장 신청</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-normal mt-0.5">기존 슬롯을 연장하여 서비스를 계속 이용합니다</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-6 overflow-y-auto flex-1">
          {/* 연장 가능 여부 체크 */}
          {!isEligible && (
            <Alert variant="warning">
              <div className="flex items-start gap-2">
                <KeenIcon icon="information-3" className="size-5 mt-0.5" />
                <div>
                  <p className="font-medium">연장 불가</p>
                  <p className="text-sm mt-1">{eligibilityMessage}</p>
                </div>
              </div>
            </Alert>
          )}

          {/* 현재 슬롯 정보 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-base mb-4 flex items-center gap-2">
              <KeenIcon icon="information-3" className="text-blue-600 dark:text-blue-400 size-5" />
              현재 슬롯 정보
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <KeenIcon icon="briefcase" className="size-4" />
                  캠페인
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{slot.campaign?.campaign_name || slot.campaign_name || '-'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <KeenIcon icon="time" className="size-4" />
                  남은 기간
                </span>
                <span className="font-bold text-lg text-orange-600 dark:text-orange-400">
                  {slot.end_date && (
                    <>
                      {Math.max(0, Math.ceil((new Date(slot.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}일
                    </>
                  )}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <KeenIcon icon="calendar" className="size-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">현재 서비스 기간</span>
                </div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {slot.start_date && slot.end_date && (
                    <>
                      {format(new Date(slot.start_date), 'yyyy년 MM월 dd일')} ~ {format(new Date(slot.end_date), 'yyyy년 MM월 dd일')}
                    </>
                  )}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <KeenIcon icon="tag" className="size-4" />
                    일일 작업량
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">
                    {slot.input_data?.workCount || 
                     slot.input_data?.['작업량'] ||
                     slot.input_data?.quantity || 
                     slot.input_data?.['타수'] || 
                     slot.input_data?.['일일 타수'] || 
                     slot.input_data?.['일일타수'] ||
                     slot.quantity || 
                     0}건
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <KeenIcon icon="dollar" className="size-4" />
                    단가
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">
                    {campaignPrice > 0 ? `${campaignPrice.toLocaleString()}원` : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 연장 설정 */}
          <div className="space-y-4">
            {/* 연장 기간 설정 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-base mb-4 flex items-center gap-2">
                <KeenIcon icon="calendar-tick" className="text-blue-600 dark:text-blue-400 size-5" />
                연장 기간
              </h4>
              <div className="space-y-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      className="h-10 w-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                      onClick={() => setExtensionDays(Math.max(1, extensionDays - 1))}
                      disabled={!isEligible || extensionDays <= 1}
                      type="button"
                    >
                      <KeenIcon icon="minus" className="size-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <input
                      type="number"
                      value={extensionDays}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setExtensionDays(Math.max(1, Math.min(365, value)));
                      }}
                      className="w-24 h-10 text-center text-lg font-semibold bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!isEligible}
                      min="1"
                      max="365"
                    />
                    <button
                      className="h-10 w-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                      onClick={() => setExtensionDays(Math.min(365, extensionDays + 1))}
                      disabled={!isEligible || extensionDays >= 365}
                      type="button"
                    >
                      <KeenIcon icon="plus" className="size-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setExtensionDays(7)}
                    disabled={!isEligible}
                    type="button"
                  >
                    1주
                  </button>
                  <button
                    className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setExtensionDays(14)}
                    disabled={!isEligible}
                    type="button"
                  >
                    2주
                  </button>
                  <button
                    className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setExtensionDays(30)}
                    disabled={!isEligible}
                    type="button"
                  >
                    1개월
                  </button>
                  <button
                    className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setExtensionDays(60)}
                    disabled={!isEligible}
                    type="button"
                  >
                    2개월
                  </button>
                  <button
                    className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setExtensionDays(90)}
                    disabled={!isEligible}
                    type="button"
                  >
                    3개월
                  </button>
                </div>
              </div>
            </div>

            {/* 예상 기간 표시 */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-2">
                <KeenIcon icon="calendar-check" className="text-purple-600 dark:text-purple-400 size-5 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">연장 후 서비스 기간 (예상)</p>
                  <p className="text-base font-semibold text-purple-700 dark:text-purple-300">
                    {newDates.start} ~ {newDates.end}
                  </p>
                </div>
              </div>
            </div>

            {/* 비용 정보 */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 space-y-4">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <KeenIcon icon="wallet" className="text-gray-600 dark:text-gray-400 size-4" />
                비용 정보
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <KeenIcon icon="calculator" className="size-4" />
                    예상 비용 (VAT 포함)
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-lg text-gray-900 dark:text-white">
                      {totalCost > 0 ? `${totalCost.toLocaleString()}원` : '계산 중...'}
                    </span>
                    {totalCost > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        ({campaignPrice.toLocaleString()}원 × {extensionDays}일 × {slot.input_data?.workCount || 
                         slot.input_data?.['작업량'] ||
                         slot.input_data?.quantity || 
                         slot.input_data?.['타수'] || 
                         slot.input_data?.['일일 타수'] || 
                         slot.input_data?.['일일타수'] ||
                         slot.quantity || 
                         0}건) × 1.1
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <KeenIcon icon="wallet" className="size-4" />
                    보유 캐시
                  </span>
                  <span className={`font-bold text-lg ${userBalance.paid >= totalCost ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {userBalance.paid.toLocaleString()}원
                  </span>
                </div>
                {userBalance.paid < totalCost && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <KeenIcon icon="information-2" className="text-red-600 dark:text-red-400 size-5 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-300">
                        캐시가 부족합니다. 충전 후 이용해주세요.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        <DialogFooter className="border-t p-6 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isProcessing}
            className="min-w-[100px]"
          >
            <KeenIcon icon="cross" className="size-4 mr-1" />
            취소
          </Button>
          <Button
            onClick={handleExtensionRequest}
            disabled={isProcessing || !isEligible || userBalance.paid < totalCost}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white min-w-[120px]"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                처리중...
              </>
            ) : (
              <>
                <KeenIcon icon="check" className="size-4 mr-1" />
                연장 신청
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};