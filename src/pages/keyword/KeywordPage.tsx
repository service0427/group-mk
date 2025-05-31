import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useKeywords } from './hooks/useKeywords';
import { KeywordTable, KeywordMoveModal } from './components';
import { KeywordInput } from './types';
import { getTypeNameByCode, getCampaignNameByServiceType } from '../../config/campaign.config';
import { DashboardTemplate } from '@/components/pageTemplate';
import KeywordUploadModal from './components/KeywordUploadModal';
import { TestKeywordFieldConfig } from './components/TestKeywordFieldConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { CampaignServiceType, SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';
import { X } from 'lucide-react';
import { keywordGroupService, keywordService } from './services/keywordService';
import { toast } from 'sonner';

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
    clearKeywords,
  } = useKeywords();

  // 현재 선택된 그룹 가져오기
  const selectedGroup = useMemo(() => {
    return groups.find((group) => group.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  // 선택된 서비스 타입 상태
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');
  
  // 컴포넌트 마운트 시 첫 번째 그룹 선택
  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      handleGroupChange(groups[0].id);
    }
  }, [groups]);
  
  // 엑셀 업로드 모달 상태
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // 그룹 관리 상태
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  
  // 키워드 이동/복사 모달 상태
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<number[]>([]);
  
  // 필터링된 그룹 목록 (선택된 서비스 타입에 따라)
  const filteredGroups = useMemo(() => {
    if (!selectedServiceType) {
      return [];
    }
    return groups.filter(group => group.campaignType === selectedServiceType);
  }, [groups, selectedServiceType]);
  
  // 서비스 타입별 그룹 수 계산
  const serviceTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    groups.forEach(group => {
      if (group.campaignType) {
        counts[group.campaignType] = (counts[group.campaignType] || 0) + 1;
      }
    });
    return counts;
  }, [groups]);
  
  // 사용 가능한 서비스 타입 목록 (표준 enum 값들 + DB에 있는 값들)
  const availableServiceTypes = useMemo(() => {
    // DB에 있는 서비스 타입들
    const dbServiceTypes = Object.keys(serviceTypeCounts);
    // 모든 enum 값들
    const allEnumTypes = Object.values(CampaignServiceType);
    // 중복 제거하여 합치기
    const combined = Array.from(new Set([...dbServiceTypes, ...allEnumTypes]));
    
    // SERVICE_TYPE_LABELS의 순서대로 정렬
    const orderedEnums = [
      CampaignServiceType.NAVER_TRAFFIC,
      CampaignServiceType.NAVER_AUTO,
      CampaignServiceType.NAVER_SHOPPING_TRAFFIC,
      CampaignServiceType.NAVER_SHOPPING_FAKESALE,
      CampaignServiceType.NAVER_PLACE_TRAFFIC,
      CampaignServiceType.NAVER_PLACE_SAVE,
      CampaignServiceType.NAVER_PLACE_SHARE,
      CampaignServiceType.COUPANG_TRAFFIC,
      CampaignServiceType.COUPANG_FAKESALE
    ];
    
    return combined.sort((a, b) => {
      const aIndex = orderedEnums.indexOf(a as CampaignServiceType);
      const bIndex = orderedEnums.indexOf(b as CampaignServiceType);
      
      // 둘 다 정의된 enum에 있으면 순서대로
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // 하나만 정의된 enum에 있으면 그것을 먼저
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // 둘 다 정의되지 않은 경우 알파벳 순
      return a.localeCompare(b);
    });
  }, [serviceTypeCounts]);
  
  // 초기 서비스 타입 설정 - 자동 선택하지 않음
  // useEffect(() => {
  //   if (!selectedServiceType && availableServiceTypes.length > 0) {
  //     setSelectedServiceType(availableServiceTypes[0]);
  //   }
  // }, [availableServiceTypes, selectedServiceType]);
  
  // 서비스 타입 라벨 가져오기
  const getServiceTypeLabel = (serviceType: string): string => {
    // 한글로 저장된 기존 데이터를 enum 값으로 매핑
    const koreanToEnumMap: Record<string, string> = {
      'N트래픽': CampaignServiceType.NAVER_TRAFFIC,
      'N자동완성': CampaignServiceType.NAVER_AUTO,
      'NS트래픽': CampaignServiceType.NAVER_SHOPPING_TRAFFIC,
      'NS가구매': CampaignServiceType.NAVER_SHOPPING_FAKESALE,
      'NP트래픽': CampaignServiceType.NAVER_PLACE_TRAFFIC,
      'NP저장하기': CampaignServiceType.NAVER_PLACE_SAVE,
      'NP블로그공유': CampaignServiceType.NAVER_PLACE_SHARE,
      'CP트래픽': CampaignServiceType.COUPANG_TRAFFIC,
      'CP가구매': CampaignServiceType.COUPANG_FAKESALE
    };
    
    // 한글이면 enum으로 변환 후 라벨 가져오기
    const enumValue = koreanToEnumMap[serviceType] || serviceType;
    return SERVICE_TYPE_LABELS[enumValue] || serviceType;
  };

  // 서비스 타입 변경 핸들러
  const handleServiceTypeChange = (serviceType: string) => {
    setSelectedServiceType(serviceType);
    // 서비스 타입 변경 시 키워드 목록 초기화
    clearKeywords();
    // 서비스 타입 변경 시 첫 번째 그룹 선택 또는 null
    const filteredGroups = groups.filter(g => g.campaignType === serviceType);
    if (filteredGroups.length > 0) {
      handleGroupChange(filteredGroups[0].id);
    } else {
      handleGroupChange(0);
    }
  };
  
  // 그룹 ID를 문자열로 변환 (Select 컴포넌트용)
  const groupIdToString = (id: number | null) => {
    return id !== null ? id.toString() : '';
  };
  
  // 문자열을 그룹 ID로 변환 (Select 컴포넌트용)
  const stringToGroupId = (value: string) => {
    return value ? parseInt(value) : null;
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
    name: string
  ) => {
    // 기존 그룹 정보를 찾아서 campaign 정보 유지
    const group = groups.find(g => g.id === groupId);
    if (group) {
      // keywordGroupService의 updateGroup을 campaign 정보와 함께 호출
      const response = await keywordGroupService.updateGroup(
        groupId, 
        name, 
        group.campaignName, 
        group.campaignType
      );
      
      if (response.success) {
        // updateGroup 대신 createGroup의 loadGroups를 활용하기 위해
        // 임시로 빈 그룹을 생성하고 바로 삭제 (loadGroups 트리거용)
        // 더 나은 방법: useKeywords 훅을 수정하여 loadGroups를 export하거나
        // updateGroup이 campaign 정보를 받도록 수정
        
        // 현재는 기존 updateGroup 함수 사용
        return await updateGroup(groupId, name);
      }
    }
    return false;
  };
  
  // 업로드 모달 열기 핸들러
  const handleOpenUploadModal = () => setShowUploadModal(true);
  
  // 키워드 이동/복사 핸들러
  const handleMoveKeywords = async (targetGroupId: number, copy: boolean) => {
    console.log('handleMoveKeywords called', { targetGroupId, copy, selectedKeywordIds });
    try {
      const selectedKeywords = keywords.filter(k => selectedKeywordIds.includes(k.id));
      console.log('Selected keywords:', selectedKeywords);
      
      if (copy) {
        console.log('Copying keywords...');
        const response = await keywordService.copyKeywords(selectedKeywordIds, targetGroupId);
        console.log('Copy response:', response);
        if (response.success) {
          toast.success(`${selectedKeywords.length}개의 키워드를 복사했습니다.`);
          setSelectedKeywordIds([]);
          setIsMoveModalOpen(false);
          await loadKeywords();
        } else {
          toast.error(response.message || '키워드 복사에 실패했습니다.');
        }
      } else {
        console.log('Moving keywords...');
        const response = await keywordService.moveKeywords(selectedKeywordIds, targetGroupId);
        console.log('Move response:', response);
        if (response.success) {
          toast.success(`${selectedKeywords.length}개의 키워드를 이동했습니다.`);
          setSelectedKeywordIds([]);
          setIsMoveModalOpen(false);
          await loadKeywords();
        } else {
          toast.error(response.message || '키워드 이동에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('Error in handleMoveKeywords:', error);
      toast.error('키워드 이동/복사 중 오류가 발생했습니다.');
    }
  };
  
  // 동일한 서비스 타입의 다른 그룹들 찾기
  const targetGroups = useMemo(() => {
    if (!selectedGroup) return [];
    return groups.filter(g => 
      g.id !== selectedGroup.id && 
      g.campaignType === selectedGroup.campaignType
    );
  }, [groups, selectedGroup]);

  return (
    <DashboardTemplate
      title="내 키워드"
      description="키워드를 그룹별로 관리할 수 있습니다."
      headerTextClass="text-white"
    >
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          <p className="font-medium">오류 발생</p>
          <p>{error}</p>
        </div>
      )}

      {/* 서비스 타입 탭 및 그룹 선택 영역 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          {/* 서비스 타입 탭 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {availableServiceTypes.map(serviceType => {
              const isNaver = serviceType.toLowerCase().includes('naver');
              const isCoupang = serviceType.toLowerCase().includes('coupang');
              
              // 서비스별 이미지 매핑
              const getServiceImage = (type: string) => {
                const lowerType = type.toLowerCase();
                if (lowerType.includes('naver')) {
                  if (lowerType.includes('shopping')) return '/media/ad-brand/naver-shopping.png';
                  if (lowerType.includes('place')) {
                    if (lowerType.includes('share')) return '/media/ad-brand/naver-blog.png';
                    return '/media/ad-brand/naver-place.png';
                  }
                  return '/media/ad-brand/naver.png';
                }
                if (lowerType.includes('coupang')) return '/media/ad-brand/coupang-app.png';
                return null;
              };
              
              const serviceImage = getServiceImage(serviceType);
              const buttonClass = selectedServiceType === serviceType 
                ? (isNaver ? 'bg-green-600 hover:bg-green-700' : isCoupang ? 'bg-yellow-600 hover:bg-yellow-700' : '')
                : '';
              
              return (
                <Button
                  key={serviceType}
                  variant={selectedServiceType === serviceType ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleServiceTypeChange(serviceType)}
                  className={`relative ${buttonClass}`}
                >
                  <div className="flex items-center gap-2">
                    {serviceImage && (
                      <img 
                        src={serviceImage} 
                        alt="" 
                        className="w-4 h-4 object-contain"
                      />
                    )}
                    <span>{getServiceTypeLabel(serviceType)}</span>
                    {serviceTypeCounts[serviceType] && (
                      <Badge 
                        variant="outline" 
                        className={`ml-1 ${
                          selectedServiceType === serviceType 
                            ? 'bg-white border-white text-gray-900' 
                            : ''
                        }`}
                      >
                        {serviceTypeCounts[serviceType]}
                      </Badge>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
          
          {/* 구분선 - 서비스 타입이 선택된 경우에만 표시 */}
          {selectedServiceType && (
            <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
          )}
          
          {/* 그룹 선택 버튼들 - 서비스 타입이 선택된 경우에만 표시 */}
          {selectedServiceType && (
            <div className="space-y-2">
              {filteredGroups.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    그룹 선택 
                    {selectedGroup && (
                      <span className="ml-2 text-xs text-gray-500">
                        (전체 {totalKeywords}개)
                      </span>
                    )}
                  </h3>
                  {/* 그룹 추가 버튼 */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingGroup(true)}
                  >
                    <KeenIcon icon="plus" className="size-4 mr-1" />
                    그룹 추가
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filteredGroups.map((group) => (
                    editingGroupId === group.id ? (
                      <div key={group.id} className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingGroupName}
                          onChange={(e) => setEditingGroupName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editingGroupName.trim()) {
                              handleUpdateGroup(group.id, editingGroupName.trim());
                              setEditingGroupId(null);
                            } else if (e.key === 'Escape') {
                              setEditingGroupId(null);
                            }
                          }}
                          className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (editingGroupName.trim()) {
                              handleUpdateGroup(group.id, editingGroupName.trim());
                              setEditingGroupId(null);
                            }
                          }}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <KeenIcon icon="check" className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingGroupId(null)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        key={group.id}
                        variant={selectedGroupId === group.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={(e) => {
                          // Ctrl 또는 Cmd 키를 누르고 클릭하면 편집 모드
                          if (e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            setEditingGroupId(group.id);
                            setEditingGroupName(group.name);
                          } else {
                            handleGroupChange(group.id);
                          }
                        }}
                        onDoubleClick={() => {
                          setEditingGroupId(group.id);
                          setEditingGroupName(group.name);
                        }}
                        className={`relative group ${
                          selectedGroupId === group.id 
                            ? 'bg-blue-600 hover:bg-blue-700 border-blue-600' 
                            : ''
                        }`}
                      >
                        <span className="font-medium pr-8">
                          {group.name}
                          {group.keywordCount !== undefined && group.keywordCount > 0 && (
                            <span className={`ml-2 text-xs ${
                              selectedGroupId === group.id
                                ? 'text-white/80'
                                : 'text-gray-500'
                            }`}>
                              ({group.keywordCount})
                            </span>
                          )}
                        </span>
                        <span
                          className={`absolute right-2 ${
                            selectedGroupId === group.id
                              ? 'text-white/80 hover:text-white'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGroupId(group.id);
                            setEditingGroupName(group.name);
                          }}
                        >
                          <KeenIcon icon="pencil" className="size-3" />
                        </span>
                      </Button>
                    )
                  ))}
                  
                  {/* 새 그룹 추가 입력 폼 */}
                  {isAddingGroup && (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newGroupName.trim()) {
                            const campaignName = getCampaignNameByServiceType(selectedServiceType);
                            handleCreateGroup(
                              newGroupName.trim(),
                              campaignName,
                              selectedServiceType,
                              false
                            );
                            setNewGroupName('');
                            setIsAddingGroup(false);
                          } else if (e.key === 'Escape') {
                            setNewGroupName('');
                            setIsAddingGroup(false);
                          }
                        }}
                        placeholder="그룹명 입력"
                        className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (newGroupName.trim()) {
                            const campaignName = getCampaignNameByServiceType(selectedServiceType);
                            handleCreateGroup(
                              newGroupName.trim(),
                              campaignName,
                              selectedServiceType,
                              false
                            );
                            setNewGroupName('');
                            setIsAddingGroup(false);
                          }
                        }}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <KeenIcon icon="check" className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setNewGroupName('');
                          setIsAddingGroup(false);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm mb-2">
                  {isLoading ? '그룹 로딩 중...' : '사용 가능한 그룹이 없습니다'}
                </p>
                {!isLoading && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const groupName = prompt('새 그룹 이름을 입력하세요:');
                      if (groupName) {
                        const campaignName = getCampaignNameByServiceType(selectedServiceType);
                        handleCreateGroup(
                          groupName,
                          campaignName,  // 서비스 타입에 맞는 캠페인 이름
                          selectedServiceType,  // campaignType
                          false  // isDefault
                        );
                      }
                    }}
                  >
                    <KeenIcon icon="plus" className="size-4 mr-1" />
                    첫 그룹 만들기
                  </Button>
                )}
              </div>
            )}
          </div>
          )}
        </CardContent>
      </Card>

      {/* 테스트용 - 설정 확인 */}
      {/*selectedGroup?.campaignType && (
        <div className="mb-4">
          <TestKeywordFieldConfig campaignType={selectedGroup.campaignType} />
        </div>
      )*/}

      {/* 키워드 테이블 또는 가이드 메시지 */}
      {selectedServiceType ? (
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
          selectedKeywordIds={selectedKeywordIds}
          onSelectionChange={setSelectedKeywordIds}
          onMoveKeywords={() => setIsMoveModalOpen(true)}
        />
      ) : (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                <KeenIcon icon="information-2" className="size-6 text-gray-300" />
                서비스 타입을 선택해주세요
              </h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              상단의 서비스 타입 버튼을 클릭하여 관리할 키워드 그룹을 선택하세요.
              서비스 타입별로 키워드를 분류하여 효율적으로 관리할 수 있습니다.
            </p>
          </div>
        </Card>
      )}
      
      {/* 엑셀 업로드 모달 */}
      <KeywordUploadModal 
        isOpen = {showUploadModal}
        onClose={ () => setShowUploadModal(false)}
        groups={filteredGroups}
        onSuccess={loadKeywords}
        selectedServiceType={selectedServiceType}
      />
      
      {/* 키워드 이동/복사 모달 */}
      <KeywordMoveModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        targetGroups={targetGroups}
        onConfirm={handleMoveKeywords}
        selectedCount={selectedKeywordIds.length}
        selectedKeywords={keywords.filter(k => selectedKeywordIds.includes(k.id))}
      />
    </DashboardTemplate>
  );
};

export default KeywordPage;