import React, { useState, useEffect } from 'react';
import { DefaultTooltip } from '@/components/tooltip';

interface WithdrawGlobalFormProps {
  settings: any;
  onSave: (settings: any) => Promise<boolean>;
}

// 천 단위 콤마 포맷팅 함수
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// 콤마 제거 함수
const removeCommas = (str: string): string => {
  return str.replace(/,/g, "");
};

const WithdrawGlobalForm: React.FC<WithdrawGlobalFormProps> = ({ settings, onSave }) => {
  const [savingGlobal, setSavingGlobal] = useState<boolean>(false);
  const [globalSettings, setGlobalSettings] = useState(settings);

  // 화면에 표시할 포맷된 값
  const [formattedValues, setFormattedValues] = useState({
    min_request_amount: '',
    min_request_percentage: ''
  });

  // 초기 로딩 시 값 포맷팅
  useEffect(() => {
    if (settings) {
      setGlobalSettings(settings);
      setFormattedValues({
        min_request_amount: formatNumber(settings.min_request_amount),
        min_request_percentage: settings.min_request_percentage.toString()
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // 콤마 제거 후 숫자값만 추출
    const numericValue = removeCommas(value);

    // 빈 문자열이거나 숫자가 아닌 경우 처리
    if (numericValue === '' || isNaN(Number(numericValue))) {
      setFormattedValues({
        ...formattedValues,
        [name]: numericValue === '' ? '' : formattedValues[name as keyof typeof formattedValues]
      });
      return;
    }

    // 숫자 값 업데이트
    const numberValue = Number(numericValue);
    setGlobalSettings({
      ...globalSettings,
      [name]: numberValue
    });

    // 수수료는 콤마 없이, 금액은 콤마 포맷팅
    setFormattedValues({
      ...formattedValues,
      [name]: name === 'min_request_amount' ? formatNumber(numberValue) : numericValue
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGlobal(true);

    try {
      // 저장 시에는 포맷팅 없는 숫자 값으로 전달
      const success = await onSave(globalSettings);
    } catch (error) {
      
    } finally {
      setSavingGlobal(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* 최소 출금액 설정 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <label className="text-sm font-medium text-card-foreground mb-1">
              최소 출금 금액
            </label>
            <DefaultTooltip title="최소 출금액 이상부터 출금이 가능합니다. 이 금액보다 적은 금액은 출금 신청할 수 없습니다." arrow placement="top">
              <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary cursor-help">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
            </DefaultTooltip>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-muted-foreground sm:text-sm">₩</span>
            </div>
            <input
              type="text"
              name="min_request_amount"
              placeholder="예: 10,000"
              className="pl-8 block w-full p-2 border border-border dark:border-gray-600 bg-background text-foreground rounded-md focus:ring-primary focus:border-primary h-10"
              value={formattedValues.min_request_amount}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* 출금 수수료 비율 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <label className="text-sm font-medium text-card-foreground mb-1">
              출금 수수료 비율
            </label>
            <DefaultTooltip title="출금 시 적용되는 수수료 비율(%)입니다. 출금 금액에서 이 비율만큼 수수료가 차감됩니다." arrow placement="top">
              <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary cursor-help">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
            </DefaultTooltip>
          </div>
          <div className="relative">
            <input
              type="number"
              name="min_request_percentage"
              placeholder="예: 5"
              className="block w-full p-2 border border-border dark:border-gray-600 bg-background text-foreground rounded-md focus:ring-primary focus:border-primary pr-12 h-10"
              value={formattedValues.min_request_percentage}
              onChange={handleChange}
              min="0"
              max="100"
              step="1"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-muted-foreground sm:text-sm">%</span>
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex justify-center items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors h-10"
            disabled={savingGlobal}
          >
            {savingGlobal ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                저장 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                전역 설정 저장
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">
        <p className="flex items-center">
          <svg className="w-4 h-4 mr-2 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          전역 설정은 개별 사용자 설정이 없는 경우에 적용됩니다.
        </p>
      </div>
    </form>
  );
};

export default WithdrawGlobalForm;