import { useEffect } from 'react';

// 인라인 편집을 위한 CSS 스타일
export const createEditableStyles = (): HTMLStyleElement => {
  const style = document.createElement('style');
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
  return style;
};

// 스타일 요소 관리 훅
export const useEditableCellStyles = (): void => {
  useEffect(() => {
    const style = createEditableStyles();
    document.head.appendChild(style);
    
    // 컴포넌트 언마운트 시 스타일 제거
    return () => {
      document.head.removeChild(style);
    };
  }, []);
};
