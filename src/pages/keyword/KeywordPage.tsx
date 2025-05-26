import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useKeywords } from './hooks/useKeywords';
import { KeywordGroupTree, KeywordTable } from './components';
import { KeywordInput } from './types';
import { getTypeNameByCode } from '../../config/campaign.config';


// 레이아웃 컴포넌트 임포트
import { CommonTemplate } from '@/components/pageTemplate';
import KeywordUploadModal from './components/KeywordUploadModal';
import { group } from 'console';
import { TestKeywordFieldConfig } from './components/TestKeywordFieldConfig';

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
    loadKeywords,
    createDefaultGroup,
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

  // 현재 선택된 그룹 가져오기
  const selectedGroup = useMemo(() => {
    return groups.find((group) => group.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  // 초기 로드 시 기본 그룹 확인 및 생성
  useEffect(() => {
    // 그룹이 없거나 선택된 그룹이 없을 때 기본 그룹 생성
    if ((groups.length === 0 || !selectedGroupId) && !isLoading) {
      createDefaultGroup();
    }
  }, [groups, selectedGroupId, isLoading, createDefaultGroup]);

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

  // 그룹 생성 핸들러 (캠페인/유형 지원)
  const handleCreateGroup = async (
    name: string,
    campaignName: string | null = null,
    campaignType: string | null = null,
    isDefault: boolean = false
  ) => {
    return await createGroup(name, isDefault, campaignName, campaignType);
  };

  // 그룹 업데이트 핸들러 (캠페인/유형 지원)
  const handleUpdateGroup = async (
    groupId: number,
    name: string,
    campaignName: string | null = null,
    campaignType: string | null = null
  ) => {
    // updateGroup은 groupId와 name만 받으므로 다른 인자는 전달하지 않음
    return await updateGroup(groupId, name);
  };

  // 업로드 모달 상태 변수
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  
  // 업로드 모달 열기 핸들러
  const handleOpenUploadModal = () => setShowUploadModal(true);

  return (
    <CommonTemplate
      title="내 키워드"
      description="키워드를 그룹별로 관리할 수 있습니다."
      showPageMenu={false}
    >
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          <p className="font-medium">오류 발생</p>
          <p>{error}</p>
        </div>
      )}

      {/* 테스트용 - 설정 확인 */}
      {/*selectedGroup?.campaignType && (
        <div className="mb-4">
          <TestKeywordFieldConfig campaignType={selectedGroup.campaignType} />
        </div>
      )*/}


      <div className="flex flex-col lg:flex-row gap-4">
        {/* 왼쪽: 키워드 그룹 관리 (접을 수 있는 영역) */}
        {showGroupArea && (
          <div className="transition-all duration-300 w-full lg:w-[350px] flex-shrink-0">
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

            <KeywordGroupTree
              selectedGroupId={selectedGroupId}
              onGroupSelect={handleGroupChange}
              onCreateGroup={handleCreateGroup}
              onUpdateGroup={handleUpdateGroup}
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
              className="mb-2 px-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center shadow-sm h-10 w-full overflow-x-auto"
              title="그룹 영역 펼치기"
            >
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
                </svg>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 h-6 flex items-center">그룹 관리 표시</span>

                {selectedGroup && (
                  <span className="ml-3 px-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-bold text-sm border border-green-400 flex items-center h-6 whitespace-nowrap max-w-[350px] overflow-hidden">
                    <span className="mr-2 flex-shrink-0">현재:</span>
                    <span className="truncate">
                      {selectedGroup.campaignName && selectedGroup.campaignType ?
                        `${selectedGroup.campaignName} > ${getTypeNameByCode(selectedGroup.campaignName, selectedGroup.campaignType) || selectedGroup.campaignType} > ${selectedGroup.name}` :
                        selectedGroup.name}
                    </span>
                  </span>
                )}
              </div>
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
            onOpenUploadModal={handleOpenUploadModal}
          />
        </div>
      </div>
      
      {/* 엑셀 업로드 모달 */}
      <KeywordUploadModal 
        isOpen = {showUploadModal}
        onClose={ () => setShowUploadModal(false)}
        groups={groups}
        onSuccess={loadKeywords}
      />
    </CommonTemplate>
  );
};

export default KeywordPage;