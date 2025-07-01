import React, { useState, useRef, useCallback, useEffect } from 'react';
import { KeenIcon } from '@/components';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface Cell {
  row: number;
  col: number;
  value: string;
}

interface ColumnConfig {
  name: string;
  type?: 'text' | 'dropdown' | 'number' | 'file';
  options?: string[];
  required?: boolean;
  fileHandler?: (file: File, rowIndex: number) => void;
}

interface SpreadsheetGridProps {
  columns: (string | ColumnConfig)[];
  initialData?: string[][];
  onChange?: (data: string[][]) => void;
  minRows?: number;
  placeholder?: string;
  onFileUpload?: (file: File, fieldName: string, rowIndex: number) => void;
  minPurchaseQuantity?: number; // 최소 구매수 추가
  showAlert?: (title: string, description: string, success?: boolean) => void; // alert 함수 추가
  onExcelUpload?: (data: string[][]) => void; // 엑셀 업로드 콜백 추가
  onEscapePress?: () => void; // ESC 키 눌렀을 때 콜백 추가
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  columns,
  initialData = [],
  onChange,
  minRows = 10,
  placeholder = '',
  onFileUpload,
  minPurchaseQuantity = 1,
  showAlert,
  onExcelUpload,
  onEscapePress
}) => {
  // 컬럼 설정 정규화
  const normalizedColumns: ColumnConfig[] = columns.map(col => 
    typeof col === 'string' 
      ? { name: col, type: 'text' as const } 
      : { ...col, type: col.type || 'text' as const }
  );

  const [data, setData] = useState<string[][]>(() => {
    // 초기 데이터 설정, 최소 행 수 보장
    const rows = Math.max(initialData.length, minRows);
    const grid = Array(rows).fill(null).map((_, rowIndex) => 
      Array(normalizedColumns.length).fill(null).map((_, colIndex) => 
        initialData[rowIndex]?.[colIndex] || ''
      )
    );
    return grid;
  });

  // initialData가 변경될 때 최소 구매수 컬럼만 업데이트
  useEffect(() => {
    if (initialData.length > 0 && initialData[0][1]) {
      setData(prevData => {
        const newData = [...prevData];
        // 첫 번째 행의 최소 구매수 값만 업데이트 (빈 행인 경우만)
        if (newData[0] && (newData[0][0] === '' || !newData[0][0])) {
          newData[0][1] = initialData[0][1];
        }
        return newData;
      });
    }
  }, [initialData]);

  
  // 컬럼 수가 변경될 때 데이터 배열 조정
  useEffect(() => {
    setData(prevData => {
      return prevData.map(row => {
        const newRow = [...row];
        // 컬럼이 추가된 경우 빈 값 추가
        while (newRow.length < normalizedColumns.length) {
          newRow.push('');
        }
        // 컬럼이 제거된 경우 초과분 제거
        if (newRow.length > normalizedColumns.length) {
          newRow.length = normalizedColumns.length;
        }
        return newRow;
      });
    });
  }, [normalizedColumns.length]);

  // 데이터 변경 시 강제 리렌더링
  useEffect(() => {
    // 데이터가 변경되면 컴포넌트 리렌더링
  }, [data]);

  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: Cell; end: Cell } | null>(null);
  const [editingCell, setEditingCell] = useState<Cell | null>(null);
  const [editValue, setEditValue] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ESC 키 전역 이벤트 리스너
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // ESC 키가 눌렸고 스프레드시트가 포커스되어 있는지 확인
      if (e.key === 'Escape') {
        const spreadsheetGrid = document.querySelector('.spreadsheet-grid');
        const activeElement = document.activeElement;
        
        // 스프레드시트 내부에 포커스가 있거나 스프레드시트 자체가 활성화된 경우
        if (spreadsheetGrid && (spreadsheetGrid.contains(activeElement) || gridRef.current?.contains(e.target as Node))) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation(); // 다른 이벤트 핸들러도 막기
          
          // 편집 중이면 편집 취소
          if (editingCell) {
            setEditingCell(null);
            setEditValue('');
          } else if (onEscapePress) {
            // 편집 중이 아니면 onEscapePress 콜백 호출
            onEscapePress();
          }
          
          return false; // 이벤트 전파 완전 차단
        }
      }
    };

    // capture phase에서 이벤트 처리 (다른 핸들러보다 먼저 실행)
    document.addEventListener('keydown', handleGlobalKeyDown, true);
    // keyup 이벤트도 차단
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Escape' && document.querySelector('.spreadsheet-grid')?.contains(document.activeElement)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    }, true);

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [editingCell, onEscapePress]);

  // 셀 선택
  const selectCell = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col, value: data[row][col] });
    setSelectedRange(null);
    setEditingCell(null);
    setIsComposing(false); // 셀 선택 시 isComposing 초기화
    
    // 선택된 셀에 포커스 주기
    setTimeout(() => {
      const cell = gridRef.current?.querySelector(
        `tr:nth-child(${row + 1}) td:nth-child(${col + 2})`
      ) as HTMLElement;
      cell?.focus();
    }, 0);
  }, [data]);

  // 셀 편집 시작
  const startEditing = useCallback((row: number, col: number, initialValue?: string) => {
    // 유효성 검사
    if (!data[row] || !normalizedColumns[col]) return;
    
    setEditingCell({ row, col, value: data[row][col] });
    setIsComposing(false); // 편집 시작 시 isComposing 초기화
    
    // 초기값 설정 - 한글은 항상 빈 값으로 시작
    setEditValue(initialValue && !/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(initialValue) ? initialValue : (data[row][col] || ''));
    
    setTimeout(() => {
      if (normalizedColumns[col] && normalizedColumns[col].type === 'file') {
        // 파일 타입은 DOM이 렌더링된 후 자동으로 파일 선택 창이 열림
        const fileInput = document.querySelector(`#file-input-${row}-${col}`) as HTMLInputElement;
        fileInput?.click();
      } else if (normalizedColumns[col] && normalizedColumns[col].type === 'dropdown') {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } else {
        if (inputRef.current) {
          inputRef.current.focus();
          // 기존 텍스트가 있으면 선택, 한글 초기값이면 커서를 끝으로
          if (!initialValue) {
            inputRef.current.select();
          } else if (!/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(initialValue)) {
            // 영문/숫자 초기값인 경우 커서를 끝으로
            // number 타입 input은 setSelectionRange를 지원하지 않음
            if (normalizedColumns[col].type !== 'number') {
              inputRef.current.setSelectionRange(initialValue.length, initialValue.length);
            }
          }
        }
      }
    }, 100);
  }, [data, normalizedColumns]);

  // 셀 편집 완료
  const finishEditing = useCallback((shouldFocus = true) => {
    if (editingCell) {
      const newData = [...data];
      let finalValue = editValue;
      let alertShown = false;
      
      // number 타입 필드 검증
      if (normalizedColumns[editingCell.col].type === 'number') {
        // 숫자가 아닌 문자 제거
        const cleanedValue = editValue.replace(/[^0-9]/g, '');
        let numValue = parseInt(cleanedValue) || 0;
        
        // 최소 구매수인 경우 0이면 캠페인 최소값으로 설정
        if (editingCell.col === 0 && normalizedColumns[0].name === '최소 구매수' && numValue === 0) {
          numValue = minPurchaseQuantity;
        }
        // 작업일인 경우 0이면 1로 설정
        else if (editingCell.col === 1 && normalizedColumns[1].name === '작업일' && numValue === 0) {
          numValue = 1;
        }
        
        // 값이 다르면 정리된 값으로 설정
        if (editValue !== cleanedValue && editValue.trim() !== '') {
          finalValue = numValue.toString();
          
          // 최소 구매수가 아닌 경우에는 알림 표시하지 않음
          // 최소 구매수는 아래에서 별도로 처리됨
          if (editingCell.col !== 0 || normalizedColumns[0].name !== '최소 구매수') {
            // 다른 숫자 필드는 조용히 정리만 수행
          }
        } else {
          finalValue = numValue.toString();
        }
      }
      
      // 최소 구매수 컬럼(index 0)인 경우 최소값 체크
      if (editingCell.col === 0 && normalizedColumns[0].name === '최소 구매수') {
        const inputValue = parseInt(finalValue) || minPurchaseQuantity;
        if (inputValue < minPurchaseQuantity) {
          finalValue = minPurchaseQuantity.toString();
          if (showAlert) {
            // 알림 표시 전에 포커스 정보 저장
            const currentRow = editingCell.row;
            const currentCol = editingCell.col;
            
            // 알림 표시 전에 현재 포커스된 요소 저장
            const activeElement = document.activeElement;
            
            // 포커스 복구 함수
            const restoreFocus = () => {
              const targetCell = gridRef.current?.querySelector(
                `tr:nth-child(${currentRow + 1}) td:nth-child(${currentCol + 2})`
              ) as HTMLElement;
              if (targetCell) {
                targetCell.focus();
                // 탭 인덱스 설정으로 포커스 가능하게 만들기
                targetCell.setAttribute('tabindex', '0');
              }
            };
            
            // 알림 표시
            showAlert('최소 구매수 제한', `최소 구매수는 ${minPurchaseQuantity}개 이상이어야 합니다.`, false);
            alertShown = true;
            
            // 여러 방법으로 포커스 복구 시도
            // 1. 즉시 시도
            requestAnimationFrame(restoreFocus);
            
            // 2. 짧은 지연 후 시도
            setTimeout(restoreFocus, 100);
            
            // 3. 포커스 이벤트 감지
            const handleFocus = (e: FocusEvent) => {
              // 포커스가 body나 document로 이동하면 다시 복구
              if (e.target === document.body || e.target === document.documentElement) {
                restoreFocus();
                window.removeEventListener('focus', handleFocus, true);
              }
            };
            window.addEventListener('focus', handleFocus, true);
            
            // 4. 더 긴 지연으로 한 번 더 시도
            setTimeout(() => {
              restoreFocus();
              window.removeEventListener('focus', handleFocus, true);
            }, 300);
          }
        }
      }
      
      newData[editingCell.row][editingCell.col] = finalValue;
      setData(newData);
      onChange?.(newData);
      
      const prevRow = editingCell.row;
      const prevCol = editingCell.col;
      
      setEditingCell(null);
      setEditValue('');
      setIsComposing(false); // 편집 완료 시 isComposing 초기화
      
      // 편집 종료 후 해당 셀에 포커스 유지
      if (shouldFocus && !alertShown) {
        // 알림이 표시되지 않은 경우에만 기본 포커스 로직 실행
        requestAnimationFrame(() => {
          const cell = gridRef.current?.querySelector(
            `tr:nth-child(${prevRow + 1}) td:nth-child(${prevCol + 2})`
          ) as HTMLElement;
          if (cell) {
            cell.focus();
          }
        });
      }
    }
  }, [editingCell, editValue, data, onChange, normalizedColumns, minPurchaseQuantity, showAlert]);

  // 키보드 네비게이션
  const handleKeyDown = useCallback((e: React.KeyboardEvent, row: number, col: number) => {
    if (editingCell) {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        
        // Tab 키인 경우 다음 셀로 이동할 위치 미리 계산
        let nextRow = row;
        let nextCol = col;
        
        if (e.key === 'Tab') {
          nextCol = e.shiftKey ? col - 1 : col + 1;
          
          if (nextCol >= normalizedColumns.length) {
            // 마지막 컬럼에서 다음 행으로
            if (row < data.length - 1) {
              nextRow = row + 1;
              nextCol = 0;
            } else {
              // 마지막 행이면 새 행 추가
              addRow();
              nextRow = row + 1;
              nextCol = 0;
            }
          } else if (nextCol < 0) {
            // 첫 번째 컬럼에서 이전 행으로
            if (row > 0) {
              nextRow = row - 1;
              nextCol = normalizedColumns.length - 1;
            } else {
              nextCol = 0; // 첫 셀에 머무르기
            }
          }
        }
        
        // 편집 종료
        finishEditing(false); // 포커스는 수동으로 처리
        
        // Tab 키인 경우 다음 셀로 이동
        if (e.key === 'Tab') {
          // 최소 구매수 컬럼이고 값이 작은 경우 알림이 표시될 수 있음
          const isMinPurchaseColumn = editingCell.col === 0 && normalizedColumns[0].name === '최소 구매수';
          const willShowAlert = isMinPurchaseColumn && (parseInt(editValue) || 0) < minPurchaseQuantity;
          
          if (willShowAlert) {
            // 알림이 표시될 경우 다음 셀 정보를 저장하고 포커스 복구 후 이동
            const moveToNextCell = () => {
              setTimeout(() => {
                selectCell(nextRow, nextCol);
              }, 400); // 알림이 닫히고 포커스가 복구된 후 이동
            };
            moveToNextCell();
          } else {
            // 알림이 없는 경우 바로 이동
            setTimeout(() => {
              selectCell(nextRow, nextCol);
            }, 10);
          }
        } else {
          // Enter 키인 경우 같은 셀에 포커스 유지
          setTimeout(() => {
            const cell = gridRef.current?.querySelector(
              `tr:nth-child(${row + 1}) td:nth-child(${col + 2})`
            ) as HTMLElement;
            if (cell) {
              cell.focus();
            }
          }, 10);
        }
      } else if (e.key === 'Escape') {
        setEditingCell(null);
        setEditValue('');
        return; // 편집 중일 때는 ESC 처리 후 종료
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        // 편집 중이 아닐 때 ESC 키를 누르면 onEscapePress 콜백 호출
        e.preventDefault();
        e.stopPropagation();
        if (onEscapePress) {
          onEscapePress();
        }
        break;
      case 'Enter':
        if (normalizedColumns[col].type !== 'file') {
          startEditing(row, col);
        }
        break;
      case 'F2':
        if (normalizedColumns[col].type !== 'file') {
          startEditing(row, col);
        }
        break;
      case 'Tab':
        e.preventDefault();
        const nextCol = e.shiftKey ? col - 1 : col + 1;
        if (nextCol >= 0 && nextCol < normalizedColumns.length) {
          selectCell(row, nextCol);
        } else if (!e.shiftKey && col === normalizedColumns.length - 1) {
          if (row < data.length - 1) {
            // 마지막 컬럼에서 탭을 누르면 다음 행의 첫 번째 셀로 이동
            selectCell(row + 1, 0);
          } else {
            // 마지막 행의 마지막 셀에서 탭을 누르면 새 행 추가
            addRow();
            setTimeout(() => selectCell(row + 1, 0), 50);
          }
        } else if (e.shiftKey && col === 0 && row > 0) {
          // 첫 번째 컬럼에서 Shift+Tab을 누르면 이전 행의 마지막 셀로 이동
          selectCell(row - 1, normalizedColumns.length - 1);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (row > 0) {
          selectCell(row - 1, col);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (row < data.length - 1) {
          selectCell(row + 1, col);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (col > 0) {
          selectCell(row, col - 1);
        } else if (row > 0) {
          // 첫 번째 열에서 왼쪽 화살표를 누르면 이전 행의 마지막 열로
          selectCell(row - 1, normalizedColumns.length - 1);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (col < normalizedColumns.length - 1) {
          selectCell(row, col + 1);
        } else if (row < data.length - 1) {
          // 마지막 열에서 오른쪽 화살표를 누르면 다음 행의 첫 번째 열로
          selectCell(row + 1, 0);
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (!editingCell) {
          const newData = [...data];
          newData[row][col] = '';
          setData(newData);
          onChange?.(newData);
        }
        break;
      default:
        // 일반 문자 입력 시 편집 모드로 전환
        // 한글 조합 중이거나 한글 자음/모음인 경우 제외
        // 드롭다운 타입도 제외
        const isKoreanChar = /^[ㄱ-ㅎㅏ-ㅣ가-힣]$/.test(e.key);
        
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !isComposing && !isKoreanChar && 
            normalizedColumns[col].type !== 'file' && 
            normalizedColumns[col].type !== 'dropdown' && 
            e.key !== 'Process') {
          e.preventDefault();
          startEditing(row, col, e.key);
        } else if (isKoreanChar && !editingCell && normalizedColumns[col].type !== 'dropdown') {
          // 한글 입력 시작 시 바로 편집 모드로 전환 (초기값 없이) - 드롭다운 제외
          startEditing(row, col);
        }
    }
  }, [editingCell, data, normalizedColumns, finishEditing, selectCell, startEditing, onChange, isComposing]);

  // 붙여넣기 처리
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const rows = pastedText.split('\n').map(row => row.split('\t'));
    
    if (selectedCell) {
      const newData = [...data];
      const startRow = selectedCell.row;
      const startCol = selectedCell.col;
      let hasMinPurchaseViolation = false;
      const violatedCells: {row: number, col: number}[] = [];
      
      rows.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          const targetRow = startRow + rowIndex;
          const targetCol = startCol + colIndex;
          let finalValue = value;
          let skipCell = false;
          
          // 최소 구매수 컬럼(index 0)인 경우 검증
          if (targetCol === 0 && normalizedColumns[0]?.name === '최소 구매수') {
            const numValue = parseInt(value) || 0;
            if (numValue > 0 && numValue < minPurchaseQuantity) {
              hasMinPurchaseViolation = true;
              violatedCells.push({row: targetRow, col: targetCol});
              skipCell = true; // 이 셀은 붙여넣기 건너뛰기
            }
          }
          
          // 숫자 컬럼인 경우 숫자만 허용
          if (normalizedColumns[targetCol]?.type === 'number' && !skipCell) {
            const cleanedValue = value.replace(/[^0-9]/g, '');
            finalValue = cleanedValue;
          }
          
          // 최소값 미만이 아닌 경우에만 붙여넣기
          if (!skipCell) {
            // 범위를 벗어나지 않는 경우에만 붙여넣기
            if (targetRow < newData.length && targetCol < normalizedColumns.length) {
              newData[targetRow][targetCol] = finalValue;
            } else if (targetRow >= newData.length && targetCol < normalizedColumns.length) {
              // 행이 부족하면 새로 추가
              while (newData.length <= targetRow) {
                newData.push(Array(normalizedColumns.length).fill(''));
              }
              newData[targetRow][targetCol] = finalValue;
            }
          }
        });
      });
      
      setData(newData);
      onChange?.(newData);
      
      // 최소 구매수 위반이 있는 경우 알림 표시
      if (hasMinPurchaseViolation && showAlert) {
        showAlert(
          '최소 구매수 제한', 
          `최소 구매수는 ${minPurchaseQuantity}개 이상이어야 합니다. 해당 셀은 입력되지 않았습니다.`, 
          false
        );
      }
    }
  }, [selectedCell, data, normalizedColumns, minPurchaseQuantity, showAlert, onChange]);

  // 복사 처리
  const handleCopy = useCallback((e: React.ClipboardEvent) => {
    if (selectedRange) {
      e.preventDefault();
      const { start, end } = selectedRange;
      const minRow = Math.min(start.row, end.row);
      const maxRow = Math.max(start.row, end.row);
      const minCol = Math.min(start.col, end.col);
      const maxCol = Math.max(start.col, end.col);
      
      const copyData: string[][] = [];
      for (let r = minRow; r <= maxRow; r++) {
        const row: string[] = [];
        for (let c = minCol; c <= maxCol; c++) {
          row.push(data[r][c]);
        }
        copyData.push(row);
      }
      
      const copyText = copyData.map(row => row.join('\t')).join('\n');
      e.clipboardData.setData('text/plain', copyText);
    } else if (selectedCell) {
      e.preventDefault();
      e.clipboardData.setData('text/plain', data[selectedCell.row][selectedCell.col]);
    }
  }, [selectedRange, selectedCell, data]);

  // 행 추가
  const addRow = useCallback(() => {
    const newData = [...data, Array(normalizedColumns.length).fill('')];
    setData(newData);
    onChange?.(newData);
  }, [data, normalizedColumns.length, onChange]);

  // 행 삭제
  const deleteRow = useCallback((rowIndex: number) => {
    if (data.length > 1) {
      const newData = data.filter((_, index) => index !== rowIndex);
      setData(newData);
      onChange?.(newData);
    }
  }, [data, onChange]);

  // 샘플 엑셀 다운로드
  const handleDownloadSample = useCallback(async () => {
    try {
      // XLSX 동적 import
      const XLSX = await import('xlsx');
      
      // 파일 타입이 아닌 컬럼만 필터링
      const downloadColumns = normalizedColumns.filter(col => col.type !== 'file');
      
      // 샘플 데이터 생성
      const sampleData: any[] = [];
      
      // 헤더 행 생성
      const headers = downloadColumns.map(col => col.name);
      
      // 샘플 데이터 행 생성 (2개)
      const sampleRow1: any = {};
      const sampleRow2: any = {};
      
      downloadColumns.forEach((col, index) => {
        if (col.type === 'number') {
          sampleRow1[col.name] = col.name === '최소 구매수' ? minPurchaseQuantity : 1;
          sampleRow2[col.name] = col.name === '최소 구매수' ? minPurchaseQuantity : 3;
        } else if (col.type === 'dropdown' && col.options) {
          sampleRow1[col.name] = col.options[0] || '';
          sampleRow2[col.name] = col.options[Math.min(1, col.options.length - 1)] || '';
        } else {
          sampleRow1[col.name] = `${col.name} 예시 1`;
          sampleRow2[col.name] = `${col.name} 예시 2`;
        }
      });
      
      sampleData.push(sampleRow1);
      sampleData.push(sampleRow2);
      
      // 워크북 생성
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
      
      // 컬럼 너비 설정
      const colWidths = headers.map(header => ({
        wch: Math.max(header.length + 5, 15)
      }));
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, '샘플데이터');
      
      // 파일 다운로드
      XLSX.writeFile(wb, '스프레드시트_샘플.xlsx');
      
    } catch (error) {
      console.error('샘플 다운로드 오류:', error);
      showAlert?.('샘플 다운로드 실패', '샘플 파일 생성 중 오류가 발생했습니다.', false);
    }
  }, [normalizedColumns, minPurchaseQuantity, showAlert]);

  // 엑셀 파일 업로드 처리
  const handleExcelUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // XLSX 동적 import
      const XLSX = await import('xlsx');
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (jsonData.length === 0) {
            showAlert?.('엑셀 업로드 실패', '엑셀 파일에 데이터가 없습니다.', false);
            return;
          }

          // 헤더 행 제거
          const dataRows = jsonData.slice(1);
          
          // 컬럼 매핑
          const headers = jsonData[0] as string[];
          const mappedData: string[][] = [];
          
          dataRows.forEach((row: any[]) => {
            const mappedRow: string[] = [];
            
            normalizedColumns.forEach((col, colIndex) => {
              // 헤더에서 매칭되는 컬럼 찾기
              const headerIndex = headers.findIndex(h => 
                h === col.name || 
                h.replace(/\s*\(필수\)\s*$/, '') === col.name
              );
              
              if (headerIndex !== -1 && row[headerIndex] !== undefined) {
                let value = String(row[headerIndex] || '');
                
                // 필수 표시 제거
                value = value.replace(/\s*\(필수\)\s*$/, '');
                
                // 타입별 검증
                if (col.type === 'number') {
                  const numValue = parseInt(value);
                  value = isNaN(numValue) ? '' : String(numValue);
                } else if (col.type === 'dropdown' && col.options) {
                  // 드롭다운 옵션 검증
                  if (!col.options.includes(value)) {
                    value = '';
                  }
                }
                
                mappedRow.push(value);
              } else {
                mappedRow.push('');
              }
            });
            
            // 빈 행이 아닌 경우만 추가
            if (mappedRow.some(cell => cell !== '')) {
              mappedData.push(mappedRow);
            }
          });
          
          if (mappedData.length === 0) {
            showAlert?.('엑셀 업로드 실패', '유효한 데이터가 없습니다.', false);
            return;
          }
          
          // 기존 데이터와 병합 또는 교체
          const newData = [...mappedData];
          
          // 최소 행 수 보장
          while (newData.length < minRows) {
            newData.push(Array(normalizedColumns.length).fill(''));
          }
          
          setData(newData);
          onChange?.(newData);
          onExcelUpload?.(newData);
          
          showAlert?.('엑셀 업로드 성공', `${mappedData.length}개의 행이 업로드되었습니다.`, true);
          
        } catch (error) {
          console.error('엑셀 파싱 오류:', error);
          showAlert?.('엑셀 업로드 실패', '엑셀 파일을 읽는 중 오류가 발생했습니다.', false);
        }
      };
      
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('엑셀 업로드 오류:', error);
      showAlert?.('엑셀 업로드 실패', '엑셀 파일 처리 중 오류가 발생했습니다.', false);
    }
    
    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [normalizedColumns, minRows, onChange, onExcelUpload, showAlert]);

  // 클릭 이벤트로 편집 모드 종료
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editingCell && gridRef.current && !gridRef.current.contains(e.target as Node)) {
        finishEditing();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingCell, finishEditing]);

  return (
    <div className="spreadsheet-grid w-full border border-gray-300 rounded-lg bg-white dark:bg-gray-900">
      {/* 상단 툴바 추가 */}
      <div className="p-3 border-b border-gray-300 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded transition-colors"
          >
            엑셀 업로드
          </button>
          <button
            onClick={handleDownloadSample}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
          >
            샘플 다운로드
          </button>
        </div>
        <div className="text-xs text-gray-500">
          * 파일 타입 필드는 엑셀 업로드를 지원하지 않습니다
        </div>
      </div>
      
      <div 
        ref={gridRef}
        className="inline-block min-w-full overflow-auto"
        onPaste={handlePaste}
        onCopy={handleCopy}
      >
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-gray-100 dark:bg-gray-800 border-r border-b border-gray-300 w-12 h-9 text-center text-xs font-medium text-gray-600">
                #
              </th>
              {normalizedColumns.map((col, index) => (
                <th key={index} className="bg-gray-100 dark:bg-gray-800 border-r border-b border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
                  {col.name}
                  {col.required && <span className="text-red-500 ml-1">*</span>}
                </th>
              ))}
              <th className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                <td className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800/50 border-r border-b border-gray-300 w-12 h-8 text-center text-xs font-medium text-gray-600">
                  {rowIndex + 1}
                </td>
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className={`
                      border-r border-b border-gray-300 p-0 relative h-8 outline-none
                      ${normalizedColumns[colIndex] && normalizedColumns[colIndex].type === 'dropdown' ? '' : 'cursor-pointer'}
                      ${selectedCell?.row === rowIndex && selectedCell?.col === colIndex && !editingCell ? 'ring-2 ring-blue-500 ring-inset bg-blue-50 dark:bg-blue-900/20' : ''}
                      ${editingCell?.row === rowIndex && editingCell?.col === colIndex ? 'z-30' : ''}
                      focus:ring-2 focus:ring-orange-400 focus:ring-inset focus:bg-orange-50 dark:focus:bg-orange-900/20
                      hover:bg-gray-100 dark:hover:bg-gray-800/50
                    `}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // 파일 타입인 경우 바로 파일 선택 창 열기
                      if (normalizedColumns[colIndex] && normalizedColumns[colIndex].type === 'file') {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'image/*';
                        fileInput.onchange = (event) => {
                          const file = (event.target as HTMLInputElement).files?.[0];
                          if (file) {
                            // 파일명을 셀에 표시
                            const newData = [...data];
                            newData[rowIndex][colIndex] = file.name;
                            setData(newData);
                            onChange?.(newData);
                            
                            // 파일 업로드 콜백 호출
                            if (onFileUpload) {
                              onFileUpload(file, normalizedColumns[colIndex].name, rowIndex);
                            }
                          }
                        };
                        fileInput.click();
                        selectCell(rowIndex, colIndex);
                      } else if (normalizedColumns[colIndex] && normalizedColumns[colIndex].type === 'dropdown') {
                        if (editingCell?.row !== rowIndex || editingCell?.col !== colIndex) {
                          selectCell(rowIndex, colIndex);
                          startEditing(rowIndex, colIndex);
                        }
                      } else {
                        selectCell(rowIndex, colIndex);
                      }
                    }}
                    onDoubleClick={() => {
                      if (normalizedColumns[colIndex] && normalizedColumns[colIndex].type !== 'file' && normalizedColumns[colIndex].type !== 'dropdown') {
                        startEditing(rowIndex, colIndex);
                      }
                    }}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                    tabIndex={0}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                      normalizedColumns[colIndex] && normalizedColumns[colIndex].type === 'dropdown' && normalizedColumns[colIndex].options ? (
                        <div className="absolute inset-0 bg-white dark:bg-gray-900">
                          <select
                            ref={inputRef as any}
                            value={data[rowIndex][colIndex] || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              // 즉시 데이터 업데이트
                              const newData = [...data];
                              newData[rowIndex][colIndex] = value;
                              setData(newData);
                              onChange?.(newData);
                              
                              // 편집 모드 종료
                              setEditingCell(null);
                              setEditValue('');
                              
                              // 선택 후 셀에 포커스
                              setTimeout(() => {
                                const cell = gridRef.current?.querySelector(
                                  `tr:nth-child(${rowIndex + 1}) td:nth-child(${colIndex + 2})`
                                ) as HTMLElement;
                                cell?.focus();
                              }, 50);
                            }}
                            className="w-full h-full px-2 border-2 border-green-500 outline-none bg-white dark:bg-gray-900 text-sm cursor-pointer"
                            autoFocus
                            size={1}
                          >
                            <option value="">선택하세요</option>
                            {normalizedColumns[colIndex].options!.map((option: string) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <input
                          ref={inputRef}
                          type={normalizedColumns[colIndex] && normalizedColumns[colIndex].type === 'number' ? 'text' : 'text'}
                          value={editValue}
                          onChange={(e) => {
                            if (normalizedColumns[colIndex] && normalizedColumns[colIndex].type === 'number') {
                              // number 타입일 때는 숫자만 입력 가능
                              const value = e.target.value;
                              // 빈 문자열이거나 숫자만 있는 경우 그대로 설정
                              if (value === '' || /^[0-9]+$/.test(value)) {
                                setEditValue(value);
                              }
                              // 숫자가 아닌 문자가 포함된 경우만 필터링
                              else {
                                const cleanedValue = value.replace(/[^0-9]/g, '');
                                setEditValue(cleanedValue);
                              }
                            } else {
                              setEditValue(e.target.value);
                            }
                          }}
                          onBlur={() => finishEditing(false)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                          onCompositionStart={() => setIsComposing(true)}
                          onCompositionEnd={(e) => {
                            setIsComposing(false);
                            // 한글 조합이 끝났을 때 값 업데이트
                            if (normalizedColumns[colIndex] && normalizedColumns[colIndex].type !== 'number') {
                              setEditValue(e.currentTarget.value);
                            }
                          }}
                          className="absolute inset-0 w-full h-full px-2 border-2 border-green-500 outline-none bg-white dark:bg-gray-900 text-sm z-10"
                          autoFocus
                          inputMode={normalizedColumns[colIndex] && normalizedColumns[colIndex].type === 'number' ? 'numeric' : 'text'}
                        />
                      )
                    ) : (
                      <div className="h-8 px-2 text-sm flex items-center justify-between">
                        {normalizedColumns[colIndex] && normalizedColumns[colIndex].type === 'file' ? (
                          data[rowIndex][colIndex] ? (
                            <div className="flex items-center gap-1 text-xs w-full">
                              <KeenIcon icon="file" className="size-3 text-green-600 flex-shrink-0" />
                              <span className="text-green-600 truncate flex-1">{data[rowIndex][colIndex]}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(rowIndex, colIndex);
                                }}
                                className="text-blue-600 hover:text-blue-700 flex-shrink-0 p-0.5 hover:bg-blue-50 rounded"
                              >
                                <KeenIcon icon="refresh" className="size-3" />
                              </button>
                            </div>
                          ) : (
                            <div
                              className="text-gray-400 hover:text-blue-600 text-xs flex items-center gap-1 w-full justify-center hover:bg-gray-50 rounded py-0.5 cursor-pointer"
                            >
                              <KeenIcon icon="file-up" className="size-3" />
                              파일 선택
                            </div>
                          )
                        ) : normalizedColumns[colIndex] && normalizedColumns[colIndex].type === 'dropdown' ? (
                          <div className="flex items-center justify-between w-full cursor-pointer px-1">
                            <span className={data[rowIndex][colIndex] ? '' : 'text-gray-400'}>
                              {data[rowIndex][colIndex] || '선택하세요'}
                            </span>
                            <KeenIcon icon="down" className="size-3 text-gray-400 pointer-events-none" />
                          </div>
                        ) : (
                          <span className={data[rowIndex][colIndex] ? '' : 'text-gray-400'}>
                            {data[rowIndex][colIndex] || placeholder}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                ))}
                <td className="border-b border-gray-300 px-2">
                  <button
                    onClick={() => deleteRow(rowIndex)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="행 삭제"
                  >
                    <KeenIcon icon="trash" className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-2 border-t border-gray-300 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={addRow}
          className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
        >
          행 추가
        </button>
      </div>
    </div>
  );
};