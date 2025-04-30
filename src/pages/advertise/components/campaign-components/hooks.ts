import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';
import { SlotItem, CampaignListItem, Campaign } from './types';

/**
 * 슬롯 편집 관련 커스텀 훅
 */
export const useSlotEditing = (slots: SlotItem[], setSlots: (slots: SlotItem[]) => void, filteredSlots: SlotItem[], setFilteredSlots: (slots: SlotItem[]) => void) => {
  const [editingCell, setEditingCell] = useState<{ id: string, field: string }>({ id: '', field: '' });
  const [editingValue, setEditingValue] = useState<string>('');

  // document 클릭 이벤트 핸들러
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // 편집 중인 상태가 아니면 아무 작업도 하지 않음
      if (!editingCell.id || !editingCell.field) return;
      
      // 클릭된 요소가 input이거나 editable-cell인 경우 무시
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.closest('.editable-cell') || 
        target.classList.contains('editable-cell')
      ) {
        return;
      }
      
      // 다른 곳을 클릭한 경우 편집 모드 종료 (저장)
      saveEdit();
    };
    
    // 이벤트 리스너 등록
    document.addEventListener('mousedown', handleDocumentClick);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [editingCell, editingValue, slots]);

  // 셀 편집 시작
  const handleEditStart = useCallback((id: string, field: string) => {
    const slot = slots.find(item => item.id === id);
    if (!slot) return;

    let initialValue = '';
    
    switch (field) {
      case 'productName':
        initialValue = slot.inputData.productName;
        break;
      case 'mid':
        initialValue = slot.inputData.mid;
        break;
      case 'url':
        initialValue = slot.inputData.url;
        break;
      case 'keywords':
        initialValue = slot.inputData.keywords.join(',');
        break;
      default:
        return;
    }

    setEditingCell({ id, field });
    setEditingValue(initialValue);
  }, [slots]);

  // 편집 내용 저장
  const saveEdit = useCallback(async () => {
    if (!editingCell.id || !editingCell.field) return;

    const slot = slots.find(item => item.id === editingCell.id);
    if (!slot) return;

    try {
      // 값이 비어있는지 확인
      if (!editingValue.trim() && (editingCell.field === 'productName' || editingCell.field === 'mid' || editingCell.field === 'url')) {
        // 필수 값이 비어있으면 저장하지 않고 편집 모드만 종료
        setEditingCell({ id: '', field: '' });
        setEditingValue('');
        return;
      }

      const updatedInputData = { ...slot.inputData };

      switch (editingCell.field) {
        case 'productName':
          updatedInputData.productName = editingValue.trim();
          break;
        case 'mid':
          updatedInputData.mid = editingValue.trim();
          break;
        case 'url':
          // URL 형식 검증 (간소화)
          updatedInputData.url = editingValue.trim();
          if (!updatedInputData.url.startsWith('http://') && !updatedInputData.url.startsWith('https://')) {
            updatedInputData.url = 'https://' + updatedInputData.url.replace(/^(https?:\/\/)/, '');
          }
          break;
        case 'keywords':
          updatedInputData.keywords = editingValue.split(',')
            .map(k => k.trim())
            .filter(k => k);
          break;
        default:
          return;
      }
      
      // Supabase 업데이트
      await supabase
        .from('slots')
        .update({ 
          input_data: updatedInputData,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCell.id);
      
      // 로컬 상태 업데이트
      setSlots(prevSlots => prevSlots.map(item => {
        if (item.id === editingCell.id) {
          return {
            ...item,
            inputData: { ...updatedInputData },
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      }));
      
      setFilteredSlots(prevFiltered => prevFiltered.map(item => {
        if (item.id === editingCell.id) {
          return {
            ...item,
            inputData: { ...updatedInputData },
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      }));
    } catch (err) {
      console.error('슬롯 수정 실패:', err);
    } finally {
      // 편집 상태 초기화 (성공/실패 상관없이)
      setEditingCell({ id: '', field: '' });
      setEditingValue('');
    }
  }, [editingCell, editingValue, slots, setSlots, setFilteredSlots]);

  return {
    editingCell,
    editingValue,
    handleEditStart,
    handleEditChange: setEditingValue,
    saveEdit
  };
};

/**
 * 서비스 타입과 URL 기반으로 서비스 카테고리 결정 커스텀 훅
 */
export const useServiceCategory = (pathname: string) => {
  const [serviceCategory, setServiceCategory] = useState<string>('');
  
  useEffect(() => {
    // URL 기반으로 서비스 카테고리 결정
    if (pathname.includes('naver/traffic')) {
      setServiceCategory('N 트래픽');
    } else if (pathname.includes('naver/auto')) {
      setServiceCategory('N 자동완성');
    } else if (pathname.includes('naver/shopping/traffic')) {
      setServiceCategory('NS 트래픽');
    } else if (pathname.includes('naver/place/save')) {
      setServiceCategory('NP 저장하기');
    } else if (pathname.includes('naver/place/share')) {
      setServiceCategory('NP 블로그공유');
    } else if (pathname.includes('naver/place/traffic')) {
      setServiceCategory('NP 트래픽');
    } else if (pathname.includes('coupang/traffic')) {
      setServiceCategory('CP 트래픽');
    } else if (pathname.includes('ohouse/traffic')) {
      setServiceCategory('OH 트래픽');
    } else {
      // URL에서 기본 서비스 정보 추출 (fallback)
      const pathSegments = pathname.split('/').filter(Boolean);
      setServiceCategory(pathSegments.length >= 3 ? `${pathSegments[1]} > ${pathSegments[2]}` : '');
    }
  }, [pathname]);

  return serviceCategory;
};

/**
 * 캠페인 및 슬롯 데이터 가져오는 커스텀 훅
 */
export const useCampaignSlots = (serviceType: string, userId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<SlotItem[]>([]);
  const [campaignList, setCampaignList] = useState<CampaignListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  
  // 검색 파라미터 상태
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchDateFrom, setSearchDateFrom] = useState<string>('');
  const [searchDateTo, setSearchDateTo] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | 'all'>('all');

  // 슬롯 데이터 가져오기
  const fetchSlots = useCallback(async () => {
    if (!serviceType || !userId) {
      console.error('서비스 타입 또는 사용자 ID가 없습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // 서비스 타입에 맞는 캠페인 ID들 가져오기
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, campaign_name, logo, status, service_type')
        .eq('service_type', serviceType)
        .order('id', {ascending: true});
      
      if (campaignError) {
        throw campaignError;
      }
      
      if (!campaignData || campaignData.length === 0) {
        setSlots([]);
        setFilteredSlots([]);
        setTotalCount(0);
        setCampaignList([]);
        setIsLoading(false);
        return;
      }
      
      // 캠페인 목록 설정
      const campaigns = campaignData.map(campaign => ({
        id: campaign.id,
        campaignName: campaign.campaign_name
      }));
      
      setCampaignList(campaigns);
      
      // 캠페인 ID 배열 생성
      const campaignIds = campaignData.map(campaign => campaign.id);
      
      // 현재 서비스 타입의 캠페인에 해당하는 사용자의 슬롯 데이터 가져오기
      let query = supabase
        .from('slots')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .in('product_id', campaignIds);
      
      // 캠페인 필터 적용
      if (selectedCampaignId !== 'all') {
        query = query.eq('product_id', selectedCampaignId);
      }
      
      // 상태 필터 적용
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      // 검색어 필터 적용
      if (searchInput) {
        query = query.or(`input_data->productName.ilike.%${searchInput}%,input_data->mid.ilike.%${searchInput}%,input_data->url.ilike.%${searchInput}%`);
      }
      
      // 날짜 필터 적용 (created_at 필드 기준)
      if (searchDateFrom) {
        query = query.gte('created_at', `${searchDateFrom}T00:00:00`);
      }
      
      if (searchDateTo) {
        query = query.lte('created_at', `${searchDateTo}T23:59:59`);
      }
      
      const { data, error: slotsError, count } = await query.order('created_at', { ascending: false });
      
      if (slotsError) {
        throw slotsError;
      }
      
      if (data) {
        // 데이터 변환 및 캠페인 정보 추가
        const processedSlots: SlotItem[] = data.map(slot => {
          const matchingCampaign = campaignData.find(campaign => campaign.id === slot.product_id);
          
          return {
            id: slot.id,
            matId: slot.mat_id,
            productId: slot.product_id,
            userId: slot.user_id,
            status: slot.status,
            submittedAt: slot.submitted_at,
            processedAt: slot.processed_at,
            rejectionReason: slot.rejection_reason,
            userReason: slot.user_reason,
            inputData: slot.input_data,
            deadline: slot.deadline,
            createdAt: slot.created_at,
            updatedAt: slot.updated_at,
            campaign: matchingCampaign ? {
              id: matchingCampaign.id,
              campaignName: matchingCampaign.campaign_name,
              logo: matchingCampaign.logo,
              status: matchingCampaign.status,
              serviceType: matchingCampaign.service_type
            } : undefined
          };
        });
        
        setSlots(processedSlots);
        setFilteredSlots(processedSlots);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error('슬롯 데이터 가져오기 실패:', err);
      setError('슬롯 데이터를 불러오는 중 오류가 발생했습니다.');
      
      // 개발 모드에서만 임시 데이터 사용
      if (process.env.NODE_ENV === 'development') {
        const mockSlots = generateMockSlots(serviceType, userId);
        setSlots(mockSlots);
        setFilteredSlots(mockSlots);
        setTotalCount(mockSlots.length);
      }
    } finally {
      setIsLoading(false);
    }
  }, [serviceType, userId, statusFilter, searchInput, searchDateFrom, searchDateTo, selectedCampaignId]);

  // 필터 변경 시 데이터 다시 필터링
  useEffect(() => {
    if (statusFilter !== 'all' || searchInput || searchDateFrom || searchDateTo || selectedCampaignId !== 'all') {
      let filtered = [...slots];
      
      // 캠페인 필터링 (클라이언트 측)
      if (selectedCampaignId !== 'all') {
        filtered = filtered.filter(item => item.productId === selectedCampaignId);
      }
      
      // 상태 필터링
      if (statusFilter !== 'all') {
        filtered = filtered.filter(item => item.status === statusFilter);
      }
      
      // 검색어 필터링
      if (searchInput) {
        const normalizedSearchTerm = searchInput.toLowerCase().trim();
        filtered = filtered.filter(item => 
          item.inputData.productName.toLowerCase().includes(normalizedSearchTerm) ||
          item.inputData.mid.toLowerCase().includes(normalizedSearchTerm) ||
          item.inputData.url.toLowerCase().includes(normalizedSearchTerm) ||
          item.inputData.keywords.some(keyword => 
            keyword.toLowerCase().includes(normalizedSearchTerm)
          )
        );
      }
      
      // 날짜 필터링 (클라이언트 측)
      if (searchDateFrom) {
        const fromDate = new Date(`${searchDateFrom}T00:00:00`);
        filtered = filtered.filter(item => new Date(item.createdAt) >= fromDate);
      }
      
      if (searchDateTo) {
        const toDate = new Date(`${searchDateTo}T23:59:59`);
        filtered = filtered.filter(item => new Date(item.createdAt) <= toDate);
      }
      
      setFilteredSlots(filtered);
    } else {
      setFilteredSlots(slots);
    }
  }, [statusFilter, searchInput, searchDateFrom, searchDateTo, selectedCampaignId, slots]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (serviceType && userId) {
      fetchSlots();
    }
  }, [serviceType, userId, fetchSlots]);

  // 슬롯 삭제 핸들러
  const handleDeleteSlot = async (id: string) => {
    if (!window.confirm('정말로 이 슬롯을 삭제하시겠습니까?')) {
      return;
    }

    try {
      // Supabase에서 삭제
      const { error: deleteError } = await supabase
        .from('slots')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // 로컬 상태 업데이트
      const updatedSlots = slots.filter(item => item.id !== id);
      setSlots(updatedSlots);

      // 필터링된 슬롯도 업데이트
      const updatedFilteredSlots = filteredSlots.filter(item => item.id !== id);
      setFilteredSlots(updatedFilteredSlots);

    } catch (err) {
      console.error('슬롯 삭제 실패:', err);
      alert('슬롯 삭제 중 오류가 발생했습니다.');
    }
  };

  return {
    isLoading,
    error,
    slots,
    setSlots,
    filteredSlots,
    setFilteredSlots,
    totalCount,
    campaignList,
    statusFilter,
    setStatusFilter,
    searchInput, 
    setSearchInput,
    searchDateFrom,
    setSearchDateFrom,
    searchDateTo,
    setSearchDateTo,
    selectedCampaignId,
    setSelectedCampaignId,
    fetchSlots,
    handleDeleteSlot
  };
};

// 임시 데이터 생성 (개발 모드에서만 사용)
const generateMockSlots = (serviceType: string, userId: string): SlotItem[] => {
  const statuses = ['draft', 'submitted', 'approved', 'rejected', 'active', 'paused', 'completed'];
  const serviceCategory = serviceType ? { 
    'NaverShopTraffic': 'NS 트래픽',
    'NaverPlaceSave': 'NP 저장',
    'NaverPlaceShare': 'NP 공유',
    'NaverPlaceTraffic': 'NP 트래픽',
    'NaverAuto': 'N 자동완성',
    'NaverTraffic': 'N 트래픽',
    'CoupangTraffic': 'C 트래픽',
    'OhouseTraffic': 'OH 트래픽'
  }[serviceType] : '테스트 서비스';
  
  return Array.from({ length: 10 }, (_, i) => ({
    id: `mock-slot-${i}`,
    matId: `mock-mat-${i}`,
    productId: i + 1,
    userId: userId,
    status: statuses[i % statuses.length],
    submittedAt: i % 2 === 0 ? new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString() : null,
    processedAt: i % 3 === 0 ? new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString() : null,
    rejectionReason: i % 4 === 0 ? '요청 사항이 불명확합니다.' : null,
    userReason: i % 5 === 0 ? '사용자 메모입니다.' : null,
    inputData: {
      productName: `테스트 상품 ${i + 1}`,
      mid: `MID${10000 + i}`,
      url: `https://example.com/product/${i + 1}`,
      keywords: [
        `키워드${i + 1}`,
        `테스트${i + 1}`,
        `상품${i + 1}`
      ]
    },
    deadline: '22:00',
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
    campaign: {
      id: i + 1,
      campaignName: `${serviceCategory} 캠페인 ${i + 1}`,
      logo: 'animal/svg/lion.svg',
      status: 'active',
      serviceType: serviceType
    }
  }));
};
