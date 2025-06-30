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
import { smartCeil } from '@/utils/mathUtils';

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
    dailyBudget: '', // 일별/단위별 금액으로 변경
    message: ''
  });

  const [priceInputType, setPriceInputType] = useState<'daily' | 'total'>('daily');

  // 실시간 총 금액 계산
  const calculateTotalAmount = useCallback(() => {
    const inputAmount = parseInt(formData.dailyBudget.replace(/,/g, '') || '0');
    const guaranteeDays = parseInt(campaign?.guarantee_count?.toString() || '0'); // 캠페인의 보장 일수 사용

    if (priceInputType === 'daily') {
      return inputAmount * guaranteeDays; // 보장 일수로 계산
    } else {
      return inputAmount;
    }
  }, [formData.dailyBudget, campaign?.guarantee_count, priceInputType]);

  // 일별 단가 계산 (총 단가 입력 시)
  const calculateDailyAmount = useCallback(() => {
    if (priceInputType === 'total') {
      const totalAmount = parseInt(formData.dailyBudget.replace(/,/g, '') || '0');
      const guaranteeDays = parseInt(campaign?.guarantee_count?.toString() || '1'); // 캠페인의 보장 일수 사용
      return Math.round(totalAmount / guaranteeDays);
    }
    return parseInt(formData.dailyBudget.replace(/,/g, '') || '0');
  }, [formData.dailyBudget, campaign?.guarantee_count, priceInputType]);

  // 최소 일별/회당 단가 계산
  const calculateMinDailyAmount = useCallback(() => {
    if (campaign?.min_guarantee_price && campaign?.guarantee_count) {
      const guaranteeCount = parseInt(campaign.guarantee_count);
      if (guaranteeCount > 0) {
        return smartCeil(parseInt(campaign.min_guarantee_price) / guaranteeCount);
      }
    }
    return null;
  }, [campaign?.min_guarantee_price, campaign?.guarantee_count]);

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
      // 최소 금액 계산
      let initialBudget = '';
      if (campaign.min_guarantee_price && campaign.guarantee_count) {
        const minTotalPrice = parseInt(campaign.min_guarantee_price);
        const guaranteeCount = parseInt(campaign.guarantee_count);
        
        if (priceInputType === 'daily') {
          // 일별 단가: 최소 총액을 보장 일수로 나눈 값 (올림 처리)
          const minDailyPrice = smartCeil(minTotalPrice / guaranteeCount);
          initialBudget = minDailyPrice.toLocaleString();
        } else {
          // 총 단가: 최소 총액 그대로
          initialBudget = minTotalPrice.toLocaleString();
        }
      }
      
      setFormData(prev => ({
        ...prev,
        dailyBudget: initialBudget
      }));
      // 캠페인이 변경될 때 validation 오류 초기화
      setValidationError('');
    }
  }, [campaign, priceInputType]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setValidationError('');

      // 유효성 검사
      if (!formData.dailyBudget) {
        setValidationError(priceInputType === 'daily'
          ? `${campaign?.guarantee_unit === '회' ? '회당' : '일별'} 단가를 입력해주세요.`
          : '총 단가를 입력해주세요.'
        );
        setLoading(false);
        return;
      }

      // 최소 가격 체크
      const inputAmount = parseInt(formData.dailyBudget.replace(/,/g, ''));
      if (priceInputType === 'daily') {
        const minDailyAmount = calculateMinDailyAmount();
        if (minDailyAmount && inputAmount < minDailyAmount) {
          setValidationError(`${campaign?.guarantee_unit === '회' ? '회당' : '일별'} 단가는 최소 ${minDailyAmount.toLocaleString()}원 이상이어야 합니다.`);
          setLoading(false);
          return;
        }
      } else {
        // 총 단가인 경우 최소 총액 체크
        if (campaign?.min_guarantee_price && inputAmount < parseInt(campaign.min_guarantee_price)) {
          setValidationError(`총 단가는 최소 ${parseInt(campaign.min_guarantee_price).toLocaleString()}원 이상이어야 합니다.`);
          setLoading(false);
          return;
        }
      }

      // 목표 순위는 캠페인 설정값을 사용하므로 별도 검증 불필요

      // 작업기간과 보장 일수는 캠페인 설정값 사용
      const guaranteePeriod = campaign?.guarantee_period;
      const guaranteeCount = parseInt(campaign?.guarantee_count?.toString() || '0');

      // 캠페인 설정값 검증
      if (!guaranteePeriod) {
        setValidationError('캠페인에 작업기간이 설정되지 않았습니다.');
        setLoading(false);
        return;
      }

      if (!guaranteeCount || guaranteeCount < 1) {
        setValidationError('캠페인에 보장 일수가 설정되지 않았습니다.');
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
        })),
        // 수동 입력인 경우 추가 정보 포함
        ...(keywordDetails[0]?.id === -1 && keywordDetails[0]?.inputData ? {
          is_manual_input: true,
          mid: keywordDetails[0].inputData.mid || '',
          url: keywordDetails[0].inputData.url || '',
          mainKeyword: keywordDetails[0].mainKeyword || '',
          keyword1: keywordDetails[0].inputData.keyword1 || '',
          keyword2: keywordDetails[0].inputData.keyword2 || '',
          keyword3: keywordDetails[0].inputData.keyword3 || ''
        } : {})
      };

      // 견적 요청 생성 - inputAmount는 이미 위에서 선언됨
      const dailyBudget = priceInputType === 'total'
        ? Math.floor(inputAmount / guaranteeCount) // 보장 일수로 나눔
        : inputAmount;

      const { data, error } = await guaranteeSlotRequestService.createRequest({
        campaign_id: campaign.id,
        target_rank: campaign?.guarantee_unit === '회' ? 1 : (campaign?.target_rank || 1),
        guarantee_count: parseInt(guaranteeCount.toString()),
        guarantee_period: parseInt(guaranteePeriod.toString()), // 작업기간 추가
        initial_budget: dailyBudget, // 일별 금액으로 저장
        budget_type: priceInputType, // 입력 방식 추가
        keyword_id: (firstKeyword?.id && firstKeyword.id > 0) ? firstKeyword.id : undefined, // 첫 번째 키워드 ID (수동 입력인 경우 undefined)
        input_data: inputData,
        quantity: keywordDetails.reduce((sum, kd) => sum + (kd.workCount || 0), 0), // 총 작업수
        user_reason: formData.message, // 사용자 요청 사유
        additional_requirements: keywordDetails.map(kd => kd.mainKeyword).join(', ')
      }, userId);

      if (error) {
        throw error;
      }

      // 견적 요청 생성 성공 시 통합 메시지 생성
      if (data?.id) {
        try {
          // negotiationService import가 필요
          const { negotiationService } = await import('@/services/guaranteeSlotService');

          // 통합 메시지 생성
          const keywords = keywordDetails.map(kd => kd.mainKeyword).join(', ');
          let combinedMessage = '견적을 요청합니다.\n\n';
          
          // 희망 예산 정보만 표시
          let budgetInfo = '';
          let dailyAmount = 0;
          let totalAmountForMessage = 0;
          
          if (priceInputType === 'total') {
            // 총 단가로 입력한 경우
            const totalAmount = parseInt(formData.dailyBudget.replace(/,/g, ''));
            totalAmountForMessage = totalAmount;
            dailyAmount = Math.floor(totalAmount / guaranteeCount);
            budgetInfo = `희망 예산: 총 ${totalAmount.toLocaleString()}원`;
          } else {
            // 일별/회당 단가로 입력한 경우
            dailyAmount = parseInt(formData.dailyBudget.replace(/,/g, ''));
            totalAmountForMessage = dailyAmount * guaranteeCount;
            budgetInfo = `희망 예산: ${formData.dailyBudget}원/${campaign?.guarantee_unit || '일'} × ${guaranteeCount}${campaign?.guarantee_unit || '일'} (총 ${totalAmountForMessage.toLocaleString()}원)`;
          }
          
          combinedMessage += budgetInfo;
          combinedMessage += `\n제안구분: ${priceInputType === 'total' ? '총액' : '일별'}`;

          // 키워드 정보 추가
          if (keywords) {
            combinedMessage += `\n\n키워드: ${keywords}`;
          }

          // 사용자 요청사항이 있으면 추가
          if (formData.message) {
            combinedMessage += '\n\n요청사항: ' + formData.message;
          }

          // 통합 메시지를 price_proposal 타입으로 전송
          await negotiationService.createMessage(
            {
              request_id: data.id,
              message: combinedMessage,
              message_type: 'price_proposal',
              proposed_daily_amount: dailyAmount,
              proposed_guarantee_count: guaranteeCount,
              budget_type: priceInputType,
              proposed_total_amount: priceInputType === 'total' ? totalAmountForMessage : (dailyAmount * guaranteeCount),
              isFromDistributorPage: false
            },
            userId,
            'user'
          );
        } catch (messageError) {
          // 메시지 생성 실패는 무시하고 진행 (견적 요청은 이미 성공)
        }
      }

      toast.success('견적 요청이 성공적으로 접수되었습니다.');
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
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

                {/* 보장 요약 정보 */}
                {campaign?.guarantee_period && campaign?.guarantee_count && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">보장 요약:</span>
                    <span className="font-medium text-purple-600">
                      {campaign.guarantee_unit === '일'
                        ? `작업 시작 후 ${campaign.guarantee_period}일 안에 순위 ${campaign.target_rank || '__'}위권을 ${campaign.guarantee_count}일 이상 유지하도록 보장합니다.`
                        : `작업 시작 후 ${campaign.guarantee_period}일 안에 ${campaign.guarantee_count}회 이상 작업을 보장합니다.`
                      }
                    </span>
                  </div>
                )}

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

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">선택한 키워드:</span>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                    {keywordDetails.map((keyword, index) => (
                      <span key={index} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-md text-xs">
                        {keyword.mainKeyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 사용자 입력 필드 정보 */}
                {keywordDetails.some(kd => kd.inputData && Object.keys(kd.inputData).length > 0) && (
                  <div className="pt-2 mt-2 border-t border-purple-100 dark:border-purple-700">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">입력 정보:</div>
                    <div className="space-y-2">
                      {keywordDetails.map((keyword, index) => {
                        if (!keyword.inputData || Object.keys(keyword.inputData).length === 0) return null;

                        // 캠페인의 사용자 입력 필드 정의 가져오기
                        const userInputFields = campaign?.originalData?.add_info?.add_field || campaign?.userInputFields || [];

                        return (
                          <div key={index} className="text-xs bg-purple-50/50 dark:bg-purple-900/20 p-2 rounded">
                            <div className="font-medium text-purple-700 dark:text-purple-300 mb-1">
                              {keyword.mainKeyword}
                            </div>

                            {/* 정의된 순서대로 필드 표시 */}
                            {userInputFields.map((field: any) => {
                              const fieldName = field.fieldName;
                              const fieldDescription = field.description || fieldName;
                              const value = keyword.inputData[fieldName];

                              // 값이 없거나 제외할 필드면 표시하지 않음
                              if (!value || ['main_keyword', 'is_manual_input'].includes(fieldName)) return null;

                              // URL이 포함된 필드는 제외 (파일명 형식으로 이미 다른 필드에 표시됨)
                              if (String(value).includes('supabase.co/storage/') || String(value).startsWith('http')) return null;

                              // _fileName으로 끝나는 필드도 제외 (실제 파일명은 다른 필드에 있음)
                              if (fieldName.endsWith('_fileName')) return null;

                              return (
                                <div key={fieldName} className="flex gap-2">
                                  <span className="text-gray-500">{fieldName}({fieldDescription}):</span>
                                  <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{String(value)}</span>
                                </div>
                              );
                            })}

                            {/* userInputFields에 정의되지 않은 필드들 (예: url, mid, keyword1,2,3) */}
                            {keyword.inputData.url && !userInputFields.some((f: any) => f.fieldName === 'url') && (
                              <div className="flex gap-2">
                                <span className="text-gray-500">url(URL):</span>
                                <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{keyword.inputData.url}</span>
                              </div>
                            )}
                            {keyword.inputData.mid && !userInputFields.some((f: any) => f.fieldName === 'mid') && (
                              <div className="flex gap-2">
                                <span className="text-gray-500">mid(MID):</span>
                                <span className="text-gray-700 dark:text-gray-300">{keyword.inputData.mid}</span>
                              </div>
                            )}
                            {(keyword.inputData.keyword1 || keyword.inputData.keyword2 || keyword.inputData.keyword3) &&
                              !userInputFields.some((f: any) => ['keyword1', 'keyword2', 'keyword3'].includes(f.fieldName)) && (
                                <div className="flex gap-2">
                                  <span className="text-gray-500">keywords(추가 키워드):</span>
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {[keyword.inputData.keyword1, keyword.inputData.keyword2, keyword.inputData.keyword3]
                                      .filter(Boolean)
                                      .join(', ')}
                                  </span>
                                </div>
                              )}

                            {/* 정의되지 않은 나머지 필드들 */}
                            {Object.entries(keyword.inputData).map(([key, value]) => {
                              // 이미 표시했거나 제외할 필드들
                              if (['url', 'mid', 'keyword1', 'keyword2', 'keyword3', 'main_keyword', 'is_manual_input'].includes(key)) return null;
                              // userInputFields에 정의된 필드면 이미 표시했으므로 제외
                              if (userInputFields.some((f: any) => f.fieldName === key)) return null;
                              if (!value) return null;

                              // URL이 포함된 필드는 제외 (파일명 형식으로 이미 다른 필드에 표시됨)
                              if (String(value).includes('supabase.co/storage/') || String(value).startsWith('http')) return null;

                              // _fileName으로 끝나는 필드도 제외 (실제 파일명은 다른 필드에 있음)
                              if (key.endsWith('_fileName')) return null;

                              return (
                                <div key={key} className="flex gap-2">
                                  <span className="text-gray-500">{key}:</span>
                                  <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{String(value)}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 견적 요청 폼 */}
            <div className="space-y-4">
              {/* 일별 단가 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    {priceInputType === 'daily'
                      ? `${campaign?.guarantee_unit === '회' ? '회당' : '일별'} 단가`
                      : '총 단가'
                    } <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setPriceInputType('daily')}
                      className={`px-2 py-1 text-xs rounded-l-md transition-colors ${priceInputType === 'daily'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      {campaign?.guarantee_unit === '회' ? '회당' : '일별'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriceInputType('total')}
                      className={`px-2 py-1 text-xs rounded-r-md transition-colors ${priceInputType === 'total'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      총액
                    </button>
                  </div>
                </div>
                <Input
                  type="text"
                  value={formData.dailyBudget}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, dailyBudget: formatCurrency(value) });
                    setValidationError('');
                  }}
                  placeholder={priceInputType === 'daily'
                    ? `${campaign?.guarantee_unit === '회' ? '회당' : '일별'} 금액을 입력하세요`
                    : '총 금액을 입력하세요'
                  }
                />
                <div className="text-xs text-gray-500 mt-1 space-y-1">
                  <p>* 실제 금액은 판매자와 협의를 통해 결정됩니다</p>
                  {priceInputType === 'daily' && calculateMinDailyAmount() && (
                    <p>* 최소: <span className="font-semibold text-purple-600 dark:text-purple-400">{calculateMinDailyAmount()?.toLocaleString()}원</span> 이상</p>
                  )}
                  {priceInputType === 'total' && campaign?.min_guarantee_price && (
                    <p>* 최소: <span className="font-semibold text-purple-600 dark:text-purple-400">{parseInt(campaign.min_guarantee_price).toLocaleString()}원</span> 이상</p>
                  )}
                </div>
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

            {/* 예상 금액 - 안내사항 위로 이동 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <KeenIcon icon="calculator" className="size-4 text-gray-600" />
                예상 금액
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {priceInputType === 'daily'
                      ? `${campaign?.guarantee_unit === '회' ? '회당' : '일별'} 단가:`
                      : '총 단가:'
                    }
                  </span>
                  <span className="font-medium">{formData.dailyBudget || '0'}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {priceInputType === 'daily' ? '× 보장 일수:' : '보장 일수:'}
                  </span>
                  <span className="font-medium">{campaign?.guarantee_count || '0'}{campaign?.guarantee_unit || '일'}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
                  {priceInputType === 'daily' ? (
                    <>
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
                          <span className="hidden md:inline">{formatAmountDesktop(smartCeil(calculateTotalAmount() * 1.1))}</span>
                          <span className="md:hidden">{formatAmountMobile(smartCeil(calculateTotalAmount() * 1.1))}</span>
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">총 금액 (VAT 제외):</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          <span className="hidden md:inline">{formatAmountDesktop(parseInt(formData.dailyBudget.replace(/,/g, '') || '0'))}</span>
                          <span className="md:hidden">{formatAmountMobile(parseInt(formData.dailyBudget.replace(/,/g, '') || '0'))}</span>
                        </span>
                      </div>
                      <div className="flex justify-between text-purple-600 dark:text-purple-400">
                        <span>총 금액 (VAT 포함):</span>
                        <span className="font-semibold">
                          <span className="hidden md:inline">{formatAmountDesktop(smartCeil(parseInt(formData.dailyBudget.replace(/,/g, '') || '0') * 1.1))}</span>
                          <span className="md:hidden">{formatAmountMobile(smartCeil(parseInt(formData.dailyBudget.replace(/,/g, '') || '0') * 1.1))}</span>
                        </span>
                      </div>
                    </>
                  )}
                </div>
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
              disabled={loading || !formData.dailyBudget}
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