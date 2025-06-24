import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/auth';
import { USER_ROLES } from '@/config/roles.config';
import { Navigate } from 'react-router-dom';
import { CommonTemplate } from '@/components/pageTemplate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomToast } from '@/hooks/useCustomToast';
import { naverSearchAdWorkerService } from '@/services/naverSearchAdWorkerService';
import { searchAdApiKeyService } from '@/services/searchAdApiKeyService';
import { searchKeywordService, type SearchKeyword } from '@/services/searchKeywordService';
import { KeenIcon } from '@/components';
import { cn } from '@/lib/utils';
import { Loader2, Eye, EyeOff, Save, Trash2, Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface KeywordResult {
  keyword: string;
  pc: number;
  mobile: number;
  total: number;
  pcRatio: number;
  mobileRatio: number;
}

interface ApiKeyConfig {
  apiKey: string;
  secretKey: string;
  customerId: string;
}

const KeywordToolPage: React.FC = () => {
  const { currentUser } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();
  const [keywords, setKeywords] = useState<string>('');
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [savedKeywords, setSavedKeywords] = useState<SearchKeyword[]>([]);
  const [savedSearchQuery, setSavedSearchQuery] = useState('');
  const [selectedSavedKeywords, setSelectedSavedKeywords] = useState<Set<string>>(new Set());
  
  // results가 변경될 때마다 로그
  useEffect(() => {
    console.log('현재 results state:', results);
  }, [results]);
  
  // 저장된 키워드 불러오기 함수
  const loadSavedKeywords = async () => {
    if (!currentUser?.id) return;
    
    try {
      const keywords = await searchKeywordService.getUserKeywords(currentUser.id);
      setSavedKeywords(keywords);
    } catch (error) {
      console.error('저장된 키워드 로드 실패:', error);
    }
  };

  // 저장된 키워드 불러오기 (컴포넌트 초기화 시)
  useEffect(() => {
    if (currentUser?.id) {
      loadSavedKeywords();
    }
  }, [currentUser?.id]);
  
  // 모달이 열릴 때도 최신 데이터 불러오기
  useEffect(() => {
    if (showSavedModal && currentUser?.id) {
      loadSavedKeywords();
      setSelectedSavedKeywords(new Set()); // 모달 열릴 때 선택 초기화
    }
  }, [showSavedModal]);
  
  const [loading, setLoading] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  
  // API 설정 상태
  const [apiConfig, setApiConfig] = useState<ApiKeyConfig>({
    apiKey: '',
    secretKey: '',
    customerId: ''
  });
  const [isUsingCustomApi, setIsUsingCustomApi] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [hasLoadedApiKey, setHasLoadedApiKey] = useState(false);

  // 운영자 또는 개발자만 접근 가능
  if (!currentUser || (currentUser.role !== USER_ROLES.OPERATOR && currentUser.role !== USER_ROLES.DEVELOPER)) {
    return <Navigate to="/" replace />;
  }

  // 저장된 API 키 불러오기
  useEffect(() => {
    if (currentUser && !hasLoadedApiKey) {
      // 약간의 딜레이를 주어 초기화 완료 후 실행
      setTimeout(() => {
        loadSavedApiKey();
      }, 100);
    }
  }, [currentUser, hasLoadedApiKey]);

  const loadSavedApiKey = async () => {
    console.log('loadSavedApiKey 호출됨');
    try {
      if (!currentUser?.id) {
        console.log('currentUser.id가 없음');
        return;
      }
      
      console.log('API 키 조회 시작:', currentUser.id);
      const savedKey = await searchAdApiKeyService.getActiveApiKey(currentUser.id);
      console.log('조회 결과:', savedKey);
      
      if (savedKey) {
        setApiConfig({
          apiKey: savedKey.api_key,
          secretKey: savedKey.secret_key,
          customerId: savedKey.customer_id
        });
        setIsUsingCustomApi(true);
        console.log('API 키 로드 완료');
      } else {
        console.log('저장된 API 키 없음');
      }
      setHasLoadedApiKey(true);
    } catch (error) {
      console.error('API 키 불러오기 실패:', error);
      setHasLoadedApiKey(true);
    }
  };

  // API 키 저장
  const handleSaveApiKey = async () => {
    if (!apiConfig.apiKey || !apiConfig.secretKey || !apiConfig.customerId) {
      showError('모든 API 설정을 입력해주세요.');
      return;
    }
    
    if (!currentUser?.id) {
      showError('사용자 정보를 확인할 수 없습니다.');
      return;
    }

    setSavingApiKey(true);
    try {
      await searchAdApiKeyService.saveApiKey(currentUser.id, apiConfig);
      showSuccess('API 키가 저장되었습니다.');
      setIsUsingCustomApi(true);
    } catch (error) {
      console.error('API 키 저장 실패:', error);
      showError('API 키 저장에 실패했습니다.');
    } finally {
      setSavingApiKey(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!keywords.trim()) {
      showError('키워드를 입력해주세요.');
      return;
    }

    // 사용자 정의 API를 사용하는 경우 필수 필드 검증
    if (isUsingCustomApi) {
      if (!apiConfig.apiKey || !apiConfig.secretKey || !apiConfig.customerId) {
        showError('API 설정을 모두 입력해주세요.');
        return;
      }
    }

    setLoading(true);
    setResults([]);

    try {
      const keywordList = keywords
        .split('\n')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const analysisResults: KeywordResult[] = [];

      // 사용자 정의 API 설정이 있으면 적용
      if (isUsingCustomApi) {
        naverSearchAdWorkerService.setApiConfig(apiConfig);
      }

      for (const keyword of keywordList) {
        try {
          const results = await naverSearchAdWorkerService.analyzeKeyword(keyword);
          
          if (results && results.length > 0) {
            // 모든 결과를 추가
            analysisResults.push(...results.map(result => ({
              keyword: result.keyword,
              pc: result.pc,
              mobile: result.mobile,
              total: result.total,
              pcRatio: result.pcRatio,
              mobileRatio: result.mobileRatio
            })));
          }
        } catch (error) {
          console.error(`키워드 분석 실패: ${keyword}`, error);
        }
      }

      // 중복 키워드 제거 (같은 키워드가 여러 번 나올 수 있음)
      const uniqueResults = analysisResults.reduce((acc: KeywordResult[], current) => {
        const exists = acc.find(item => item.keyword === current.keyword);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      console.log('분석 결과 (중복 제거 전):', analysisResults);
      console.log('분석 결과 (중복 제거 후):', uniqueResults);
      console.log('결과 개수:', uniqueResults.length);
      
      setResults(uniqueResults);
      
      if (uniqueResults.length > 0) {
        showSuccess(`${uniqueResults.length}개의 키워드 분석이 완료되었습니다.`);
      } else {
        showError('키워드 분석 결과가 없습니다.');
      }
    } catch (error) {
      console.error('키워드 분석 중 오류:', error);
      showError('키워드 분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      
      // 기본 API 설정으로 복원
      if (isUsingCustomApi) {
        naverSearchAdWorkerService.resetApiConfig();
      }
    }
  };

  const handleReset = () => {
    setKeywords('');
    setResults([]);
    setSelectedKeywords(new Set());
  };
  
  // 체크박스 핸들러
  const handleCheckboxChange = (keyword: string) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(keyword)) {
      newSelected.delete(keyword);
    } else {
      newSelected.add(keyword);
    }
    setSelectedKeywords(newSelected);
  };
  
  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedKeywords.size === results.length) {
      setSelectedKeywords(new Set());
    } else {
      setSelectedKeywords(new Set(results.map(r => r.keyword)));
    }
  };
  
  // 키워드가 이미 저장되어 있는지 확인
  const isKeywordSaved = (keyword: string): boolean => {
    return savedKeywords.some(saved => saved.keyword === keyword);
  };

  // 선택된 키워드 저장
  const handleSaveSelected = async () => {
    if (!currentUser?.id) {
      showError('로그인이 필요합니다.');
      return;
    }

    const selectedResults = results.filter(r => selectedKeywords.has(r.keyword));
    if (selectedResults.length === 0) {
      showError('선택된 키워드가 없습니다.');
      return;
    }
    
    try {
      // DB에서 이미 저장된 키워드 확인
      const existingKeywords = await searchKeywordService.checkExistingKeywords(
        currentUser.id, 
        selectedResults.map(r => r.keyword)
      );
      
      // 중복되지 않은 키워드만 필터링
      const newKeywords = selectedResults.filter(result => 
        !existingKeywords.includes(result.keyword)
      );
      
      if (newKeywords.length === 0) {
        showError('선택된 키워드가 모두 이미 저장되어 있습니다.');
        return;
      }
      
      // DB에 저장
      await searchKeywordService.saveKeywords(currentUser.id, newKeywords);
      
      // 저장된 키워드 목록 새로고침
      await loadSavedKeywords();
      
      console.log('새로 저장할 키워드:', newKeywords.map(k => k.keyword));
      console.log('선택된 키워드:', selectedResults.map(k => k.keyword));
      console.log('이미 존재하는 키워드:', existingKeywords);
      
      showSuccess(`${newKeywords.length}개의 키워드를 저장했습니다.`);
      
      // 저장 후 선택 초기화
      setSelectedKeywords(new Set());
    } catch (error) {
      console.error('키워드 저장 실패:', error);
      showError('키워드 저장에 실패했습니다.');
    }
  };
  
  // 저장된 키워드 삭제
  const handleDeleteSaved = async (keywordToDelete: string) => {
    if (!currentUser?.id) {
      showError('로그인이 필요합니다.');
      return;
    }

    try {
      await searchKeywordService.deleteKeywordByText(currentUser.id, keywordToDelete);
      await loadSavedKeywords();
      showSuccess('키워드가 삭제되었습니다.');
    } catch (error) {
      console.error('키워드 삭제 실패:', error);
      showError('키워드 삭제에 실패했습니다.');
    }
  };
  
  // 필터링된 저장 키워드
  const filteredSavedKeywords = savedKeywords.filter(k => 
    k.keyword.toLowerCase().includes(savedSearchQuery.toLowerCase())
  );

  // 저장된 키워드 체크박스 핸들러
  const handleSavedCheckboxChange = (keyword: string) => {
    const newSelected = new Set(selectedSavedKeywords);
    if (newSelected.has(keyword)) {
      newSelected.delete(keyword);
    } else {
      newSelected.add(keyword);
    }
    setSelectedSavedKeywords(newSelected);
  };
  
  // 저장된 키워드 전체 선택/해제
  const handleSelectAllSaved = () => {
    if (selectedSavedKeywords.size === filteredSavedKeywords.length) {
      setSelectedSavedKeywords(new Set());
    } else {
      setSelectedSavedKeywords(new Set(filteredSavedKeywords.map(k => k.keyword)));
    }
  };
  
  // 선택된 저장 키워드들 삭제
  const handleDeleteSelectedSaved = async () => {
    if (!currentUser?.id) {
      showError('로그인이 필요합니다.');
      return;
    }

    if (selectedSavedKeywords.size === 0) {
      showError('삭제할 키워드를 선택해주세요.');
      return;
    }
    
    if (confirm(`선택된 ${selectedSavedKeywords.size}개의 키워드를 삭제하시겠습니까?`)) {
      try {
        // 선택된 키워드들의 ID 찾기
        const keywordsToDelete = savedKeywords
          .filter(k => selectedSavedKeywords.has(k.keyword))
          .map(k => k.id!)
          .filter(id => id);

        if (keywordsToDelete.length > 0) {
          await searchKeywordService.deleteKeywords(currentUser.id, keywordsToDelete);
          await loadSavedKeywords();
          setSelectedSavedKeywords(new Set());
          showSuccess(`${selectedSavedKeywords.size}개의 키워드가 삭제되었습니다.`);
        }
      } catch (error) {
        console.error('키워드 삭제 실패:', error);
        showError('키워드 삭제에 실패했습니다.');
      }
    }
  };

  return (
    <CommonTemplate>
      <div className="w-full max-w-[1600px] mx-auto px-4">
        {/* 하나의 카드에 두 섹션을 나란히 배치 */}
        <Card>
        <CardHeader>
          <CardTitle>키워드 분석 도구</CardTitle>
        </CardHeader>
        <CardContent className="p-6 lg:p-8">
          <div className="grid grid-cols-2 gap-6">
            {/* API 설정 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">API 설정</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isUsingCustomApi) {
                    setIsUsingCustomApi(false);
                    setApiConfig({
                      apiKey: '',
                      secretKey: '',
                      customerId: ''
                    });
                  } else {
                    setIsUsingCustomApi(true);
                    if (currentUser?.id) {
                      loadSavedApiKey();
                    }
                  }
                }}
              >
                {isUsingCustomApi ? '기본 API 사용' : '사용자 API 사용'}
              </Button>
              </div>
            {isUsingCustomApi ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="customerId">Customer ID</Label>
                    <Input
                      id="customerId"
                      type="text"
                      value={apiConfig.customerId}
                      onChange={(e) => setApiConfig(prev => ({ ...prev, customerId: e.target.value }))}
                      placeholder="1417905"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="text"
                      value={apiConfig.apiKey}
                      onChange={(e) => setApiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="API 키를 입력하세요"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="secretKey">Secret Key</Label>
                    <div className="relative">
                      <Input
                        id="secretKey"
                        type={showSecretKey ? "text" : "password"}
                        value={apiConfig.secretKey}
                        onChange={(e) => setApiConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                        placeholder="Secret Key를 입력하세요"
                        className="mt-1 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      >
                        {showSecretKey ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
                
                <Button
                  type="button"
                  onClick={handleSaveApiKey}
                  disabled={savingApiKey || !apiConfig.apiKey || !apiConfig.secretKey || !apiConfig.customerId}
                  className="w-full"
                >
                  {savingApiKey ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      API 키 저장
                    </>
                  )}
                </Button>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 API 키를 저장하면 다음 방문 시 자동으로 불러옵니다.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-center flex-1">
                <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <KeenIcon icon="shield-check" className="text-4xl text-gray-400 dark:text-gray-600 mb-4 mx-auto" />
                  <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    기본 API를 사용 중입니다
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    사용자 API를 등록하면 제한 없이 사용할 수 있습니다.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsUsingCustomApi(true);
                      if (currentUser?.id) {
                        loadSavedApiKey();
                      }
                    }}
                  >
                    <KeenIcon icon="plus" className="mr-2" />
                    API 키 등록하기
                  </Button>
                </div>
              </div>
            )}
            </div>

            {/* 구분선 제거 - 간격으로만 구분 */}
            
            {/* 키워드 분석 섹션 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">키워드 입력</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  키워드 입력 (한 줄에 하나씩)
                </label>
                <textarea
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className={cn(
                    "w-full h-64 p-4 border rounded-lg resize-vertical",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500",
                    "dark:bg-gray-800 dark:border-gray-700",
                    "text-base"
                  )}
                  placeholder="키워드를 입력하세요...&#10;예시:&#10;여성 원피스&#10;남성 정장&#10;운동화"
                  disabled={loading}
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="min-w-[120px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    '분석하기'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="destructive"
                  onClick={handleReset}
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  초기화
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowSavedModal(true)}
                  disabled={loading}
                >
                  저장된 키워드 ({savedKeywords.length})
                </Button>
              </div>
            </form>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 분석 결과 - 전체 너비로 표시 */}
      {results.length > 0 && (
        <Card className="mt-5">
          <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b">
            <CardTitle className="flex items-center justify-between">
              <span className="text-xl font-bold">분석 결과 ({results.length}개)</span>
              {selectedKeywords.size > 0 && (
                <Button
                  onClick={handleSaveSelected}
                  size="sm"
                  className="btn btn-success"
                >
                  선택 저장 ({selectedKeywords.size}개)
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* 고정 헤더 */}
            <div className="border border-gray-200 dark:border-gray-700 border-b-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                    <th className="text-center p-4 font-bold w-12 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600">
                      <input
                        type="checkbox"
                        checked={selectedKeywords.size === results.length && results.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="text-left p-4 font-bold bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600">키워드</th>
                    <th className="text-right p-4 font-bold bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600">PC</th>
                    <th className="text-right p-4 font-bold bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600">모바일</th>
                    <th className="text-right p-4 font-bold bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600">합계</th>
                    <th className="text-right p-4 font-bold bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600">PC 비율</th>
                    <th className="text-right p-4 font-bold bg-gray-100 dark:bg-gray-800">모바일 비율</th>
                  </tr>
                </thead>
              </table>
            </div>
            
            {/* 스크롤 가능한 테이블 바디 */}
            <div className="relative max-h-[600px] overflow-auto border border-gray-200 dark:border-gray-700 border-t-0">
              <table className="w-full text-sm">
                <tbody>
                  {results.map((result, index) => (
                    <tr 
                      key={index} 
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="text-center p-3">
                        <input
                          type="checkbox"
                          checked={selectedKeywords.has(result.keyword)}
                          onChange={() => handleCheckboxChange(result.keyword)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          disabled={isKeywordSaved(result.keyword)}
                        />
                      </td>
                      <td className="p-3 font-medium relative">
                        <div className="flex items-center gap-2">
                          <span>{result.keyword}</span>
                          {isKeywordSaved(result.keyword) && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              ✓ 저장됨
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-right p-3">{result.pc.toLocaleString()}</td>
                      <td className="text-right p-3">{result.mobile.toLocaleString()}</td>
                      <td className="text-right p-3 font-semibold">{result.total.toLocaleString()}</td>
                      <td className="text-right p-3">
                        <span className="text-blue-600 dark:text-blue-400">
                          {result.pcRatio.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right p-3">
                        <span className="text-green-600 dark:text-green-400">
                          {result.mobileRatio.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* 하단 요약 정보 */}
            <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-white/95 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950/95 border-t-4 border-gray-300 dark:border-gray-600 p-4 backdrop-blur-sm shadow-2xl z-40">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                  총 {results.length}개 키워드 | 선택: {selectedKeywords.size}개
                </p>
                <div className="flex gap-2">
                  {selectedKeywords.size > 0 && (
                    <Button
                      onClick={handleSaveSelected}
                      size="sm"
                      className="btn btn-success"
                    >
                      선택 항목 저장 ({selectedKeywords.size}개)
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowSavedModal(true)}
                    size="sm"
                    variant="outline"
                    className="border-2"
                  >
                    저장 목록
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 저장된 키워드 관리 모달 */}
      <Dialog open={showSavedModal} onOpenChange={setShowSavedModal}>
        <DialogContent className="max-w-[900px] p-0 overflow-hidden">
          <DialogHeader className="bg-background py-3 px-5">
            <DialogTitle className="text-lg font-medium text-foreground">저장된 키워드 관리</DialogTitle>
          </DialogHeader>
          
          <div className="bg-background flex flex-col h-[85vh] w-full">
            {/* 검색 필터 */}
            <div className="flex-shrink-0 p-5 border-b">
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="키워드 검색..."
                  value={savedSearchQuery}
                  onChange={(e) => setSavedSearchQuery(e.target.value)}
                  className="pl-12 py-3 text-base"
                />
              </div>
            </div>
          
            {/* 저장된 키워드 목록 - 스크롤 가능 영역 */}
            <div className="flex-1 overflow-auto px-5 pb-5">
              <Card className="mt-5">
                <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b">
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-xl font-bold">저장된 키워드 ({filteredSavedKeywords.length}개)</span>
                    {filteredSavedKeywords.length > 0 && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSelectAllSaved}
                        >
                          {selectedSavedKeywords.size === filteredSavedKeywords.length && filteredSavedKeywords.length > 0 ? '전체 해제' : '전체 선택'}
                        </Button>
                        {selectedSavedKeywords.size > 0 && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleDeleteSelectedSaved}
                          >
                            선택 삭제 ({selectedSavedKeywords.size}개)
                          </Button>
                        )}
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
            <CardContent className="p-0">
              {filteredSavedKeywords.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="text-4xl mb-4">📝</div>
                  <div className="text-lg font-medium mb-2">
                    {savedSearchQuery ? '검색 결과가 없습니다.' : '저장된 키워드가 없습니다.'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {!savedSearchQuery && '키워드를 분석하고 체크박스로 선택하여 저장해보세요.'}
                  </div>
                </div>
              ) : (
                <>
                  {/* 고정 헤더 */}
                  <div className="border border-gray-200 dark:border-gray-700 border-b-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                          <th className="text-center p-4 font-bold w-12 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600">
                            <input
                              type="checkbox"
                              checked={selectedSavedKeywords.size === filteredSavedKeywords.length && filteredSavedKeywords.length > 0}
                              onChange={handleSelectAllSaved}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                          </th>
                          <th className="text-left p-4 font-bold bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600">키워드</th>
                          <th className="text-right p-4 font-bold bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600">PC</th>
                          <th className="text-right p-4 font-bold bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600">모바일</th>
                          <th className="text-right p-4 font-bold bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600">합계</th>
                          <th className="text-center p-4 font-bold bg-gray-100 dark:bg-gray-800 w-24">삭제</th>
                        </tr>
                      </thead>
                    </table>
                  </div>
                  
                  {/* 스크롤 가능한 테이블 바디 */}
                  <div className="relative max-h-[400px] overflow-auto border border-gray-200 dark:border-gray-700 border-t-0">
                    <table className="w-full text-sm">
                      <tbody>
                        {filteredSavedKeywords.map((keyword, index) => (
                          <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="text-center p-4 w-12">
                              <input
                                type="checkbox"
                                checked={selectedSavedKeywords.has(keyword.keyword)}
                                onChange={() => handleSavedCheckboxChange(keyword.keyword)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                            </td>
                            <td className="p-4 font-medium">{keyword.keyword}</td>
                            <td className="text-right p-4">{keyword.pc_count?.toLocaleString() || 0}</td>
                            <td className="text-right p-4">{keyword.mobile_count?.toLocaleString() || 0}</td>
                            <td className="text-right p-4 font-semibold">{keyword.total_count?.toLocaleString() || 0}</td>
                            <td className="text-center p-4 w-24">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteSaved(keyword.keyword)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              </CardContent>
              </Card>
            </div>
            
            {/* 모달 하단 버튼 - 고정 영역 */}
            <div className="flex-shrink-0 p-5 border-t bg-background">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">전체 {savedKeywords.length}개</span> 중 <span className="font-semibold">{filteredSavedKeywords.length}개</span> 표시
                </div>
                <div className="flex gap-3">
                  {savedKeywords.length > 0 && (
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        if (!currentUser?.id) {
                          showError('로그인이 필요합니다.');
                          return;
                        }
                        
                        if (confirm('저장된 모든 키워드를 삭제하시겠습니까?')) {
                          try {
                            await searchKeywordService.deleteAllUserKeywords(currentUser.id);
                            await loadSavedKeywords();
                            showSuccess('모든 키워드가 삭제되었습니다.');
                          } catch (error) {
                            console.error('전체 키워드 삭제 실패:', error);
                            showError('키워드 삭제에 실패했습니다.');
                          }
                        }
                      }}
                      className="px-6"
                    >
                      전체 삭제
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSavedModal(false)}
                    className="px-8"
                  >
                    닫기
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </CommonTemplate>
  );
};

export default KeywordToolPage;