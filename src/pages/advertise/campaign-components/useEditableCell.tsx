import { useState, useEffect } from 'react';
import { EditingCellState, SlotItem } from './types';

interface UseEditableCellProps {
  slots: SlotItem[];
  updateSlot: (slotId: string, updatedInputData: any) => Promise<void>;
}

/**
 * 인라인 편집 기능을 제공하는 커스텀 훅
 */
export const useEditableCell = ({ slots, updateSlot }: UseEditableCellProps) => {
  const [editingCell, setEditingCell] = useState<EditingCellState>({ id: '', field: '' });
  const [editingValue, setEditingValue] = useState<string>('');

  // document 클릭 이벤트 핸들러 추가
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // 편집 중인 상태가 아니면 아무 작업도 하지 않음
      if (!editingCell.id || !editingCell.field) return;
      
      // 클릭된 요소가 input이거나 editable-cell인 경우 무시
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.closest('.editable-cell') || 
        target.classList.contains('editable-cell')
      ) {
        return;
      }
      
      // 다른 곳을 클릭한 경우 편집 모드 종료 (저장)
      saveAndClose();
    };
    
    // 이벤트 리스너 등록
    document.addEventListener('mousedown', handleDocumentClick);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [editingCell, editingValue, slots]); // 의존성 배열에 필요한 상태들 추가

  // 셀 편집 시작
  const handleEditCell = (id: string, field: string) => {
    const slot = slots.find(item => item.id === id);
    if (!slot) return;

    let initialValue = '';
    
    switch (field) {
      case 'productName':
        initialValue = slot.inputData.productName;
        break;
      case 'mid':
        initialValue = slot.inputData.mid;
        break;
      case 'url':
        initialValue = slot.inputData.url;
        break;
      case 'keywords':
        initialValue = slot.inputData.keywords.join(',');
        break;
      default:
        return;
    }

    setEditingCell({ id, field });
    setEditingValue(initialValue);
  };

  // 편집 내용 저장
  const saveAndClose = async () => {
    try {
      if (!editingCell.id || !editingCell.field) return;
      
      const slot = slots.find(item => item.id === editingCell.id);
      if (!slot) return;
      
      // 값이 비어있는지 확인
      if (!editingValue.trim() && (editingCell.field === 'productName' || editingCell.field === 'mid' || editingCell.field === 'url')) {
        // 필수 값이 비어있으면 저장하지 않고 편집 모드만 종료
        setEditingCell({ id: '', field: '' });
        setEditingValue('');
        return;
      }
      
      const updatedInputData = { ...slot.inputData };
      
      switch (editingCell.field) {
        case 'productName':
          updatedInputData.productName = editingValue.trim();
          break;
        case 'mid':
          updatedInputData.mid = editingValue.trim();
          break;
        case 'url':
          // URL 형식 검증 (간소화)
          updatedInputData.url = editingValue.trim();
          if (!updatedInputData.url.startsWith('http://') && !updatedInputData.url.startsWith('https://')) {
            updatedInputData.url = 'https://' + updatedInputData.url.replace(/^(https?:\/\/)/, '');
          }
          break;
        case 'keywords':
          updatedInputData.keywords = editingValue.split(',')
            .map(k => k.trim())
            .filter(k => k);
          break;
        default:
          return;
      }
      
      // 데이터 업데이트
      await updateSlot(editingCell.id, updatedInputData);
    } catch (err) {
      
    } finally {
      // 편집 상태 초기화 (성공/실패 상관없이)
      setEditingCell({ id: '', field: '' });
      setEditingValue('');
    }
  };

  // 엔터 키 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveAndClose();
    }
  };

  return {
    editingCell,
    editingValue,
    setEditingValue,
    handleEditCell,
    saveAndClose,
    handleKeyDown
  };
};

// 인라인 편집을 위한 CSS 스타일 추가
export const addEditableCellStyles = () => {
  const styleExists = document.getElementById('editableCellStyles');
  if (styleExists) return;

  const style = document.createElement('style');
  style.id = 'editableCellStyles';
  style.textContent = `
    .editable-cell {
      position: relative;
      cursor: pointer;
      padding: 0.2rem;
      border-radius: 0.25rem;
      transition: background-color 0.2s;
      min-height: 24px;
      display: block;
      width: 100%;
    }
    
    .editable-cell:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .editable-cell:not(:has(input)):hover::after {
      content: "✏️";
      position: absolute;
      top: 0.2rem;
      right: 0.2rem;
      font-size: 0.75rem;
      opacity: 0.5;
    }
    
    /* 편집 중인 셀 스타일 유지 */
    .editable-cell input {
      width: 100%;
      background-color: #fff;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      border: 1px solid var(--tw-primary);
    }
    
    /* 테이블 셀 안의 내용이 넘치지 않도록 */
    .table td {
      vertical-align: middle;
    }
    
    /* 키워드 영역 스타일 보정 */
    .editable-cell .badge {
      margin-right: 0.25rem;
      margin-bottom: 0.25rem;
    }
  `;
  document.head.appendChild(style);
};
