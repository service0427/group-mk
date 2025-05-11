import React, { useEffect, useMemo, useState} from 'react';
import { useKeywords } from './hooks/useKeywords';
import { KeywordGroups, KeywordTable } from './components';
import { KeywordInput } from './types';

// 레이아웃 컴포넌트 임포트
import { CommonTemplate } from '@/components/pageTemplate';

const KeywordPage: React.FC = () => {
  // 키워드 관리 훅 사용
  const {
    groups,
    keywords,
    selectedGroupId,
    isLoading,
    error,
    totalKeywords,
    pagination,
    createGroup,
    updateGroup,
    deleteGroup,
    createKeyword,
    updateKeyword,
    deleteKeyword,
    handleGroupChange,
    handlePageChange,
    handleLimitChange,
    handleSortChange,
    handleSearchChange,
  } = useKeywords();
  
  // 페이지 진입 시 기본 그룹 확인 및 생성
  useEffect(() => {
    const createDefaultGroupIfNeeded = async () => {
      if (groups.length === 0 && !isLoading) {
        await createGroup('기본 그룹', true);
      }
    };
    
    createDefaultGroupIfNeeded();
  }, [groups.length, isLoading, createGroup]);

  // 현재 선택된 그룹 가져오기
  const selectedGroup = useMemo(() => {
    return groups.find((group) => group.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  // 그룹 영역 표시 여부 상태 (기본적으로 접혀 있음)
  const [showGroupArea, setShowGroupArea] = useState<boolean>(false);

  // 그룹 영역 토글 핸들러
  const toggleGroupArea = () => {
    setShowGroupArea(!showGroupArea);
  };

  // 키워드 생성 핸들러
  const handleCreateKeyword = async (keywordData: KeywordInput) => {
    return await createKeyword(keywordData);
  };

  return (
    <CommonTemplate
      title="내 키워드"
      description="키워드를 그룹별로 관리할 수 있습니다."
    >
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          <p className="font-medium">오류 발생</p>
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* 왼쪽: 키워드 그룹 관리 (접을 수 있는 영역) */}
        {showGroupArea && (
          <div className="transition-all duration-300 w-full lg:w-[250px] flex-shrink-0">
            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg mb-2 flex justify-between items-center">
              <h2 className="text-base font-bold text-primary-600 dark:text-primary-400">그룹 관리 영역</h2>
              <button
                onClick={toggleGroupArea}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title="그룹 영역 접기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
                </svg>
              </button>
            </div>

            <KeywordGroups
              groups={groups}
              selectedGroupId={selectedGroupId}
              onGroupSelect={handleGroupChange}
              onCreateGroup={createGroup}
              onUpdateGroup={updateGroup}
              onDeleteGroup={deleteGroup}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* 오른쪽: 키워드 테이블 */}
        <div className="transition-all duration-300 flex-grow">
          {!showGroupArea && (
            <button
              onClick={toggleGroupArea}
              className="mb-2 px-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-between shadow-sm h-10 w-full md:w-auto"
              title="그룹 영역 펼치기"
            >
              <div className="flex items-center my-0">
                <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
                </svg>
                <span className="mr-2 text-sm font-bold text-blue-600 dark:text-blue-400 h-6 flex items-center">그룹 관리 표시</span>
              </div>
              {selectedGroup && (
                <span className="px-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-bold text-sm border border-green-400 flex items-center h-6">
                  현재: {selectedGroup.name}
                </span>
              )}
            </button>
          )}
          <KeywordTable
            keywords={keywords}
            totalKeywords={totalKeywords}
            selectedGroup={selectedGroup}
            pagination={pagination}
            isLoading={isLoading}
            onUpdateKeyword={updateKeyword}
            onDeleteKeyword={deleteKeyword}
            onCreateKeyword={handleCreateKeyword}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onSearch={handleSearchChange}
            onSort={handleSortChange}
          />
        </div>
      </div>
    </CommonTemplate>
  );
};

export default KeywordPage;