import React, { useState, KeyboardEvent, useEffect } from 'react';

interface NotificationPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const NotificationPagination: React.FC<NotificationPaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}) => {
  // 입력 필드에 표시할 페이지 번호 상태
  const [inputPage, setInputPage] = useState<string>(currentPage.toString());

  // 페이지가 변경될 때 입력 필드 업데이트
  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  // 입력 필드에서 엔터 키 처리
  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(inputPage);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        onPageChange(pageNum);
      } else {
        // 입력이 유효하지 않으면 현재 페이지로 다시 설정
        setInputPage(currentPage.toString());
      }
    }
  };

  // 입력 필드 값 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자만 입력 허용
    const value = e.target.value.replace(/[^0-9]/g, '');
    setInputPage(value);
  };

  // 입력 필드가 포커스를 잃었을 때 처리
  const handleInputBlur = () => {
    const pageNum = parseInt(inputPage);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    } else {
      // 입력이 유효하지 않으면 현재 페이지로 다시 설정
      setInputPage(currentPage.toString());
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center p-6 border-t border-border bg-card gap-4">
      <div className="hidden md:flex items-center gap-3 order-2 md:order-1 min-w-[200px]">
        <span className="text-sm text-muted-foreground whitespace-nowrap">페이지당 표시:</span>
        <select
          className="select select-sm select-bordered flex-grow min-w-[100px]"
          name="perpage"
          value={itemsPerPage}
          onChange={onItemsPerPageChange}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>

      <div className="flex items-center gap-3 order-1 md:order-2">
        <div className="flex items-center gap-2">
          <button
            className="btn btn-icon btn-sm btn-light"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"></path>
            </svg>
          </button>

          {/* 페이지 입력 필드 및 총 페이지 수 */}
          <div className="flex items-center h-9">
            <div className="h-full flex items-center border border-border rounded shadow-sm bg-background dark:border-gray-600 dark:bg-gray-800 px-2">
              <input
                type="text"
                className="w-7 h-6 px-0 text-center bg-transparent border-0 focus:outline-none dark:text-gray-200"
                value={inputPage}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onBlur={handleInputBlur}
                aria-label="페이지 번호"
              />
            </div>
            <span className="text-muted-foreground px-2 dark:text-gray-400">/ {totalPages}</span>
          </div>

          <button
            className="btn btn-icon btn-sm btn-light"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPagination;