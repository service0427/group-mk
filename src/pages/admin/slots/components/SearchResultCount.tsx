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
    <div className="px-5 pb-3">
      <div className="text-sm font-medium text-gray-700">
        총 <span className="font-bold text-primary">{count}</span>개의 슬롯이 있습니다.
        {searchTerm && (
          <span className="ml-2">
            (검색어: "<span className="font-bold text-primary">{searchTerm}</span>")
          </span>
        )}
        {searchStatus && (
          <span className="ml-2">
            (상태: "<span className="font-bold text-primary">
              {STATUS_OPTIONS.find(opt => opt.code === searchStatus)?.name || searchStatus}
            </span>")
          </span>
        )}
        {searchDateFrom && (
          <span className="ml-2">
            (기간: <span className="font-bold text-primary">{searchDateFrom}</span>
            {searchDateTo ? ` ~ ${searchDateTo}` : ''}
            )
          </span>
        )}
      </div>
    </div>
  );
};

export default SearchResultCount;
