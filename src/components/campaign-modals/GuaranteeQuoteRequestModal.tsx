import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { guaranteeSlotRequestService } from '@/services/guaranteeSlotService';
import { toast } from 'sonner';
import { useAuthContext } from '@/auth';

interface GuaranteeQuoteRequestModalProps {
  open: boolean;
  onClose: () => void;
  campaign: any;
  keywordDetails: any[];
  onSuccess?: () => void;
}

export const GuaranteeQuoteRequestModal: React.FC<GuaranteeQuoteRequestModalProps> = ({
  open,
  onClose,
  campaign,
  keywordDetails,
  onSuccess
}) => {
  const { currentUser } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const [formData, setFormData] = useState({
    targetRank: '1', // 목표 순위 입력값
    guaranteeCount: campaign?.guarantee_count?.toString() || '',
    dailyBudget: '', // 일별/단위별 금액으로 변경
    message: ''
  });

  // 실시간 총 금액 계산
  const calculateTotalAmount = useCallback(() => {
    const daily = parseInt(formData.dailyBudget.replace(/,/g, '') || '0');
    const count = parseInt(formData.guaranteeCount || '0');
    return daily * count;
  }, [formData.dailyBudget, formData.guaranteeCount]);

  // 최소 일별/회당 단가 계산
  const calculateMinDailyAmount = useCallback(() => {
    if (campaign?.min_guarantee_price && formData.guaranteeCount) {
      const guaranteeCount = parseInt(formData.guaranteeCount);
      if (guaranteeCount > 0) {
        return Math.ceil(parseInt(campaign.min_guarantee_price) / guaranteeCount);
      }
    }
    return null;
  }, [campaign?.min_guarantee_price, formData.guaranteeCount]);

  // 금액 포맷팅 헬퍼 (모바일용)
  const formatAmountMobile = (amount: number): string => {
    if (amount >= 100000000) {
      const billions = amount / 100000000;
      return billions % 1 === 0 ? `${billions}억원` : `${billions.toFixed(1)}억원`;
    } else if (amount >= 10000000) {
      const tenMillions = amount / 10000000;
      return tenMillions % 1 === 0 ? `${tenMillions}천만원` : `${tenMillions.toFixed(1)}천만원`;
    } else if (amount >= 10000) {
      const tenThousands = amount / 10000;
      return tenThousands % 1 === 0 ? `${tenThousands}만원` : `${tenThousands.toFixed(1)}만원`;
    }
    return `${amount.toLocaleString()}원`;
  };

  // 금액 포맷팅 헬퍼 (데스크톱용 - 원 단위)
  const formatAmountDesktop = (amount: number): string => {
    return `${amount.toLocaleString()}원`;
  };

  // 선택한 키워드명 목록
  const selectedKeywordNames = keywordDetails.map(kw => kw.mainKeyword);
  const totalKeywords = keywordDetails.length;

  // campaign이 변경될 때 폼 데이터 업데이트
  useEffect(() => {
    if (campaign) {
      setFormData(prev => ({
        ...prev,
        guaranteeCount: campaign.guarantee_count?.toString() || prev.guaranteeCount,
        // dailyBudget는 초기값을 비워둠
        dailyBudget: ''
      }));
      // 캠페인이 변경될 때 validation 오류 초기화
      setValidationError('');
    }
  }, [campaign]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setValidationError('');

      // 유효성 검사
      if (!formData.dailyBudget) {
        setValidationError(`${campaign?.guarantee_unit === '회' ? '회당' : '일별'} 단가를 입력해주세요.`);
        setLoading(false);
        return;
      }

      // 최소 가격 체크
      const dailyAmount = parseInt(formData.dailyBudget.replace(/,/g, ''));
      const minDailyAmount = calculateMinDailyAmount();
      if (minDailyAmount && dailyAmount < minDailyAmount) {
        setValidationError(`${campaign?.guarantee_unit === '회' ? '회당' : '일별'} 단가는 최소 ${minDailyAmount.toLocaleString()}원 이상이어야 합니다.`);
        setLoading(false);
        return;
      }

      if (!formData.targetRank || parseInt(formData.targetRank) < 1) {
        setValidationError('목표 순위를 1 이상의 숫자로 입력해주세요.');
        setLoading(false);
        return;
      }

      // 보장 기간이 없으면 캠페인 기본값 사용
      const guaranteeCount = formData.guaranteeCount || campaign?.guarantee_count;
      if (!guaranteeCount) {
        setValidationError('보장 기간 정보가 없습니다.');
        setLoading(false);
        return;
      }

      // 사용자 ID 가져오기
      const userId = currentUser?.id || '';
      if (!userId) {
        setValidationError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      // 첫 번째 키워드 정보 가져오기
      const firstKeyword = keywordDetails[0];
      
      // input_data 구성 (키워드별 작업 정보)
      const inputData = {
        keywords: keywordDetails.map(kd => ({
          id: kd.id,
          main_keyword: kd.mainKeyword,
          work_count: kd.workCount,
          due_days: kd.dueDays,
          input_data: kd.inputData || {}
        }))
      };

      // 견적 요청 생성
      const { data, error } = await guaranteeSlotRequestService.createRequest({
        campaign_id: campaign.id,
        target_rank: parseInt(formData.targetRank),
        guarantee_count: parseInt(guaranteeCount.toString()),
        initial_budget: parseInt(formData.dailyBudget.replace(/,/g, '')), // 일별 금액을 initial_budget으로 전송
        keyword_id: firstKeyword?.id, // 첫 번째 키워드 ID
        input_data: inputData,
        quantity: keywordDetails.reduce((sum, kd) => sum + (kd.workCount || 0), 0), // 총 작업수
        user_reason: formData.message, // 사용자 요청 사유
        additional_requirements: keywordDetails.map(kd => kd.mainKeyword).join(', ')
      }, userId);

      if (error) {
        throw error;
      }

      toast.success('견적 요청이 성공적으로 접수되었습니다.');
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('견적 요청 실패:', error);
      setValidationError('견적 요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const number = value.replace(/,/g, '');
    if (!number) return '';
    return parseInt(number).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon="message-text" className="size-5 text-primary" />
            보장형 캠페인 견적 요청
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="max-h-[60vh] overflow-y-auto">
          <div className="space-y-6">
            {/* 캠페인 정보 */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <KeenIcon icon="document" className="size-4 text-purple-600" />
                캠페인 정보
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">캠페인명:</span>
                  <span className="font-medium">{campaign?.campaign_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">선택한 키워드:</span>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                    {keywordDetails.map((keyword, index) => (
                      <span key={index} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-md text-xs">
                        {keyword.mainKeyword} ({keyword.workCount}개, {keyword.dueDays}일)
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">총 작업수:</span>
                  <span className="font-medium">
                    {keywordDetails.reduce((sum, kd) => sum + (kd.workCount || 0), 0)}개
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">가격 범위:</span>
                  <span className="font-medium text-purple-600">
                    {campaign?.min_guarantee_price && campaign?.max_guarantee_price
                      ? (() => {
                        const minPrice = parseInt(campaign.min_guarantee_price);
                        const maxPrice = parseInt(campaign.max_guarantee_price);

                        const formatPrice = (price: number) => {
                          if (price >= 100000000) {
                            const billions = price / 100000000;
                            return billions % 1 === 0 ? `${billions}억` : `${billions.toFixed(1)}억`;
                          } else if (price >= 10000000) {
                            const tenMillions = price / 10000000;
                            return tenMillions % 1 === 0 ? `${tenMillions}천만` : `${tenMillions.toFixed(1)}천만`;
                          } else if (price >= 10000) {
                            const tenThousands = price / 10000;
                            return tenThousands % 1 === 0 ? `${tenThousands}만` : `${tenThousands.toFixed(1)}만`;
                          }
                          return price.toLocaleString();
                        };

                        return `${formatPrice(minPrice)}~${formatPrice(maxPrice)}원`;
                      })()
                      : '협의 필요'}
                  </span>
                </div>
              </div>
            </div>

            {/* 견적 요청 폼 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  목표 순위 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={formData.targetRank}
                  onChange={(e) => {
                    setFormData({ ...formData, targetRank: e.target.value });
                    setValidationError('');
                  }}
                  placeholder="목표 순위를 입력하세요 (예: 1)"
                  min="1"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  * 검색 결과에서 노출되길 원하는 순위를 입력하세요
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  보장 {campaign?.guarantee_unit === '회' ? '회수' : '일수'}
                </label>
                <Input
                  type="number"
                  value={formData.guaranteeCount}
                  onChange={(e) => {
                    setFormData({ ...formData, guaranteeCount: e.target.value });
                    setValidationError('');
                  }}
                  placeholder={`보장 ${campaign?.guarantee_unit === '회' ? '회수' : '일수'}를 입력하세요`}
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {campaign?.guarantee_unit === '회' ? '회당' : '일별'} 단가 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.dailyBudget}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, dailyBudget: formatCurrency(value) });
                    setValidationError('');
                  }}
                  placeholder={`${campaign?.guarantee_unit === '회' ? '회당' : '일별'} 금액을 입력하세요`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  * 실제 금액은 판매자와 협의를 통해 결정됩니다
                  {calculateMinDailyAmount() && (
                    <>
                      <br />
                      * 최소 {campaign?.guarantee_unit === '회' ? '회당' : '일별'} 단가: <span className="font-semibold text-purple-600 dark:text-purple-400">{calculateMinDailyAmount()?.toLocaleString()}원</span> 이상
                    </>
                  )}
                </p>
              </div>

              {/* 실시간 계산 결과 표시 */}
              {formData.dailyBudget && formData.guaranteeCount && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <KeenIcon icon="calculator" className="size-4 text-gray-600" />
                    예상 금액
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {campaign?.guarantee_unit === '회' ? '회당' : '일별'} 단가:
                      </span>
                      <span className="font-medium">{formData.dailyBudget}원</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        × 보장 {campaign?.guarantee_unit === '회' ? '횟수' : '일수'}:
                      </span>
                      <span className="font-medium">{formData.guaranteeCount}{campaign?.guarantee_unit || '일'}</span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">총 금액 (VAT 제외):</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          <span className="hidden md:inline">{formatAmountDesktop(calculateTotalAmount())}</span>
                          <span className="md:hidden">{formatAmountMobile(calculateTotalAmount())}</span>
                        </span>
                      </div>
                      <div className="flex justify-between text-purple-600 dark:text-purple-400">
                        <span>총 금액 (VAT 포함):</span>
                        <span className="font-semibold">
                          <span className="hidden md:inline">{formatAmountDesktop(Math.round(calculateTotalAmount() * 1.1))}</span>
                          <span className="md:hidden">{formatAmountMobile(Math.round(calculateTotalAmount() * 1.1))}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  요청 메시지 (선택)
                </label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="추가 요청사항이나 문의사항을 입력하세요"
                  rows={4}
                />
              </div>
            </div>

            {/* 안내 사항 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <KeenIcon icon="information-2" className="size-4 text-blue-600" />
                안내사항
              </h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                <li>견적 요청 후 총판에서 검토하여 최종 가격을 제안합니다.</li>
                <li>협상을 통해 가격이 확정된 후 구매가 가능합니다.</li>
                <li>보장형 캠페인은 목표 순위 달성을 보장하며, 미달성 시 환불됩니다.</li>
                <li>작업 시작일은 총판 승인 다음날부터입니다.</li>
              </ul>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex-1">
            {validationError && (
              <div className="flex items-center gap-2 text-sm">
                <KeenIcon icon="information-3" className="size-4 text-red-500 flex-shrink-0" />
                <span className="text-red-600 dark:text-red-400">{validationError}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
            onClick={handleSubmit}
            disabled={loading || !formData.dailyBudget || !formData.targetRank}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full me-2" />
                요청 중...
              </>
            ) : (
              <>
                <KeenIcon icon="message-programming" className="size-4 me-2" />
                견적 요청
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            취소
          </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};