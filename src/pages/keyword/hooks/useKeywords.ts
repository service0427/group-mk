import { useState, useEffect, useCallback } from 'react';
import { keywordGroupService, keywordService } from '../services/keywordService';
import { 
  KeywordGroup, 
  Keyword, 
  KeywordInput, 
  KeywordFilter, 
  PaginationParams, 
  SortParams 
} from '../types';
import { CampaignServiceType, SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';
import { getCampaignNameByServiceType } from '@/config/campaign.config';

export const useKeywords = () => {
  // 그룹 관련 상태
  const [groups, setGroups] = useState<KeywordGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  
  // 키워드 관련 상태
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [totalKeywords, setTotalKeywords] = useState<number>(0);
  
  // 필터, 정렬, 페이지네이션 상태
  const [filter, setFilter] = useState<KeywordFilter>({});
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 10
  });
  const [sort, setSort] = useState<SortParams>({
    field: 'created_at',
    direction: 'desc'
  });
  
  // 로딩 및 에러 상태
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 그룹 목록 로드
  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await keywordGroupService.getUserGroups();
      
      if (response.success && response.data) {
        let groups = response.data;
        
        // 현재 존재하는 서비스 타입들을 확인
        const existingServiceTypes = new Set(groups.map((g: KeywordGroup) => g.campaignType).filter(Boolean));
        const allServiceTypes = Object.values(CampaignServiceType);
        
        // 없는 서비스 타입에 대해 기본 그룹 생성
        let groupsCreated = false;
        for (const serviceType of allServiceTypes) {
          if (!existingServiceTypes.has(serviceType)) {
            const serviceName = SERVICE_TYPE_LABELS[serviceType] || serviceType;
            const campaignName = getCampaignNameByServiceType(serviceType);
            
            const createResponse = await keywordGroupService.createGroup(
              `${serviceName}`,
              campaignName,
              serviceType,
              true
            );
            
            if (createResponse.success && createResponse.data) {
              console.log(`Created default group: ${serviceName}`);
              groupsCreated = true;
            } else {
              console.error(`Failed to create group for ${serviceType}:`, createResponse.message);
            }
          }
        }
        
        // 새 그룹이 생성되었다면 목록 다시 로드
        if (groupsCreated) {
          const refreshResponse = await keywordGroupService.getUserGroups();
          if (refreshResponse.success && refreshResponse.data) {
            groups = refreshResponse.data;
          }
        }
        
        // 기본 그룹을 맨 앞으로 정렬
        const sortedGroups = groups.sort((a: KeywordGroup, b: KeywordGroup) => {
          // 기본 그룹을 먼저 배치
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;
          
          // 기본 그룹들끼리는 서비스 타입 순서대로
          if (a.isDefault && b.isDefault) {
            const aIndex = allServiceTypes.indexOf(a.campaignType as CampaignServiceType);
            const bIndex = allServiceTypes.indexOf(b.campaignType as CampaignServiceType);
            return aIndex - bIndex;
          }
          
          // 일반 그룹들은 생성 시간 순
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        
        setGroups(sortedGroups);
        
        // 선택된 그룹이 없고 그룹이 있으면 첫 번째 그룹 선택
        if (!selectedGroupId && sortedGroups.length > 0) {
          // 첫 번째 그룹을 선택
          setSelectedGroupId(sortedGroups[0].id);
        }
      } else {
        throw new Error(response.message || '그룹을 로드하는데 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '그룹을 로드하는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []); // selectedGroupId 의존성 제거

  // 키워드 목록 로드
  const loadKeywords = useCallback(async () => {
    if (!selectedGroupId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await keywordService.getKeywordsByGroup(
        selectedGroupId,
        filter,
        pagination,
        sort
      );
      
      if (response.success && response.data) {
        setKeywords(response.data.keywords);
        setTotalKeywords(response.data.total);
      } else {
        throw new Error(response.message || '키워드를 로드하는데 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '키워드를 로드하는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroupId, filter, pagination, sort]);

  // 초기 로드
  useEffect(() => {
    loadGroups();
  }, []); // loadGroups는 의존성이 없으므로 한 번만 실행

  // 그룹 선택 또는 필터 변경 시 키워드 로드
  useEffect(() => {
    if (selectedGroupId) {
      loadKeywords();
    }
  }, [selectedGroupId, filter, pagination, sort, loadKeywords]);

  // 기본 그룹 생성 핸들러 - 제거됨
  // 사용자가 직접 그룹을 생성해야 함

  // 그룹 생성 핸들러
  const createGroup = useCallback(async (
    name: string, 
    isDefault: boolean = false,
    campaignName: string | null = null,
    campaignType: string | null = null
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await keywordGroupService.createGroup(name, campaignName, campaignType, isDefault);
      
      if (response.success && response.data) {
        await loadGroups();
        return true;
      } else {
        throw new Error(response.message || '그룹을 생성하는데 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '그룹을 생성하는데 실패했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadGroups]);

  // 그룹 업데이트 핸들러
  const updateGroup = useCallback(async (groupId: number, name: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await keywordGroupService.updateGroup(groupId, name);
      
      if (response.success) {
        await loadGroups();
        return true;
      } else {
        throw new Error(response.message || '그룹을 업데이트하는데 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '그룹을 업데이트하는데 실패했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadGroups]);

  // 그룹 삭제 핸들러
  const deleteGroup = useCallback(async (groupId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await keywordGroupService.deleteGroup(groupId);
      
      if (response.success) {
        // 삭제한 그룹이 현재 선택된 그룹이면 선택 해제
        if (selectedGroupId === groupId) {
          setSelectedGroupId(null);
        }
        
        await loadGroups();
        return true;
      } else {
        throw new Error(response.message || '그룹을 삭제하는데 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '그룹을 삭제하는데 실패했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroupId, loadGroups]);

  // 키워드 생성 핸들러
  const createKeyword = useCallback(async (keywordData: KeywordInput) => {
    if (!selectedGroupId) {
      setError('키워드를 추가할 그룹을 선택해주세요.');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await keywordService.createKeyword(selectedGroupId, keywordData);
      
      if (response.success) {
        await loadKeywords();
        return true;
      } else {
        throw new Error(response.message || '키워드를 생성하는데 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '키워드를 생성하는데 실패했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroupId, loadKeywords]);

  // 키워드 업데이트 핸들러
  const updateKeyword = useCallback(async (keywordId: number, updateData: Partial<Keyword>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await keywordService.updateKeyword(keywordId, updateData);
      
      if (response.success) {
        await loadKeywords();
        return true;
      } else {
        throw new Error(response.message || '키워드를 업데이트하는데 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '키워드를 업데이트하는데 실패했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadKeywords]);

  // 키워드 삭제 핸들러
  const deleteKeyword = useCallback(async (keywordId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await keywordService.deleteKeyword(keywordId);
      
      if (response.success) {
        await loadKeywords();
        return true;
      } else {
        throw new Error(response.message || '키워드를 삭제하는데 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '키워드를 삭제하는데 실패했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadKeywords]);

  // 그룹 변경 핸들러
  const handleGroupChange = useCallback((groupId: number) => {
    setSelectedGroupId(groupId);
    setPagination(prev => ({ ...prev, page: 1 })); // 페이지 초기화
  }, []);

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  // 페이지당 항목 수 변경 핸들러
  const handleLimitChange = useCallback((limit: number) => {
    setPagination({ page: 1, limit });
  }, []);

  // 정렬 변경 핸들러
  const handleSortChange = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSort({ field, direction });
  }, []);

  // 검색어 변경 핸들러
  const handleSearchChange = useCallback((search: string) => {
    setFilter(prev => ({ ...prev, search }));
    setPagination(prev => ({ ...prev, page: 1 })); // 페이지 초기화
  }, []);

  // 키워드 목록 초기화 핸들러
  const clearKeywords = useCallback(() => {
    setKeywords([]);
    setTotalKeywords(0);
  }, []);

  return {
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
  };
};