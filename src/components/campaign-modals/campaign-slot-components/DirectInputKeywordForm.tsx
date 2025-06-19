import React, { useState } from 'react';
import { KeenIcon } from '@/components';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FieldType } from '../types';
import { useKeywordFieldConfig } from '@/pages/keyword/hooks/useKeywordFieldConfig';

interface DirectInputKeywordFormProps {
  slotData: any;
  setSlotData: (data: any) => void;
  selectedCampaign: any;
  getAdditionalFields: (campaign: any) => any[];
  resetTrigger?: number; // 초기화 트리거
}

export const DirectInputKeywordForm: React.FC<DirectInputKeywordFormProps> = ({
  slotData,
  setSlotData,
  selectedCampaign,
  getAdditionalFields,
  resetTrigger
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({});
  
  // resetTrigger가 변경되면 uploadedFiles 초기화 및 입력 필드 초기화
  React.useEffect(() => {
    if (resetTrigger && resetTrigger > 0) {
      setUploadedFiles({});
      // input_data의 모든 필드를 초기화
      setSlotData((prev: any) => ({
        ...prev,
        input_data: {},
        mainKeyword: '',
        keywords: []
      }));
    }
  }, [resetTrigger, setSlotData]);
  
  // DB에서 필드 설정 가져오기
  const { orderedFields, getFieldConfig, isHidden } = useKeywordFieldConfig(
    selectedCampaign?.service_type
  );
  
  // 키워드 관련 필드 필터링 (description, 상태, 날짜 제외)
  const keywordFields = orderedFields.filter(field => 
    !field.hidden && 
    field.fieldName !== 'description' &&
    field.fieldName !== 'status' &&
    field.fieldName !== 'created_at' &&
    field.fieldName !== 'actions' &&
    field.fieldName !== '최소 구매수' &&  // 기본 필드는 따로 처리
    field.fieldName !== '작업일'          // 기본 필드는 따로 처리
  );

  const handleFieldChange = (fieldName: string, value: string) => {
    setSlotData((prev: any) => {
      const newData = {
        ...prev,
        input_data: {
          ...prev.input_data,
          [fieldName]: value
        }
      };
      
      // main_keyword 필드는 별도로 처리
      if (fieldName === 'main_keyword') {
        newData.mainKeyword = value;
      }
      
      // keyword1, keyword2, keyword3를 keywords 배열로 변환
      if (fieldName.startsWith('keyword')) {
        const keywords = [];
        if (newData.input_data.keyword1) keywords.push(newData.input_data.keyword1);
        if (newData.input_data.keyword2) keywords.push(newData.input_data.keyword2);
        if (newData.input_data.keyword3) keywords.push(newData.input_data.keyword3);
        newData.keywords = keywords;
      }
      
      return newData;
    });
  };

  return (
    <div className="w-full">
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-4">
        {/* DB 설정 기반 키워드 필드 */}
        {keywordFields.map((field) => (
          <div key={field.fieldName}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {field.label || field.fieldName} 
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <Input
              type="text"
              value={
                field.fieldName === 'main_keyword' 
                  ? (slotData.mainKeyword || slotData.input_data?.main_keyword || '')
                  : (slotData.input_data?.[field.fieldName] || '')
              }
              onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
              placeholder={field.placeholder || `${field.label || field.fieldName}을(를) 입력하세요`}
              className="w-full"
            />
            {field.tooltip && (
              <p className="text-xs text-gray-500 mt-1">{field.tooltip}</p>
            )}
          </div>
        ))}

        {/* 기본 필드 (최소 구매수, 작업일) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              최소 구매수 <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={slotData.minimum_purchase || ''}
              onChange={(e) => setSlotData((prev: any) => ({
                ...prev,
                minimum_purchase: parseInt(e.target.value) || 0
              }))}
              placeholder="최소 구매수"
              min={selectedCampaign?.min_quantity || 1}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              작업일 <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={slotData.work_days || ''}
              onChange={(e) => setSlotData((prev: any) => ({
                ...prev,
                work_days: parseInt(e.target.value) || 0
              }))}
              placeholder="작업일"
              min={1}
              className="w-full"
            />
          </div>
        </div>

        {/* 서비스별 추가 필드 */}
        {selectedCampaign && getAdditionalFields(selectedCampaign).map((field, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {field.fieldName} {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            {field.description && (
              <p className="text-xs text-gray-500 mb-1">{field.description}</p>
            )}
            
            {field.fieldType === FieldType.ENUM && field.enumOptions ? (
              /* 드롭박스 필드 */
              <select
                value={slotData.input_data?.[field.fieldName] || ''}
                onChange={(e) => setSlotData((prev: any) => ({
                  ...prev,
                  input_data: {
                    ...prev.input_data,
                    [field.fieldName]: e.target.value
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">선택하세요</option>
                {field.enumOptions.map((option: string) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : field.fieldType === FieldType.INTEGER ? (
              /* 숫자 입력 필드 */
              <Input
                type="text"
                value={slotData.input_data?.[field.fieldName] || ''}
                onChange={(e) => {
                  // 숫자가 아닌 문자 모두 제거
                  const value = e.target.value.replace(/[^\d]/g, '');
                  setSlotData((prev: any) => ({
                    ...prev,
                    input_data: {
                      ...prev.input_data,
                      [field.fieldName]: value
                    }
                  }));
                }}
                placeholder={`${field.fieldName}을(를) 입력하세요 (숫자만)`}
                className="w-full"
                inputMode="numeric"
                pattern="[0-9]*"
              />
            ) : field.fieldType === FieldType.FILE ? (
              /* 파일 업로드 필드 */
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id={`file-${field.fieldName}`}
                    accept={field.fileOptions?.acceptedTypes?.join(',') || 'image/*'}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // 파일 크기 체크
                        const maxSize = (field.fileOptions?.maxSizeMB || 10) * 1024 * 1024;
                        if (file.size > maxSize) {
                          alert(`파일 크기는 ${field.fileOptions?.maxSizeMB || 10}MB를 초과할 수 없습니다.`);
                          e.target.value = '';
                          return;
                        }
                        
                        setUploadedFiles(prev => ({ ...prev, [field.fieldName]: file }));
                        setSlotData((prev: any) => ({
                          ...prev,
                          input_data: {
                            ...prev.input_data,
                            [field.fieldName]: file.name,
                            [`${field.fieldName}_file`]: file
                          }
                        }));
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById(`file-${field.fieldName}`)?.click()}
                    className="flex items-center gap-2"
                  >
                    <KeenIcon icon="file-up" className="size-4" />
                    파일 선택
                  </Button>
                  {uploadedFiles[field.fieldName] && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <KeenIcon icon="file" className="size-4" />
                      <span>{uploadedFiles[field.fieldName]?.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUploadedFiles(prev => ({ ...prev, [field.fieldName]: null }));
                          setSlotData((prev: any) => ({
                            ...prev,
                            input_data: {
                              ...prev.input_data,
                              [field.fieldName]: '',
                              [`${field.fieldName}_file`]: null
                            }
                          }));
                        }}
                        className="p-1 hover:bg-red-50 hover:text-red-600"
                      >
                        <KeenIcon icon="trash" className="size-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {field.fileOptions?.acceptedTypes && (
                  <p className="text-xs text-gray-500">
                    허용된 파일 형식: {field.fileOptions.acceptedTypes.join(', ')}
                  </p>
                )}
              </div>
            ) : (
              /* 일반 텍스트 입력 필드 */
              <Input
                type="text"
                value={slotData.input_data?.[field.fieldName] || ''}
                onChange={(e) => setSlotData((prev: any) => ({
                  ...prev,
                  input_data: {
                    ...prev.input_data,
                    [field.fieldName]: e.target.value
                  }
                }))}
                placeholder={`${field.fieldName}을(를) 입력하세요`}
                className="w-full"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};