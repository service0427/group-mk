import React, { useState, useEffect } from 'react';

interface WithdrawRequestSearchBarProps {
  onSearch: (params: {
    searchType: string;
    searchKeyword: string;
    startDate: string;
    endDate: string;
    status: string;
  }) => void;
  initialParams?: {
    username: string;
    startDate: string;
    endDate: string;
    status: string;
  };
}

const WithdrawRequestSearchBar: React.FC<WithdrawRequestSearchBarProps> = ({ onSearch, initialParams }) => {
  const [searchType, setSearchType] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('pending'); // 기본값은 '대기중'(pending)

  const searchTypes = [
    { value: 'all', label: '전체' },
    { value: 'userId', label: '회원 ID' },
    { value: 'userName', label: '회원명' },
    { value: 'accountNumber', label: '계좌번호' }
  ];

  const statusTypes = [
    { value: 'all', label: '전체 상태' },
    { value: 'pending', label: '대기중' },
    { value: 'approved', label: '승인' },
    { value: 'rejected', label: '반려' }
  ];

  // 컴포넌트 마운트 시 초기 검색 실행
  useEffect(() => {
    if (initialParams) {
      // 초기 파라미터가 있으면 사용
      setSearchKeyword(initialParams.username || '');
      setStartDate(initialParams.startDate || '');
      setEndDate(initialParams.endDate || '');
      setStatus(initialParams.status || 'pending');
    } else {
      // 초기 검색 실행 (기본적으로 대기중 상태만 표시)
      handleSearch();
    }
  }, []);

  const handleSearch = () => {
    onSearch({
      searchType,
      searchKeyword,
      startDate,
      endDate,
      status
    });
  };

  return (
    <div className="w-full mb-4">
      <div className="bg-gray-50 rounded-lg p-3 card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          {/* 검색 유형 선택 */}
          <div className="lg:col-span-2">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="select w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {searchTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* 검색어 입력 */}
          <div className="lg:col-span-2">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="검색어를 입력하세요"
              className="input w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 상태 선택 */}
          <div className="lg:col-span-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="select w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* 시작 날짜 */}
          <div className="lg:col-span-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 종료 날짜 */}
          <div className="lg:col-span-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 검색 버튼 */}
          <div className="lg:col-span-2">
            <button
              onClick={handleSearch}
              className="btn btn-primary w-full h-10 flex items-center justify-center"
            >
              검색
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawRequestSearchBar;