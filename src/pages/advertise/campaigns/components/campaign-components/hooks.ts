import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';
import { SlotItem, CampaignListItem, Campaign } from './types';
import { hasPermission, PERMISSION_GROUPS } from '@/config/roles.config';
import { SERVICE_TYPE_TO_CATEGORY, URL_TO_DB_SERVICE_TYPE } from './constants';

/**
 * 슬롯 편집 관련 커스텀 훅
 */
export const useSlotEditing = (
  slots: SlotItem[],
  setSlots: (slots: SlotItem[] | ((prev: SlotItem[]) => SlotItem[])) => void,
  filteredSlots: SlotItem[],
  setFilteredSlots: (slots: SlotItem[] | ((prev: SlotItem[]) => SlotItem[])) => void
) => {
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
      case 'mainKeyword':
        initialValue = slot.inputData.mainKeyword || '';
        break;
      case 'keywords':
        // 서브키워드만 편집
        initialValue = Array.isArray(slot.inputData.keywords) ? slot.inputData.keywords.join(',') : '';
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
        case 'mainKeyword':
          updatedInputData.mainKeyword = editingValue.trim();
          break;
        case 'keywords':
          const keywordArray = editingValue.split(',')
            .map(k => k.trim())
            .filter(k => k);

          // keywords 배열로 저장
          updatedInputData.keywords = keywordArray;

          // keyword1, keyword2, keyword3로도 저장 (하위 호환성)
          updatedInputData.keyword1 = keywordArray[0] || '';
          updatedInputData.keyword2 = keywordArray[1] || '';
          updatedInputData.keyword3 = keywordArray[2] || '';
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
      setSlots((prevSlots: SlotItem[]) => {
        return prevSlots.map((item: SlotItem) => {
          if (item.id === editingCell.id) {
            return {
              ...item,
              inputData: { ...updatedInputData },
              updatedAt: new Date().toISOString()
            };
          }
          return item;
        });
      });

      setFilteredSlots((prevFiltered: SlotItem[]) => {
        return prevFiltered.map((item: SlotItem) => {
          if (item.id === editingCell.id) {
            return {
              ...item,
              inputData: { ...updatedInputData },
              updatedAt: new Date().toISOString()
            };
          }
          return item;
        });
      });
    } catch (err) {

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
    saveEdit,
    handleEditCancel: () => {
      setEditingCell({ id: '', field: '' });
      setEditingValue('');
    }
  };
};

/**
 * 서비스 타입과 URL 기반으로 서비스 카테고리 결정 커스텀 훅
 */
export const useServiceCategory = (pathname: string) => {
  const [serviceCategory, setServiceCategory] = useState<string>('');

  useEffect(() => {
    // 새로운 URL 형식 처리 (/advertise/campaigns/info/:serviceType 또는 /advertise/campaigns/my/:serviceType)
    if (pathname.includes('/advertise/campaigns/') && (pathname.includes('/info/') || pathname.includes('/my/'))) {
      const pathSegments = pathname.split('/').filter(Boolean);
      // 서비스 타입은 마지막 세그먼트 (예: naver-shopping-traffic)
      const serviceType = pathSegments.length >= 4 ? pathSegments[3] : '';

      if (serviceType) {
        // constants.tsx의 SERVICE_TYPE_TO_CATEGORY 매핑 사용
        const category = SERVICE_TYPE_TO_CATEGORY[serviceType];
        setServiceCategory(category || serviceType.replace(/-/g, ' '));
        return;
      }
    }

    // 구 URL 형식에 대한 backward compatibility 유지
    if (pathname.includes('/ntraffic')) {
      setServiceCategory('N 트래픽');
    } else if (pathname.includes('naver/traffic')) {
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
export const useCampaignSlots = (serviceType: string, userId: string | undefined, userRole?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<SlotItem[]>([]);
  const [campaignList, setCampaignList] = useState<CampaignListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // 타입 오류 방지를 위한 래퍼 함수
  const updateSlots = (newSlotsOrUpdater: SlotItem[] | ((prev: SlotItem[]) => SlotItem[])) => {
    if (typeof newSlotsOrUpdater === 'function') {
      setSlots(prev => newSlotsOrUpdater(prev));
    } else {
      setSlots(newSlotsOrUpdater);
    }
  };

  const updateFilteredSlots = (newSlotsOrUpdater: SlotItem[] | ((prev: SlotItem[]) => SlotItem[])) => {
    if (typeof newSlotsOrUpdater === 'function') {
      setFilteredSlots(prev => newSlotsOrUpdater(prev));
    } else {
      setFilteredSlots(newSlotsOrUpdater);
    }
  };

  // 검색 파라미터 상태
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchDateFrom, setSearchDateFrom] = useState<string>('');
  const [searchDateTo, setSearchDateTo] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | 'all'>('all');

  // 슬롯 데이터 가져오기
  const fetchSlots = useCallback(async () => {

    if (!serviceType || !userId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // URL 서비스 타입을 DB 서비스 타입으로 변환
      const dbServiceType = URL_TO_DB_SERVICE_TYPE[serviceType] || serviceType;

      // 서비스 타입에 맞는 캠페인 ID들 가져오기


      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, campaign_name, logo, status, service_type, add_info, refund_settings, ranking_field_mapping')
        .eq('service_type', dbServiceType)
        .order('id', { ascending: true });


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

      // 운영자 이상 권한 체크
      const isOperatorOrAbove = userRole ? hasPermission(userRole, PERMISSION_GROUPS.ADMIN) : false;


      // 현재 서비스 타입의 캠페인에 해당하는 슬롯 데이터 가져오기
      let query = supabase
        .from('slots')
        .select(`
          *,
          start_date,
          end_date,
          quantity,
          user:users(id, email, full_name),
          refund_requests:slot_refund_approvals(
            id,
            status,
            refund_reason,
            approval_notes,
            request_date,
            approval_date
          ),
          slot_works_info(
            work_cnt,
            date
          )
        `, { count: 'exact' });

      // 캠페인 ID 필터가 있는 경우에만 적용
      if (campaignIds.length > 0) {
        query = query.in('product_id', campaignIds);
      }

      // 운영자 이상이 아닌 경우에만 사용자 ID로 필터링
      if (!isOperatorOrAbove) {
        query = query.eq('user_id', userId);
      }

      // 캠페인 필터 적용
      if (selectedCampaignId !== 'all') {
        query = query.eq('product_id', selectedCampaignId);
      }

      // 상태 필터 적용
      if (statusFilter !== 'all') {
        // 'active'는 실제로 'approved' 상태를 의미함
        const actualStatus = statusFilter === 'active' ? 'approved' : statusFilter;
        query = query.eq('status', actualStatus);
      }

      // 검색어 필터 적용은 클라이언트 측에서 처리 (JSONB 필드 검색 제한 회피)
      // if (searchInput) {
      //   query = query.or(`input_data->productName.ilike.%${searchInput}%,input_data->>mid.ilike.%${searchInput}%,input_data->url.ilike.%${searchInput}%`);
      // }

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


          // 캠페인 로고 처리 (ApprovePage 로직과 동일)
          let campaignLogo = undefined;
          if (matchingCampaign) {
            // 실제 업로드된 로고 URL 확인 (add_info.logo_url)
            if (matchingCampaign.add_info && typeof matchingCampaign.add_info === 'object' && matchingCampaign.add_info.logo_url) {
              campaignLogo = matchingCampaign.add_info.logo_url;
            } else {
              // 업로드된 로고가 없으면 동물 아이콘 사용
              campaignLogo = matchingCampaign.logo;
            }
          }

          // input_data 처리 - keyword1, keyword2, keyword3를 keywords 배열로 변환
          const processedInputData = { ...slot.input_data };

          // keywords 배열이 없으면 keyword1, keyword2, keyword3에서 생성
          if (!processedInputData.keywords && (processedInputData.keyword1 || processedInputData.keyword2 || processedInputData.keyword3)) {
            const keywords = [];
            if (processedInputData.keyword1) keywords.push(processedInputData.keyword1);
            if (processedInputData.keyword2) keywords.push(processedInputData.keyword2);
            if (processedInputData.keyword3) keywords.push(processedInputData.keyword3);
            processedInputData.keywords = keywords;
          }

          // 작업 진행률 계산 (approved/active 상태일 때만)
          let workProgress = undefined;
          if ((slot.status === 'approved' || slot.status === 'active') && 
              slot.slot_works_info && Array.isArray(slot.slot_works_info)) {
            // 작업 기간 계산
            let dueDays = 1;
            if (slot.start_date && slot.end_date) {
              const start = new Date(slot.start_date);
              const end = new Date(slot.end_date);
              dueDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            } else if (processedInputData.work_days && Number(processedInputData.work_days) > 0) {
              dueDays = Number(processedInputData.work_days);
            } else if (processedInputData.dueDays && Number(processedInputData.dueDays) > 0) {
              dueDays = Number(processedInputData.dueDays);
            } else if (processedInputData.workCount && Number(processedInputData.workCount) > 0) {
              dueDays = Number(processedInputData.workCount);
            }

            // 일일 작업량 가져오기
            let dailyQuantity = 0;
            if (slot.quantity && Number(slot.quantity) > 0) {
              dailyQuantity = Number(slot.quantity);
            } else if (processedInputData.quantity && Number(processedInputData.quantity) > 0) {
              dailyQuantity = Number(processedInputData.quantity);
            } else if (processedInputData.타수 && Number(processedInputData.타수) > 0) {
              dailyQuantity = Number(processedInputData.타수);
            } else if (processedInputData['일일 타수'] && Number(processedInputData['일일 타수']) > 0) {
              dailyQuantity = Number(processedInputData['일일 타수']);
            } else if (processedInputData['작업량'] && Number(processedInputData['작업량']) > 0) {
              dailyQuantity = Number(processedInputData['작업량']);
            }

            // 총 요청 수량 계산
            const totalRequestedQuantity = dailyQuantity * dueDays;

            // 실제 작업량 계산
            const totalWorkedQuantity = slot.slot_works_info.reduce((sum: number, work: any) => 
              sum + (work.work_cnt || 0), 0
            );

            // 작업 일수 계산
            const workedDays = slot.slot_works_info.length;

            // 완료율 계산 (100% 상한)
            const completionRate = totalRequestedQuantity > 0
              ? Math.min(100, Math.round((totalWorkedQuantity / totalRequestedQuantity) * 100))
              : 0;

            // 디버깅용 로그
            if (process.env.NODE_ENV === 'development') {
              console.log(`Slot ${slot.id} 진행률 계산:`, {
                dailyQuantity,
                dueDays,
                totalRequestedQuantity,
                totalWorkedQuantity,
                workedDays,
                completionRate,
                slot_works_info: slot.slot_works_info
              });
            }

            workProgress = {
              totalRequestedQuantity,
              totalWorkedQuantity,
              requestedDays: dueDays,
              workedDays,
              completionRate
            };
          }

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
            inputData: processedInputData,
            deadline: slot.deadline,
            createdAt: slot.created_at,
            updatedAt: slot.updated_at,
            startDate: slot.start_date,
            endDate: slot.end_date,
            quantity: slot.quantity,
            workProgress,
            campaign: matchingCampaign ? {
              id: matchingCampaign.id,
              campaignName: matchingCampaign.campaign_name,
              logo: campaignLogo,
              status: matchingCampaign.status,
              serviceType: matchingCampaign.service_type,
              refund_settings: matchingCampaign.refund_settings,
              ranking_field_mapping: matchingCampaign.ranking_field_mapping
            } : undefined,
            user: slot.user,
            refund_requests: slot.refund_requests
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
        const mockSlots = generateMockSlots(serviceType, userId);
        setSlots(mockSlots);
        setFilteredSlots(mockSlots);
        setTotalCount(mockSlots.length);
      }
    } finally {
      setIsLoading(false);
    }
  }, [serviceType, userId, userRole, statusFilter, searchDateFrom, searchDateTo, selectedCampaignId]);

  // 필터 변경 시 데이터 다시 필터링
  useEffect(() => {
    // 검색어 필터만 클라이언트 측에서 처리 (서버에서 JSONB 검색 제한)
    if (searchInput) {
      const normalizedSearchTerm = searchInput.toLowerCase().trim();
      const filtered = slots.filter(item =>
        item.inputData.productName?.toLowerCase().includes(normalizedSearchTerm) ||
        item.inputData.mid?.toString().toLowerCase().includes(normalizedSearchTerm) ||
        item.inputData.url?.toLowerCase().includes(normalizedSearchTerm) ||
        item.inputData.mainKeyword?.toLowerCase().includes(normalizedSearchTerm) ||
        item.inputData.keyword1?.toLowerCase().includes(normalizedSearchTerm) ||
        item.inputData.keyword2?.toLowerCase().includes(normalizedSearchTerm) ||
        item.inputData.keyword3?.toLowerCase().includes(normalizedSearchTerm) ||
        (Array.isArray(item.inputData.keywords) && item.inputData.keywords.some(keyword =>
          keyword.toLowerCase().includes(normalizedSearchTerm)
        ))
      );
      setFilteredSlots(filtered);
    } else {
      // 검색어가 없으면 서버에서 필터링된 slots를 그대로 사용
      setFilteredSlots(slots);
    }
  }, [searchInput, slots]);

  // 필터나 서비스 타입 변경 시 데이터 로드
  useEffect(() => {
    if (serviceType && userId) {
      fetchSlots();
    }
  }, [fetchSlots]);

  // 슬롯 삭제 핸들러
  const handleDeleteSlot = async (id: string) => {
    if (!window.confirm('정말로 이 슬롯을 취소하시겠습니까?')) {
      return;
    }

    try {
      // 슬롯 정보 확인
      const slot = slots.find(s => s.id === id);
      if (!slot) {
        throw new Error('슬롯을 찾을 수 없습니다.');
      }

      // pending, submitted 상태만 취소 가능
      if (!['pending', 'submitted'].includes(slot.status)) {
        alert('이미 처리된 슬롯은 취소할 수 없습니다.');
        return;
      }

      // 1. 슬롯 상태를 cancelled로 변경
      const { error: updateError } = await supabase
        .from('slots')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      // 2. slot_pending_balances 상태도 cancelled로 변경
      const { error: pendingError } = await supabase
        .from('slot_pending_balances')
        .update({ status: 'cancelled' })
        .eq('slot_id', id);

      if (pendingError) {
        console.error('pending balance 업데이트 오류:', pendingError);
      }

      // 3. 환불 처리
      const { data: pendingBalance } = await supabase
        .from('slot_pending_balances')
        .select('amount')
        .eq('slot_id', id)
        .single();

      if (pendingBalance && pendingBalance.amount > 0) {
        // user_balances 업데이트
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          // 현재 잔액 조회
          const { data: currentBalance } = await supabase
            .from('user_balances')
            .select('amount')
            .eq('user_id', userData.user.id)
            .single();

          if (currentBalance) {
            // 잔액 증가
            await supabase
              .from('user_balances')
              .update({ 
                amount: Number(currentBalance.amount) + Number(pendingBalance.amount),
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userData.user.id);

            // cash history 추가
            await supabase
              .from('user_cash_history')
              .insert({
                user_id: userData.user.id,
                amount: pendingBalance.amount,
                transaction_type: 'refund',
                description: `슬롯 취소 환불 - ${slot.campaign?.campaignName || slot.campaign_name || ''}`,
                status: 'completed',
                created_at: new Date().toISOString()
              });
          }
        }
      }

      // 로컬 상태 업데이트 (상태만 변경)
      const updatedSlots = slots.map(item => 
        item.id === id ? { ...item, status: 'cancelled' } : item
      );
      setSlots(updatedSlots);

      // 필터링된 슬롯도 업데이트
      const updatedFilteredSlots = filteredSlots.map(item => 
        item.id === id ? { ...item, status: 'cancelled' } : item
      );
      setFilteredSlots(updatedFilteredSlots);

      alert('슬롯이 성공적으로 취소되었습니다.');

    } catch (err: any) {
      console.error('슬롯 취소 오류:', err);
      alert(err.message || '슬롯 취소 중 오류가 발생했습니다.');
    }
  };

  return {
    isLoading,
    error,
    slots,
    setSlots: updateSlots,
    filteredSlots,
    setFilteredSlots: updateFilteredSlots,
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
  // constants.tsx의 SERVICE_TYPE_TO_CATEGORY 매핑 사용
  const serviceCategory = SERVICE_TYPE_TO_CATEGORY[serviceType] || '테스트 서비스';

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
    startDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    campaign: {
      id: i + 1,
      campaignName: `${serviceCategory} 캠페인 ${i + 1}`,
      logo: '/media/animal/svg/lion.svg',
      status: 'active',
      serviceType: serviceType
    }
  }));
};
