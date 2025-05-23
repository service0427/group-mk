import React, { ChangeEvent, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { bulkUploadSlotWorks } from '../services/workInputService';
import { useAuthContext } from '@/auth';

// 엑셀 업로드를 위한 작업 데이터 타입
interface WorkExcelData {
  slot_id: string;
  date: string;
  work_cnt: number;
  notes?: string;
  mat_id?: string; // 매트별 슬롯 조회용
  user_slot_number?: number; // 사용자 슬롯 번호
}

// 엑셀 업로드 모달 props
interface WorkExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // 업로드 성공 후 데이터 리로드 함수
  matId: string; // 현재 로그인한 총판 ID
}

const WorkExcelUploadModal: React.FC<WorkExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  matId
}) => {
  // 상태 관리
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [duplicateErrors, setDuplicateErrors] = useState<string[]>([]);
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  
  const { session, currentUser } = useAuthContext();

  // 엑셀 파일 선택 핸들러
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    // 에러 초기화
    setValidationErrors([]);
    setDuplicateErrors([]);
    setUploadResult(null);
    
    const file = e.target.files?.[0];
    if (file) {
      // 파일 타입 체크
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.csv')) {
        setUploadFile(file);

        // 파일 내용 미리 읽기
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { 
              type: 'array',
              cellDates: true, // 날짜를 Date 객체로 파싱
              dateNF: 'yyyy-mm-dd' // 날짜 형식 지정
            });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
              raw: false, // 원시 값 대신 형식화된 문자열 사용
              dateNF: 'yyyy-mm-dd'
            });

            setTotalRows(jsonData.length);
            validateExcelData(jsonData);
          } catch (error) {
            console.error('엑셀 파일 파싱 오류:', error);
            toast.error('엑셀 파일을 읽는 도중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
            setUploadFile(null);
            if (e.target instanceof HTMLInputElement) {
              e.target.value = '';
            }
          }
        };
        
        reader.readAsArrayBuffer(file);
      } else {
        toast.error('엑셀 파일 (.xlsx, .xls, .csv)만 업로드 가능합니다.');
        e.target.value = '';
      }
    }
  };

  // 엑셀 데이터 유효성 검사
  const validateExcelData = (data: any[]): boolean => {
    if (data.length === 0) {
      toast.error('업로드한 파일에 데이터가 없습니다.');
      setUploadFile(null);
      return false;
    }

    // 필수 컬럼 체크 (유연한 방식)
    const firstRow = data[0];
    const keys = Object.keys(firstRow);
    
    // 슬롯 번호 체크 (매트별 슬롯 번호)
    const hasSlotNumber = keys.some(key => 
      key.toLowerCase().replace(/\s+/g, '').includes('슬롯번호') ||
      key.toLowerCase().replace(/\s+/g, '').includes('slotnumber') ||
      key.toLowerCase().replace(/\s+/g, '').includes('번호')
    );
    
    if (!hasSlotNumber) {
      toast.error('슬롯 번호가 없습니다. "슬롯 번호" 컬럼이 필요합니다.');
      setUploadFile(null);
      return false;
    }
    
    // 공통 필수 컬럼 체크
    const requiredColumns = ['날짜', '작업량'];
    for (const col of requiredColumns) {
      const normalizedCol = col.toLowerCase().replace(/\s+/g, '');
      
      if (!keys.some(key => {
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
        return normalizedKey === normalizedCol || normalizedKey.includes(normalizedCol);
      })) {
        toast.error(`필수 컬럼이 누락되었습니다: ${col}`);
        setUploadFile(null);
        return false;
      }
    }

    console.log(`파일 확인 완료: 총 ${data.length}개 행 발견`);
    return true;
  };

  // 엑셀 데이터를 작업 데이터로 변환
  const convertExcelToWorkData = (data: any[]): WorkExcelData[] => {
    const validatedData: WorkExcelData[] = [];
    const errors: string[] = [];
    const rowDataMap: { rowNum: number; slotNum: number; date: string; workCnt: number }[] = [];
    
    data.forEach((row, index) => {
      // 컬럼명 정규화 함수
      const normalizeKey = (key: string) => key.toLowerCase().replace(/\s+/g, '');

      // 주어진 키 목록에서 일치하는 값 찾기
      const findValue = (possibleKeys: string[]): string | undefined => {
        for (const key of possibleKeys) {
          const normalized = normalizeKey(key);
          const matchingKey = Object.keys(row).find(k => 
            normalizeKey(k) === normalized || normalizeKey(k).includes(normalized)
          );

          if (matchingKey) {
            return row[matchingKey];
          }
        }
        return undefined;
      };

      // 필드 매핑 - 매트별 슬롯 번호 사용
      const slotNumberStr = findValue(['슬롯번호', '슬롯 번호', 'slot_number', 'slotnumber', '번호']) || '';
      const date = findValue(['날짜', 'date', '작업날짜', '작업 날짜']) || '';
      const workCntStr = findValue(['작업량', '작업 량', 'work_cnt', 'workcnt', '타수']) || '0';
      const notes = findValue(['비고', '메모', 'notes', '설명']) || '';
      
      // 디버깅: 원본 데이터 타입 확인
      console.log('엑셀 데이터 디버그:', {
        row,
        dateValue: date,
        dateType: typeof date,
        isDate: date instanceof Date
      });

      // 슬롯 번호 파싱
      const slotNumber = parseInt(slotNumberStr) || 0;

      // 날짜 형식 정규화 (YYYY-MM-DD)
      let formattedDate = '';
      if (date) {
        // 날짜가 문자열인지 확인
        if (typeof date === 'string') {
          // 이미 YYYY-MM-DD 형식인지 확인
          if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = date;
          } else {
            try {
              const dateObj = new Date(date);
              if (!isNaN(dateObj.getTime())) {
                formattedDate = dateObj.toISOString().split('T')[0];
              }
            } catch (e) {
              console.warn('날짜 파싱 실패:', date);
            }
          }
        } else if (typeof date === 'number') {
          // 엑셀 날짜 시리얼 번호 처리 (1900년 1월 1일부터의 일수)
          try {
            // Excel의 날짜 시작점: 1900년 1월 1일 (단, 1900년 2월 29일 버그 고려)
            const excelStartDate = new Date(1899, 11, 30); // 1899년 12월 30일
            const dateObj = new Date(excelStartDate.getTime() + date * 24 * 60 * 60 * 1000);
            if (!isNaN(dateObj.getTime())) {
              formattedDate = dateObj.toISOString().split('T')[0];
            }
          } catch (e) {
            console.warn('엑셀 날짜 변환 실패:', date);
          }
        } else if (date instanceof Date) {
          // Date 객체인 경우
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0];
          }
        }
      }

      // 데이터 유효성 검사
      const rowNum = index + 2; // 엑셀은 1부터 시작, 헤더 제외
      
      // 슬롯 번호 검증
      if (!slotNumber || slotNumber <= 0) {
        errors.push(`행 ${rowNum}: 유효하지 않은 슬롯 번호 (${slotNumberStr})`);
        return;
      }
      
      // 날짜 검증
      if (!formattedDate) {
        errors.push(`행 ${rowNum}: 유효하지 않은 날짜 형식 (${date})`);
        return;
      }
      
      // 작업량 검증
      const workCnt = parseInt(workCntStr) || 0;
      if (workCnt <= 0) {
        errors.push(`행 ${rowNum}: 작업량은 0보다 커야 합니다 (${workCntStr})`);
        return;
      }
      
      // 작업량 상한 체크 (예: 10000 이상은 비정상)
      if (workCnt > 10000) {
        errors.push(`행 ${rowNum}: 비정상적으로 큰 작업량입니다 (${workCnt}). 확인이 필요합니다.`);
        return;
      }
      
      // 유효한 데이터 저장
      validatedData.push({
        slot_id: '', // 나중에 실제 slot_id로 매핑
        date: formattedDate,
        work_cnt: workCnt,
        notes: notes || undefined,
        mat_id: matId,
        user_slot_number: slotNumber
      });
      
      // 중복 체크를 위한 데이터 저장
      rowDataMap.push({
        rowNum: index + 2,
        slotNum: slotNumber,
        date: formattedDate,
        workCnt: workCnt
      });
    });
    
    // 검증 오류가 있으면 상태에 저장
    if (errors.length > 0) {
      setValidationErrors(errors);
    }
    
    // 중복 데이터 체크
    const duplicateCheck = new Map<string, number[]>();
    
    rowDataMap.forEach((item) => {
      const key = `${item.slotNum}-${item.date}`;
      if (!duplicateCheck.has(key)) {
        duplicateCheck.set(key, []);
      }
      duplicateCheck.get(key)!.push(item.rowNum);
    });
    
    console.log('중복 체크 맵:', duplicateCheck);
    console.log('원본 데이터 맵:', rowDataMap);
    
    const duplicateErrors: string[] = [];
    duplicateCheck.forEach((rows, key) => {
      if (rows.length > 1) {
        const [slotNum, ...dateParts] = key.split('-');
        const date = dateParts.join('-'); // 날짜에 '-'가 포함되어 있을 수 있음
        duplicateErrors.push(`슬롯 번호 ${slotNum}, 날짜 ${date}: 행 ${rows.join(', ')}에서 중복됨`);
      }
    });
    
    if (duplicateErrors.length > 0) {
      console.log('중복 데이터 발견:', duplicateErrors);
      setDuplicateErrors(duplicateErrors);
    }
    
    return validatedData;
  };

  // 엑셀 업로드 제출
  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      toast.error('업로드할 파일을 선택해주세요.');
      return;
    }
    
    // 사용자 인증 확인
    const userId = session?.user?.id || currentUser?.id;
    if (!userId) {
      console.error('업로드 시작 시 Auth 정보:', { session, currentUser, matId });
      toast.error('사용자 인증 정보를 확인할 수 없습니다. 다시 로그인해주세요.');
      return;
    }

    setIsUploading(true);
    setProgressPercent(0);

    try {
      // 파일 처리
      const processFile = () => {
        return new Promise<{ success: number; failed: number; errors: string[] }>((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onload = async (e) => {
            try {
              const data = new Uint8Array(e.target?.result as ArrayBuffer);
              const workbook = XLSX.read(data, { 
                type: 'array',
                cellDates: true, // 날짜를 Date 객체로 파싱
                dateNF: 'yyyy-mm-dd' // 날짜 형식 지정
              });
              const sheet = workbook.Sheets[workbook.SheetNames[0]];
              const jsonData = XLSX.utils.sheet_to_json(sheet, {
                raw: false, // 원시 값 대신 형식화된 문자열 사용
                dateNF: 'yyyy-mm-dd'
              });

              // 엑셀 데이터를 작업 데이터로 변환
              const workData = convertExcelToWorkData(jsonData);
              
              console.log('변환된 작업 데이터:', workData);
              console.log('현재 matId:', matId);
              
              // 유효한 데이터가 없는 경우
              if (workData.length === 0) {
                throw new Error('업로드할 유효한 데이터가 없습니다. 데이터를 확인해주세요.');
              }

              // 사용자 ID 확인
              const userId = session?.user?.id || currentUser?.id;
              if (!userId) {
                console.error('Auth 정보:', { session, currentUser });
                throw new Error('사용자 인증 정보를 확인할 수 없습니다.');
              }

              // 실제 업로드 처리
              const result = await bulkUploadSlotWorks(workData, userId);

              // 결과 처리
              setProgressPercent(100);
              
              // 성공적으로 완료
              resolve(result);
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
      
      // 파일 처리 실행
      const result = await processFile();
      
      // 결과 저장
      setUploadResult(result);
      setIsUploading(false);
      
      // 성공한 경우에만 3초 후 새로고침
      if (result.success > 0) {
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
      
    } catch (error: any) {
      console.error('파일 업로드 중 오류:', error);
      const errorMessage = error.message || '파일 업로드에 실패했습니다. 다시 시도해 주세요.';
      setUploadResult({
        success: 0,
        failed: 1,
        errors: [errorMessage]
      });
      setIsUploading(false);
      setProgressPercent(0);
    }
  };

  // 샘플 파일 다운로드 (매트별 슬롯 번호 방식)
  const handleDownloadSample = () => {
    const sampleData = [
      {
        '슬롯 번호': 1,
        '날짜': '2024-01-15',
        '작업량': 100,
        '비고': '정상 완료'
      },
      {
        '슬롯 번호': 2,
        '날짜': '2024-01-15',
        '작업량': 150,
        '비고': '추가 작업 완료'
      },
      {
        '슬롯 번호': 1,
        '날짜': '2024-01-16',
        '작업량': 120,
        '비고': ''
      },
      {
        '슬롯 번호': 3,
        '날짜': '2024-01-16',
        '작업량': 200,
        '비고': '특별 작업'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    
    // 열 너비 설정
    const wcols = [
      { wch: 12 }, // 슬롯 번호
      { wch: 12 }, // 날짜
      { wch: 10 }, // 작업량
      { wch: 20 }  // 비고
    ];
    ws['!cols'] = wcols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '작업입력');
    XLSX.writeFile(wb, '작업입력_샘플.xlsx');
  };

  // 상태 초기화
  const resetState = () => {
    setUploadFile(null);
    setProgressPercent(0);
    setTotalRows(0);
    setValidationErrors([]);
    setDuplicateErrors([]);
    setUploadResult(null);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    resetState();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden flex flex-col">
        <DialogHeader className="bg-background py-4 px-6 border-b">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full mr-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                작업 데이터 엑셀 업로드
              </DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                엑셀 파일로 대량 작업 데이터를 등록하세요
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 bg-background space-y-4">
          {/* 알림 메시지 영역 */}
          {(validationErrors.length > 0 || duplicateErrors.length > 0 || uploadResult) && (
            <div className="space-y-3">
              {/* 검증 오류 */}
              {validationErrors.length > 0 && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  <strong className="font-bold block mb-1">데이터 검증 실패:</strong>
                  <ul className="list-disc list-inside text-sm">
                    {validationErrors.slice(0, 5).map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                    {validationErrors.length > 5 && (
                      <li className="text-gray-600">... 외 {validationErrors.length - 5}건</li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* 중복 오류 */}
              {duplicateErrors.length > 0 && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                  <strong className="font-bold block mb-1">엑셀 파일 내 중복 데이터 발견!</strong>
                  <ul className="list-disc list-inside text-sm">
                    {duplicateErrors.slice(0, 5).map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                    {duplicateErrors.length > 5 && (
                      <li className="text-gray-600">... 외 {duplicateErrors.length - 5}건</li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* 업로드 결과 */}
              {uploadResult && (
                <div className={`px-4 py-3 rounded border ${
                  uploadResult.success > 0 && uploadResult.failed === 0
                    ? 'bg-green-100 border-green-400 text-green-700'
                    : uploadResult.success > 0 && uploadResult.failed > 0
                    ? 'bg-yellow-100 border-yellow-400 text-yellow-700'
                    : 'bg-red-100 border-red-400 text-red-700'
                }`}>
                  <strong className="font-bold block mb-1">
                    {uploadResult.success > 0 && uploadResult.failed === 0
                      ? `업로드 성공! (총 ${uploadResult.success}건)`
                      : uploadResult.success > 0 && uploadResult.failed > 0
                      ? `업로드 부분 완료: 성공 ${uploadResult.success}건, 실패 ${uploadResult.failed}건`
                      : `업로드 실패: 총 ${uploadResult.failed}건`}
                  </strong>
                  {uploadResult.errors.length > 0 && (
                    <ul className="list-disc list-inside text-sm mt-2">
                      {uploadResult.errors.slice(0, 5).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                      {uploadResult.errors.length > 5 && (
                        <li className="text-gray-600">... 외 {uploadResult.errors.length - 5}건</li>
                      )}
                    </ul>
                  )}
                  {uploadResult.success > 0 && (
                    <p className="text-sm mt-2 font-medium">3초 후 자동으로 새로고침됩니다...</p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* 샘플 파일 다운로드 */}
          <div>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              엑셀 파일 선택 (.xlsx, .xls, .csv)
            </label>
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={() => !isUploading && document.getElementById('work-excel-file-input')?.click()}
            >
              <input 
                id="work-excel-file-input"
                type="file" 
                className="hidden"
                accept=".xlsx,.xls,.csv" 
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {uploadFile ? (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center justify-center mb-2 text-green-600 dark:text-green-400">
                    <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">파일이 선택되었습니다</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {uploadFile.name}
                  </p>
                  {totalRows > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {totalRows.toLocaleString()}개 행 포함
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="font-medium">클릭하여 파일 선택</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    .xlsx, .xls, .csv 파일만 가능
                  </p>
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
                  className="bg-green-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* 사용법 안내 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">엑셀 업로드 가이드</h4>
            
            {/* 슬롯 번호 안내 */}
            <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded">
              <h5 className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">📌 슬롯 번호 안내</h5>
              <ul className="text-xs text-green-700 dark:text-green-200 space-y-1">
                <li>• 슬롯 번호는 해당 매트에서 관리하는 슬롯의 고유 번호입니다</li>
                <li>• 각 매트별로 1번부터 순차적으로 부여됩니다</li>
                <li>• 슬롯 목록에서 확인 가능합니다</li>
              </ul>
            </div>

            {/* 필수 컬럼 */}
            <div>
              <h5 className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">📋 필수 컬럼</h5>
              <ul className="text-xs text-blue-700 dark:text-blue-200 space-y-1">
                <li>• <strong>슬롯 번호</strong>: 작업할 슬롯의 번호 (숫자)</li>
                <li>• <strong>날짜</strong>: 작업 날짜 (YYYY-MM-DD 형식)</li>
                <li>• <strong>작업량</strong>: 작업한 타수 (숫자)</li>
                <li>• <strong>비고</strong>: 메모 (선택사항)</li>
              </ul>
            </div>
            
            {/* 주의사항 */}
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded">
              <h5 className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-1">⚠️ 주의사항</h5>
              <ul className="text-xs text-yellow-700 dark:text-yellow-200 space-y-1">
                <li>• 동일한 슬롯의 같은 날짜에는 하나의 작업만 등록 가능합니다</li>
                <li>• 날짜 형식을 정확히 지켜주세요 (예: 2024-01-15)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end items-center gap-3 py-4 px-6 bg-gray-50 dark:bg-gray-800/50 border-t">
          <Button
            variant="outline"
            onClick={handleCloseModal}
            disabled={isUploading}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            취소
          </Button>
          <Button
            onClick={handleUploadSubmit}
            disabled={isUploading || !uploadFile}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                업로드 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                업로드 시작
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkExcelUploadModal;