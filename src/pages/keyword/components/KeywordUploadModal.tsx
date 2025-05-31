import React, { ChangeEvent, useDebugValue, useState } from "react";
import { KeywordGroup, KeywordInput } from "../types";
import { getServiceTypeFromPath, SERVICE_TYPE_LABELS, CampaignServiceType } from '@/components/campaign-modals/types';
import { keywordService } from "../services/keywordService";
import { fieldMappingService } from "../services/fieldMappingService";
import { KEYWORD_SAMPLE_DATA, getColumnWidth } from "../config/sampleData.config";

// 엑셀업로드 모달에 대한 props 설정
interface KeywordUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    groups: KeywordGroup[];
    onSuccess: () => void;          // 업로드 성공 후 키워드 리로드 함수
    selectedServiceType?: string;   // 현재 선택된 서비스 타입
}

const KeywordUploadModal: React.FC<KeywordUploadModalProps> = ({
    isOpen,
    onClose,
    groups,
    onSuccess,
    selectedServiceType
}) => {

    // 엑셀 업로드 관련 상태값들
    const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);  // 업로드할 파일
    const [uploadGroupId, setUploadGroupId] = useState<number | string>('')    // 업로드할 그룹 Id
    const [isUploading, setIsUploading] = useState<boolean>(false);   // 업로드중 상태값
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [totalRows, setTotalRows] = useState<number>(0);
    
    // 결과 모달 관련 상태
    const [showResultModal, setShowResultModal] = useState<boolean>(false);
    const [uploadedCount, setUploadedCount] = useState<number>(0);
    
    // 엑셀 업로드 파일 선택 핸들러 - 및 바로 파싱
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // 1. 파일 타입 체크 (.xlsx, .xls 만 허용)
            if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                file.type === 'application/vnd.ms-excel') {
                setUploadFile(file);

                // 2. 파일 내용 미리 읽기
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        // XLSX 동적 import
                        const XLSX = await import('xlsx');
                        
                        const data = new Uint8Array(e.target?.result as ArrayBuffer);
                        const workbook = XLSX.read(data, { type: 'array'});

                        // 첫 번째 시트 가져오기
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

                        // 시트를 JSON 으로 변환
                        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                        // 총 행 수 저장
                        setTotalRows(jsonData.length);

                        // 데이터 기본 유효성 검사
                        if (uploadGroupId) {
                            validateExcelData(jsonData);
                        }
                    
                    } catch (error) {
                        console.error('엑셀 파일 파싱 오류:', error);
                        alert('엑셀 파일을 읽는 도중 오류가 발생했습니다. 파일 형식 및 내용을 확인해주세요.');
                        setUploadFile(null);
                        if (e.target instanceof HTMLInputElement) {
                            e.target.value = '';
                        }
                    }
                };
            
                reader.readAsArrayBuffer(file);
            } else {
                alert('엑셀 파일 (.xlsx, .xls 확장자)만 업로드 가능 합니다.');
                e.target.value = '';
            }
        }
    }

    const validateExcelData = async (data: any[]): Promise<boolean> => {
        // 데이터 있는지 확인
        if (data.length === 0) {
            alert('업로드한 파일에 데이터가 없습니다.');
            setUploadFile(null);
            return false;
        }

        // 선택된 그룹의 서비스 타입 확인
        const selectedGroup = groups.find(g => g.id === Number(uploadGroupId));
        if (!selectedGroup || !selectedGroup.campaignType) {
            // 기본 검증 로직 사용
            return validateExcelDataDefault(data);
        }

        // 서비스 타입별 필드 매핑 가져오기
        let fieldMapping = await fieldMappingService.getFieldMapping(selectedGroup.campaignType);
        
        if (!fieldMapping || !fieldMapping.field_mapping) {
            // DB에 필드 매핑이 없으면 기본 매핑 사용
            fieldMapping = {
                id: 'default',
                service_type: selectedGroup.campaignType,
                field_mapping: fieldMappingService.getDefaultFieldMapping(selectedGroup.campaignType),
                ui_config: {
                    listHeaders: ['메인 키워드', 'MID', 'URL', '키워드1', '키워드2', '키워드3'],
                    listFieldOrder: ['main_keyword', 'mid', 'url', 'keyword1', 'keyword2', 'keyword3'],
                    hiddenFields: [],
                    requiredFields: ['main_keyword']
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        }

        // 필수 필드 확인
        const requiredFields = fieldMappingService.getRequiredFields(fieldMapping.field_mapping);
        const firstRow = data[0];
        
        for (const fieldName of requiredFields) {
            const fieldConfig = fieldMapping.field_mapping[fieldName as keyof typeof fieldMapping.field_mapping];
            if (!fieldConfig || fieldConfig.hidden) continue;
            
            const label = fieldConfig.label;
            if (!Object.keys(firstRow).includes(label)) {
                alert(`필수 컬럼이 누락되었습니다: ${label}`);
                setUploadFile(null);
                return false;
            }
        }

        return true;
    };

    // 기본 엑셀 검증 로직 (필드 매핑이 없는 경우)
    const validateExcelDataDefault = (data: any[]): boolean => {
        const firstRow = data[0];
        const requiredColumns = ['메인 키워드'];    // 기본적으로 메인 키워드만 필수

        for (const col of requiredColumns) {
            const normalizedCol = col.toLowerCase().replace(/\s+/g, '');
        
            if (!Object.keys(firstRow).some(key => {
                const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
                return normalizedKey === normalizedCol || normalizedKey.includes(normalizedCol);
            })) {
                alert(`필수 컬럼이 누락되었습니다: ${col}`);
                setUploadFile(null);
                return false;
            }
        }

        return true;
    }

    // 엑셀 업로드 파일 제출 핸들러
    const handleUploadSubmit = async () => {
        if (!uploadGroupId) {
            alert('그룹을 선택해주세요.');
            return;
        }

        if (!uploadFile) {
            alert('업로드할 파일을 선택해주세요.');
            return;
        }

        setIsUploading(true);
        setProgressPercent(0);

        try {
            // FileReader 비동기 작업을 Promise로 감싸기
            const processFile = () => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    
                    reader.onload = async (e) => {
                        try {
                            // XLSX 동적 import
                            const XLSX = await import('xlsx');
                            
                            const data = new Uint8Array(e.target?.result as ArrayBuffer);
                            const workbook = XLSX.read(data, { type: 'array'});
                            const sheet = workbook.Sheets[workbook.SheetNames[0]];
                            const jsonData = XLSX.utils.sheet_to_json(sheet);

                            // 엑셀 데이터를 키워드 형식으로 변환
                            const keywordsData = await convertExcelToKeyword(jsonData, uploadGroupId);

                            // progressbar도 있을꺼라서 chunk 단위로 나눠서 supabase에 업로드
                            const CHUNK_THRESHOLD = 500;
                            const CHUNK_SIZE = 250;

                            // CHUNK_THRESHOLD 보다 크기 때문에 분할 업로드로 처리
                            if (keywordsData.length > CHUNK_THRESHOLD) {
                                const totalChunks = Math.ceil(keywordsData.length / CHUNK_SIZE);

                                for (let i = 0; i < totalChunks; i++) {
                                    const startIdx = i * CHUNK_SIZE;
                                    const endIdx = Math.min((1+i) * CHUNK_SIZE, keywordsData.length);
                                    const chunk = keywordsData.slice(startIdx, endIdx);

                                    // 청크 전송
                                    const response = await keywordService.bulkCreateKeywords(
                                        Number(uploadGroupId), 
                                        chunk
                                    );
                                    
                                    if (!response.success) {
                                        throw new Error(response.message || `청크 ${i + 1} 처리 중 오류`);
                                    }
                                    
                                    // 진행률 업데이트
                                    const progress = Math.round(((i + 1) / totalChunks) * 100);
                                    setProgressPercent(progress);
                                }
                            } else {
                                // 작은 파일 - 한 번에 처리
                                const response = await keywordService.bulkCreateKeywords(
                                    Number(uploadGroupId), 
                                    keywordsData
                                );
                                
                                if (!response.success) {
                                    throw new Error(response.message || '키워드 업로드 중 오류');
                                }
                                
                                setProgressPercent(100);
                            }
                            
                            // 모든 작업이 성공적으로 완료되었을 때 resolve 호출
                            resolve(true);
                        } catch (error) {
                            reject(error);
                        }
                    };
                    
                    reader.onerror = (error) => {
                        reject(error);
                    };
                    
                    reader.readAsArrayBuffer(uploadFile);
                });
            };
            
            // 파일 처리 작업 실행
            await processFile();
            
            // 성공 메시지를 모달로 표시
            setUploadedCount(totalRows);
            setShowResultModal(true);
            setUploadFile(null);
            setUploadGroupId('');
            setProgressPercent(0);
            setTotalRows(0);
            
        } catch (error) {
            console.error('파일 업로드 중 오류가 발생했습니다:', error);
            alert('파일 업로드에 실패했습니다. 다시 시도해 주세요.');
        } finally {
            setIsUploading(false);
        }
    };

    const convertExcelToKeyword = async (data:any[], groupId: number | string): Promise<KeywordInput[]> => {
        // 그룹의 서비스 타입 확인
        const selectedGroup = groups.find(g => g.id === Number(groupId));
        if (!selectedGroup || !selectedGroup.campaignType) {
            // 기본 파싱 로직 사용
            return convertExcelToKeywordDefault(data);
        }

        // 서비스 타입별 필드 매핑 가져오기
        let fieldMapping = await fieldMappingService.getFieldMapping(selectedGroup.campaignType);
        
        if (!fieldMapping || !fieldMapping.field_mapping) {
            // DB에 필드 매핑이 없으면 기본 매핑 사용
            fieldMapping = {
                id: 'default',
                service_type: selectedGroup.campaignType,
                field_mapping: fieldMappingService.getDefaultFieldMapping(selectedGroup.campaignType),
                ui_config: {
                    listHeaders: ['메인 키워드', 'MID', 'URL', '키워드1', '키워드2', '키워드3'],
                    listFieldOrder: ['main_keyword', 'mid', 'url', 'keyword1', 'keyword2', 'keyword3'],
                    hiddenFields: [],
                    requiredFields: ['main_keyword']
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        }

        // 필드 매핑에 따른 데이터 변환
        return data.map(row => {
            const keywordData: KeywordInput = {
                mainKeyword: '',
                isActive: true
            };

            // 각 필드별로 엑셀 데이터에서 값 찾기
            Object.entries(fieldMapping.field_mapping).forEach(([fieldName, config]) => {
                if (!config || config.hidden) return; // config가 없거나 숨김 필드는 스킵
                
                const label = config.label;
                const value = row[label];
                
                if (value !== undefined && value !== null && value !== '') {
                    switch (fieldName) {
                        case 'main_keyword':
                            keywordData.mainKeyword = String(value);
                            break;
                        case 'mid':
                            keywordData.mid = Number(value) || undefined;
                            break;
                        case 'url':
                            keywordData.url = String(value);
                            break;
                        case 'keyword1':
                            keywordData.keyword1 = String(value);
                            break;
                        case 'keyword2':
                            keywordData.keyword2 = String(value);
                            break;
                        case 'keyword3':
                            keywordData.keyword3 = String(value);
                            break;
                        case 'description':
                            keywordData.description = String(value);
                            break;
                    }
                }
            });

            return keywordData;
        });
    };

    // 기본 엑셀 파싱 로직 (필드 매핑이 없는 경우)
    const convertExcelToKeywordDefault = (data:any[]): KeywordInput[] => {
        return data.map(row => {
            // 컬럼명 정규화 함수 (공백제거, 소문자 변환)
            const normalizeKey = (key: string) => key.toLowerCase().replace(/\s+/g, '');

            // 주어진 키 목록에서 일치하는 값 찾기
            const findValue = (possibleKeys: string[]): string | undefined => {
                for (const key of possibleKeys) {
                    const normalized = normalizeKey(key);
                    const matchingKey = Object.keys(row).find(k => 
                        normalizeKey(k) === normalized || normalizeKey(k).includes(normalized)
                    )

                    if (matchingKey) {
                        return row[matchingKey];
                    }
                }
                return undefined;
            }

            const mainKeyword = findValue(['메인키워드', '메인 키워드', 'mainKeyword', 'mainkeyword']) || '';
            const mid = findValue(['MID', 'mid', '엠아이디', '미드']) || '';
            const midNum = mid ? Number(mid) : undefined;
            const url = findValue(['URL', 'url', '주소', '링크']) || '';
            const keyword1 = findValue(['키워드1', '키워드 1', 'keyword1', 'keyword 1', '검색어1', '검색어 1',]) || '';
            const keyword2 = findValue(['키워드2', '키워드 2', 'keyword2', 'keyword 2', '검색어2', '검색어 2',]) || '';
            const keyword3 = findValue(['키워드3', '키워드 3', 'keyword3', 'keyword 3', '검색어3', '검색어 3',]) || '';
            const description = findValue(['설명', 'description', '비고', '메모']) || '';

            return {
                mainKeyword: mainKeyword,
                mid: midNum,
                url: url,
                keyword1: keyword1,
                keyword2: keyword2,
                keyword3: keyword3,
                description: description,
                isActive: true
            }
        });
    };

    // 업로드 샘플 다운로드 함수 추가
    const handleDownloadSample = async () => {
        try {

            // XLSX 동적 import
            const XLSX = await import('xlsx');
            
            // 선택된 그룹의 서비스 타입 확인 (선택되지 않았으면 현재 서비스 타입 또는 기본값 사용)
            const selectedGroup = groups.find(g => g.id === Number(uploadGroupId));
            
            // 우선순위: 선택된 그룹의 campaignType > 전달받은 selectedServiceType > 기본값
            const serviceType = selectedGroup?.campaignType || selectedServiceType || 'default';
            
            // 서비스 타입별 필드 매핑 가져오기
            let fieldMapping = null;
            if (serviceType !== 'default') {
                fieldMapping = await fieldMappingService.getFieldMapping(serviceType);
            }
            
            // 필드 매핑이 없으면 기본 매핑 사용
            if (!fieldMapping || !fieldMapping.field_mapping) {
                fieldMapping = {
                    id: 'default',
                    service_type: serviceType,
                    field_mapping: fieldMappingService.getDefaultFieldMapping(serviceType),
                    ui_config: {
                        listHeaders: ['메인 키워드', 'MID', 'URL', '키워드1', '키워드2', '키워드3'],
                        listFieldOrder: ['main_keyword', 'mid', 'url', 'keyword1', 'keyword2', 'keyword3'],
                        hiddenFields: [],
                        requiredFields: ['main_keyword']
                    },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
            }
            
            let sampleData: any[] = [];
            let wcols: any[] = [];
            
            if (fieldMapping.field_mapping) {
                // 필드 매핑에 따른 샘플 데이터 생성
                const excelFields = fieldMappingService.getExcelFields(fieldMapping.field_mapping);
                
                // 샘플 행 데이터 생성
                const sampleRow1: any = {};
                const sampleRow2: any = {};
                
                excelFields.forEach((field, index) => {
                    // 서비스 타입별 맞춤 샘플 데이터
                    const sampleConfig = KEYWORD_SAMPLE_DATA[serviceType] || KEYWORD_SAMPLE_DATA.default;
                    const fieldSample = sampleConfig[field.fieldName];
                    
                    if (fieldSample) {
                        sampleRow1[field.label] = fieldSample.sample1;
                        sampleRow2[field.label] = fieldSample.sample2;
                    } else {
                        // 기본값 사용
                        sampleRow1[field.label] = `샘플 ${field.label} 1`;
                        sampleRow2[field.label] = `샘플 ${field.label} 2`;
                    }
                    
                    // 열 너비 설정
                    wcols.push({ wch: getColumnWidth(field.fieldName) });
                });
                
                sampleData = [sampleRow1, sampleRow2];
            }

            // 엑셀 워크시트 생성
            const ws = XLSX.utils.json_to_sheet(sampleData);
            ws['!cols'] = wcols;

            // 워크북 생성
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

            // 서비스 타입 라벨 가져오기
            const serviceLabel = SERVICE_TYPE_LABELS[serviceType as CampaignServiceType] || serviceType;

            
            // 엑셀 파일로 내보내기
            const fileName = `${serviceLabel}_샘플.xlsx`;
            XLSX.writeFile(wb, fileName);
            
        } catch (error) {
            console.error('샘플 다운로드 중 오류 발생:', error);
            alert('샘플 파일 다운로드 중 오류가 발생했습니다. 브라우저 콘솔을 확인해주세요.');
        }
    }

    // 상태 초기화
    const resetState = () => {
        setUploadFile(null);
        setUploadGroupId('');
        setProgressPercent(0);
        setTotalRows(0);
    };

    // 모달이 닫힐 때 상태 초기화
    const handleCloseModal = () => {
        resetState();
        onClose();
    }
    
    // 결과 모달 닫기 핸들러
    const handleCloseResultModal = () => {
        setShowResultModal(false);
        onClose();
        // 데이터 리로드 - onSuccess 콜백 호출
        onSuccess();
    }

    if (!isOpen) return null;

    return (
        <>
        {/* 결과 모달 */}
        {showResultModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm">
                    <div className="p-6 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-green-100 dark:bg-green-900 rounded-full p-3">
                                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            업로드 완료
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            {uploadedCount.toLocaleString()}건의 키워드가<br />
                            성공적으로 업로드되었습니다.
                        </p>
                    </div>
                    <div className="px-6 pb-6">
                        <button
                            type="button"
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={handleCloseResultModal}
                        >
                            확인
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {/* 메인 업로드 모달 */}
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">엑셀 파일 업로드</h3>
          <button 
            type="button" 
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            onClick={handleCloseModal}
            disabled={isUploading}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* 그룹 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">업로드할 그룹 선택</label>
            {groups.length > 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
                    {/* 첫 번째 그룹의 서비스 타입 라벨 표시 */}
                    {groups[0] && groups[0].campaignType && SERVICE_TYPE_LABELS[groups[0].campaignType as CampaignServiceType] 
                      ? SERVICE_TYPE_LABELS[groups[0].campaignType as CampaignServiceType]
                      : '기타'}
                  </span>
                  <select
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={uploadGroupId}
                    onChange={(e) => setUploadGroupId(e.target.value)}
                    disabled={isUploading}
                  >
                    <option value="">그룹을 선택하세요</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                선택한 서비스 타입에 그룹이 없습니다. 먼저 그룹을 생성해주세요.
              </div>
            )}
          </div>

          {/* 샘플 파일 다운로드 버튼 */}
          <div className="mb-3">
            <button
              type="button"
              onClick={handleDownloadSample}
              className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isUploading}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              샘플 엑셀 파일 다운로드
            </button>
          </div>
          
          {/* 파일 업로드 영역 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">엑셀 파일 선택 (.xlsx, .xls)</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                 onClick={() => !isUploading && document.getElementById('excel-file-input')?.click()}>
              <input 
                id="excel-file-input"
                type="file" 
                className="hidden"
                accept=".xlsx,.xls" 
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {uploadFile ? (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center justify-center mb-2 text-green-600 dark:text-green-400">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">파일이 선택되었습니다</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {uploadFile.name} - {totalRows > 0 ? `${totalRows.toLocaleString()}개 행 포함` : ''}
                  </p>
                </div>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mt-1">클릭하여 파일 선택 또는 파일을 여기에 드래그</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">.xlsx, .xls 파일만 가능</p>
                </div>
              )}
            </div>
          </div>
          
          {/* 진행률 표시 */}
          {isUploading && progressPercent > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                <span>업로드 중...</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button 
            type="button" 
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={handleCloseModal}
            disabled={isUploading}
          >
            취소
          </button>
          <button 
            type="button" 
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleUploadSubmit}
            disabled={isUploading || !uploadFile || !uploadGroupId}
          >
            {isUploading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                업로드 중...
              </span>
            ) : '업로드'}
          </button>
        </div>
      </div>
    </div>
    </>
    )
}

export default KeywordUploadModal;