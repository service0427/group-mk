import React from 'react';
import { KeenIcon } from '@/components';
import { FieldType } from '../types';
import { toast } from 'sonner';

interface ManualServiceFormProps {
  selectedCampaign: any;
  slotData: any;
  setSlotData: React.Dispatch<React.SetStateAction<any>>;
  getAdditionalFields: (campaign: any) => any[];
  onFileUpload?: (file: File, fieldName: string) => Promise<{ url: string; fileName: string }>;
}

export const ManualServiceForm: React.FC<ManualServiceFormProps> = ({
  selectedCampaign,
  slotData,
  setSlotData,
  getAdditionalFields,
  onFileUpload
}) => {
  const [uploadingFiles, setUploadingFiles] = React.useState<{ [key: string]: boolean }>({});
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
        
        {/* 보장형 캠페인 안내 메시지 */}
        {selectedCampaign?.slot_type === 'guarantee' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <KeenIcon icon="information-2" className="text-blue-600 dark:text-blue-400 size-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {selectedCampaign && getAdditionalFields(selectedCampaign).length > 0
                    ? "추가 정보를 기입하고, 견적요청 버튼을 눌러 내용을 확인하세요."
                    : "필수입력정보가 없습니다. 견적요청 버튼을 눌러 내용을 확인하세요."}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* 기본 필드 (최소 구매수, 작업일) - 보장형이 아닌 경우에만 표시 */}
        {selectedCampaign?.slot_type !== 'guarantee' && (
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
                className="input w-full"
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
                className="input w-full"
                placeholder="작업일을 입력하세요"
              />
            </div>
          </div>
        )}
        
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
                        className="input w-full"
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
                        className="input w-full"
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
                        className="input w-full"
                        placeholder={`${field.fieldName}을(를) 입력하세요`}
                        required={field.isRequired}
                      />
                    )}
                    {field.fieldType === FieldType.ENUM && (
                      <select
                        value={slotData.input_data?.[field.fieldName] || ''}
                        onChange={(e) => setSlotData((prev: any) => ({
                          ...prev,
                          input_data: {
                            ...prev.input_data,
                            [field.fieldName]: e.target.value
                          }
                        }))}
                        className="select w-full"
                        required={field.isRequired}
                      >
                        <option value="">선택하세요</option>
                        {field.enumOptions?.map((option: string) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                    {field.fieldType === FieldType.FILE && (
                      <div className="w-full">
                        {slotData.input_data?.[field.fieldName] ? (
                          // 파일이 업로드된 경우
                          <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                            <KeenIcon icon="picture" className="size-5 text-gray-500" />
                            <a
                              href={slotData.input_data?.[field.fieldName]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate flex-1"
                              title={slotData.input_data?.[`${field.fieldName}_fileName`] || '파일 보기'}
                            >
                              {slotData.input_data?.[`${field.fieldName}_fileName`] || '업로드된 파일'}
                            </a>
                            <button
                              type="button"
                              onClick={() => setSlotData((prev: any) => ({
                                ...prev,
                                input_data: {
                                  ...prev.input_data,
                                  [field.fieldName]: '',
                                  [`${field.fieldName}_fileName`]: ''
                                }
                              }))}
                              className="text-red-500 hover:text-red-700"
                              title="파일 삭제"
                            >
                              <KeenIcon icon="trash" className="size-4" />
                            </button>
                          </div>
                        ) : (
                          // 파일 업로드 버튼
                          <div className="relative">
                            <input
                              type="file"
                              id={`file-${field.fieldName}`}
                              accept={field.fileOptions?.acceptedTypes?.join(',') || 'image/*'}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file && onFileUpload) {
                                  if (field.fileOptions?.maxSizeMB && file.size > field.fileOptions.maxSizeMB * 1024 * 1024) {
                                    toast.error(`파일 크기는 ${field.fileOptions.maxSizeMB}MB를 초과할 수 없습니다.`);
                                    e.target.value = ''; // input 초기화
                                    return;
                                  }
                                  
                                  setUploadingFiles(prev => ({ ...prev, [field.fieldName]: true }));
                                  try {
                                    const result = await onFileUpload(file, field.fieldName);
                                    setSlotData((prev: any) => ({
                                      ...prev,
                                      input_data: {
                                        ...prev.input_data,
                                        [field.fieldName]: result.url,
                                        [`${field.fieldName}_fileName`]: result.fileName
                                      }
                                    }));
                                    toast.success('파일이 업로드되었습니다.');
                                  } catch (error) {
                                    console.error('파일 업로드 에러:', error);
                                    toast.error(error instanceof Error ? error.message : '파일 업로드에 실패했습니다.');
                                    e.target.value = ''; // input 초기화
                                  } finally {
                                    setUploadingFiles(prev => ({ ...prev, [field.fieldName]: false }));
                                  }
                                }
                              }}
                              className="hidden"
                              required={field.isRequired && !slotData.input_data?.[field.fieldName]}
                            />
                            <label
                              htmlFor={`file-${field.fieldName}`}
                              className="flex items-center justify-center gap-2 w-full px-3 py-2 border-2 border-dashed rounded-md cursor-pointer hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              {uploadingFiles[field.fieldName] ? (
                                <>
                                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></span>
                                  <span className="text-sm text-gray-600">업로드 중...</span>
                                </>
                              ) : (
                                <>
                                  <KeenIcon icon="cloud-upload" className="size-5 text-gray-400" />
                                  <span className="text-sm text-gray-600">파일 선택</span>
                                </>
                              )}
                            </label>
                          </div>
                        )}
                        {field.description && (
                          <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                        )}
                      </div>
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