import { useState, useEffect, useCallback } from 'react';
import { keywordGroupService, keywordService } from '../services/keywordService';
import { KeywordGroup, Keyword, KeywordInput, KeywordFilter, PaginationParams, SortParams } from '../types';

export const useKeywords = () => {
  // 상태 관리
  const [groups, setGroups] = useState<KeywordGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalKeywords, setTotalKeywords] = useState<number>(0);
  
  // 필터, 페이지네이션, 정렬 상태
  const [filter, setFilter] = useState<KeywordFilter>({});
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 10,
  });
  const [sort, setSort] = useState<SortParams>({
    field: 'created_at',
    direction: 'desc',
  });

  // 그룹 목록 조회
  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await keywordGroupService.getUserGroups();
      
      if (response.success && response.data) {
        setGroups(response.data);
        
        // 처음 로드 시 기본 그룹 선택
        if (!selectedGroupId && response.data.length > 0) {
          const defaultGroup = response.data.find((group: KeywordGroup) => group.isDefault);
          setSelectedGroupId(defaultGroup ? defaultGroup.id : response.data[0].id);
        }
      } else {
        setError(response.message || '그룹을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('그룹을 불러오는 중 오류가 발생했습니다.');
      
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroupId]);

  // 키워드 목록 조회
  const fetchKeywords = useCallback(async () => {
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
        setTotalKeywords(response.data.total || 0);
      } else {
        setError(response.message || '키워드를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('키워드를 불러오는 중 오류가 발생했습니다.');
      
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroupId, filter, pagination, sort]);

  // 그룹 생성
  const createGroup = useCallback(async (name: string, isDefault: boolean = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await keywordGroupService.createGroup(name, isDefault);
      
      if (response.success) {
        await fetchGroups();
        // 새로 생성된 그룹이 있고 선택된 그룹이 없다면 새 그룹 선택
        if (response.data && !selectedGroupId) {
          setSelectedGroupId(response.data.id);
        }
        return true;
      } else {
        setError(response.message || '그룹 생성에 실패했습니다.');
        return false;
      }
    } catch (err) {
      setError('그룹 생성 중 오류가 발생했습니다.');
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchGroups, selectedGroupId]);

  // 그룹 수정
  const updateGroup = useCallback(async (groupId: number, name: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await keywordGroupService.updateGroup(groupId, name);
      
      if (response.success) {
        await fetchGroups();
        return true;
      } else {
        setError(response.message || '그룹 수정에 실패했습니다.');
        return false;
      }
    } catch (err) {
      setError('그룹 수정 중 오류가 발생했습니다.');
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchGroups]);

  // 그룹 삭제
  const deleteGroup = useCallback(async (groupId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await keywordGroupService.deleteGroup(groupId);
      
      if (response.success) {
        await fetchGroups();
        
        // 현재 선택된 그룹이 삭제된 경우 다른 그룹 선택
        if (selectedGroupId === groupId) {
          setSelectedGroupId(null);
        }
        
        return true;
      } else {
        setError(response.message || '그룹 삭제에 실패했습니다.');
        return false;
      }
    } catch (err) {
      setError('그룹 삭제 중 오류가 발생했습니다.');
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchGroups, selectedGroupId]);

  // 키워드 생성
  const createKeyword = useCallback(async (keywordData: KeywordInput) => {
    if (!selectedGroupId) {
      setError('키워드를 추가할 그룹을 선택해주세요.');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await keywordService.createKeyword(
        selectedGroupId,
        keywordData
      );
      
      if (response.success) {
        await fetchKeywords();
        return true;
      } else {
        setError(response.message || '키워드 추가에 실패했습니다.');
        return false;
      }
    } catch (err) {
      setError('키워드 추가 중 오류가 발생했습니다.');
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroupId, fetchKeywords]);

  // 키워드 업데이트
  const updateKeyword = useCallback(async (keywordId: number, data: Partial<Keyword>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await keywordService.updateKeyword(keywordId, data);
      
      if (response.success) {
        await fetchKeywords();
        return true;
      } else {
        setError(response.message || '키워드 수정에 실패했습니다.');
        return false;
      }
    } catch (err) {
      setError('키워드 수정 중 오류가 발생했습니다.');
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchKeywords]);

  // 키워드 삭제
  const deleteKeyword = useCallback(async (keywordId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await keywordService.deleteKeyword(keywordId);
      
      if (response.success) {
        await fetchKeywords();
        return true;
      } else {
        setError(response.message || '키워드 삭제에 실패했습니다.');
        return false;
      }
    } catch (err) {
      setError('키워드 삭제 중 오류가 발생했습니다.');
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchKeywords]);

  // 키워드 벌크 생성
  const bulkCreateKeywords = useCallback(async (keywordsData: KeywordInput[]) => {
    if (!selectedGroupId) {
      setError('키워드를 추가할 그룹을 선택해주세요.');
      return false;
    }
    
    if (keywordsData.length === 0) {
      setError('추가할 키워드가 없습니다.');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await keywordService.bulkCreateKeywords(
        selectedGroupId,
        keywordsData
      );
      
      if (response.success) {
        await fetchKeywords();
        return true;
      } else {
        setError(response.message || '키워드 대량 추가에 실패했습니다.');
        return false;
      }
    } catch (err) {
      setError('키워드 대량 추가 중 오류가 발생했습니다.');
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroupId, fetchKeywords]);

  // 페이지 변경
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  // 페이지당 항목 수 변경
  const handleLimitChange = useCallback((limit: number) => {
    setPagination({ page: 1, limit });
  }, []);

  // 정렬 변경
  const handleSortChange = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSort({ field, direction });
  }, []);

  // 검색어 변경
  const handleSearchChange = useCallback((search: string) => {
    setFilter(prev => ({ ...prev, search }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // 그룹 변경
  const handleGroupChange = useCallback((groupId: number) => {
    setSelectedGroupId(groupId);
    setPagination({ page: 1, limit: pagination.limit });
  }, [pagination.limit]);

  // 초기 로드 시 그룹 및 키워드 데이터 조회
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // 선택된 그룹, 필터, 페이지네이션, 정렬이 변경될 때 키워드 데이터 조회
  useEffect(() => {
    if (selectedGroupId) {
      fetchKeywords();
    }
  }, [selectedGroupId, filter, pagination, sort, fetchKeywords]);

  return {
    groups,
    keywords,
    selectedGroupId,
    isLoading,
    error,
    totalKeywords,
    pagination,
    filter,
    sort,
    createGroup,
    updateGroup,
    deleteGroup,
    createKeyword,
    updateKeyword,
    deleteKeyword,
    bulkCreateKeywords,
    handleGroupChange,
    handlePageChange,
    handleLimitChange,
    handleSortChange,
    handleSearchChange,
  };
};