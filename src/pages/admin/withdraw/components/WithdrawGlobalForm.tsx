import React, { useState, useEffect } from 'react';

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
      console.error('Error saving global settings:', error);
    } finally {
      setSavingGlobal(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 그리드 레이아웃 적용 - 3개의 동일한 열로 변경 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end gap-6">
        {/* 첫 번째 인풋 */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text text-sm font-medium text-foreground">최소 출금액</span>
          </label>
          <input
            type="text"
            name="min_request_amount"
            className="input input-bordered w-full focus:ring-2 focus:ring-primary bg-card h-10"
            value={formattedValues.min_request_amount}
            onChange={handleChange}
          />
          <label className="label">
            <span className="label-text-alt text-muted-foreground">최소 출금액 이상부터 출금 가능합니다.</span>
          </label>
        </div>

        {/* 두 번째 인풋 */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text text-sm font-medium text-foreground">출금 수수료 비율(%)</span>
          </label>
          <input
            type="text"
            name="min_request_percentage"
            className="input input-bordered w-full focus:ring-2 focus:ring-primary bg-card h-10"
            value={formattedValues.min_request_percentage}
            onChange={handleChange}
          />
          <label className="label">
            <span className="label-text-alt text-muted-foreground">출금 시 적용되는 수수료 비율입니다.</span>
          </label>
        </div>

        {/* 저장 버튼 - 오른쪽 정렬 */}
        <div className="form-control">
          <button
            type="submit"
            className="btn btn-primary h-20 px-6"
            disabled={savingGlobal}
          >
            {savingGlobal ? (
              <>
                <span className="loading loading-spinner loading-xs mr-2"></span>
                저장 중...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                저장
              </>
            )}
          </button>
        </div>

        {/* 빈 공간 두 개 추가 */}
        <div className="hidden lg:block"></div>
      </div>
    </form>
  );
};

export default WithdrawGlobalForm;