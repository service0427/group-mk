import React, { useState } from 'react';
import { KeenIcon } from '@/components';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FieldType } from '../types';
import { useKeywordFieldConfig } from '@/pages/keyword/hooks/useKeywordFieldConfig';
import { useAuthContext } from '@/auth/useAuthContext';
import { supabase } from '@/supabase';
import { SpreadsheetGrid } from './SpreadsheetGrid';

interface DirectInputKeywordFormProps {
  slotData: any;
  setSlotData: (data: any) => void;
  selectedCampaign: any;
  getAdditionalFields: (campaign: any) => any[];
  resetTrigger?: number; // 초기화 트리거
  onDataChange?: () => void; // 데이터 변경 콜백 추가
  showAlert?: (title: string, description: string, success?: boolean) => void; // alert 함수 추가
  onClose?: () => void; // 모달 닫기 콜백 추가
}

export const DirectInputKeywordForm: React.FC<DirectInputKeywordFormProps> = ({
  slotData,
  setSlotData,
  selectedCampaign,
  getAdditionalFields,
  resetTrigger,
  onDataChange,
  showAlert,
  onClose
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({});
  const [useSpreadsheet, setUseSpreadsheet] = useState(false); // 기본값을 false로 변경
  const { currentUser } = useAuthContext();
  
  // resetTrigger가 변경되면 uploadedFiles 초기화 및 입력 필드 초기화
  React.useEffect(() => {
    if (resetTrigger && resetTrigger > 0) {
      setUploadedFiles({});
      // 스프레드시트 모드는 유지하고 값만 초기화
      // input_data의 모든 필드를 초기화
      setSlotData((prev: any) => ({
        ...prev,
        input_data: {},
        mainKeyword: '',
        keywords: [],
        minimum_purchase: selectedCampaign?.min_quantity || 1,
        work_days: 1,
        total_purchase: 0,
        total_work_days: 0,
        keywordDetails: [],
        hasPartiallyFilledRows: false,
        partiallyFilledRows: []
      }));
    }
  }, [resetTrigger, setSlotData, selectedCampaign]);
  
  // useSpreadsheet 상태가 변경될 때 데이터 초기화
  React.useEffect(() => {
    if (selectedCampaign) {
      // 보장형 캠페인인 경우 스프레드시트 모드 비활성화
      if (selectedCampaign.slot_type === 'guarantee' && useSpreadsheet) {
        setUseSpreadsheet(false);
      }
      
      // 모드 전환 시 데이터 초기화
      setSlotData((prev: any) => ({
        ...prev,
        input_data: {},
        mainKeyword: '',
        keywords: [],
        minimum_purchase: selectedCampaign?.min_quantity || 1,
        work_days: selectedCampaign?.slot_type === 'guarantee' ? (selectedCampaign?.guarantee_period || 1) : 1,
        total_purchase: 0,
        total_work_days: 0,
        keywordDetails: [],
        hasPartiallyFilledRows: false,
        partiallyFilledRows: []
      }));
    }
  }, [selectedCampaign?.id, selectedCampaign?.slot_type, useSpreadsheet]);
  
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
      
      // main_keyword 필드 처리 제거
      
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
  
  // 파일을 Supabase에 업로드하는 함수
  const uploadFileToSupabase = async (file: File, field: any) => {
    try {
      // 파일명을 안전하게 처리
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `campaign-files/${currentUser?.id || 'anonymous'}/${safeFileName}`;

      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from('campaign-files')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600'
        });

      if (error) {
        alert('파일 업로드 중 오류가 발생했습니다.');
        return;
      }

      // 공개 URL 가져오기
      const { data: urlData } = supabase.storage
        .from('campaign-files')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        // 파일 URL과 파일명을 input_data에 저장
        setSlotData((prev: any) => ({
          ...prev,
          input_data: {
            ...prev.input_data,
            [field.fieldName]: file.name,  // 필드명으로 파일명 저장 (검증용)
            [`${field.fieldName}_fileName`]: file.name,
            [`${field.fieldName}_file`]: urlData.publicUrl
          }
        }));
      }
    } catch (error) {
      alert('파일 업로드 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="w-full">
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-4">
        {/* DB 설정 기반 키워드 필드 - 임시 주석 처리 */}
        {/* {keywordFields.map((field) => (
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
        ))} */}

        {/* 입력 모드 전환 버튼 - 보장형 캠페인에서는 숨김 */}
        {selectedCampaign?.slot_type !== 'guarantee' && (
          <div className="flex justify-between items-center mb-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              키워드 입력
            </label>
            <Button
              type="button"
              size="default"
              variant={useSpreadsheet ? "default" : "outline"}
              onClick={() => setUseSpreadsheet(!useSpreadsheet)}
              className={`flex items-center gap-2 px-4 py-2 font-medium shadow-sm transition-all duration-200 ${
                useSpreadsheet 
                  ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                  : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
              }`}
            >
              <KeenIcon icon={useSpreadsheet ? "document" : "grid"} className="size-4" />
              {useSpreadsheet ? "기본 입력으로 전환" : "엑셀 시트로 전환"}
            </Button>
          </div>
        )}

        {useSpreadsheet ? (
          // 스프레드시트 모드
          <div className="space-y-4">
            <SpreadsheetGrid
              key={resetTrigger} // resetTrigger가 변경되면 컴포넌트를 재생성
              minPurchaseQuantity={parseInt(selectedCampaign?.min_quantity) || 1}
              showAlert={showAlert}
              onEscapePress={() => {
                // ESC 키가 눌렸을 때 상위 컴포넌트로 전달
                if (onClose) {
                  onClose();
                }
              }}
              columns={(() => {
                // 기본 컬럼 - 보장형이 아닌 경우에만 포함
                const baseColumns: any[] = selectedCampaign?.slot_type !== 'guarantee' ? [
                  { name: '최소 구매수', type: 'number', required: true },
                  { name: '작업일', type: 'number', required: true }
                ] : [];
                
                // 추가 필드 중 텍스트, 숫자, 드롭다운 포함
                const additionalFields = getAdditionalFields(selectedCampaign)
                  .filter(field => field.fieldType !== FieldType.FILE)
                  .map(field => {
                    if (field.fieldType === FieldType.ENUM && field.enumOptions) {
                      return {
                        name: field.fieldName,
                        type: 'dropdown' as const,
                        options: field.enumOptions,
                        required: field.isRequired
                      };
                    } else if (field.fieldType === FieldType.INTEGER) {
                      return {
                        name: field.fieldName,
                        type: 'number' as const,
                        required: field.isRequired
                      };
                    } else {
                      return {
                        name: field.fieldName,
                        type: 'text' as const,
                        required: field.isRequired
                      };
                    }
                  });
                
                // 파일 필드는 별도로 처리
                const fileFields = getAdditionalFields(selectedCampaign)
                  .filter(field => field.fieldType === FieldType.FILE)
                  .map(field => ({
                    name: field.fieldName,
                    type: 'file' as const,
                    required: field.isRequired,
                    fileHandler: (file: File, rowIndex: number) => {
                      // 파일 업로드 처리
                      uploadFileToSupabase(file, field);
                    }
                  }));
                
                return [...baseColumns, ...additionalFields, ...fileFields];
              })()}
              initialData={(() => {
                // 항상 빈 데이터로 시작 (최소 구매수만 설정)
                const minPurchase = selectedCampaign?.min_quantity 
                  ? selectedCampaign.min_quantity.toString() 
                  : '1';
                
                // 빈 행 하나만 반환
                return [[]]; // 완전히 빈 행
              })()}
              onChange={(data) => {
                // 여러 행의 데이터 처리
                const additionalFields = getAdditionalFields(selectedCampaign);
                
                // 필수 필드 인덱스 확인
                const requiredFieldIndices: number[] = [];
                
                // 보장형이 아닌 경우에만 최소 구매수, 작업일 필수
                if (selectedCampaign?.slot_type !== 'guarantee') {
                  requiredFieldIndices.push(0, 1); // 최소 구매수, 작업일
                }
                
                const baseFieldCount = selectedCampaign?.slot_type !== 'guarantee' ? 2 : 0;
                
                // 추가 필드 중 필수 필드의 인덱스 추가
                additionalFields.forEach((field, index) => {
                  if (field.isRequired) {
                    requiredFieldIndices.push(baseFieldCount + index);
                  }
                });
                
                
                // 부분적으로 입력된 행 체크
                const partiallyFilledRows: number[] = [];
                let hasPartiallyFilledRows = false;
                
                // 필수값이 모두 입력된 행만 필터링
                const validRows = data.filter((row, rowIndex) => {
                  // 빈 행 체크 (모든 셀이 비어있으면 제외)
                  const hasAnyValue = row.some(cell => cell && cell.trim() !== '');
                  if (!hasAnyValue) return false;
                  
                  // 필수값 체크
                  const allRequiredFilled = requiredFieldIndices.every(index => {
                    const value = row[index];
                    return value && value.toString().trim() !== '';
                  });
                  
                  
                  // 부분적으로만 입력된 행 추적
                  if (!allRequiredFilled && hasAnyValue) {
                    partiallyFilledRows.push(rowIndex + 1);
                    hasPartiallyFilledRows = true;
                  }
                  
                  return allRequiredFilled;
                });
                
                
                if (validRows.length > 0) {
                  const firstRow = validRows[0];
                  
                  // 총 구매수와 작업일 계산
                  let totalPurchase = 0;
                  let totalWorkDays = 0;
                  
                  // 모든 행의 keywordDetails 생성
                  const keywordDetails = validRows.map((row, rowIndex) => {
                    const minQuantity = parseInt(selectedCampaign?.min_quantity) || 1;
                    let purchaseCount = minQuantity;
                    let workDays = 1;
                    
                    if (selectedCampaign?.slot_type !== 'guarantee') {
                      purchaseCount = parseInt(row[0]) || minQuantity;
                      
                      // 최소 구매수보다 작으면 최소 구매수로 설정
                      if (purchaseCount < minQuantity) {
                        purchaseCount = minQuantity;
                        // 데이터는 업데이트하지 않음 (SpreadsheetGrid에서 처리)
                      }
                      
                      workDays = parseInt(row[1]) || 1;
                    }
                    
                    totalPurchase += purchaseCount;
                    totalWorkDays += purchaseCount * workDays; // 각 행의 구매수 * 작업일
                    
                    const rowAdditionalData: any = {};
                    additionalFields.forEach((field, fieldIndex) => {
                      const colIndex = baseFieldCount + fieldIndex;
                      if (row[colIndex] !== undefined) {
                        if (field.fieldType === FieldType.FILE) {
                          rowAdditionalData[`${field.fieldName}_fileName`] = row[colIndex];
                        } else {
                          rowAdditionalData[field.fieldName] = row[colIndex];
                        }
                      }
                    });
                    
                    return {
                      id: rowIndex + 1,
                      mainKeyword: '', // 메인 키워드 제거
                      workCount: purchaseCount,
                      dueDays: workDays,
                      inputData: {
                        ...rowAdditionalData
                      }
                    };
                  });
                  
                  // 첫 번째 행의 추가 필드 데이터
                  const additionalFieldsData: any = {};
                  additionalFields.forEach((field, index) => {
                    const colIndex = baseFieldCount + index;
                    if (firstRow[colIndex] !== undefined) {
                      if (field.fieldType === FieldType.FILE) {
                        additionalFieldsData[`${field.fieldName}_fileName`] = firstRow[colIndex];
                      } else {
                        additionalFieldsData[field.fieldName] = firstRow[colIndex];
                      }
                    }
                  });
                  
                  setSlotData((prev: any) => ({
                    ...prev,
                    input_data: {
                      ...prev.input_data,
                      ...additionalFieldsData
                    },
                    mainKeyword: '', // 메인 키워드 제거
                    keywords: [],
                    // 총 구매수와 평균 작업일로 계산
                    minimum_purchase: totalPurchase,
                    work_days: totalPurchase > 0 ? Math.round(totalWorkDays / totalPurchase) : 1,
                    // 전체 구매 정보
                    total_purchase: totalPurchase,
                    total_work_days: totalWorkDays,
                    keywordDetails: keywordDetails,
                    // 부분 입력 정보 추가
                    hasPartiallyFilledRows: hasPartiallyFilledRows,
                    partiallyFilledRows: partiallyFilledRows
                  }));
                  
                  // 데이터 변경 콜백 호출
                  if (onDataChange) {
                    onDataChange();
                  }
                } else {
                  // 유효한 행이 없으면 구매수와 작업일을 0으로 설정
                  setSlotData((prev: any) => ({
                    ...prev,
                    minimum_purchase: 0,
                    work_days: 0,
                    total_purchase: 0,
                    total_work_days: 0,
                    keywordDetails: [],
                    // 부분 입력 정보 추가
                    hasPartiallyFilledRows: hasPartiallyFilledRows,
                    partiallyFilledRows: partiallyFilledRows
                  }));
                  
                  // 데이터 변경 콜백 호출
                  if (onDataChange) {
                    onDataChange();
                  }
                }
              }}
              minRows={10}
              placeholder="클릭하여 입력"
              onFileUpload={(file, fieldName, rowIndex) => {
                // 파일 업로드 핸들러
                const field = getAdditionalFields(selectedCampaign)
                  .find(f => f.fieldName === fieldName);
                if (field) {
                  uploadFileToSupabase(file, field);
                }
              }}
            />
            
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
              <div className="space-y-0.5">
                <p className="font-medium">사용 방법</p>
                <p>• 엑셀 복사/붙여넣기 지원 (Ctrl+C / Ctrl+V)</p>
                <p>• 더블클릭 또는 Enter: 셀 편집 | Tab: 다음 셀 | 화살표: 이동</p>
              </div>
            </div>
          </div>
        ) : (
          // 기본 입력 모드
          <>
            {/* 기본 필드 (최소 구매수, 작업일) - 보장형이 아닌 경우에만 표시 */}
            {selectedCampaign?.slot_type !== 'guarantee' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    최소 구매수 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={slotData.minimum_purchase || selectedCampaign?.min_quantity || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      const minQuantity = selectedCampaign?.min_quantity ? Number(selectedCampaign.min_quantity) : 1;
                      // 최소값보다 작은 값은 입력 불가
                      const finalValue = value < minQuantity ? minQuantity : value;
                      
                      setSlotData((prev: any) => ({
                        ...prev,
                        minimum_purchase: finalValue
                      }));
                      // 데이터 변경 콜백 호출
                      if (onDataChange) {
                        onDataChange();
                      }
                    }}
                    onBlur={(e) => {
                      // 포커스를 잃을 때 최소값 체크
                      const value = parseInt(e.target.value) || 0;
                      const minQuantity = selectedCampaign?.min_quantity ? Number(selectedCampaign.min_quantity) : 1;
                      if (value < minQuantity) {
                        setSlotData((prev: any) => ({
                          ...prev,
                          minimum_purchase: minQuantity
                        }));
                        if (showAlert) {
                          showAlert('최소 구매수 제한', `최소 구매수는 ${minQuantity}개 이상이어야 합니다.`, false);
                        }
                      }
                    }}
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
                    onChange={(e) => {
                      setSlotData((prev: any) => ({
                        ...prev,
                        work_days: parseInt(e.target.value) || 0
                      }));
                      // 데이터 변경 콜백 호출
                      if (onDataChange) {
                        onDataChange();
                      }
                    }}
                    placeholder="작업일"
                    min={1}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* 서비스별 추가 필드 - 스프레드시트 모드에서는 표시하지 않음 */}
        {!useSpreadsheet && selectedCampaign && getAdditionalFields(selectedCampaign)
          .map((field, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {field.fieldName} {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            {field.description && (
              <p className="text-xs text-gray-500 mb-1">{field.description}</p>
            )}
            
            {field.fieldType === FieldType.ENUM && field.enumOptions ? (
              /* 드롭박스 필드 */
              <Select
                value={slotData.input_data?.[field.fieldName] || ''}
                onValueChange={(value) => setSlotData((prev: any) => ({
                  ...prev,
                  input_data: {
                    ...prev.input_data,
                    [field.fieldName]: value
                  }
                }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {field.enumOptions.map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                        
                        // 파일을 Supabase에 업로드하는 함수 호출
                        uploadFileToSupabase(file, field);
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
                              [field.fieldName]: '',  // 필드명도 초기화
                              [`${field.fieldName}_fileName`]: '',
                              [`${field.fieldName}_file`]: ''
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