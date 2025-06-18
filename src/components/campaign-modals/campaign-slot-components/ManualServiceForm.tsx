import React from 'react';
import { KeenIcon } from '@/components';
import { FieldType } from '../types';

interface ManualServiceFormProps {
  selectedCampaign: any;
  slotData: any;
  setSlotData: React.Dispatch<React.SetStateAction<any>>;
  getAdditionalFields: (campaign: any) => any[];
}

export const ManualServiceForm: React.FC<ManualServiceFormProps> = ({
  selectedCampaign,
  slotData,
  setSlotData,
  getAdditionalFields
}) => {
  return (
    <div className="w-full space-y-4 flex-1 flex flex-col min-h-0">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <KeenIcon icon="information-2" className="text-amber-600 dark:text-amber-400 size-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              직접 입력 모드
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              필요한 정보를 직접 입력하여 서비스를 신청할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
      
      {/* 추가 필드 입력 영역 */}
      <div className="border rounded-lg p-6 space-y-4 bg-white dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-foreground mb-4">필수 입력 정보</h3>
        
        {/* 기본 필드 (최소 구매수, 작업일) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              최소 구매수 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={slotData.minimum_purchase || selectedCampaign?.min_quantity || ''}
              onChange={(e) => setSlotData((prev: any) => ({ 
                ...prev, 
                minimum_purchase: e.target.value === '' ? undefined : parseInt(e.target.value) || undefined 
              }))}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="최소 구매수를 입력하세요"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              작업일 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={slotData.work_days || 1}
              onChange={(e) => setSlotData((prev: any) => ({ 
                ...prev, 
                work_days: e.target.value === '' ? undefined : parseInt(e.target.value) || undefined 
              }))}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="작업일을 입력하세요"
            />
          </div>
        </div>
        
        {/* 서비스별 추가 필드 */}
        {selectedCampaign && getAdditionalFields(selectedCampaign).length > 0 && (
          <>
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium text-foreground mb-3">추가 정보</h4>
              <div className="space-y-4">
                {getAdditionalFields(selectedCampaign).map((field) => (
                  <div key={field.fieldName} className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {field.fieldName} {field.isRequired && <span className="text-red-500">*</span>}
                    </label>
                    {field.fieldType === FieldType.TEXT && (
                      <input
                        type="text"
                        value={slotData.input_data?.[field.fieldName] || ''}
                        onChange={(e) => setSlotData((prev: any) => ({
                          ...prev,
                          input_data: {
                            ...prev.input_data,
                            [field.fieldName]: e.target.value
                          }
                        }))}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder={`${field.fieldName}을(를) 입력하세요`}
                        required={field.isRequired}
                      />
                    )}
                    {field.fieldType === FieldType.TEXTAREA && (
                      <textarea
                        value={slotData.input_data?.[field.fieldName] || ''}
                        onChange={(e) => setSlotData((prev: any) => ({
                          ...prev,
                          input_data: {
                            ...prev.input_data,
                            [field.fieldName]: e.target.value
                          }
                        }))}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={3}
                        placeholder={`${field.fieldName}을(를) 입력하세요`}
                        required={field.isRequired}
                      />
                    )}
                    {field.fieldType === FieldType.INTEGER && (
                      <input
                        type="number"
                        value={slotData.input_data?.[field.fieldName] || ''}
                        onChange={(e) => setSlotData((prev: any) => ({
                          ...prev,
                          input_data: {
                            ...prev.input_data,
                            [field.fieldName]: e.target.value
                          }
                        }))}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder={`${field.fieldName}을(를) 입력하세요`}
                        required={field.isRequired}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};