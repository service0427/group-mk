import React, { useState, useEffect } from 'react';
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

  // 초기 예산 (최소 가격만 표시)
  const calculateInitialBudget = () => {
    if (campaign?.min_guarantee_price) {
      const minPrice = parseInt(campaign.min_guarantee_price);
      return minPrice.toLocaleString();
    }
    return '';
  };

  const [formData, setFormData] = useState({
    targetRank: '1', // 기본값 유지 (DB 필수값일 수 있음)
    guaranteeCount: campaign?.guarantee_count?.toString() || '',
    initialBudget: calculateInitialBudget(),
    message: ''
  });

  // 선택한 키워드명 목록
  const selectedKeywordNames = keywordDetails.map(kw => kw.mainKeyword);
  const totalKeywords = keywordDetails.length;

  // campaign이 변경될 때 폼 데이터 업데이트
  useEffect(() => {
    if (campaign) {
      // 초기 예산 (최소 가격만)
      let initialBudget = '';
      if (campaign.min_guarantee_price) {
        const minPrice = parseInt(campaign.min_guarantee_price);
        initialBudget = minPrice.toLocaleString();
      }

      setFormData(prev => ({
        ...prev,
        guaranteeCount: campaign.guarantee_count?.toString() || prev.guaranteeCount,
        initialBudget: initialBudget || prev.initialBudget
      }));
    }
  }, [campaign]);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // 유효성 검사
      if (!formData.initialBudget) {
        toast.error('희망 예산을 입력해주세요.');
        return;
      }

      // 보장 기간이 없으면 캠페인 기본값 사용
      const guaranteeCount = formData.guaranteeCount || campaign?.guarantee_count;
      if (!guaranteeCount) {
        toast.error('보장 기간 정보가 없습니다.');
        return;
      }

      // 사용자 ID 가져오기
      const userId = currentUser?.id || '';
      if (!userId) {
        toast.error('로그인이 필요합니다.');
        return;
      }

      // 견적 요청 생성
      const { data, error } = await guaranteeSlotRequestService.createRequest({
        campaign_id: campaign.id,
        target_rank: 1, // 기본값으로 1을 사용 (UI에서 제거됨)
        guarantee_count: parseInt(guaranteeCount.toString()),
        initial_budget: parseInt(formData.initialBudget.replace(/,/g, '')),
        message: formData.message
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
      toast.error('견적 요청 중 오류가 발생했습니다.');
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
                    {selectedKeywordNames.map((name, index) => (
                      <span key={index} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-md text-xs">
                        {name}
                      </span>
                    ))}
                  </div>
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
                  보장 {campaign?.guarantee_unit === '회' ? '회수' : '일수'}
                </label>
                <Input
                  type="number"
                  value={formData.guaranteeCount}
                  onChange={(e) => setFormData({ ...formData, guaranteeCount: e.target.value })}
                  placeholder={`보장 ${campaign?.guarantee_unit === '회' ? '회수' : '일수'}를 입력하세요`}
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  희망 예산 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.initialBudget}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, initialBudget: formatCurrency(value) });
                  }}
                  placeholder="희망하는 예산을 입력하세요"
                />
                <p className="text-xs text-gray-500 mt-1">
                  * 최종적인 금액이 아닌 실제 금액은 판매자와 협의를 통해 최종 결정되며 이후 부가세는 별도 반영됩니다.
                </p>
              </div>

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

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.initialBudget}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};