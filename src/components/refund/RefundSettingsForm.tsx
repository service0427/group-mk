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
      delete newSettings.cutoff_time;
    } else if (type === 'cutoff_based') {
      newSettings.cutoff_time = settings.cutoff_time || '14:00';
      delete newSettings.delay_days;
    } else {
      delete newSettings.delay_days;
      delete newSettings.cutoff_time;
    }

    onChange(newSettings);
  };

  const handleRequiresApprovalChange = (checked: boolean) => {
    onChange({
      ...settings,
      requires_approval: checked
    });
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

  const handleCutoffTimeChange = (value: string) => {
    onChange({
      ...settings,
      cutoff_time: value
    });
  };

  return (
    <table className="min-w-full divide-y divide-border">
      <tbody className="divide-y divide-border">
        {/* 환불 허용 */}
        <tr>
          <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
            환불 허용
          </th>
          <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                이 캠페인의 환불 가능 여부를 설정합니다
              </p>
              <Switch
                id="refund-enabled"
                checked={settings.enabled}
                onCheckedChange={handleToggleRefund}
                disabled={disabled}
              />
            </div>
          </td>
        </tr>

        {settings.enabled && (
          <>
            {/* 환불 시점 */}
            <tr>
              <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                환불 시점
              </th>
              <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
                <div className="space-y-3">
                  {isModal ? (
                    <select
                      value={settings.type}
                      onChange={(e) => handleTypeChange(e.target.value as RefundSettings['type'])}
                      className="w-full h-10 px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                      disabled={disabled}
                    >
                      <option value="immediate">즉시 환불</option>
                      <option value="delayed">지연 환불</option>
                      <option value="cutoff_based">마감시간 기준 환불</option>
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
                      <option value="cutoff_based">마감시간 기준 환불</option>
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
                      <span className="text-sm">일 후 환불</span>
                    </div>
                  )}

                  {/* 마감시간 기준 환불 옵션 */}
                  {settings.type === 'cutoff_based' && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">마감시간:</span>
                      <Input
                        type="time"
                        value={settings.cutoff_time || '14:00'}
                        onChange={(e) => handleCutoffTimeChange(e.target.value)}
                        className="w-32"
                        disabled={disabled}
                      />
                      <span className="text-sm text-muted-foreground">이후 요청은 다음날 처리</span>
                    </div>
                  )}
                </div>
              </td>
            </tr>

            {/* 총판 승인 필요 */}
            <tr>
              <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                총판 승인 필요
              </th>
              <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    환불 시 총판의 승인이 필요한지 설정합니다
                  </p>
                  <Switch
                    id="requires-approval"
                    checked={settings.requires_approval}
                    onCheckedChange={handleRequiresApprovalChange}
                    disabled={disabled}
                  />
                </div>
              </td>
            </tr>

            {/* 최소 사용 일수 */}
            <tr>
              <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                최소 사용 일수
              </th>
              <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
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
                  <span className="text-sm">일</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    (이 기간 이상 사용해야 환불 가능)
                  </span>
                </div>
              </td>
            </tr>

            {/* 최대 환불 가능 일수 */}
            <tr>
              <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                최대 환불 가능 일수
              </th>
              <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
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
                  <span className="text-sm">일</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    (사용 시작 후 이 기간 내에만 환불 가능)
                  </span>
                </div>
              </td>
            </tr>

            {/* 일할 계산 환불 */}
            <tr>
              <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                일할 계산 환불
              </th>
              <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    사용한 기간을 제외한 금액만 환불 (실제 환불 금액은 작업량과 상황에 따라 결정)
                  </p>
                  <Switch
                    id="partial-refund"
                    checked={settings.refund_rules.partial_refund}
                    onCheckedChange={(checked) => handleRulesChange('partial_refund', checked)}
                    disabled={disabled}
                  />
                </div>
              </td>
            </tr>

            {/* 환불 정책 요약 */}
            <tr>
              <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                환불 정책 요약
              </th>
              <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <KeenIcon icon="check" className="size-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>
                        환불 시점: {settings.type === 'immediate' ? '즉시' : 
                          settings.type === 'delayed' ? `${settings.delay_days}일 후` : 
                          `마감시간(${settings.cutoff_time}) 기준`}
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
                    {settings.requires_approval && (
                      <li className="flex items-start gap-2">
                        <KeenIcon icon="information-2" className="size-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-orange-600 dark:text-orange-400">총판 승인 필요</span>
                      </li>
                    )}
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