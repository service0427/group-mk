import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { keywordService, keywordGroupService } from '@/pages/keyword/services/keywordService';
import { KeywordGroup, KeywordInput } from '@/pages/keyword/types';

interface AddKeywordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultData?: {
    mainKeyword: string;
    mid?: string;
    url?: string;
    type: 'shop' | 'place';
    description?: string;
    additionalInfo?: any;
  };
}

export const AddKeywordModal: React.FC<AddKeywordModalProps> = ({ isOpen, onClose, defaultData }) => {
  const [groups, setGroups] = useState<KeywordGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // 폼 데이터
  const [formData, setFormData] = useState<KeywordInput>({
    mainKeyword: '',
    mid: undefined,
    url: '',
    description: '',
    isActive: true,
    additionalInfo: undefined
  });

  // 그룹 목록 불러오기
  useEffect(() => {
    const loadGroups = async () => {
      setIsLoading(true);
      try {
        const response = await keywordGroupService.getUserGroups();
        if (response.success && response.data) {
          setGroups(response.data as KeywordGroup[]);
          // 기본 그룹 자동 선택
          const defaultGroup = response.data.find((g: KeywordGroup) => g.isDefault);
          if (defaultGroup) {
            setSelectedGroupId(defaultGroup.id);
          }
        }
      } catch (error) {
        toast.error('키워드 그룹을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadGroups();
    }
  }, [isOpen]);

  // defaultData가 있으면 폼 데이터 설정
  useEffect(() => {
    if (defaultData) {
      setFormData(prev => ({
        ...prev,
        mainKeyword: defaultData.mainKeyword,
        mid: defaultData.mid ? parseInt(defaultData.mid) : undefined,
        url: defaultData.url || '',
        description: defaultData.description || '',
        additionalInfo: defaultData.additionalInfo || undefined
      }));
    }
  }, [defaultData]);

  const handleInputChange = (field: keyof KeywordInput, value: string | number | boolean | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaveError(null); // 이전 에러 초기화
    
    if (!selectedGroupId) {
      setSaveError('키워드 그룹을 선택해주세요.');
      return;
    }

    if (!formData.mainKeyword.trim()) {
      setSaveError('메인 키워드를 입력해주세요.');
      return;
    }

    if (!formData.mid) {
      setSaveError(`${defaultData?.type === 'place' ? 'PID' : 'MID'}를 입력해주세요.`);
      return;
    }

    setIsSaving(true);
    try {
      const response = await keywordService.createKeyword(selectedGroupId, formData, defaultData?.type);
      if (response.success) {
        toast.success('키워드가 추가되었습니다.');
        onClose();
      } else {
        setSaveError(response.message || '키워드 추가에 실패했습니다.');
      }
    } catch (error) {
      setSaveError('키워드 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-2xl p-0 overflow-hidden flex flex-col h-[85vh] sm:h-[80vh]">
        <DialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 py-4 px-6 border-b shrink-0">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                내 키워드에 추가
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                검색 결과를 키워드로 저장하여 관리할 수 있습니다
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6 bg-background overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 타입 표시 */}
              {defaultData && (
                <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
                    </svg>
                    검색 정보
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">검색 타입:</span>
                    {defaultData.type === 'shop' ? (
                      <Badge variant="default">N 쇼핑</Badge>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                        N 플레이스
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 그룹 선택 */}
              <div>
                <Label htmlFor="keyword-group" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  키워드 그룹 <span className="text-red-500">*</span>
                </Label>
                <select
                  id="keyword-group"
                  value={selectedGroupId || ''}
                  onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                  className="select w-full"
                  required
                >
                  <option value="">그룹을 선택하세요</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                      {group.campaignName && ` (${group.campaignName})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* 메인 키워드와 MID/PID 같은 라인 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 메인 키워드 */}
                <div>
                  <Label htmlFor="main-keyword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    메인 키워드 <span className="text-red-500">*</span>
                  </Label>
                  <input
                    id="main-keyword"
                    type="text"
                    value={formData.mainKeyword}
                    onChange={(e) => handleInputChange('mainKeyword', e.target.value)}
                    placeholder="메인 키워드를 입력하세요"
                    className="input w-full"
                    required
                  />
                </div>

                {/* MID/PID */}
                <div>
                  <Label htmlFor="mid" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {defaultData?.type === 'place' ? 'PID' : 'MID'} <span className="text-red-500">*</span>
                  </Label>
                  <input
                    id="mid"
                    type="number"
                    value={formData.mid || ''}
                    onChange={(e) => handleInputChange('mid', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder={`${defaultData?.type === 'place' ? 'PID' : 'MID'}를 입력하세요`}
                    className="input w-full"
                    required
                  />
                </div>
              </div>
              
              {/* 안내 문구 - 전체 너비로 표시 */}
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                <p className="text-xs text-amber-800 dark:text-amber-200 font-medium flex items-start">
                  <span className="mr-1">⚠️</span>
                  <span>
                    {defaultData?.type === 'shop' ? '쇼핑' : '플레이스'} 순위 확인을 위한 키워드와{' '}
                    {defaultData?.type === 'place' ? 'PID' : 'MID'}이니 입력에 유의하세요. 
                    순위 확인이 되지 않을 수 있습니다.
                  </span>
                </p>
              </div>

              {/* URL */}
              <div>
                <Label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL
                </Label>
                <div className="input pr-0 flex items-center [&[readonly]]:opacity-70 [&[readonly]]:bg-gray-50 dark:[&[readonly]]:bg-gray-900/50">
                  <input
                    id="url"
                    type="url"
                    value={formData.url}
                    readOnly
                    placeholder="URL이 자동으로 입력됩니다"
                    className="flex-1 bg-transparent border-0 outline-none p-0 placeholder:text-muted-foreground disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.url) {
                        navigator.clipboard.writeText(formData.url);
                        toast.success('URL이 복사되었습니다.');
                      }
                    }}
                    disabled={!formData.url}
                    className="flex-shrink-0 cursor-pointer group inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50 transition-colors rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="URL 복사"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                  </button>
                </div>
              </div>


              {/* 메모 */}
              <div>
                <Label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  메모
                </Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="추가 정보나 필요한 정보를 입력하세요"
                  className="textarea w-full"
                  rows={2}
                />
              </div>

              {/* 활성화 상태 */}
              <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-medium text-sky-900 dark:text-sky-300 mb-1">
                      활성화 상태
                    </h5>
                    <p className="text-xs text-sky-700 dark:text-sky-200">
                      키워드를 활성화하면 작업에 사용할 수 있습니다
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    />
                    <Label 
                      htmlFor="isActive" 
                      className="text-sm font-medium cursor-pointer"
                    >
                      {formData.isActive ? '활성' : '비활성'}
                    </Label>
                  </div>
                </div>
              </div>

              {/* 추가 정보 표시 */}
              {defaultData?.additionalInfo && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {defaultData.type === 'shop' ? '상품 정보' : '플레이스 정보'}
                  </h4>
                  
                  {defaultData.type === 'shop' && defaultData.additionalInfo && (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">상품명</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{defaultData.additionalInfo.productName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">순위</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{defaultData.additionalInfo.rank}위</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">가격</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {(() => {
                            const lowPrice = parseInt(defaultData.additionalInfo.price.low);
                            const highPrice = parseInt(defaultData.additionalInfo.price.high);
                            
                            // 가격이 없거나 0인 경우
                            if (!lowPrice || isNaN(lowPrice)) {
                              return '가격 정보 없음';
                            }
                            
                            // 최저가만 있거나 최저가와 최고가가 같은 경우
                            if (!highPrice || isNaN(highPrice) || lowPrice === highPrice) {
                              return `${lowPrice.toLocaleString()}원`;
                            }
                            
                            // 최저가와 최고가가 다른 경우
                            return `${lowPrice.toLocaleString()}원 ~ ${highPrice.toLocaleString()}원`;
                          })()}
                        </span>
                      </div>
                      {defaultData.additionalInfo.shop?.brand && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">브랜드</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{defaultData.additionalInfo.shop.brand}</span>
                        </div>
                      )}
                      {defaultData.additionalInfo.shop?.maker && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">제조사</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{defaultData.additionalInfo.shop.maker}</span>
                        </div>
                      )}
                      {defaultData.additionalInfo.category?.length > 0 && (
                        <div className="flex items-start justify-between">
                          <span className="text-gray-600 dark:text-gray-400">카테고리</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-right">
                            {defaultData.additionalInfo.category.join(' > ')}
                          </span>
                        </div>
                      )}
                      {defaultData.additionalInfo.image && (
                        <div className="mt-3">
                          <img 
                            src={defaultData.additionalInfo.image} 
                            alt="상품 이미지" 
                            className="w-20 h-20 object-cover rounded border border-gray-300 dark:border-gray-600"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {defaultData.type === 'place' && defaultData.additionalInfo && (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">플레이스명</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{defaultData.additionalInfo.placeName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">순위</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{defaultData.additionalInfo.rank}위</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">카테고리</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{defaultData.additionalInfo.category.main}</span>
                      </div>
                      {defaultData.additionalInfo.category.business && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">업종</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{defaultData.additionalInfo.category.business}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-white dark:bg-gray-700 rounded p-2 text-center">
                          <div className="text-xs text-gray-600 dark:text-gray-400">방문자 리뷰</div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{defaultData.additionalInfo.stats.visitorReviews.toLocaleString()}</div>
                        </div>
                        <div className="bg-white dark:bg-gray-700 rounded p-2 text-center">
                          <div className="text-xs text-gray-600 dark:text-gray-400">블로그 리뷰</div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{defaultData.additionalInfo.stats.blogReviews.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${defaultData.additionalInfo.features.booking
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                        }`}>
                          예약 {defaultData.additionalInfo.features.booking ? '가능' : '불가'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${defaultData.additionalInfo.features.npay
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                        }`}>
                          N페이 {defaultData.additionalInfo.features.npay ? '가능' : '불가'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-between items-center py-4 px-6 bg-gray-50 dark:bg-gray-800/50 border-t shrink-0">
          {/* 에러 메시지 */}
          <div className="flex-1 mr-4">
            {saveError && (
              <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {saveError}
              </div>
            )}
          </div>
          
          {/* 버튼들 */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving || !selectedGroupId || !formData.mainKeyword.trim() || !formData.mid}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};