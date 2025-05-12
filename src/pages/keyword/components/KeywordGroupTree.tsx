import React, { useState, useEffect } from 'react';
import { KeywordGroup, KeywordGroupTreeData } from '../types';
import { keywordGroupService } from '../services/keywordService';
import { CAMPAIGNS } from '../../../config/campaign.config';

interface KeywordGroupTreeProps {
  selectedGroupId: number | null;
  onGroupSelect: (groupId: number) => void;
  onCreateGroup: (name: string, campaignName?: string | null, campaignType?: string | null, isDefault?: boolean) => Promise<boolean>;
  onUpdateGroup: (groupId: number, name: string, campaignName?: string | null, campaignType?: string | null) => Promise<boolean>;
  onDeleteGroup: (groupId: number) => Promise<boolean>;
  isLoading: boolean;
}

const KeywordGroupTree: React.FC<KeywordGroupTreeProps> = ({
  selectedGroupId,
  onGroupSelect,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  isLoading,
}) => {
  // 트리 데이터 상태
  const [treeData, setTreeData] = useState<KeywordGroupTreeData>({
    campaigns: [],
    defaultGroup: null,
    generalGroups: []
  });

  // 각 캠페인의 확장 상태 관리
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({});
  
  // 각 캠페인 유형의 확장 상태 관리
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});
  
  // 새 그룹 추가 폼 상태
  const [activeAddFormKey, setActiveAddFormKey] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupInfo, setNewGroupInfo] = useState<{
    campaignName: string | null;
    campaignType: string | null;
  }>({ campaignName: null, campaignType: null });

  // 그룹 편집 상태
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  // 트리 데이터 로드
  const loadTreeData = async () => {
    try {
      const response = await keywordGroupService.getKeywordGroupTree();
      if (response.success && response.data) {
        const data = response.data as KeywordGroupTreeData;
        setTreeData(data);
        
        // 초기화: 모든 캠페인 펼치기
        const campaignExpanded: Record<string, boolean> = {};
        data.campaigns.forEach(campaign => {
          campaignExpanded[campaign.name] = true;
        });
        setExpandedCampaigns(campaignExpanded);
        
        // 초기화: 모든 캠페인 유형 펼치기
        const typeExpanded: Record<string, boolean> = {};
        data.campaigns.forEach(campaign => {
          campaign.types.forEach(type => {
            typeExpanded[`${campaign.name}-${type.code}`] = true;
          });
        });
        setExpandedTypes(typeExpanded);
      }
    } catch (error) {
      console.error("트리 데이터 로드 실패:", error);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadTreeData();
  }, []);

  // 캠페인 펼침/접기 토글
  const toggleCampaign = (campaignName: string) => {
    // 입력 폼을 닫기 위해 activeAddFormKey 초기화
    setActiveAddFormKey(null);

    setExpandedCampaigns(prev => ({
      ...prev,
      [campaignName]: !prev[campaignName]
    }));
  };

  // 캠페인 유형 펼침/접기 토글
  const toggleType = (campaignName: string, typeCode: string) => {
    // 입력 폼을 닫기 위해 activeAddFormKey 초기화
    setActiveAddFormKey(null);

    const key = `${campaignName}-${typeCode}`;
    setExpandedTypes(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 새 그룹 생성 폼 표시 핸들러
  const handleShowAddForm = (campaignName: string | null = null, campaignType: string | null = null) => {
    const formKey = campaignName && campaignType ? `${campaignName}-${campaignType}` : 'default';

    // 캠페인이 닫혀 있으면 먼저 열기
    if (campaignName && !expandedCampaigns[campaignName]) {
      setExpandedCampaigns(prev => ({
        ...prev,
        [campaignName]: true
      }));
    }

    // 캠페인 유형이 닫혀 있으면 먼저 열기
    if (campaignName && campaignType) {
      const typeKey = `${campaignName}-${campaignType}`;
      if (!expandedTypes[typeKey]) {
        setExpandedTypes(prev => ({
          ...prev,
          [typeKey]: true
        }));
      }
    }

    // 활성 폼 키 토글 (같은 버튼을 다시 누르면 폼 닫기)
    setActiveAddFormKey(activeAddFormKey === formKey ? null : formKey);

    setNewGroupInfo({ campaignName, campaignType });
    setNewGroupName('');
  };

  // 새 그룹 생성 제출 핸들러
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newGroupName.trim()) return;

    const success = await onCreateGroup(
      newGroupName.trim(), 
      newGroupInfo.campaignName, 
      newGroupInfo.campaignType
    );

    if (success) {
      setNewGroupName('');
      setNewGroupInfo({ campaignName: null, campaignType: null });
      setActiveAddFormKey(null);
      loadTreeData(); // 그룹 트리 새로고침
    }
  };

  // 그룹 편집 시작
  const handleStartEditing = (group: KeywordGroup) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  // 그룹 편집 취소
  const handleCancelEditing = () => {
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  // 그룹 편집 저장
  const handleSaveEditing = async (group: KeywordGroup) => {
    if (!editingGroupName.trim()) return;

    const success = await onUpdateGroup(
      group.id, 
      editingGroupName.trim(),
      group.campaignName,
      group.campaignType
    );

    if (success) {
      setEditingGroupId(null);
      setEditingGroupName('');
      loadTreeData(); // 그룹 트리 새로고침
    }
  };

  // 그룹 삭제 핸들러
  const handleDeleteGroup = async (groupId: number) => {
    if (window.confirm('이 그룹을 삭제하시겠습니까? 그룹에 속한 모든 키워드도 함께 삭제됩니다.')) {
      const success = await onDeleteGroup(groupId);
      if (success) {
        loadTreeData(); // 그룹 트리 새로고침
      }
    }
  };

  // 그룹 항목 컴포넌트
  const GroupItem = ({ group }: { group: KeywordGroup }) => {
    // 그룹의 키워드 수 표시를 위한 상태
    const [keywordCount, setKeywordCount] = useState<number>(0);

    // 그룹의 키워드 수 가져오기
    useEffect(() => {
      const fetchKeywordCount = async () => {
        try {
          const response = await keywordGroupService.getKeywordCountByGroup(group.id);
          if (response.success && response.data) {
            setKeywordCount(response.data.count || 0);
          }
        } catch (error) {
          console.error("키워드 수 가져오기 실패:", error);
        }
      };

      fetchKeywordCount();
    }, [group.id]);

    return (
    <div
      className={`flex items-center justify-between p-2 rounded-md cursor-pointer ml-2 ${
        selectedGroupId === group.id
          ? 'bg-green-100 dark:bg-green-800 border-l-4 border-green-500 shadow-md transform transition-all'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 border-l-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
      }`}
    >
      {/* 그룹 선택 영역 */}
      <div 
        className="flex-1 flex items-center"
        onClick={() => onGroupSelect(group.id)}
      >
        {editingGroupId === group.id ? (
          <input
            type="text"
            value={editingGroupName}
            onChange={(e) => setEditingGroupName(e.target.value)}
            className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <div className="flex items-center">
            <span className={`text-sm font-medium ${selectedGroupId === group.id ? 'text-green-800 dark:text-green-300 font-bold' : 'dark:text-white'}`}>
              {group.name}
            </span>
            {group.isDefault && (
              <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                selectedGroupId === group.id
                  ? 'bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-300'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}>
                기본
              </span>
            )}
            <span className={`ml-2 text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300`}>
              {keywordCount} 키워드
            </span>
          </div>
        )}
      </div>

      {/* 그룹 액션 버튼 */}
      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
        {editingGroupId === group.id ? (
          <>
            <button
              onClick={() => handleSaveEditing(group)}
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </button>
            <button
              onClick={handleCancelEditing}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleStartEditing(group)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1"
              disabled={isLoading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
            </button>
            {!group.isDefault && (
              <button
                onClick={() => handleDeleteGroup(group.id)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                disabled={isLoading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

  // 기본 캠페인 구조를 표시 (캠페인 구성만 표시하고 실제 데이터는 비어 있음)
  const renderEmptyCampaigns = () => {
    return (
      <div className="mb-3">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1 px-2 bg-gray-100 dark:bg-gray-700 py-1 rounded">
          캠페인별 그룹
        </div>

        {CAMPAIGNS.map((campaign) => (
          <div key={campaign.name} className="mb-2">
            {/* 캠페인 헤더 */}
            <div
              className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/30 rounded cursor-pointer border-l-4 border-blue-500 shadow-sm"
              onClick={() => toggleCampaign(campaign.name)}
            >
              <div className="flex items-center">
                <span className="mr-2">
                  {expandedCampaigns[campaign.name] ? (
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  )}
                </span>
                <div className="flex items-center">
                  {campaign.logo && (
                    <img
                      src={campaign.logo}
                      alt={campaign.name}
                      className="w-5 h-5 mr-2"
                    />
                  )}
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-base">
                    {campaign.name}
                  </span>
                </div>
              </div>
            </div>

            {/* 캠페인 유형 목록 (접을 수 있음) */}
            {expandedCampaigns[campaign.name] && (
              <div className="ml-4 mt-1">
                {campaign.types.map((type) => (
                  <div key={`${campaign.name}-${type.code}`} className="mb-1">
                    <div
                      className="flex items-center justify-between p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded cursor-pointer border-l-2 border-purple-400 shadow-sm ml-1"
                      onClick={() => toggleType(campaign.name, type.code)}
                    >
                      <div className="flex items-center">
                        <span className="mr-2">
                          {expandedTypes[`${campaign.name}-${type.code}`] ? (
                            <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                          )}
                        </span>
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                          {type.name}
                        </span>
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300">
                          0 그룹
                        </span>
                      </div>

                      {/* 캠페인 유형에 그룹 추가 버튼 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowAddForm(campaign.name, type.code);
                        }}
                        className="text-xs px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded"
                      >
                        + 그룹
                      </button>
                    </div>

                    {/* 해당 캠페인 유형의 그룹 목록 (접을 수 있음) */}
                    {expandedTypes[`${campaign.name}-${type.code}`] && (
                      <div className="ml-4 mt-1">
                        {/* 해당 유형에 대한 그룹 추가 폼 */}
                        {activeAddFormKey === `${campaign.name}-${type.code}` && (
                          <div className="p-1 bg-gray-50 dark:bg-gray-700 rounded-lg mb-1">
                            <form onSubmit={handleCreateGroup}>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="text"
                                  value={newGroupName}
                                  onChange={(e) => setNewGroupName(e.target.value)}
                                  placeholder="그룹 이름"
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-l focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:text-white h-7"
                                  disabled={isLoading}
                                  autoFocus
                                />
                                <button
                                  type="submit"
                                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 text-xs rounded-r disabled:opacity-50 font-medium h-7"
                                  disabled={isLoading || !newGroupName.trim()}
                                >
                                  추가
                                </button>
                              </div>
                            </form>
                          </div>
                        )}

                        {!activeAddFormKey && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 italic px-2 py-1">
                            그룹이 없습니다.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">그룹 관리</h2>
      </div>

      {/* 트리 뷰 영역 */}
      <div className="space-y-1 max-h-[30rem] overflow-y-auto pr-1">
        {/* 로딩 상태 */}
        {isLoading && (
          <div className="flex justify-center items-center p-4">
            <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">로딩 중...</span>
          </div>
        )}

        {/* 기본 그룹 */}
        {treeData.defaultGroup && (
          <div className="mb-3 border-b pb-2 border-gray-200 dark:border-gray-600">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1 px-2 bg-gray-100 dark:bg-gray-700 py-1 rounded">
              기본 그룹
            </div>
            <GroupItem group={treeData.defaultGroup} />
          </div>
        )}

        {/* 캠페인별 그룹 */}
        {treeData.campaigns.length > 0 ? (
          <div className="mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1 px-2 bg-gray-100 dark:bg-gray-700 py-1 rounded">
              캠페인별 그룹
            </div>
            
            {treeData.campaigns.map((campaign) => (
              <div key={campaign.name} className="mb-2">
                {/* 캠페인 헤더 */}
                <div
                  className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/30 rounded cursor-pointer border-l-4 border-blue-500 shadow-sm"
                  onClick={() => toggleCampaign(campaign.name)}
                >
                  <div className="flex items-center">
                    <span className="mr-2">
                      {expandedCampaigns[campaign.name] ? (
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      )}
                    </span>
                    <div className="flex items-center">
                      {campaign.logo && (
                        <img 
                          src={campaign.logo} 
                          alt={campaign.name} 
                          className="w-5 h-5 mr-2"
                        />
                      )}
                      <span className="font-semibold text-gray-800 dark:text-gray-200 text-base">
                        {campaign.name}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* 캠페인 유형 목록 (접을 수 있음) */}
                {expandedCampaigns[campaign.name] && (
                  <div className="ml-4 mt-1">
                    {campaign.types.map((type) => (
                      <div key={`${campaign.name}-${type.code}`} className="mb-1">
                        {/* 캠페인 유형 헤더 */}
                        <div
                          className="flex items-center justify-between p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded cursor-pointer border-l-2 border-purple-400 shadow-sm ml-1"
                          onClick={() => toggleType(campaign.name, type.code)}
                        >
                          <div className="flex items-center">
                            <span className="mr-2">
                              {expandedTypes[`${campaign.name}-${type.code}`] ? (
                                <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                              )}
                            </span>
                            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                              {type.name}
                            </span>
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300">
                              {type.groups.length} 그룹
                            </span>
                          </div>
                          
                          {/* 캠페인 유형에 그룹 추가 버튼 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowAddForm(campaign.name, type.code);
                            }}
                            className="text-xs px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded"
                          >
                            + 그룹
                          </button>
                        </div>
                        
                        {/* 해당 캠페인 유형의 그룹 목록 (접을 수 있음) */}
                        {expandedTypes[`${campaign.name}-${type.code}`] && (
                          <div className="ml-4 mt-1 space-y-1">
                            {/* 해당 유형에 대한 그룹 추가 폼 */}
                            {activeAddFormKey === `${campaign.name}-${type.code}` && (
                              <div className="p-1 bg-gray-50 dark:bg-gray-700 rounded-lg mb-1">
                                <form onSubmit={handleCreateGroup}>
                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="text"
                                      value={newGroupName}
                                      onChange={(e) => setNewGroupName(e.target.value)}
                                      placeholder="그룹 이름"
                                      className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-l focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:text-white h-7"
                                      disabled={isLoading}
                                      autoFocus
                                    />
                                    <button
                                      type="submit"
                                      className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 text-xs rounded-r disabled:opacity-50 font-medium h-7"
                                      disabled={isLoading || !newGroupName.trim()}
                                    >
                                      추가
                                    </button>
                                  </div>
                                </form>
                              </div>
                            )}

                            {type.groups.length === 0 && !activeAddFormKey ? (
                              <div className="text-xs text-gray-500 dark:text-gray-400 italic px-2 py-1">
                                그룹이 없습니다.
                              </div>
                            ) : (
                              type.groups.map((group) => (
                                <GroupItem key={group.id} group={group} />
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : renderEmptyCampaigns()}

        {/* 일반 그룹 섹션은 표시하지 않음 */}
      </div>
    </div>
  );
};

export default KeywordGroupTree;