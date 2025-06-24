import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KeenIcon } from '@/components';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { shopSearchService } from '@/services/shopSearchService';
import { searchKeywordService } from '@/services/searchKeywordService';
import { shoppingRankService } from '@/services/shoppingRankService';
import { useAuthContext } from '@/auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Keyword {
  id: string;
  keyword: string;
  pc_count: number;
  mobile_count: number;
  total_count: number;
  currentRank?: number;
  lastChecked?: Date;
}

interface RankingData {
  keyword: string;
  timestamp: Date;
  items: ShopItem[];
  totalItems: number;
}

interface ShopItem {
  rank: number;
  title: string;
  link: string;
  image: string;
  lprice: string;
  hprice: string;
  mallName: string;
  productId: string;
  productType: string;
  brand: string;
  maker: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
}

const ShoppingRankingPage: React.FC = () => {
  const { currentUser } = useAuthContext();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string>('');
  const [selectedKeywordId, setSelectedKeywordId] = useState<string>('');
  const [rankingData, setRankingData] = useState<RankingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'current' | 'hourly' | 'daily'>('current');
  const [dbRankingData, setDbRankingData] = useState<any[]>([]);

  // search_keywords 테이블에서 키워드 목록 가져오기
  useEffect(() => {
    const fetchKeywords = async () => {
      if (!currentUser?.id) return;
      
      try {
        const data = await searchKeywordService.getUserKeywords(currentUser.id);
        setKeywords(data.map(item => ({
          id: item.id || '',
          keyword: item.keyword,
          pc_count: item.pc_count,
          mobile_count: item.mobile_count,
          total_count: item.total_count,
        })));
      } catch (error) {
        console.error('키워드 조회 실패:', error);
        alert('키워드 목록을 불러오는데 실패했습니다.');
      }
    };

    fetchKeywords();
  }, [currentUser]);

  // DB에서 순위 데이터 로드
  const loadDbRankingData = async () => {
    if (!selectedKeywordId) return;
    
    try {
      let data = [];
      switch (viewMode) {
        case 'current':
          data = await shoppingRankService.getCurrentRankings(selectedKeywordId);
          break;
        case 'hourly':
          data = await shoppingRankService.getHourlyRankings(selectedKeywordId);
          break;
        case 'daily':
          data = await shoppingRankService.getDailyRankings(selectedKeywordId);
          break;
      }
      setDbRankingData(data);
    } catch (error) {
      console.error('DB 데이터 조회 실패:', error);
    }
  };

  // 뷰 모드 변경시 데이터 로드
  useEffect(() => {
    if (selectedKeywordId) {
      loadDbRankingData();
    }
  }, [viewMode, selectedKeywordId]);

  // 키워드 선택 핸들러
  const handleKeywordSelect = (keyword: string) => {
    setSelectedKeyword(keyword);
    const keywordData = keywords.find(k => k.keyword === keyword);
    if (keywordData?.id) {
      setSelectedKeywordId(keywordData.id);
    }
  };

  // 선택된 키워드의 전체 상품 순위 조회
  const checkCurrentRanking = async () => {
    if (!selectedKeyword) {
      alert('키워드를 선택해주세요');
      return;
    }

    setLoading(true);
    try {
      // 네이버 쇼핑 API 호출 (100개 상품 조회)
      const response = await shopSearchService.searchShop(selectedKeyword, 100);
      
      if (!response) {
        alert('검색 결과를 받지 못했습니다');
        return;
      }
      
      // 전체 상품 목록을 저장
      const newRankingData: RankingData = {
        keyword: selectedKeyword,
        timestamp: new Date(),
        items: response.items || [],
        totalItems: response.total || 0,
      };

      setRankingData(prev => [newRankingData, ...prev]);
      
      // DB에 저장
      if (selectedKeywordId && response.items && response.items.length > 0) {
        await shoppingRankService.saveCurrentRankings(selectedKeywordId, response.items);
      }
      
      // 키워드 정보 업데이트
      setKeywords(prev => prev.map(k => 
        k.keyword === selectedKeyword 
          ? { ...k, lastChecked: new Date() }
          : k
      ));

      alert(`총 ${response.items?.length || 0}개 상품의 순위를 조회했습니다`);
      
      // DB에서 최신 데이터 다시 로드
      if (viewMode !== 'current') {
        loadDbRankingData();
      }
    } catch (error) {
      console.error('순위 조회 실패:', error);
      alert('순위 조회에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">쇼핑 순위 모니터링</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">네이버 쇼핑 키워드 순위 추적 테스트</p>
      </div>

      <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-start gap-3">
          <KeenIcon icon="information-2" className="size-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            이 페이지는 개발/테스트 목적으로만 사용됩니다. 실제 순위 추적은 특정 상품 ID를 기준으로 해야 합니다.
          </p>
        </div>
      </div>

      {/* 키워드 선택 영역 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeenIcon icon="search" className="size-5" />
            키워드 선택
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={selectedKeyword} onValueChange={handleKeywordSelect}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="키워드를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {keywords.map(keyword => (
                  <SelectItem key={keyword.id} value={keyword.keyword}>
                    {keyword.keyword}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={checkCurrentRanking} disabled={loading}>
              <KeenIcon icon="refresh" className="size-4 mr-2" />
              {loading ? '조회 중...' : '현재 순위 확인'}
            </Button>
          </div>

          {/* 선택된 키워드 정보 */}
          {selectedKeyword && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">키워드:</span>
                  <span className="ml-2 font-medium">{selectedKeyword}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">검색량:</span>
                  <span className="ml-2 font-medium">
                    {keywords.find(k => k.keyword === selectedKeyword)?.total_count.toLocaleString() || '-'}회
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">최근 조회 상품수:</span>
                  <span className="ml-2 font-medium">
                    {rankingData.find(d => d.keyword === selectedKeyword)?.items.length || '-'}개
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">마지막 확인:</span>
                  <span className="ml-2 font-medium">
                    {keywords.find(k => k.keyword === selectedKeyword)?.lastChecked
                      ? format(keywords.find(k => k.keyword === selectedKeyword)!.lastChecked!, 'MM/dd HH:mm', { locale: ko })
                      : '-'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 뷰 모드 선택 */}
      {selectedKeywordId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeenIcon icon="eye" className="size-5" />
              보기 모드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={viewMode === 'current' ? 'default' : 'outline'}
                onClick={() => setViewMode('current')}
              >
                최신 조회
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'hourly' ? 'default' : 'outline'}
                onClick={() => setViewMode('hourly')}
              >
                시간별
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'daily' ? 'default' : 'outline'}
                onClick={() => setViewMode('daily')}
              >
                일자별
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 최신 조회 결과 (current 모드) */}
      {viewMode === 'current' && rankingData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeenIcon icon="chart-line" className="size-5" />
                최근 조회 결과
              </div>
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                {format(rankingData[0].timestamp, 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <KeenIcon icon="information-3" className="size-4 inline mr-1" />
                키워드: <span className="font-bold">{rankingData[0].keyword}</span> / 
                총 검색 결과: <span className="font-bold">{rankingData[0].totalItems.toLocaleString()}개</span> / 
                표시된 상품: <span className="font-bold">{rankingData[0].items.length}개</span>
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      순위
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      상품명
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      쇼핑몰
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      가격
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      브랜드
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      카테고리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {rankingData[0].items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant="outline">{item.rank}위</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img 
                              src={item.image} 
                              alt={item.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="max-w-md">
                            <a 
                              href={item.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: item.title }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {item.mallName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {parseInt(item.lprice).toLocaleString()}원
                        {item.hprice && item.hprice !== item.lprice && (
                          <span className="text-xs text-gray-500 ml-1">
                            ~ {parseInt(item.hprice).toLocaleString()}원
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {item.brand || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="max-w-xs">
                          {[item.category1, item.category2, item.category3, item.category4]
                            .filter(Boolean)
                            .join(' > ') || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 시간별 순위 데이터 */}
      {viewMode === 'hourly' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeenIcon icon="time" className="size-5" />
              시간별 순위 변화 (최근 24시간)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              // 시간별 데이터를 상품별로 그룹화
              const productMap = new Map<string, any>();
              const hourSet = new Set<number>();
              
              // 현재 시간부터 24시간 전까지의 시간 생성
              const now = new Date();
              const hours = Array.from({ length: 24 }, (_, i) => {
                const hour = new Date(now);
                hour.setHours(now.getHours() - (23 - i));
                hour.setMinutes(0, 0, 0);
                return hour.getHours();
              });
              
              dbRankingData.forEach(item => {
                if (!item.hour) return;
                
                const hour = new Date(item.hour).getHours();
                hourSet.add(hour);
                
                if (!productMap.has(item.product_id)) {
                  productMap.set(item.product_id, {
                    product_id: item.product_id,
                    title: item.title,
                    mall_name: item.mall_name,
                    ranks: {}
                  });
                }
                
                productMap.get(item.product_id).ranks[hour] = item.rank;
              });
              
              const products = Array.from(productMap.values());
              
              if (products.length === 0) {
                return <p className="text-center text-gray-500 py-8">시간별 데이터가 없습니다.</p>;
              }
              
              return (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 dark:bg-gray-800 z-10">
                          상품명
                        </th>
                        {hours.map(hour => (
                          <th key={hour} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            {hour}시
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {products.slice(0, 100).map((product, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 text-sm sticky left-0 bg-white dark:bg-gray-900 z-10">
                            <span dangerouslySetInnerHTML={{ __html: product.title }} className="line-clamp-2" />
                          </td>
                          {hours.map(hour => {
                            const rank = product.ranks[hour];
                            return (
                              <td key={hour} className="px-3 py-3 text-center">
                                {rank ? (
                                  <Badge 
                                    variant={rank <= 10 ? 'default' : 'outline'} 
                                    className={`text-xs ${rank <= 10 ? 'bg-blue-500' : ''}`}
                                  >
                                    {rank}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* 일별 순위 데이터 */}
      {viewMode === 'daily' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeenIcon icon="calendar" className="size-5" />
              일별 순위 변화 (최근 30일)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              // 일별 데이터를 상품별로 그룹화
              const productMap = new Map<string, any>();
              const dateSet = new Set<string>();
              
              // 최근 30일 날짜 생성
              const dates = Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (29 - i));
                return format(date, 'yyyy-MM-dd');
              });
              
              dbRankingData.forEach(item => {
                if (!item.date) return;
                
                const dateStr = format(new Date(item.date), 'yyyy-MM-dd');
                dateSet.add(dateStr);
                
                if (!productMap.has(item.product_id)) {
                  productMap.set(item.product_id, {
                    product_id: item.product_id,
                    title: item.title,
                    mall_name: item.mall_name,
                    ranks: {}
                  });
                }
                
                productMap.get(item.product_id).ranks[dateStr] = item.rank;
              });
              
              const products = Array.from(productMap.values());
              const validDates = dates.filter(date => dateSet.has(date));
              
              if (products.length === 0) {
                return <p className="text-center text-gray-500 py-8">일별 데이터가 없습니다.</p>;
              }
              
              return (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 dark:bg-gray-800 z-10">
                          상품명
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          쇼핑몰
                        </th>
                        {validDates.map(date => (
                          <th key={date} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            {format(new Date(date), 'MM/dd')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {products.slice(0, 100).map((product, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 text-sm sticky left-0 bg-white dark:bg-gray-900 z-10">
                            <span dangerouslySetInnerHTML={{ __html: product.title }} className="line-clamp-2" />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {product.mall_name || '-'}
                          </td>
                          {validDates.map(date => {
                            const rank = product.ranks[date];
                            return (
                              <td key={date} className="px-3 py-3 text-center">
                                {rank ? (
                                  <Badge 
                                    variant={rank <= 10 ? 'default' : 'outline'} 
                                    className={`text-xs ${rank <= 10 ? 'bg-blue-500' : ''}`}
                                  >
                                    {rank}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* 데이터 없음 표시 */}
      {((viewMode === 'current' && rankingData.length === 0) || 
        ((viewMode === 'hourly' || viewMode === 'daily') && dbRankingData.length === 0)) && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">
              {keywords.length === 0 
                ? 'search_keywords 테이블에 저장된 키워드가 없습니다.' 
                : '데이터가 없습니다. 키워드를 선택하고 조회해주세요.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShoppingRankingPage;