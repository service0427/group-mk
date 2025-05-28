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
    keyword1?: string;
  };
}

export const AddKeywordModal: React.FC<AddKeywordModalProps> = ({ isOpen, onClose, defaultData }) => {
  const [groups, setGroups] = useState<KeywordGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 폼 데이터
  const [formData, setFormData] = useState<KeywordInput>({
    mainKeyword: '',
    mid: undefined,
    url: '',
    keyword1: '',
    keyword2: '',
    keyword3: '',
    description: '',
    isActive: true
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
        keyword1: defaultData.keyword1 || ''
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
    if (!selectedGroupId) {
      toast.error('키워드 그룹을 선택해주세요.');
      return;
    }

    if (!formData.mainKeyword.trim()) {
      toast.error('메인 키워드를 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await keywordService.createKeyword(selectedGroupId, formData);
      if (response.success) {
        toast.success('키워드가 추가되었습니다.');
        onClose();
      } else {
        toast.error(response.message || '키워드 추가에 실패했습니다.');
      }
    } catch (error) {
      toast.error('키워드 저장 중 오류가 발생했습니다.');
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

              {/* MID */}
              <div>
                <Label htmlFor="mid" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  MID
                </Label>
                <input
                  id="mid"
                  type="number"
                  value={formData.mid || ''}
                  onChange={(e) => handleInputChange('mid', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="MID를 입력하세요"
                  className="input w-full"
                />
              </div>

              {/* URL */}
              <div>
                <Label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL
                </Label>
                <input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  placeholder="URL을 입력하세요"
                  className="input w-full"
                />
              </div>

              {/* 서브 키워드들 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="keyword1" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    키워드 1
                  </Label>
                  <input
                    id="keyword1"
                    type="text"
                    value={formData.keyword1}
                    onChange={(e) => handleInputChange('keyword1', e.target.value)}
                    placeholder="키워드 1"
                    className="input w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="keyword2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    키워드 2
                  </Label>
                  <input
                    id="keyword2"
                    type="text"
                    value={formData.keyword2}
                    onChange={(e) => handleInputChange('keyword2', e.target.value)}
                    placeholder="키워드 2"
                    className="input w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="keyword3" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    키워드 3
                  </Label>
                  <input
                    id="keyword3"
                    type="text"
                    value={formData.keyword3}
                    onChange={(e) => handleInputChange('keyword3', e.target.value)}
                    placeholder="키워드 3"
                    className="input w-full"
                  />
                </div>
              </div>

              {/* 설명 */}
              <div>
                <Label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설명
                </Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  placeholder="키워드에 대한 설명을 입력하세요"
                  className="textarea w-full"
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
            </div>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end items-center gap-3 py-4 px-6 bg-gray-50 dark:bg-gray-800/50 border-t shrink-0">
          <Button
            onClick={handleSave}
            disabled={isSaving || !selectedGroupId || !formData.mainKeyword.trim()}
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
      </DialogContent>
    </Dialog>
  );
};