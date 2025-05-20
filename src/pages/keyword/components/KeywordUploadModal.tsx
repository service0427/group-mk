import React, { ChangeEvent, useDebugValue, useState } from "react";
import { KeywordGroup, KeywordInput } from "../types";
import * as XLSX from 'xlsx';
import { getServiceTypeFromPath, SERVICE_TYPE_LABELS, CampaignServiceType } from '@/components/campaign-modals/types';
import { keywordService } from "../services/keywordService";

// 엑셀업로드 모달에 대한 props 설정
interface KeywordUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    groups: KeywordGroup[];
    onSuccess: () => void;          // 업로드 성공 후 키워드 리로드 함수
}

const KeywordUploadModal: React.FC<KeywordUploadModalProps> = ({
    isOpen,
    onClose,
    groups,
    onSuccess
}) => {

    // 엑셀 업로드 관련 상태값들
    const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);  // 업로드할 파일
    const [uploadGroupId, setUploadGroupId] = useState<number | string>('')    // 업로드할 그룹 Id
    const [isUploading, setIsUploading] = useState<boolean>(false);   // 업로드중 상태값
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [totalRows, setTotalRows] = useState<number>(0);
    
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
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target?.result as ArrayBuffer);
                        const workbook = XLSX.read(data, { type: 'array'});

                        // 첫 번째 시트 가져오기
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

                        // 시트를 JSON 으로 변환
                        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                        // 총 행 수 저장
                        setTotalRows(jsonData.length);

                        // 데이터 기본 유효성 검사
                        validateExcelData(jsonData);
                    
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

    const validateExcelData = (data: any[]): boolean => {
        // 데이터 있는지 확인
        if (data.length === 0) {
            alert('업로드한 파일에 데이터가 없습니다.');
            setUploadFile(null);
            return false;
        }

        // 필수 컬럼이 있는지 확인
        // 필수 컬럼은 나중에 따로 다른 파일로 빼든지 해야함, 일단 "메인 키워드" 와 "MID" 만 필수로 설정
        const firstRow = data[0];
        const requiredColumns = ['메인 키워드', 'MID'];    // 한글도 가능

        for (const col of requiredColumns) {
            // 컬럼에 띄어쓰기 넣을수도 있기 때문에 제거 하고 비교
            const normalizedCol = col.toLowerCase().replace(/\s+/g, '');
        
            // 실제로 normalizedCol 사용
            if (!Object.keys(firstRow).some(key => {
                const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
                return normalizedKey === normalizedCol || normalizedKey.includes(normalizedCol);
            })) {
                alert(`필수 컬럼이 누락되었습니다: ${col}`);
                setUploadFile(null);
                return false;
            }
        }

        // 첫줄은 타이틀 이므로 데이터 에서 제외
        console.log(`파일 확인 완료: 총 ${data.length - 1}개 행 발견`);

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
                            const data = new Uint8Array(e.target?.result as ArrayBuffer);
                            const workbook = XLSX.read(data, { type: 'array'});
                            const sheet = workbook.Sheets[workbook.SheetNames[0]];
                            const jsonData = XLSX.utils.sheet_to_json(sheet);

                            // 엑셀 데이터를 키워드 형식으로 변환
                            const keywordsData = convertExcelToKeyword(jsonData);

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
            
            // 성공 메시지 표시 (모든 비동기 작업 완료 후에 실행됨)
            alert('파일이 성공적으로 업로드되었습니다.');
            setShowUploadModal(false);
            setUploadFile(null);
            setUploadGroupId('');
            setProgressPercent(0);
            setTotalRows(0);
            
            // 데이터 리로드 - onSuccess 콜백 호출 추가
            onSuccess();
            
        } catch (error) {
            console.error('파일 업로드 중 오류가 발생했습니다:', error);
            alert('파일 업로드에 실패했습니다. 다시 시도해 주세요.');
        } finally {
            setIsUploading(false);
        }
    };

    const convertExcelToKeyword = (data:any[]): KeywordInput[] => {
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

            // 키워드에 대한 컬럼명 처리 
            /*
             * 나중에 typed 또는 다른 곳에서 관리가 필요하다고 생각되나
             * 지금은 일단 일단 트래픽에 대한 키워드만
             */
            const mainKeyword = findValue(['메인키워드', '메인 키워드', 'mainKeyword', 'mainkeyword']) || '';
            const mid = findValue(['MID', 'mid', '엠아이디', '미드']) || '';

            // mid값이 존재한다면 number 형으로 변환 한다.
            const midNum =mid ? Number(mid) : undefined;
            const url = findValue(['URL', 'url', '주소', '링크']) || '';
            const keyword1 = findValue(['키워드1', '키워드 1', 'keyword1', 'keyword 1', '검색어1', '검색어 1',]) || '';
            const keyword2 = findValue(['키워드2', '키워드 2', 'keyword2', 'keyword 2', '검색어2', '검색어 2',]) || '';
            const keyword3 = findValue(['키워드3', '키워드 3', 'keyword3', 'keyword 3', '검색어3', '검색어 3',]) || '';
            const description = findValue(['설명', 'description', '비고', '메모']) || '';

            // isActive는 무조건 true
            //const isActiveStr = findValue(['활성화', '상태', 'isActive', 'active', '작동']) || '';

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
    const handleDownloadSample = () => {
        // 샘플 데이터 정의 (키워드 형식에 맞게)
        const sampleData = [
            {
                '메인 키워드' : '메인키워드1',
                'MID': '12345',
                'URL': 'https://mks-guide.com/12345',
                '키워드1' : '키워드11',
                '키워드2' : '키워드12',
                '키워드3' : '키워드13',
                '설명': '설명이 필요하면 입력'
            }, 
            {
                '메인 키워드' : '메인키워드2',
                'MID': '23456',
                'URL': 'https://mks-guide.com/23456',
                '키워드1' : '키워드21',
                '키워드2' : '키워드22',
                '키워드3' : '키워드23',
                '설명': '설명이 필요하면 입력'
            }
        ];

        // 엑셀 워크시트 생성
        const ws = XLSX.utils.json_to_sheet(sampleData);

        // 열 너비 설정 (옵션)
        const wcols = [
            { wch: 15},     // 메인 키워드
            { wch: 10},     // MID
            { wch: 25},     // URL
            { wch: 15},     // 키워드1
            { wch: 15},     // 키워드2
            { wch: 15},     // 키워드3
            { wch: 30},     // 설명
        ];
        ws['!cols'] = wcols;

        // 워크북 생성
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

        // 엑셀 파일로 내보내기
        XLSX.writeFile(wb, '키워드_샘플.xlsx');
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

    if (!isOpen) return null;

    return (
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">업로드할 그룹 선택</label>
            <select 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={uploadGroupId}
                onChange={(e) => setUploadGroupId(e.target.value)}
                disabled={isUploading}
            >
                <option value="">그룹을 선택하세요</option>
                {groups.map(group => {
                // 캠페인 타입이 있는 경우 레이블 가져오기
                let typeLabel = group.campaignType;
                
                if (group.campaignName && group.campaignType) {
                    // 먼저 campaignType이 이미 CampaignServiceType 값인지 확인
                    if (Object.values(CampaignServiceType).includes(group.campaignType as CampaignServiceType)) {
                    // 이미 CampaignServiceType이면 바로 SERVICE_TYPE_LABELS 사용
                    typeLabel = SERVICE_TYPE_LABELS[group.campaignType as CampaignServiceType];
                    } else {
                    // 아니면 getServiceTypeFromPath 사용하여 변환
                    try {
                        // 플랫폼과 타입으로 서비스 타입 코드 추출
                        const serviceType = getServiceTypeFromPath(
                        group.campaignName.toLowerCase(), 
                        group.campaignType.toLowerCase()
                        );
                        typeLabel = SERVICE_TYPE_LABELS[serviceType];
                    } catch (error) {
                        console.error('서비스 타입 변환 오류:', error);
                        // 오류 시 원래 값 사용
                        typeLabel = group.campaignType;
                    }
                    }
                }
                
                return (
                    <option key={group.id} value={group.id}>
                    {group.campaignName && group.campaignType 
                        ? `${group.campaignName} > ${typeLabel} > ${group.name}` 
                        : group.name}
                    </option>
                );
                })}
            </select>
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
    )
}

export default KeywordUploadModal;