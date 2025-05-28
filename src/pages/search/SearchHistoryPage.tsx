import React, { useState, useEffect } from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import { KeenIcon } from '@/components';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import searchLimitService, { SearchLog, SearchType } from '@/services/searchLimitService';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const SearchHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchType, setSearchType] = useState<SearchType | ''>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // 검색 히스토리 조회
  const fetchSearchHistory = async () => {
    setIsLoading(true);
    try {
      const offset = (currentPage - 1) * pageSize;
      const { logs, total } = await searchLimitService.getSearchHistory(
        searchType || undefined,
        pageSize,
        offset
      );
      setSearchLogs(logs);
      setTotalCount(total);
    } catch (error) {
      // 오류 발생 시 무시 (사용자에게 표시하지 않음)
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchSearchHistory();
  }, [searchType, currentPage, pageSize]);

  // 검색 타입별 배지 색상
  const getSearchTypeBadge = (type: SearchType) => {
    switch (type) {
      case 'shop':
        return <Badge className="bg-blue-100 text-blue-800">N 쇼핑</Badge>;
      case 'place':
        return <Badge className="bg-green-100 text-green-800">N 플레이스</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm', { locale: ko });
    } catch {
      return dateString;
    }
  };

  // 재검색 핸들러
  const handleReSearch = (searchType: SearchType, searchQuery: string) => {
    const searchPath = searchType === 'shop' ? '/search-shop' : '/search-place';
    navigate(searchPath, { state: { searchQuery } });
  };

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // 페이지 사이즈 변경 핸들러
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1); // 페이지 사이즈 변경 시 첫 페이지로 이동
  };

  // 검색 타입 변경 핸들러
  const handleSearchTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchType(e.target.value as SearchType | '');
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);

  return (
    <CommonTemplate
      title="검색 히스토리"
      description="내 검색 기록을 확인할 수 있습니다"
      showPageMenu={false}
    >
      <div className="flex flex-col space-y-4">
        {/* 필터 영역 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">검색 필터</h3>
          <div className="flex flex-wrap md:flex-nowrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">검색 타입</label>
              <select
                value={searchType}
                onChange={handleSearchTypeChange}
                className="select w-full"
              >
                <option value="">전체</option>
                <option value="shop">N 쇼핑</option>
                <option value="place">N 플레이스</option>
              </select>
            </div>
            <div className="flex-1 md:flex-none">
              <Button onClick={fetchSearchHistory} className="btn btn-primary">
                <KeenIcon icon="magnifier" className="mr-2" />
                조회
              </Button>
            </div>
          </div>
        </Card>

        {/* 테이블 영역 */}
        <Card>
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">검색 내역</h3>
              <span className="text-sm text-muted-foreground">
                총 {totalCount.toLocaleString()}건
              </span>
            </div>
          </div>

          {/* 로딩 상태 */}
          {isLoading ? (
            <div className="flex items-center justify-center p-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
              <p className="text-muted-foreground">검색 내역을 불러오는 중...</p>
            </div>
          ) : searchLogs.length === 0 ? (
            // 빈 상태
            <div className="p-10 text-center">
              <KeenIcon icon="search-list" className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">검색 내역이 없습니다</h4>
              <p className="text-sm text-muted-foreground">
                N 쇼핑 또는 N 플레이스에서 검색을 시작해보세요.
              </p>
            </div>
          ) : (
            <>
              {/* 데스크톱 테이블 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="table align-middle text-sm w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted">
                      <th className="py-4 px-5 text-start font-medium w-[120px]">검색 타입</th>
                      <th className="py-4 px-5 text-start font-medium">검색어</th>
                      <th className="py-4 px-5 text-start font-medium w-[180px]">검색 시간</th>
                      <th className="py-4 px-5 text-center font-medium w-[80px]">재검색</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border hover:bg-muted/40">
                        <td className="py-4 px-5">
                          {getSearchTypeBadge(log.searchType)}
                        </td>
                        <td className="py-4 px-5">
                          <span className="font-medium text-foreground">{log.searchQuery}</span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-muted-foreground whitespace-nowrap">
                            {formatDate(log.searchedAt)}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <button
                            onClick={() => handleReSearch(log.searchType, log.searchQuery)}
                            className="btn btn-xs btn-primary"
                            title="재검색"
                          >
                            <KeenIcon icon="magnifier" className="text-sm" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 모바일 카드 뷰 */}
              <div className="block md:hidden">
                <div className="divide-y divide-border">
                  {searchLogs.map((log) => (
                    <div key={log.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getSearchTypeBadge(log.searchType)}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(log.searchedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-foreground">{log.searchQuery}</div>
                        <button
                          onClick={() => handleReSearch(log.searchType, log.searchQuery)}
                          className="btn btn-xs btn-primary"
                          title="재검색"
                        >
                          <KeenIcon icon="magnifier" className="text-sm" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 페이지네이션 */}
              <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">페이지당:</span>
                  <select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className="select select-sm"
                  >
                    <option value={10}>10개</option>
                    <option value={20}>20개</option>
                    <option value={50}>50개</option>
                    <option value={100}>100개</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {startIndex}-{endIndex} / {totalCount}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="btn btn-sm btn-light"
                    >
                      <KeenIcon icon="left" />
                    </Button>
                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="btn btn-sm btn-light"
                    >
                      <KeenIcon icon="right" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </CommonTemplate>
  );
};

export default SearchHistoryPage;