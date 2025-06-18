import React from 'react';
import { KeenIcon } from '@/components';
import { FieldType } from '../types';

interface KeywordTableRowProps {
  keyword: any;
  selectedKeywords: number[];
  selectedCampaign: any;
  isHidden: (field: string) => boolean;
  getFieldLabel: (field: string, defaultLabel: string) => string;
  handleKeywordToggle: (keywordId: number) => void;
  handleWorkCountChange: (keywordId: number, value: number | null) => void;
  handleWorkCountBlur: (keywordId: number) => void;
  handleDueDaysChange: (keywordId: number, value: number) => void;
  calculateExpectedDate: (days: number) => { startDate: string; endDate: string };
  getAdditionalFields: (campaign: any) => any[];
  handleInputDataChange: (keywordId: number, fieldName: string, value: string) => void;
  handleNumberInputChange: (keywordId: number, fieldName: string, value: string) => void;
  handleFileUpload: (keywordId: number, fieldName: string, file: File, options?: any) => void;
  handleFileRemove: (keywordId: number, fieldName: string) => void;
  calculateTotalPayment: () => void;
  setKeywords: React.Dispatch<React.SetStateAction<any[]>>;
}

export const KeywordTableRow: React.FC<KeywordTableRowProps> = ({
  keyword,
  selectedKeywords,
  selectedCampaign,
  isHidden,
  getFieldLabel,
  handleKeywordToggle,
  handleWorkCountChange,
  handleWorkCountBlur,
  handleDueDaysChange,
  calculateExpectedDate,
  getAdditionalFields,
  handleInputDataChange,
  handleNumberInputChange,
  handleFileUpload,
  handleFileRemove,
  calculateTotalPayment,
  setKeywords
}) => {
  return (
    <tr
      key={keyword.id}
      className={`transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/70 ${selectedKeywords.includes(keyword.id)
        ? 'bg-blue-50 dark:bg-blue-900/80 shadow-sm'
        : 'bg-white dark:bg-slate-800'
        }`}
    >
      <td className="min-w-[50px] w-[50px] px-2 py-3 border border-gray-200 align-middle text-center">
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={selectedKeywords.includes(keyword.id)}
            onChange={() => handleKeywordToggle(keyword.id)}
            className="size-4 sm:size-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      </td>
      <td className="min-w-[200px] px-3 py-3 border border-gray-200 group" onClick={() => handleKeywordToggle(keyword.id)}>
        <div className="cursor-pointer transition-all">
          <p className="font-semibold text-xs sm:text-sm text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 line-clamp-1 antialiased">{keyword.mainKeyword}</p>
          <div className="flex flex-wrap gap-1 mt-1.5 text-xs">
            {keyword.keyword1 && !isHidden('keyword1') && <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-xs transition-colors group-hover:bg-indigo-100 dark:group-hover:bg-indigo-800/40 font-medium antialiased">{keyword.keyword1}</span>}
            {keyword.keyword2 && !isHidden('keyword2') && <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-xs transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-800/40 font-medium antialiased">{keyword.keyword2}</span>}
            {keyword.keyword3 && !isHidden('keyword3') && <span className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-xs transition-colors group-hover:bg-amber-100 dark:group-hover:bg-amber-800/40 font-medium antialiased">{keyword.keyword3}</span>}
          </div>
        </div>
      </td>
      {(() => {
        // 보이는 필드들을 체크하여 정보 열 표시 여부 결정
        const hasVisibleInfoFields =
          !isHidden('mid') ||
          !isHidden('url') ||
          !isHidden('description') ||
          !isHidden('keyword1') ||
          !isHidden('keyword2') ||
          !isHidden('keyword3');

        if (hasVisibleInfoFields) {
          return (
            <td className="min-w-[250px] px-3 py-3 border border-gray-200 align-middle">
              <div className="text-xs">
                {keyword.mid && !isHidden('mid') && <p className="text-gray-600 mb-1 flex items-center gap-1 font-medium"><span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs font-semibold">{getFieldLabel('mid', 'MID')}</span> {keyword.mid}</p>}
                {keyword.url && !isHidden('url') && <p className="text-blue-600 truncate max-w-[300px] hover:text-blue-700 font-medium">{keyword.url}</p>}
                {keyword.description && !isHidden('description') && <p className="text-gray-500 text-xs mt-1 truncate max-w-[300px]">{keyword.description}</p>}
              </div>
            </td>
          );
        }
        return null;
      })()}
      <td className="min-w-[80px] px-3 py-3 border border-gray-200 align-middle">
        <input
          type="text"
          placeholder="작업수"
          value={keyword.workCount === null || keyword.workCount === undefined ? '' : keyword.workCount}
          onChange={(e) => {
            const inputValue = e.target.value;
            if (inputValue === '') {
              // 빈 문자열은 임시로 null 처리
              handleWorkCountChange(keyword.id, null);
              return;
            }

            // 숫자만 입력 허용
            if (/^\d+$/.test(inputValue)) {
              const numValue = parseInt(inputValue);
              handleWorkCountChange(keyword.id, numValue);
            }
          }}
          onBlur={() => handleWorkCountBlur(keyword.id)}
          className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white font-medium"
          onClick={e => e.stopPropagation()}
        />
      </td>
      <td className="min-w-[100px] px-3 py-3 border border-gray-200 align-middle">
        <input
          type="text"
          placeholder="작업기간"
          value={keyword.dueDays === null ? '' : keyword.dueDays}
          onChange={(e) => {
            // 빈 문자열이거나 숫자가 아니면 null로 처리
            const inputValue = e.target.value;
            if (inputValue === '') {
              // 빈 문자열을 허용하고 임시로 null 처리
              setKeywords(prev =>
                prev.map(k =>
                  k.id === keyword.id ? { ...k, dueDays: null } : k
                )
              );
              return;
            }

            // 숫자만 입력 허용
            if (/^\d+$/.test(inputValue)) {
              const numValue = parseInt(inputValue);
              handleDueDaysChange(keyword.id, numValue);
            }
          }}
          onBlur={(e) => {
            // 포커스를 잃을 때 빈 값이면 기본값 1로 설정
            if (e.target.value === '' || keyword.dueDays === null) {
              handleDueDaysChange(keyword.id, 1);
            }

            // 해당 키워드가 선택된 상태인 경우 금액 재계산
            if (selectedKeywords.includes(keyword.id)) {
              setTimeout(() => calculateTotalPayment(), 0);
            }
          }}
          className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white font-medium"
          onClick={e => e.stopPropagation()}
        />
      </td>
      <td className="min-w-[150px] px-3 py-3 border border-gray-200 align-middle">
        {keyword.dueDays && keyword.dueDays > 0 && (
          <div className="text-xs text-gray-700 dark:text-gray-300">
            <div className="flex flex-col gap-1.5">
              <div className="whitespace-nowrap">
                <span className="font-semibold text-gray-600 dark:text-gray-400">시작:</span>
                <span className="ml-1 font-medium">{calculateExpectedDate(keyword.dueDays || 1).startDate}</span>
              </div>
              <div className="whitespace-nowrap">
                <span className="font-semibold text-gray-600 dark:text-gray-400">완료:</span>
                <span className="ml-1 font-medium">{calculateExpectedDate(keyword.dueDays || 1).endDate}</span>
              </div>
            </div>
          </div>
        )}
      </td>
      {/* 각 추가 필드를 별도의 td로 분리 */}
      {selectedCampaign && getAdditionalFields(selectedCampaign).map((field, index) => (
        <td
          key={index}
          className="px-1 sm:px-2 py-1 sm:py-2 md:px-3 md:py-3 border border-gray-200 align-middle relative group"
          style={{ minWidth: '150px' }}
        >
          {selectedKeywords.includes(keyword.id) ? (
            <div className="relative">
              {/* 필드 타입에 따른 입력 방식 */}
              {field.fieldType === FieldType.ENUM && field.enumOptions ? (
                // ENUM 타입: 드롭다운 선택
                <select
                  value={keyword.inputData?.[field.fieldName] || ''}
                  onChange={(e) => handleInputDataChange(keyword.id, field.fieldName, e.target.value)}
                  className={`w-full px-1.5 py-1 text-[9px] sm:text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-slate-800 ${field.isRequired && (!keyword.inputData?.[field.fieldName] || keyword.inputData[field.fieldName].trim() === '')
                    ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                    : ''
                    }`}
                  onClick={e => e.stopPropagation()}
                  required={field.isRequired}
                >
                  <option value="">선택하세요</option>
                  {field.enumOptions.map((option: string, optionIndex: number) => (
                    <option key={optionIndex} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.fieldType === FieldType.INTEGER ? (
                // INTEGER 타입: 숫자만 입력
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder={`${field.fieldName} 입력${field.isRequired ? ' (필수)' : ''} (숫자만)`}
                  value={keyword.inputData?.[field.fieldName] || ''}
                  onChange={(e) => handleNumberInputChange(keyword.id, field.fieldName, e.target.value)}
                  onKeyPress={(e) => {
                    // 숫자가 아닌 키 입력 차단
                    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
                      e.preventDefault();
                    }
                  }}
                  className={`w-full px-1.5 py-1 text-[9px] sm:text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-slate-800 ${field.isRequired && (!keyword.inputData?.[field.fieldName] || keyword.inputData[field.fieldName].trim() === '')
                    ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                    : ''
                    }`}
                  onClick={e => e.stopPropagation()}
                  required={field.isRequired}
                />
              ) : field.fieldType === FieldType.FILE ? (
                // FILE 타입: 파일 업로드
                <div className="w-full">
                  {keyword.inputData?.[field.fieldName] ? (
                    // 파일이 업로드된 경우
                    <div className="flex items-center gap-1">
                      <KeenIcon icon="picture" className="size-3 text-gray-500" />
                      <a
                        href={keyword.inputData?.[field.fieldName]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] sm:text-xs text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[100px] flex-1"
                        title={keyword.inputData?.[`${field.fieldName}_fileName`] || '파일 보기 (새 탭에서 열림)'}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {keyword.inputData?.[`${field.fieldName}_fileName`] || '파일'}
                      </a>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileRemove(keyword.id, field.fieldName);
                        }}
                        className="text-red-500 hover:text-red-700 p-0.5"
                        title="파일 삭제"
                      >
                        <KeenIcon icon="cross" className="size-3" />
                      </button>
                    </div>
                  ) : (
                    // 파일 선택 버튼
                    <label className={`flex items-center justify-center px-2 py-1 text-[9px] sm:text-xs border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${field.isRequired && !keyword.inputData?.[field.fieldName]
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300'
                      }`}>
                      <KeenIcon icon="file-up" className="size-3 mr-1" />
                      파일 선택
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          e.stopPropagation();
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(keyword.id, field.fieldName, file, field.fileOptions);
                          }
                        }}
                        onClick={e => e.stopPropagation()}
                      />
                    </label>
                  )}
                </div>
              ) : (
                // TEXT 타입 (기본값): 일반 텍스트 입력
                <input
                  type="text"
                  placeholder={`${field.fieldName} 입력${field.isRequired ? ' (필수)' : ''}`}
                  value={keyword.inputData?.[field.fieldName] || ''}
                  onChange={(e) => handleInputDataChange(keyword.id, field.fieldName, e.target.value)}
                  className={`w-full px-1.5 py-1 text-[9px] sm:text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-slate-800 ${field.isRequired && (!keyword.inputData?.[field.fieldName] || keyword.inputData[field.fieldName].trim() === '')
                    ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                    : ''
                    }`}
                  onClick={e => e.stopPropagation()}
                  required={field.isRequired}
                />
              )}

              {/* 필드 설명 툴팁 (항상 표시) */}
              {field.description && (
                <div className="absolute -top-5 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                  <div className="px-2 py-1 text-[9px] text-white bg-gray-800 rounded-md shadow-lg whitespace-nowrap max-w-xs">
                    {field.description}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-400 text-center">
              선택하세요
            </div>
          )}
        </td>
      ))}
    </tr>
  );
};