import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CommonTemplate } from '@/components/pageTemplate';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'react-router-dom';
import shopSearchService, { ShopItem, ApiStatus } from '@/services/shopSearchService';
import searchLimitService, { SearchLimitStatus } from '@/services/searchLimitService';
import { AddKeywordModal } from '@/components/keyword';

/**
 * 네이버 쇼핑 검색 페이지 컴포넌트
 * Cloudflare Workers를 사용하여 API 요청을 처리
 */
const SearchShopInfo: React.FC = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ isAvailable: false });
  const [results, setResults] = useState<ShopItem[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const limit = 100; // 검색 개수 100개로 고정
  const [searchLimitStatus, setSearchLimitStatus] = useState<SearchLimitStatus | null>(null);
  const [isCheckingLimit, setIsCheckingLimit] = useState<boolean>(true);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [hasAutoSearched, setHasAutoSearched] = useState<boolean>(false);

  // 키워드 추가 모달 상태
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState<boolean>(false);
  const [selectedItemForKeyword, setSelectedItemForKeyword] = useState<{
    mainKeyword: string;
    mid?: string;
    url?: string;
    description?: string;
    additionalInfo?: any;
  } | null>(null);

  // 이미지 확대 모달 상태
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string } | null>(null);

  // 컴포넌트 마운트 시 API 상태 및 검색 제한 확인
  useEffect(() => {
    const initialize = async () => {
      setIsChecking(true);
      setIsCheckingLimit(true);

      // API 상태 확인
      const status = await shopSearchService.checkApiStatus();
      setApiStatus(status);

      if (!status.isAvailable) {
        setError(status.error || 'API에 연결할 수 없습니다.');
      }

      // 검색 제한 상태 확인
      try {
        const limitStatus = await searchLimitService.checkSearchLimit('shop');
        setSearchLimitStatus(limitStatus);
        setLimitError(null);
      } catch (error) {
        setLimitError('검색 제한 서비스에 연결할 수 없습니다. 관리자에게 문의하세요.');
        setSearchLimitStatus(null);
      }

      setIsChecking(false);
      setIsCheckingLimit(false);
    };

    initialize();
  }, []);

  // location.state에서 검색어가 있으면 자동 검색
  useEffect(() => {
    const performAutoSearch = async () => {
      if (location.state?.searchQuery && !hasAutoSearched && apiStatus.isAvailable && searchLimitStatus) {
        const query = location.state.searchQuery;
        setSearchTerm(query);
        setHasAutoSearched(true);

        // 검색 제한 확인
        if (!searchLimitStatus.canSearch) {
          setError(searchLimitStatus.message);
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          const searchResult = await shopSearchService.searchShop(query, limit);

          if (searchResult && searchResult.items) {
            setResults(searchResult.items);
            setTotalResults(searchResult.total);
            setError(null);

            // 검색 로그 추가
            await searchLimitService.addSearchLog('shop', query, searchResult.total);

            // 검색 제한 상태 업데이트
            await updateSearchLimit();
          } else {
            setError('검색 결과가 없습니다');
            setResults([]);
            setTotalResults(0);
          }
        } catch (err) {
          setError('검색 중 오류가 발생했습니다');
          setResults([]);
          setTotalResults(0);
        } finally {
          setIsLoading(false);
        }
      }
    };

    performAutoSearch();
  }, [location.state, hasAutoSearched, apiStatus.isAvailable, searchLimitStatus, limit]);

  // 검색 후 제한 상태 업데이트
  const updateSearchLimit = async () => {
    const limitStatus = await searchLimitService.checkSearchLimit('shop');
    setSearchLimitStatus(limitStatus);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('검색어를 입력해주세요');
      return;
    }

    // 검색 제한 확인
    if (searchLimitStatus && !searchLimitStatus.canSearch) {
      setError(searchLimitStatus.message);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchResult = await shopSearchService.searchShop(searchTerm, limit);

      if (searchResult && searchResult.items) {
        setResults(searchResult.items);
        setTotalResults(searchResult.total);
        setError(null);

        // 검색 로그 추가
        await searchLimitService.addSearchLog('shop', searchTerm, searchResult.total);

        // 검색 제한 상태 업데이트
        await updateSearchLimit();
      } else {
        setError('검색 결과가 없습니다');
        setResults([]);
        setTotalResults(0);
      }
    } catch (err) {
      console.error('검색 오류:', err);
      setError('검색 중 오류가 발생했습니다');
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatPrice = (price: string) => {
    if (!price || price === '0') return '-';
    return parseInt(price).toLocaleString() + '원';
  };

  const handleProductClick = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handleAddKeyword = (item: ShopItem) => {
    // 설명란에는 간단한 정보만
    const description = `${item.title}${item.mallName ? ` - ${item.mallName}` : ''}`;

    // 추가 정보는 별도 객체로 (새로운 JSON 포맷)
    const additionalInfo = {
      type: 'shop',
      mainKeyword: searchTerm,
      mid: item.productId,
      productName: item.title,
      rank: item.rank,
      price: {
        low: item.lprice,
        high: item.hprice
      },
      shop: {
        name: item.mallName || null,
        brand: item.brand || null,
        maker: item.maker || null
      },
      category: [item.category1, item.category2, item.category3, item.category4].filter(Boolean),
      image: item.image || null,
      capturedAt: new Date().toISOString()
    };

    setSelectedItemForKeyword({
      mainKeyword: searchTerm,  // 검색한 키워드를 메인 키워드로
      mid: item.productId,
      url: item.link,
      description: description,
      additionalInfo: additionalInfo  // 추가 정보
    });
    setIsKeywordModalOpen(true);
  };

  const handleImageClick = (src: string, title: string) => {
    setSelectedImage({ src, title });
    setIsImageModalOpen(true);
  };
  
  // ESC 키 핸들러
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isImageModalOpen) {
        setIsImageModalOpen(false);
        setSelectedImage(null);
      }
    };
    
    if (isImageModalOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isImageModalOpen]);

  return (
    <CommonTemplate
      title="쇼핑 순위 검색"
      description="네이버 쇼핑에서 상품 순위 정보를 검색하고 분석할 수 있습니다"
      showPageMenu={false}
    >
      <div className="flex flex-col space-y-4">
        {/* 검색 영역 */}
        <div className="bg-card rounded-lg shadow-sm overflow-hidden border border-border">
          <div className="p-5 border-b">
            <h3 className="text-lg font-medium text-card-foreground">N 쇼핑 검색</h3>
          </div>

          <div className="p-5">
            {/* 검색 제한 상태 표시 */}
            {!isCheckingLimit && searchLimitStatus && (
              <div className="mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">오늘 검색 횟수</span>
                    <Badge variant={searchLimitStatus.canSearch ? "default" : "destructive"}>
                      {searchLimitStatus.dailyUsed} / {searchLimitStatus.dailyLimit === -1 ? '무제한' : searchLimitStatus.dailyLimit}
                    </Badge>
                  </div>
                  {searchLimitStatus.monthlyLimit && searchLimitStatus.monthlyLimit !== -1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">월간 검색 횟수</span>
                      <Badge className={searchLimitStatus.monthlyUsed < searchLimitStatus.monthlyLimit ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" : ""}
                        variant={searchLimitStatus.monthlyUsed < searchLimitStatus.monthlyLimit ? "outline" : "destructive"}>
                        {searchLimitStatus.monthlyUsed} / {searchLimitStatus.monthlyLimit}
                        {searchLimitStatus.purchasedQuota > 0 && ` (+${searchLimitStatus.purchasedQuota})`}
                      </Badge>
                    </div>
                  )}
                </div>
                {searchLimitStatus.dailyLimit !== -1 && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (searchLimitStatus.dailyUsed / searchLimitStatus.dailyLimit) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* API 상태 안내 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <div className="flex">
                <KeenIcon icon="information" className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                <div>
                  <p className="text-blue-700 dark:text-blue-300 font-medium mb-1">N 쇼핑 검색 안내</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    네이버 쇼핑에서 상품의 순위 정보를 검색할 수 있습니다.
                    상품명, 브랜드명 등으로 검색하여 가격, 쇼핑몰, 순위 정보를 확인해보세요.
                  </p>
                </div>
              </div>
            </div>

            {/* API 연결 상태 확인 */}
            {isChecking || isCheckingLimit ? (
              <div className="flex items-center justify-center p-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                <p className="text-muted-foreground">서비스 연결 확인 중...</p>
              </div>
            ) : limitError ? (
              // 검색 제한 서비스 연결 실패
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-6">
                <div className="flex">
                  <KeenIcon icon="shield" className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">검색 제한 서비스 오류</h3>
                    <p className="text-red-700 dark:text-red-400 mb-4">{limitError}</p>
                    <p className="text-sm text-red-600 dark:text-red-500">검색 기능을 사용할 수 없습니다.</p>
                  </div>
                </div>
              </div>
            ) : apiStatus.isAvailable ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="input">
                      <KeenIcon icon="magnifier" className="text-muted-foreground" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="상품명을 입력하세요 (예: 기정떡, 노트북, 화장품)"
                        className="w-full"
                      />
                    </label>
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isLoading || (searchLimitStatus !== null && !searchLimitStatus.canSearch)}
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
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-6">
                <div className="flex">
                  <KeenIcon icon="shield" className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">API 서비스에 연결할 수 없습니다</h3>
                    <p className="text-red-700 dark:text-red-400 mb-4">네이버 쇼핑 검색 서비스에 연결할 수 없습니다. 관리자에게 문의하세요.</p>
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

        <div className="bg-card rounded-lg shadow-sm overflow-hidden border border-border">
          <div className="p-5 border-b">
            <h3 className="text-lg font-medium text-card-foreground">검색 결과</h3>
          </div>

          {/* 데스크톱용 테이블 헤더 */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="table align-middle text-sm w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-muted dark:bg-gray-800/60">
                  <th className="py-3 px-3 text-center font-medium w-[60px]">순위</th>
                  <th className="py-3 px-3 text-center font-medium w-[80px]">이미지</th>
                  <th className="py-3 px-3 text-start font-medium">상품명</th>
                  <th className="py-3 px-3 text-center font-medium w-[120px]">MID</th>
                  <th className="py-3 px-3 text-start font-medium w-[180px]">쇼핑몰</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <h4 className="text-lg font-medium text-foreground mb-2">
                        {searchTerm.trim() === '' ? '검색어를 입력하세요' : '조회된 상품이 없습니다'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {searchTerm.trim() === ''
                          ? '위의 검색창에 찾고자 하는 상품명을 입력해보세요.'
                          : '다른 검색어로 다시 시도해보세요.'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  results.map((item, index) => (
                    <tr
                      key={item.productId || index}
                      className="border-b border-border hover:bg-muted/40"
                    >
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-primary/10 text-primary rounded-full">
                          {item.rank}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-8 h-8 object-cover rounded mx-auto cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => handleImageClick(item.image, item.title)}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 cursor-pointer" onClick={() => handleProductClick(item.link)}>
                        <div className="font-medium text-foreground line-clamp-2">{item.title}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-medium text-success">{item.productId}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-sm">{item.mallName || '-'}</div>
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
                  {searchTerm.trim() === '' ? '검색어를 입력하세요' : '조회된 상품이 없습니다'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {searchTerm.trim() === ''
                    ? '위의 검색창에 찾고자 하는 상품명을 입력해보세요.'
                    : '다른 검색어로 다시 시도해보세요.'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {results.map((item, index) => (
                  <div
                    key={item.productId || index}
                    className="p-4 hover:bg-muted/40"
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium bg-primary/10 text-primary rounded-full flex-shrink-0">
                        {item.rank}
                      </span>
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => handleImageClick(item.image, item.title)}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="cursor-pointer" onClick={() => handleProductClick(item.link)}>
                          <h3 className="font-medium text-foreground text-sm line-clamp-2 mb-1">{item.title}</h3>
                          <div className="text-xs text-muted-foreground">
                            MID: <span className="text-success font-medium">{item.productId}</span> • {item.mallName}
                          </div>
                        </div>
                        <div className="mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddKeyword(item);
                            }}
                            className="btn btn-xs btn-primary"
                            title="내 키워드에 추가"
                          >
                            <KeenIcon icon="plus" className="text-sm me-1" />
                            내키워드로 추가
                          </button>
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

      {/* 키워드 추가 모달 */}
      <AddKeywordModal
        isOpen={isKeywordModalOpen}
        onClose={() => {
          setIsKeywordModalOpen(false);
          setSelectedItemForKeyword(null);
        }}
        defaultData={selectedItemForKeyword ? {
          ...selectedItemForKeyword,
          type: 'shop'
        } : undefined}
      />

      {/* 이미지 확대 모달 - Portal로 body에 직접 렌더링 */}
      {isImageModalOpen && selectedImage && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
          onClick={() => {
            setIsImageModalOpen(false);
            setSelectedImage(null);
          }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImage.src}
              alt={selectedImage.title}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-2 right-2 btn btn-sm btn-light shadow-lg"
              onClick={() => {
                setIsImageModalOpen(false);
                setSelectedImage(null);
              }}
            >
              <KeenIcon icon="cross" className="text-lg" />
            </button>
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <p className="text-white bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg inline-block shadow-lg">
                {selectedImage.title}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </CommonTemplate>
  );
};

export default SearchShopInfo;