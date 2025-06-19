import React from 'react';
import { KeenIcon } from '@/components';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface KeywordGroupControlsProps {
  isCompactMode: boolean;
  selectedGroupId: number | null;
  keywordGroups: any[];
  searchKeyword: string;
  setSearchKeyword: (value: string) => void;
  handleGroupSelect: (groupId: number) => void;
  keywordSearchMode: boolean;
  setKeywordSearchMode: (value: boolean) => void;
  isGuarantee?: boolean;
}

export const KeywordGroupControls: React.FC<KeywordGroupControlsProps> = ({
  isCompactMode,
  selectedGroupId,
  keywordGroups,
  searchKeyword,
  setSearchKeyword,
  handleGroupSelect,
  keywordSearchMode,
  setKeywordSearchMode,
  isGuarantee = false
}) => {
  if (isCompactMode) {
    return (
      <div className="space-y-3">
        {/* 모바일에서는 2행으로 표시 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 w-full">
          {/* 첫 번째 행: 스왑 버튼, 제목, 작업시작일 안내 - 데스크톱에서만 표시 */}
          <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
            {!isGuarantee && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setKeywordSearchMode(!keywordSearchMode)}
                className="px-4 py-2 h-9 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                {keywordSearchMode ? '직접 입력하기' : '내키워드에서 가져오기'}
              </Button>
            )}
            <div className="flex items-center gap-2">
              <KeenIcon icon="pencil" className="text-success size-4" />
              <span className="text-sm font-medium text-foreground">
                {keywordSearchMode ? '내 키워드에서 가져오기' : '직접 입력 모드'}
              </span>
            </div>
            {keywordSearchMode && (
              <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md px-2.5 py-1.5">
                <KeenIcon icon="information-2" className="text-blue-600 dark:text-blue-400 size-3.5" />
                <span className="font-semibold">작업 시작일:</span>
                <span>총판 승인 다음날부터</span>
              </div>
            )}
          </div>

          {/* 첫 번째 행: 모바일에서는 select들만 표시 */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* 모바일용 아이콘 */}
            <KeenIcon icon="pencil" className="text-success size-4 shrink-0 sm:hidden" />
            {/* 그룹 선택 */}
            <KeenIcon icon="folder" className="text-blue-500 size-4 shrink-0" />
            <div className="w-1/2 sm:w-48">
              <select
                id="group-select"
                value={selectedGroupId || ''}
                onChange={(e) => handleGroupSelect(Number(e.target.value))}
                className="select w-full bg-background rounded-md border border-input text-sm hover:border-gray-400 focus:border-primary h-8 pl-2 pr-6"
              >
                {keywordGroups.length === 0 ? (
                  <option value="">그룹이 없습니다</option>
                ) : (
                  keywordGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} {group.isDefault ? '(기본)' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* 키워드 검색 */}
            <KeenIcon icon="magnifier" className="text-blue-500 size-4 shrink-0" />
            <div className="w-1/2 sm:w-52">
              <Input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="키워드 검색"
                className="input w-full pl-2 pr-2 h-8 bg-white border-gray-300 focus:border-blue-400 focus:ring-blue-300 text-sm"
              />
            </div>
          </div>
        </div>

        {/* 두 번째 행: 모바일에서 스왑 버튼과 작업시작일 안내 표시 */}
        <div className="flex flex-col gap-2 sm:hidden">
          {!isGuarantee && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setKeywordSearchMode(!keywordSearchMode)}
              className="flex items-center justify-center px-4 py-2 h-9 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm w-full"
            >
              {keywordSearchMode ? '직접 입력하기' : '내키워드에서 가져오기'}
            </Button>
          )}
          {keywordSearchMode && (
            <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md px-2.5 py-1.5">
              <KeenIcon icon="information-2" className="text-blue-600 dark:text-blue-400 size-3.5" />
              <span className="font-semibold">작업 시작일:</span>
              <span>총판 승인 다음날부터</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 일반 모드
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-2">
      {/* 좌측: 스왑 버튼, 섹션 제목, 작업시작일 안내 */}
      <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
        {!isGuarantee && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setKeywordSearchMode(!keywordSearchMode)}
            className="px-4 py-2 h-9 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            {keywordSearchMode ? '직접 입력하기' : '내키워드에서 가져오기'}
          </Button>
        )}
        <div className="flex items-center gap-3">
          <KeenIcon icon="pencil" className="text-success size-4" />
          <span className="text-sm font-medium text-foreground">
            {keywordSearchMode ? '내 키워드에서 가져오기' : '직접 입력 모드'}
          </span>
        </div>
        {keywordSearchMode && (
          <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md px-2.5 py-1.5">
            <KeenIcon icon="information-2" className="text-blue-600 dark:text-blue-400 size-3.5" />
            <span className="font-semibold">작업 시작일:</span>
            <span>총판 승인 다음날부터</span>
          </div>
        )}
      </div>

      {/* 우측: 그룹 선택과 키워드 검색 */}
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
        {/* 그룹 선택 */}
        <KeenIcon icon="folder" className="text-blue-500 size-4 shrink-0" />
        <div className="flex-1 sm:w-48 sm:flex-none min-w-0">
          <select
            id="group-select"
            value={selectedGroupId || ''}
            onChange={(e) => handleGroupSelect(Number(e.target.value))}
            className="select w-full bg-background rounded-md border border-input text-sm hover:border-gray-400 focus:border-primary h-9 pl-3"
          >
            {keywordGroups.length === 0 ? (
              <option value="">그룹이 없습니다</option>
            ) : (
              keywordGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name} {group.isDefault ? '(기본)' : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {/* 키워드 검색 */}
        <KeenIcon icon="magnifier" className="text-blue-500 size-4 shrink-0" />
        <div className="flex-1 sm:w-52 sm:flex-none min-w-0">
          <Input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="키워드 검색어 입력"
            className="input w-full pl-3 pr-3 h-9 bg-white border-gray-300 focus:border-blue-400 focus:ring-blue-300"
          />
        </div>
      </div>
    </div>
  );
};