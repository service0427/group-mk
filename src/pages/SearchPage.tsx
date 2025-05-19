import React, { useState, useEffect } from 'react';
import searchPlaceService, { PlaceInfo, ApiStatus } from '@/services/placeSearchService';

/**
 * 네이버 지도 장소 검색 페이지 컴포넌트
 * Cloudflare Workers를 사용하여 API 요청을 처리
 */
const SearchPage: React.FC = () => {
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
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">네이버 장소 검색</h1>

      {isChecking ? (
        <div className="flex items-center justify-center p-10">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          <p>API 연결 확인 중...</p>
        </div>
      ) : apiStatus.isAvailable ? (
        <>
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="장소를 검색하세요 (예: 서울 떡집, 강남 맛집)"
              className="flex-1 p-2 border border-gray-300 rounded"
            />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
            >
              {isLoading ? '검색 중...' : '검색'}
            </button>
          </div>
        </>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded p-6 max-w-xl mx-auto mt-6">
          <h3 className="text-lg font-semibold mb-2">API 서비스에 연결할 수 없습니다</h3>
          <p className="mb-4">네이버 지도 검색 서비스에 연결할 수 없습니다. 관리자에게 문의하세요.</p>
          <p className="text-sm text-gray-600 mt-2">에러: {apiStatus.error}</p>
        </div>
      )}

      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">검색 결과 ({results.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">순위</th>
                  <th className="border p-2">유형</th>
                  <th className="border p-2">이름</th>
                  <th className="border p-2">ID</th>
                  <th className="border p-2">방문 리뷰</th>
                  <th className="border p-2">블로그 리뷰</th>
                  <th className="border p-2">이미지 수</th>
                  <th className="border p-2">카테고리</th>
                  <th className="border p-2">거리</th>
                  <th className="border p-2">예약</th>
                  <th className="border p-2">네이버페이</th>
                </tr>
              </thead>
              <tbody>
                {results.map((place, index) => (
                  <tr key={place.id || index} className={place.isAdDup ? 'bg-yellow-50' : ''}>
                    <td className="border p-2">{place.rank}</td>
                    <td className="border p-2">{place.type}</td>
                    <td className="border p-2 font-medium">{place.name}</td>
                    <td className="border p-2">{place.id}</td>
                    <td className="border p-2 text-center">{place.visit}</td>
                    <td className="border p-2 text-center">{place.blog}</td>
                    <td className="border p-2 text-center">{place.imageCount}</td>
                    <td className="border p-2">{place.category}</td>
                    <td className="border p-2">{place.distance}</td>
                    <td className="border p-2 text-center">{place.booking}</td>
                    <td className="border p-2 text-center">{place.npay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;