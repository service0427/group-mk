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
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  columns,
  initialData = [],
  onChange,
  minRows = 10,
  placeholder = '',
  onFileUpload,
  minPurchaseQuantity = 1,
  showAlert
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

  // 모달 닫힘 후 포커스 복구를 위한 상태
  const [lastFocusedCell, setLastFocusedCell] = useState<{row: number, col: number} | null>(null);
  
  // 모달이 닫혔을 때 포커스 복구
  useEffect(() => {
    if (lastFocusedCell) {
      const handleFocusRestore = () => {
        const cell = gridRef.current?.querySelector(
          `tr:nth-child(${lastFocusedCell.row + 1}) td:nth-child(${lastFocusedCell.col + 2})`
        ) as HTMLElement;
        if (cell && !cell.contains(document.activeElement)) {
          cell.focus();
        }
      };

      // 클릭 이벤트로 모달 닫힘 감지
      document.addEventListener('click', handleFocusRestore);
      document.addEventListener('keydown', handleFocusRestore);

      return () => {
        document.removeEventListener('click', handleFocusRestore);
        document.removeEventListener('keydown', handleFocusRestore);
      };
    }
  }, [lastFocusedCell]);
  
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
        if (editingCell.col === 1 && normalizedColumns[1].name === '최소 구매수' && numValue === 0) {
          numValue = minPurchaseQuantity;
        }
        // 작업일인 경우 0이면 1로 설정
        else if (editingCell.col === 2 && normalizedColumns[2].name === '작업일' && numValue === 0) {
          numValue = 1;
        }
        
        // 값이 다르면 정리된 값으로 설정
        if (editValue !== cleanedValue && editValue.trim() !== '') {
          finalValue = numValue.toString();
          
          // 최소 구매수가 아닌 경우에는 알림 표시하지 않음
          // 최소 구매수는 아래에서 별도로 처리됨
          if (editingCell.col !== 1 || normalizedColumns[1].name !== '최소 구매수') {
            // 다른 숫자 필드는 조용히 정리만 수행
          }
        } else {
          finalValue = numValue.toString();
        }
      }
      
      // 최소 구매수 컬럼(index 1)인 경우 최소값 체크
      if (editingCell.col === 1 && normalizedColumns[1].name === '최소 구매수') {
        const inputValue = parseInt(finalValue) || minPurchaseQuantity;
        if (inputValue < minPurchaseQuantity) {
          finalValue = minPurchaseQuantity.toString();
          if (showAlert) {
            showAlert('최소 구매수 제한', `최소 구매수는 ${minPurchaseQuantity}개 이상이어야 합니다.`, false);
            alertShown = true;
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
      if (shouldFocus) {
        // 포커스 설정 함수
        const focusCell = () => {
          const cell = gridRef.current?.querySelector(
            `tr:nth-child(${prevRow + 1}) td:nth-child(${prevCol + 2})`
          ) as HTMLElement;
          if (cell) {
            cell.focus();
            // 포커스가 제대로 설정되었는지 확인
            if (document.activeElement !== cell) {
              // 포커스가 실패하면 다시 시도
              setTimeout(() => cell.focus(), 10);
            }
          }
        };
        
        if (alertShown) {
          // 알림이 표시된 경우 포커스 정보 저장
          setLastFocusedCell({ row: prevRow, col: prevCol });
          // 알림 모달이 닫힌 후 포커스 복구
          const checkAndFocus = () => {
            // 알림 모달이 아직 열려있는지 확인
            const modalElement = document.querySelector('[role="dialog"]');
            if (!modalElement) {
              // 모달이 닫혔으면 포커스 복구
              focusCell();
            } else {
              // 아직 열려있으면 다시 시도
              setTimeout(checkAndFocus, 100);
            }
          };
          setTimeout(checkAndFocus, 100);
        } else {
          // 일반적인 경우
          setLastFocusedCell(null);
          requestAnimationFrame(focusCell);
        }
      }
    }
  }, [editingCell, editValue, data, onChange, normalizedColumns, minPurchaseQuantity, showAlert, setLastFocusedCell]);

  // 키보드 네비게이션
  const handleKeyDown = useCallback((e: React.KeyboardEvent, row: number, col: number) => {
    if (editingCell) {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        finishEditing();
        if (e.key === 'Tab') {
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
        }
      } else if (e.key === 'Escape') {
        setEditingCell(null);
        setEditValue('');
      }
      return;
    }

    switch (e.key) {
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
        const isKoreanChar = /^[ㄱ-ㅎㅏ-ㅣ가-힣]$/.test(e.key);
        
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !isComposing && !isKoreanChar && normalizedColumns[col].type !== 'file' && e.key !== 'Process') {
          e.preventDefault();
          startEditing(row, col, e.key);
        } else if (isKoreanChar && !editingCell) {
          // 한글 입력 시작 시 바로 편집 모드로 전환 (초기값 없이)
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
      
      rows.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          const targetRow = startRow + rowIndex;
          const targetCol = startCol + colIndex;
          
          // 범위를 벗어나지 않는 경우에만 붙여넣기
          if (targetRow < newData.length && targetCol < normalizedColumns.length) {
            newData[targetRow][targetCol] = value;
          } else if (targetRow >= newData.length && targetCol < normalizedColumns.length) {
            // 행이 부족하면 새로 추가
            while (newData.length <= targetRow) {
              newData.push(Array(normalizedColumns.length).fill(''));
            }
            newData[targetRow][targetCol] = value;
          }
        });
      });
      
      setData(newData);
      onChange?.(newData);
    }
  }, [selectedCell, data, normalizedColumns.length, onChange]);

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
    <div className="w-full overflow-auto border border-gray-300 rounded-lg bg-white dark:bg-gray-900">
      <div 
        ref={gridRef}
        className="inline-block min-w-full"
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
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
        >
          <KeenIcon icon="plus" className="size-4" />
          행 추가
        </button>
      </div>
    </div>
  );
};