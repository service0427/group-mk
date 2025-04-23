import React from 'react';
import { KeenIcon } from '@/components/keenicons';

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
  // 현재 표시 범위 계산
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalCount);

  // 페이지 번호 계산 로직
  const calculatePageNumbers = () => {
    const maxPagesToShow = 5;
    let startPage: number;
    let endPage: number;

    if (totalPages <= maxPagesToShow) {
      // 전체 페이지가 5개 이하면 모두 표시
      startPage = 1;
      endPage = totalPages;
    } else if (currentPage <= 3) {
      // 현재 페이지가 앞쪽에 있을 경우
      startPage = 1;
      endPage = 5;
    } else if (currentPage >= totalPages - 2) {
      // 현재 페이지가 뒷쪽에 있을 경우
      startPage = totalPages - 4;
      endPage = totalPages;
    } else {
      // 현재 페이지가 중간에 있을 경우
      startPage = currentPage - 2;
      endPage = currentPage + 2;
    }

    // 페이지 버튼 배열 생성
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  // 총 페이지가 1개 이하더라도 페이지네이션 컨트롤은 표시함

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mt-5 gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">페이지당 표시:</span>
        <select
          className="form-select form-select-rounded border border-gray-300 focus:border-primary focus:shadow-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 rounded text-md px-3 py-1 min-w-[100px] w-auto"
          value={itemsPerPage}
          onChange={onItemsPerPageChange}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="30">30</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>

      <div className="text-sm text-gray-600">
        {totalCount > 0 ? (
          <>총 <span className="font-medium text-gray-800 dark:text-gray-300">{totalCount}</span>개 항목 중 <span className="font-medium text-gray-800 dark:text-gray-300">{start}</span>-<span className="font-medium text-gray-800 dark:text-gray-300">{end}</span>번</>
        ) : (
          <span className="opacity-0">-</span> // 항목이 없을 때 투명한 텍스트로 공간 유지
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        {currentPage > 1 && (
          <>
            <button
              className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
              onClick={() => onPageChange(1)}
            >
              <KeenIcon icon="double-left" className="fs-7" />
            </button>

            <button
              className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
              onClick={() => onPageChange(currentPage - 1)}
            >
              <KeenIcon icon="arrow-left" className="fs-7" />
            </button>
          </>
        )}

        <div className="flex items-center">
          {calculatePageNumbers().map(pageNumber => (
            <button
              key={pageNumber}
              className={`flex items-center justify-center w-8 h-8 rounded-md ${pageNumber === currentPage
                  ? 'bg-primary text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'
                }`}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}

          {/* 페이지가 없을 경우 현재 페이지만 표시 */}
          {totalPages === 0 && (
            <button
              className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-white"
            >
              1
            </button>
          )}
        </div>

        {currentPage < totalPages && (
          <>
            <button
              className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
              onClick={() => onPageChange(currentPage + 1)}
            >
              <KeenIcon icon="arrow-right" className="fs-7" />
            </button>

            <button
              className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
              onClick={() => onPageChange(totalPages)}
            >
              <KeenIcon icon="double-right" className="fs-7" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationPagination;