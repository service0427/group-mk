import React from 'react';
import { STATUS_OPTIONS } from './constants';

interface SearchResultCountProps {
  count: number;
  searchTerm: string;
  searchStatus: string;
  searchDateFrom: string;
  searchDateTo: string;
}

const SearchResultCount: React.FC<SearchResultCountProps> = ({
  count,
  searchTerm,
  searchStatus,
  searchDateFrom,
  searchDateTo
}) => {
  return (
    <div className="px-6 pb-3">
      <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-3">
        <span>총 <span className="font-semibold text-gray-900 dark:text-gray-100">{count}</span>개</span>
        {searchTerm && (
          <span className="flex items-center gap-1">
            <span className="text-gray-400">|</span>
            <span>검색어: <span className="font-medium text-gray-900 dark:text-gray-100">{searchTerm}</span></span>
          </span>
        )}
        {searchStatus && (
          <span className="flex items-center gap-1">
            <span className="text-gray-400">|</span>
            <span>상태: <span className="font-medium text-gray-900 dark:text-gray-100">
              {STATUS_OPTIONS.find(opt => opt.code === searchStatus)?.name || searchStatus}
            </span></span>
          </span>
        )}
        {searchDateFrom && (
          <span className="flex items-center gap-1">
            <span className="text-gray-400">|</span>
            <span>기간: <span className="font-medium text-gray-900 dark:text-gray-100">{searchDateFrom}</span>
            {searchDateTo && <span> ~ <span className="font-medium text-gray-900 dark:text-gray-100">{searchDateTo}</span></span>}
            </span>
          </span>
        )}
      </div>
    </div>
  );
};

export default SearchResultCount;
