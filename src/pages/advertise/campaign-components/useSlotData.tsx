import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { SlotItem } from './types';

/**
 * 슬롯 데이터를 가져오고 관리하는 커스텀 훅
 */
export const useSlotData = (serviceType: string, userId: string | undefined) => {
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<SlotItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaignList, setCampaignList] = useState<{id: number, campaignName: string}[]>([]);
  
  // 필터 상태
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchDateFrom, setSearchDateFrom] = useState<string>('');
  const [searchDateTo, setSearchDateTo] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | 'all'>('all');

  // 슬롯 데이터 가져오기
  const fetchSlots = async () => {
    if (!userId) {
      
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
      
      setError('슬롯 데이터를 불러오는 중 오류가 발생했습니다.');
      
      // 개발 모드에서만 임시 데이터 사용
      if (process.env.NODE_ENV === 'development') {
        const mockSlots = generateMockSlots(userId, serviceType);
        setSlots(mockSlots);
        setFilteredSlots(mockSlots);
        setTotalCount(mockSlots.length);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 임시 데이터 생성 (개발 모드에서만 사용)
  const generateMockSlots = (userId: string, serviceType: string): SlotItem[] => {
    const statuses = ['draft', 'submitted', 'approved', 'rejected', 'active', 'paused', 'completed'];
    
    return Array.from({ length: 10 }, (_, i) => ({
      id: `mock-slot-${i}`,
      matId: `mock-mat-${i}`,
      productId: i + 1,
      userId: userId || 'mock-user',
      status: statuses[i % statuses.length],
      submittedAt: i % 2 === 0 ? new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString() : null,
      processedAt: i % 3 === 0 ? new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString() : null,
      rejectionReason: i % 4 === 0 ? '요청 사항이 불명확합니다.' : null,
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
        campaignName: `캠페인 ${i + 1}`,
        logo: 'animal/svg/lion.svg',
        status: 'active',
        serviceType: serviceType
      }
    }));
  };

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

  // 슬롯 수정 함수
  const updateSlot = async (slotId: string, updatedInputData: any) => {
    try {
      // Supabase 업데이트
      await supabase
        .from('slots')
        .update({ 
          input_data: updatedInputData,
          updated_at: new Date().toISOString()
        })
        .eq('id', slotId);
      
      // 로컬 상태 업데이트
      setSlots(prevSlots => prevSlots.map(item => {
        if (item.id === slotId) {
          return {
            ...item,
            inputData: { ...updatedInputData },
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      }));
    } catch (err) {
      
      throw err;
    }
  };

  // 슬롯 삭제 함수
  const deleteSlot = async (slotId: string) => {
    try {
      // Supabase에서 삭제
      const { error: deleteError } = await supabase
        .from('slots')
        .delete()
        .eq('id', slotId);

      if (deleteError) {
        throw deleteError;
      }

      // 로컬 상태 업데이트
      const updatedSlots = slots.filter(item => item.id !== slotId);
      setSlots(updatedSlots);
      setFilteredSlots(filteredSlots.filter(item => item.id !== slotId));
      
      return true;
    } catch (err) {
      
      throw err;
    }
  };

  return {
    slots,
    filteredSlots,
    totalCount,
    isLoading,
    error,
    campaignList,
    statusFilter,
    searchInput,
    searchDateFrom,
    searchDateTo,
    selectedCampaignId,
    setStatusFilter,
    setSearchInput,
    setSearchDateFrom,
    setSearchDateTo,
    setSelectedCampaignId,
    fetchSlots,
    updateSlot,
    deleteSlot
  };
};
