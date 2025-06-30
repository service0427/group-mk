import React from 'react';
import { RefundSettings } from '@/types/refund.types';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { KeenIcon } from '@/components';

interface RefundSettingsFormProps {
  settings: RefundSettings;
  onChange: (settings: RefundSettings) => void;
  disabled?: boolean;
  isModal?: boolean;
}

export const RefundSettingsForm: React.FC<RefundSettingsFormProps> = ({
  settings,
  onChange,
  disabled = false,
  isModal = false
}) => {
  const handleToggleRefund = (checked: boolean) => {
    onChange({
      ...settings,
      enabled: checked
    });
  };

  const handleTypeChange = (type: RefundSettings['type']) => {
    const newSettings: RefundSettings = {
      ...settings,
      type
    };

    // 타입별 기본값 설정
    if (type === 'delayed') {
      newSettings.delay_days = settings.delay_days || 1;
    } else {
      delete newSettings.delay_days;
    }

    onChange(newSettings);
  };


  const handleRulesChange = (field: keyof RefundSettings['refund_rules'], value: number | boolean) => {
    onChange({
      ...settings,
      refund_rules: {
        ...settings.refund_rules,
        [field]: value
      }
    });
  };

  const handleDelayDaysChange = (value: string) => {
    const days = parseInt(value) || 0;
    onChange({
      ...settings,
      delay_days: Math.max(0, Math.min(30, days))
    });
  };


  return (
    <table className="min-w-full divide-y divide-border">
      <tbody className="divide-y divide-border">
        {/* 환불 허용 */}
        <tr>
          <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[200px]">
            환불 허용
          </th>
          <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
            <div className="flex items-center gap-3">
              <Switch
                id="refund-enabled"
                checked={settings.enabled}
                onCheckedChange={handleToggleRefund}
                disabled={disabled}
              />
              <p className="text-xs sm:text-sm text-muted-foreground">
                이 캠페인의 환불 가능 여부를 설정합니다
              </p>
            </div>
          </td>
        </tr>

        {settings.enabled && (
          <>
            {/* 환불 시점 */}
            <tr>
              <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[200px]">
                환불 시점
              </th>
              <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                <div className="space-y-3">
                  {isModal ? (
                    <select
                      value={settings.type}
                      onChange={(e) => handleTypeChange(e.target.value as RefundSettings['type'])}
                      className="select select-bordered select-sm w-full max-w-xs"
                      disabled={disabled}
                    >
                      <option value="immediate">즉시 환불</option>
                      <option value="delayed">지연 환불</option>
                    </select>
                  ) : (
                    <select
                      value={settings.type}
                      onChange={(e) => handleTypeChange(e.target.value as RefundSettings['type'])}
                      className="select select-bordered select-sm w-full max-w-xs"
                      disabled={disabled}
                    >
                      <option value="immediate">즉시 환불</option>
                      <option value="delayed">지연 환불</option>
                    </select>
                  )}

                  {/* 지연 환불 옵션 */}
                  {settings.type === 'delayed' && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={settings.delay_days || 1}
                        onChange={(e) => handleDelayDaysChange(e.target.value)}
                        className="w-20"
                        min="1"
                        max="30"
                        disabled={disabled}
                      />
                      <span className="text-sm ml-2">일 후 환불</span>
                    </div>
                  )}

                </div>
              </td>
            </tr>


            {/* 최소 사용 일수 */}
            <tr>
              <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[200px]">
                최소 사용 일수
              </th>
              <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.refund_rules.min_usage_days}
                    onChange={(e) => handleRulesChange('min_usage_days', parseInt(e.target.value) || 0)}
                    className="w-20"
                    min="0"
                    max="365"
                    disabled={disabled}
                  />
                  <span className="text-sm ml-2">일</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    (이 기간 이상 사용해야 환불 가능)
                  </span>
                </div>
              </td>
            </tr>

            {/* 최대 환불 가능 일수 */}
            <tr>
              <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[200px]">
                최대 환불 가능 일수
              </th>
              <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.refund_rules.max_refund_days}
                    onChange={(e) => handleRulesChange('max_refund_days', parseInt(e.target.value) || 7)}
                    className="w-20"
                    min="1"
                    max="365"
                    disabled={disabled}
                  />
                  <span className="text-sm ml-2">일</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    (사용 시작 후 이 기간 내에만 환불 가능)
                  </span>
                </div>
              </td>
            </tr>

            {/* 일할 계산 환불 */}
            <tr>
              <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[200px]">
                일할 계산 환불
              </th>
              <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                <div className="flex items-center gap-3">
                  <Switch
                    id="partial-refund"
                    checked={settings.refund_rules.partial_refund}
                    onCheckedChange={(checked) => handleRulesChange('partial_refund', checked)}
                    disabled={disabled}
                  />
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    사용한 기간을 제외한 금액만 환불 (실제 환불 금액은 작업량과 상황에 따라 결정)
                  </p>
                </div>
              </td>
            </tr>

            {/* 환불 정책 요약 */}
            <tr>
              <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[200px]">
                환불 정책 요약
              </th>
              <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <ul className="space-y-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <KeenIcon icon="check" className="size-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>
                        환불 시점: {settings.type === 'immediate' ? '즉시' : `${settings.delay_days}일 후`}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <KeenIcon icon="check" className="size-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>
                        사용 {settings.refund_rules.min_usage_days}일 이상, {settings.refund_rules.max_refund_days}일 이내 환불 가능
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <KeenIcon icon="check" className="size-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>
                        {settings.refund_rules.partial_refund ? '일할 계산 환불' : '전체 기간 환불'}
                      </span>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          </>
        )}
      </tbody>
    </table>
  );
};