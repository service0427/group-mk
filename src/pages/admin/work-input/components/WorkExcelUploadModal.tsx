import React, { ChangeEvent, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

// 엑셀 업로드를 위한 작업 데이터 타입
interface WorkExcelData {
  slot_id: string;
  date: string;
  work_cnt: number;
  notes?: string;
}

// 엑셀 업로드 모달 props
interface WorkExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // 업로드 성공 후 데이터 리로드 함수
}

const WorkExcelUploadModal: React.FC<WorkExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  // 상태 관리
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [totalRows, setTotalRows] = useState<number>(0);

  // 엑셀 파일 선택 핸들러
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
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
            const workbook = XLSX.read(data, { type: 'array'});
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

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
    
    // 슬롯 식별 방법 체크 (슬롯ID 또는 조합키)
    const hasSlotId = keys.some(key => 
      key.toLowerCase().replace(/\s+/g, '').includes('슬롯') ||
      key.toLowerCase().replace(/\s+/g, '').includes('slotid')
    );
    
    const hasComboKeys = keys.some(key => 
      key.toLowerCase().replace(/\s+/g, '').includes('캠페인')
    ) && keys.some(key => 
      key.toLowerCase().replace(/\s+/g, '').includes('mid')
    ) && keys.some(key => 
      key.toLowerCase().replace(/\s+/g, '').includes('사용자')
    );
    
    if (!hasSlotId && !hasComboKeys) {
      toast.error('슬롯 식별 정보가 없습니다. "슬롯 ID" 또는 "캠페인명+MID+사용자명" 조합이 필요합니다.');
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
    return data.map(row => {
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

      // 필드 매핑 - 조합 키 또는 UUID 지원
      const slotId = findValue(['슬롯ID', '슬롯 ID', 'slot_id', 'slotid']) || '';
      const campaignName = findValue(['캠페인명', '캠페인 명', 'campaign_name', '캠페인']) || '';
      const mid = findValue(['MID', 'mid', '엠아이디']) || '';
      const userName = findValue(['사용자명', '사용자 명', 'user_name', '사용자']) || '';
      const date = findValue(['날짜', 'date', '작업날짜', '작업 날짜']) || '';
      const workCntStr = findValue(['작업량', '작업 량', 'work_cnt', 'workcnt', '타수']) || '0';
      const notes = findValue(['비고', '메모', 'notes', '설명']) || '';

      // 슬롯ID가 없으면 조합 키로 찾기 시도
      let finalSlotId = slotId;
      if (!slotId && campaignName && mid && userName) {
        // 조합 키로 슬롯 찾기 (나중에 실제 구현 시 매핑 테이블 참조)
        finalSlotId = `${campaignName}_${mid}_${userName}`;
      }

      // 날짜 형식 정규화 (YYYY-MM-DD)
      let formattedDate = date;
      if (date && !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        try {
          const dateObj = new Date(date);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toISOString().split('T')[0];
          }
        } catch (e) {
          console.warn('날짜 파싱 실패:', date);
        }
      }

      return {
        slot_id: finalSlotId,
        date: formattedDate,
        work_cnt: parseInt(workCntStr) || 0,
        notes: notes || undefined
      };
    });
  };

  // 엑셀 업로드 제출
  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      toast.error('업로드할 파일을 선택해주세요.');
      return;
    }

    setIsUploading(true);
    setProgressPercent(0);

    try {
      // 파일 처리
      const processFile = () => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onload = async (e) => {
            try {
              const data = new Uint8Array(e.target?.result as ArrayBuffer);
              const workbook = XLSX.read(data, { type: 'array'});
              const sheet = workbook.Sheets[workbook.SheetNames[0]];
              const jsonData = XLSX.utils.sheet_to_json(sheet);

              // 엑셀 데이터를 작업 데이터로 변환
              const workData = convertExcelToWorkData(jsonData);

              // TODO: 실제 작업 데이터 업로드 로직 구현
              // 현재는 시뮬레이션
              const CHUNK_SIZE = 50;
              const totalChunks = Math.ceil(workData.length / CHUNK_SIZE);

              for (let i = 0; i < totalChunks; i++) {
                const startIdx = i * CHUNK_SIZE;
                const endIdx = Math.min((i + 1) * CHUNK_SIZE, workData.length);
                const chunk = workData.slice(startIdx, endIdx);

                // 시뮬레이션: 실제로는 서버에 전송
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log(`청크 ${i + 1} 처리:`, chunk);

                // 진행률 업데이트
                const progress = Math.round(((i + 1) / totalChunks) * 100);
                setProgressPercent(progress);
              }
              
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
      
      // 파일 처리 실행
      await processFile();
      
      toast.success('작업 데이터가 성공적으로 업로드되었습니다.');
      resetState();
      onSuccess();
      
    } catch (error) {
      console.error('파일 업로드 중 오류:', error);
      toast.error('파일 업로드에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  // 샘플 파일 다운로드 (조합키 방식)
  const handleDownloadSample = () => {
    const sampleData = [
      {
        '캠페인명': '네이버 트래픽',
        'MID': '12345',
        '사용자명': '홍길동',
        '날짜': '2024-01-15',
        '작업량': 100,
        '비고': '정상 완료'
      },
      {
        '캠페인명': '쿠팡 트래픽',
        'MID': '23456',
        '사용자명': '김철수',
        '날짜': '2024-01-16',
        '작업량': 150,
        '비고': '추가 작업 완료'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    
    // 열 너비 설정
    const wcols = [
      { wch: 15 }, // 캠페인명
      { wch: 10 }, // MID
      { wch: 12 }, // 사용자명
      { wch: 12 }, // 날짜
      { wch: 10 }, // 작업량
      { wch: 20 }  // 비고
    ];
    ws['!cols'] = wcols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, '작업입력_샘플.xlsx');
  };

  // 상태 초기화
  const resetState = () => {
    setUploadFile(null);
    setProgressPercent(0);
    setTotalRows(0);
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
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">슬롯 식별 방법 (둘 중 하나 선택)</h4>
            
            {/* 방법 1: 조합키 */}
            <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded">
              <h5 className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">✅ 권장: 조합키 방식</h5>
              <ul className="text-xs text-green-700 dark:text-green-200 space-y-1">
                <li>• <strong>캠페인명</strong>: 캠페인 이름 (예: "네이버 트래픽")</li>
                <li>• <strong>MID</strong>: 상품 MID 번호</li>
                <li>• <strong>사용자명</strong>: 작업자 이름</li>
              </ul>
            </div>

            {/* 방법 2: UUID */}
            <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800/50 rounded">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">🔹 대안: 직접 ID 방식</h5>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• <strong>슬롯 ID</strong>: 시스템에서 제공하는 고유 ID</li>
              </ul>
            </div>

            {/* 공통 필수 */}
            <div>
              <h5 className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">📋 공통 필수 컬럼</h5>
              <ul className="text-xs text-blue-700 dark:text-blue-200 space-y-1">
                <li>• <strong>날짜</strong>: 작업 날짜 (YYYY-MM-DD 형식)</li>
                <li>• <strong>작업량</strong>: 작업한 타수 (숫자)</li>
                <li>• <strong>비고</strong>: 메모 (선택사항)</li>
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