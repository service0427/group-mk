import React, { useState, useEffect } from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import searchPlaceService, { PlaceInfo, ApiStatus } from '@/services/placeSearchService';

/**
 * 네이버 지도 장소 검색 페이지 컴포넌트
 * Cloudflare Workers를 사용하여 API 요청을 처리
 */
const SearchPlaceInfo: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ isAvailable: false });
  const [results, setResults] = useState<PlaceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 컴포넌트 마운트 시 API 상태 확인
  useEffect(() => {
    const checkApiStatus = async () => {
      setIsChecking(true);
      const status = await searchPlaceService.checkApiStatus();
      setApiStatus(status);

      if (!status.isAvailable) {
        setError(status.error || 'API에 연결할 수 없습니다.');
      }

      setIsChecking(false);
    };

    checkApiStatus();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('검색어를 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchResult = await searchPlaceService.searchPlace(searchTerm);

      if (searchResult && searchResult.normalList) {
        setResults(searchResult.normalList);
        setError(null);
      } else {
        setError('검색 결과가 없습니다');
        setResults([]);
      }
    } catch (err) {
      console.error('검색 오류:', err);
      setError('검색 중 오류가 발생했습니다');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <CommonTemplate
      title="플레이스 순위 검색"
      description="네이버 플레이스 순위 정보를 검색하고 분석할 수 있습니다"
      showPageMenu={false}
    >
      <div className="flex flex-col space-y-4">
        {/* 검색 영역 */}
        <div className="bg-card rounded-lg shadow-sm overflow-hidden border border-border">
          <div className="p-5 border-b">
            <h3 className="text-lg font-medium text-card-foreground">N 플레이스 검색</h3>
          </div>

          <div className="p-5">
            {/* API 상태 안내 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <div className="flex">
                <KeenIcon icon="information" className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                <div>
                  <p className="text-blue-700 dark:text-blue-300 font-medium mb-1">N 플레이스 검색 안내</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    네이버 플레이스의 상세 정보를 검색할 수 있습니다.
                    업체명, 지역명 등으로 검색하여 방문자 리뷰, 블로그 리뷰, 카테고리 등의 정보를 확인해보세요.
                  </p>
                </div>
              </div>
            </div>

            {/* API 연결 상태 확인 */}
            {isChecking ? (
              <div className="flex items-center justify-center p-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                <p className="text-muted-foreground">API 연결 확인 중...</p>
              </div>
            ) : apiStatus.isAvailable ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="input">
                    <KeenIcon icon="magnifier" className="text-muted-foreground" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="장소나 업체명을 입력하세요 (예: 서울 떡집, 강남 맛집)"
                      className="w-full"
                    />
                  </label>
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      검색 중...
                    </>
                  ) : (
                    <>
                      <KeenIcon icon="magnifier" className="mr-2" />
                      검색
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-6">
                <div className="flex">
                  <KeenIcon icon="shield" className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">API 서비스에 연결할 수 없습니다</h3>
                    <p className="text-red-700 dark:text-red-400 mb-4">네이버 지도 검색 서비스에 연결할 수 없습니다. 관리자에게 문의하세요.</p>
                    <p className="text-sm text-red-600 dark:text-red-500">에러: {apiStatus.error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 검색 오류 메시지 */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                <div className="flex">
                  <KeenIcon icon="shield" className="h-4 w-4 text-red-500 mt-0.5 mr-2" />
                  <p className="text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 검색 결과 영역 - 항상 노출 */}
        <div className="bg-card rounded-lg shadow-sm overflow-hidden border border-border">
          <div className="p-5 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-card-foreground">검색 결과</h3>
              {results.length > 0 && (
                <span className="text-sm text-muted-foreground">총 {results.length}개</span>
              )}
            </div>
          </div>

          {/* 데스크톱용 테이블 헤더 - 항상 표시 */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="table align-middle text-sm w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-muted dark:bg-gray-800/60">
                  <th className="py-3 px-3 text-center font-medium w-[60px]">순위</th>
                  <th className="py-3 px-3 text-center font-medium w-[120px]">유형</th>
                  <th className="py-3 px-3 text-start font-medium">업체명</th>
                  <th className="py-3 px-3 text-start font-medium w-[180px]">카테고리</th>
                  <th className="py-3 px-3 text-center font-medium w-[80px]">방문</th>
                  <th className="py-3 px-3 text-center font-medium w-[80px]">블로그</th>
                  <th className="py-3 px-3 text-center font-medium w-[120px]">이미지</th>
                  <th className="py-3 px-3 text-center font-medium w-[80px]">예약</th>
                  <th className="py-3 px-3 text-center font-medium w-[80px]">페이</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <h4 className="text-lg font-medium text-foreground mb-2">
                        {searchTerm.trim() === '' ? '검색어를 입력하세요' : '조회된 정보가 없습니다'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {searchTerm.trim() === ''
                          ? '위의 검색창에 찾고자 하는 장소나 업체명을 입력해보세요.'
                          : '다른 검색어로 다시 시도해보세요.'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  results.map((place, index) => (
                    <tr
                      key={place.id || index}
                      className={`border-b border-border hover:bg-muted/40 ${place.isAdDup ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                    >
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-primary/10 text-primary rounded-full">
                          {place.rank || index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${place.type === 'ad'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                          }`}>
                          {place.type === 'ad' ? '광고' : '일반'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-foreground">{place.name}</div>
                        <div className="text-xs text-muted-foreground">ID: {place.id}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-sm">{place.category}</div>
                        {place.businessCategory && (
                          <div className="text-xs text-muted-foreground">{place.businessCategory}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-medium">{place.visit.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-medium">{place.blog.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-medium">{place.imageCount}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${place.booking === 'Y'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                          }`}>
                          {place.booking === 'Y' ? '가능' : '불가'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${place.npay === 'Y'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                          }`}>
                          {place.npay === 'Y' ? '가능' : '불가'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 모바일용 카드 리스트 */}
          <div className="block lg:hidden">
            {results.length === 0 ? (
              <div className="p-8 text-center">
                <h4 className="text-lg font-medium text-foreground mb-2">
                  {searchTerm.trim() === '' ? '검색어를 입력하세요' : '조회된 정보가 없습니다'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {searchTerm.trim() === ''
                    ? '위의 검색창에 찾고자 하는 장소나 업체명을 입력해보세요.'
                    : '다른 검색어로 다시 시도해보세요.'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {results.map((place, index) => (
                  <div
                    key={place.id || index}
                    className={`p-4 ${place.isAdDup ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium bg-primary/10 text-primary rounded-full flex-shrink-0 mt-1">
                        {place.rank || index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-foreground text-sm">{place.name}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${place.type === 'ad'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                            }`}>
                            {place.type === 'ad' ? '광고' : '일반'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">{place.category}</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">방문:</span>
                            <span className="font-medium">{place.visit.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">블로그:</span>
                            <span className="font-medium">{place.blog.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">이미지:</span>
                            <span className="font-medium">{place.imageCount}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${place.booking === 'Y'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                            }`}>
                            예약 {place.booking === 'Y' ? '가능' : '불가'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${place.npay === 'Y'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                            }`}>
                            페이 {place.npay === 'Y' ? '가능' : '불가'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </CommonTemplate>
  );
};

export default SearchPlaceInfo;