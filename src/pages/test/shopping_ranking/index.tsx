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
  const [dbLoading, setDbLoading] = useState(false);
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
    
    setDbLoading(true);
    try {
      let data = [];
      switch (viewMode) {
        case 'current':
          data = await shoppingRankService.getCurrentRankings(selectedKeywordId);
          break;
        case 'hourly':
          data = await shoppingRankService.getHourlyRankings(selectedKeywordId);
          // 시간별 데이터를 최신순으로 정렬
          data = data.sort((a, b) => new Date(b.hour).getTime() - new Date(a.hour).getTime());
          break;
        case 'daily':
          data = await shoppingRankService.getDailyRankings(selectedKeywordId);
          // 일별 데이터를 최신순으로 정렬
          data = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          break;
      }
      setDbRankingData(data);
      
      if (data.length === 0) {
        console.warn(`${viewMode} 데이터가 없습니다. keyword_id: ${selectedKeywordId}`);
      }
    } catch (error) {
      console.error('DB 데이터 조회 실패:', error);
      alert('데이터 조회에 실패했습니다.');
    } finally {
      setDbLoading(false);
    }
  };

  // 뷰 모드 변경시 자동 데이터 로드 제거 (사용자가 수동으로 조회)

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
            {/* API 호출 버튼 숨김 처리 */}
            {false && (
              <Button onClick={checkCurrentRanking} disabled={loading}>
                <KeenIcon icon="refresh" className="size-4 mr-2" />
                {loading ? '조회 중...' : '현재 순위 확인'}
              </Button>
            )}
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
            <div className="flex gap-2 items-center flex-wrap">
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
              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadDbRankingData}
                  disabled={!selectedKeywordId || dbLoading}
                >
                  <KeenIcon icon={dbLoading ? "loading" : "database"} className={`size-4 mr-2 ${dbLoading ? "animate-spin" : ""}`} />
                  {dbLoading ? '조회 중...' : '기존 데이터 조회'}
                </Button>
              </div>
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

      {/* DB에서 조회한 현재 순위 데이터 */}
      {viewMode === 'current' && dbRankingData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeenIcon icon="database" className="size-5" />
              현재 순위 (DB 저장 데이터)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 순위 변동 범례 */}
            <div className="mb-4 flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <span className="text-green-600 font-bold">▲</span>
                <span>순위 상승</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-red-600 font-bold">▼</span>
                <span>순위 하락</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs">신규</Badge>
                <span>신규 진입</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="bg-green-100 text-green-600 px-1 py-0.5 rounded text-xs font-bold">10↑</span>
                <span>10계단 이상 변동</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-4 h-4 bg-blue-50 rounded"></span>
                <span>상위 10위</span>
              </div>
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
                      이전 순위
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      수집일시
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {dbRankingData.map((item, idx) => {
                    // 순위 변동 계산
                    const rankChange = item.prev_rank ? item.prev_rank - item.rank : 0;
                    const isTop10 = item.rank <= 10;
                    const isBigJump = Math.abs(rankChange) >= 10;
                    
                    return (
                      <tr key={idx} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${isTop10 ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              item.prev_rank && item.prev_rank > item.rank ? "secondary" : 
                              item.prev_rank && item.prev_rank < item.rank ? "destructive" : 
                              "outline"
                            }
                          >
                            {item.rank}위
                          </Badge>
                          {/* 순위 변동 인디케이터 */}
                          {item.prev_rank && item.prev_rank !== item.rank && (
                            <div className={`text-xs font-bold ${
                              item.prev_rank > item.rank ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {item.prev_rank > item.rank ? '↑' : '↓'}
                            </div>
                          )}
                        </div>
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
                        {item.mall_name || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {item.lprice ? parseInt(item.lprice).toLocaleString() + '원' : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {item.brand || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {item.prev_rank ? (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">{item.prev_rank}위</span>
                            {item.prev_rank > item.rank && (
                              <div className="flex items-center gap-1">
                                <span className="text-green-600 font-bold">▲</span>
                                <span className={`text-xs font-medium ${
                                  isBigJump ? 'text-green-600 bg-green-100 px-1 py-0.5 rounded font-bold' : 'text-green-600'
                                }`}>
                                  {item.prev_rank - item.rank}
                                </span>
                              </div>
                            )}
                            {item.prev_rank < item.rank && (
                              <div className="flex items-center gap-1">
                                <span className="text-red-600 font-bold">▼</span>
                                <span className={`text-xs font-medium ${
                                  isBigJump ? 'text-red-600 bg-red-100 px-1 py-0.5 rounded font-bold' : 'text-red-600'
                                }`}>
                                  {item.rank - item.prev_rank}
                                </span>
                              </div>
                            )}
                            {item.prev_rank === item.rank && (
                              <span className="text-gray-400 text-xs">유지</span>
                            )}
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-xs">신규</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.collected_at ? format(new Date(item.collected_at), 'MM/dd HH:mm', { locale: ko }) : '-'}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 시간별 순위 데이터 */}
      {viewMode === 'hourly' && dbRankingData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeenIcon icon="time" className="size-5" />
                시간별 순위 변화 (최근 24시간)
              </div>
              {dbRankingData.length > 0 && (
                <div className="text-sm font-normal text-gray-600">
                  데이터 수집 시간대: {(() => {
                    const hours = new Set();
                    dbRankingData.forEach(item => {
                      if (item.hour) {
                        hours.add(new Date(item.hour).getHours());
                      }
                    });
                    const sortedHours = Array.from(hours).sort((a: any, b: any) => a - b);
                    return `${sortedHours[0]}시 ~ ${sortedHours[sortedHours.length - 1]}시`;
                  })()}
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              
              // 시간별 데이터를 상품별로 그룹화
              const productMap = new Map<string, any>();
              const hourList = []; // 실제 데이터가 있는 시간 목록
              
              // 시간별로 그룹화하여 실제 존재하는 시간 찾기
              const hourGroups = new Map<string, any[]>();
              dbRankingData.forEach(item => {
                if (!item.hour) return;
                const hourKey = item.hour;
                if (!hourGroups.has(hourKey)) {
                  hourGroups.set(hourKey, []);
                }
                hourGroups.get(hourKey)!.push(item);
              });
              
              // 시간 목록을 최신순으로 정렬
              const sortedHours = Array.from(hourGroups.keys()).sort((a, b) => 
                new Date(b).getTime() - new Date(a).getTime()
              );
              
              
              // 실제 데이터가 있는 시간대만 표시
              let displayHours;
              
              if (sortedHours.length > 0) {
                // 데이터가 있는 시간대만 사용
                displayHours = sortedHours.map(h => new Date(h).toISOString());
                console.log('실제 데이터가 있는 시간대 개수:', displayHours.length);
                console.log('실제 데이터가 있는 시간대:', displayHours.slice(0, 10).map(h => {
                  const d = new Date(h);
                  return format(d, 'MM/dd HH시', { locale: ko });
                }));
              } else {
                // 데이터가 없으면 현재 시간 기준 24시간
                const now = new Date();
                now.setMinutes(0);
                now.setSeconds(0);
                now.setMilliseconds(0);
                
                const fullHours = [];
                for (let i = 0; i < 24; i++) {
                  const hourDate = new Date(now);
                  hourDate.setHours(hourDate.getHours() - i);
                  fullHours.push(hourDate.toISOString());
                }
                displayHours = fullHours;
              }
              
              // 실제 데이터가 있는 시간을 표시하기 위해 Set 생성
              const dataHourSet = new Set(displayHours);
              
              // 상품별로 데이터 구성
              let processedCount = 0;
              dbRankingData.forEach(item => {
                if (!item.hour) return;
                
                processedCount++;
                
                if (!productMap.has(item.product_id)) {
                  productMap.set(item.product_id, {
                    product_id: item.product_id,
                    title: item.title,
                    mall_name: item.mall_name,
                    ranks: {},
                    prevRanks: {} // 이전 순위 저장
                  });
                }
                
                const product = productMap.get(item.product_id);
                // hour를 Date 객체로 변환한 후 다시 ISO 문자열로 통일
                const normalizedHour = new Date(item.hour).toISOString();
                product.ranks[normalizedHour] = item.rank;
                
                // 이전 시간의 순위 찾기
                const currentHourIndex = sortedHours.indexOf(item.hour);
                if (currentHourIndex < sortedHours.length - 1) {
                  const prevHour = sortedHours[currentHourIndex + 1];
                  const prevData = hourGroups.get(prevHour)?.find(d => d.product_id === item.product_id);
                  if (prevData) {
                    product.prevRanks[normalizedHour] = prevData.rank;
                  }
                }
              });
              
              const products = Array.from(productMap.values());
              
              if (products.length === 0) {
                return (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">시간별 데이터가 없습니다.</p>
                    <p className="text-sm text-gray-400">"기존 데이터 조회" 버튼을 클릭하여 데이터를 불러오세요.</p>
                  </div>
                );
              }
              
              // 표시할 시간 개수에 따른 상품명 칸 너비 계산
              const hourCount = displayHours.length;
              const productNameWidth = hourCount > 12 ? 'min-w-[120px] max-w-[150px]' : 
                                     hourCount > 8 ? 'min-w-[150px] max-w-[200px]' : 
                                     'min-w-[180px] max-w-[250px]';
              
              return (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 ${productNameWidth}`}>
                          상품명
                        </th>
                        {displayHours.map((hour, index) => {
                          const isCurrentHour = index === 0;
                          const hourDate = new Date(hour);
                          return (
                            <th key={hour} className={`px-2 py-3 text-center text-xs font-medium uppercase min-w-[80px] ${
                              isCurrentHour ? 'text-blue-600 bg-blue-50' : 
                              dataHourSet.has(hour) ? 'text-gray-700' : 'text-gray-400'
                            }`}>
                              <div className="text-[10px]">{format(hourDate, 'MM/dd', { locale: ko })}</div>
                              <div>{hourDate.getHours()}시</div>
                              {isCurrentHour && <div className="text-[10px] text-blue-500">최신</div>}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {products.slice(0, 100).map((product, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className={`px-4 py-3 text-sm sticky left-0 bg-white dark:bg-gray-900 z-10 ${productNameWidth}`}>
                            <div className="truncate" title={product.title.replace(/<[^>]*>/g, '')}>
                              <span dangerouslySetInnerHTML={{ __html: product.title }} />
                            </div>
                          </td>
                          {displayHours.map(hour => {
                            const rank = product.ranks[hour];
                            const prevRank = product.prevRanks[hour];
                            const rankChange = prevRank ? prevRank - rank : 0;
                            const hasData = dataHourSet.has(hour);
                            
                            return (
                              <td key={hour} className={`px-1 py-2 text-center min-w-[80px] ${
                                !hasData ? 'bg-gray-50 dark:bg-gray-800' : ''
                              }`}>
                                {rank ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <Badge 
                                      variant={
                                        prevRank && prevRank > rank ? 'secondary' : 
                                        prevRank && prevRank < rank ? 'destructive' : 
                                        rank <= 10 ? 'default' : 'outline'
                                      } 
                                      className={`text-xs ${rank <= 10 && !prevRank ? 'bg-blue-500' : ''}`}
                                    >
                                      {rank}
                                    </Badge>
                                    {prevRank && rankChange !== 0 && (
                                      <span className={`text-[10px] font-bold ${
                                        rankChange > 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {rankChange > 0 ? `↑${rankChange}` : `↓${Math.abs(rankChange)}`}
                                      </span>
                                    )}
                                    {!prevRank && rank && (
                                      <span className="text-[10px] text-blue-600 font-medium whitespace-nowrap">신규</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-300">-</span>
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
              const dateGroups = new Map<string, any[]>();
              
              // 날짜별로 그룹화
              dbRankingData.forEach(item => {
                if (!item.date) return;
                const dateKey = item.date;
                if (!dateGroups.has(dateKey)) {
                  dateGroups.set(dateKey, []);
                }
                dateGroups.get(dateKey)!.push(item);
              });
              
              // 날짜 목록을 최신순으로 정렬
              const sortedDates = Array.from(dateGroups.keys()).sort((a, b) => 
                new Date(b).getTime() - new Date(a).getTime()
              );
              
              // 상품별로 데이터 구성
              dbRankingData.forEach(item => {
                if (!item.date) return;
                
                if (!productMap.has(item.product_id)) {
                  productMap.set(item.product_id, {
                    product_id: item.product_id,
                    title: item.title,
                    mall_name: item.mall_name,
                    ranks: {},
                    prevRanks: {} // 이전 순위 저장
                  });
                }
                
                const product = productMap.get(item.product_id);
                product.ranks[item.date] = item.rank;
                
                // 이전 날짜의 순위 찾기
                const currentDateIndex = sortedDates.indexOf(item.date);
                if (currentDateIndex < sortedDates.length - 1) {
                  const prevDate = sortedDates[currentDateIndex + 1];
                  const prevData = dateGroups.get(prevDate)?.find(d => d.product_id === item.product_id);
                  if (prevData) {
                    product.prevRanks[item.date] = prevData.rank;
                  }
                }
              });
              
              const products = Array.from(productMap.values());
              
              if (products.length === 0) {
                return <p className="text-center text-gray-500 py-8">일별 데이터가 없습니다.</p>;
              }
              
              // 표시할 날짜 개수에 따른 상품명 칸 너비 계산
              const dateCount = Math.min(sortedDates.length, 30);
              const productNameWidth = dateCount > 15 ? 'min-w-[150px] max-w-[200px]' : 
                                     dateCount > 10 ? 'min-w-[200px] max-w-[250px]' : 
                                     'min-w-[250px] max-w-[350px]';
              
              return (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 ${productNameWidth}`}>
                          상품명
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[100px]">
                          쇼핑몰
                        </th>
                        {sortedDates.slice(0, 30).map((date, index) => {
                          // 최신 날짜인지 확인
                          const isToday = index === 0;
                          return (
                            <th key={date} className={`px-2 py-3 text-center text-xs font-medium uppercase min-w-[50px] ${isToday ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}>
                              <div>{format(new Date(date), 'MM/dd')}</div>
                              {isToday && <div className="text-[10px] text-blue-500">최신</div>}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {products.slice(0, 100).map((product, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className={`px-4 py-3 text-sm sticky left-0 bg-white dark:bg-gray-900 z-10 ${productNameWidth}`}>
                            <div className="truncate" title={product.title.replace(/<[^>]*>/g, '')}>
                              <span dangerouslySetInnerHTML={{ __html: product.title }} />
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm min-w-[100px]">
                            {product.mall_name || '-'}
                          </td>
                          {sortedDates.slice(0, 30).map(date => {
                            const rank = product.ranks[date];
                            const prevRank = product.prevRanks[date];
                            const rankChange = prevRank ? prevRank - rank : 0;
                            
                            return (
                              <td key={date} className="px-1 py-2 text-center min-w-[50px]">
                                {rank ? (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <Badge 
                                      variant={
                                        prevRank && prevRank > rank ? 'secondary' : 
                                        prevRank && prevRank < rank ? 'destructive' : 
                                        rank <= 10 ? 'default' : 'outline'
                                      } 
                                      className={`text-xs ${rank <= 10 && !prevRank ? 'bg-blue-500' : ''}`}
                                    >
                                      {rank}
                                    </Badge>
                                    {prevRank && rankChange !== 0 && (
                                      <div className={`text-xs font-bold ${
                                        rankChange > 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {rankChange > 0 ? `↑${rankChange}` : `↓${Math.abs(rankChange)}`}
                                      </div>
                                    )}
                                    {!prevRank && rank && (
                                      <div className="text-xs text-blue-600">신규</div>
                                    )}
                                  </div>
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
      {((viewMode === 'current' && rankingData.length === 0 && dbRankingData.length === 0) || 
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