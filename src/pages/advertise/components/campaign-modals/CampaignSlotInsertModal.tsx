import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
  DialogClose,
} from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';
import { getStatusColorClass, CampaignDetailData as ICampaignDetailData, CampaignData } from '@/utils/CampaignFormat';
import { Input } from '@/components/ui/input';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/auth';
import { cn } from '@/lib/utils';
import { registerSlot } from './services/slotService';

// X 버튼이 없는 DialogContent 커스텀 컴포넌트
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed max-h-[95%] scrollable-y-auto left-[50%] top-[50%] z-[1000] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
        className
      )}
      style={{ 
        position: 'fixed', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        zIndex: 1000
      }}
      {...props}
    >
      {children}
      {/* X 버튼 제거 */}
    </DialogPrimitive.Content>
  </DialogPortal>
));


interface CampaignSlotInsertModalProps {
  open: boolean;
  onClose: () => void;
  category: string | null;
  campaign?: CampaignData | null;
  onSave?: (data: CampaignSlotData) => void;
  serviceCode?: string; // 서비스 코드 (NaverShopTraffic, BlogPosting 등)
}

// 추가할 슬롯 데이터 인터페이스
interface CampaignSlotData {
  productName: string;
  mid: string;
  url: string;
  keyword1: string;
  keyword2: string;
  keyword3: string;
  campaignId?: number; // 선택된 캠페인 ID
}

// 슬롯 데이터 인터페이스 (DB에서 가져온 데이터)
interface UserSlotData {
  id: string;
  mat_id: string;
  product_id: number;
  user_id: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_at?: string;
  processed_at?: string;
  rejection_reason?: string;
  input_data: {
    productName: string;
    mid: string;
    url: string;
    keywords: string[];
  };
  deadline?: string;
  created_at: string;
  updated_at: string;
  // 캠페인 조인 데이터
  campaign?: {
    id: number;
    campaign_name: string;
    logo?: string;
    status: string;
    service_type: string;
  };
}

// 검색 필터 인터페이스
interface SearchFilters {
  productName: string;
  mid: string;
  url: string;
  keyword: string;
  campaignId: number | null;
  status: string | null;
}

// supabase로부터 가져온 캠페인 데이터 인터페이스
interface SupabaseCampaign {
  id: number;
  created_at: string;
  campaign_name: string;
  description?: string;
  logo?: string;
  status: string;
  service_type: string;
  efficiency?: string | number;
  min_quantity?: string | number;
  deadline?: string;
  unit_price?: string | number;
  additional_logic?: string | number;
  mat_id?: string; // 총판의 UUID
  user_id?: string; // 관리자/총판 ID
  add_info?: any; // 배너 URL 등의 추가 정보
}

const CampaignSlotInsertModal: React.FC<CampaignSlotInsertModalProps> = ({
  open,
  onClose,
  category,
  campaign,
  onSave,
  serviceCode = 'NaverShopTraffic' // 기본값 설정
}) => {
  const [slotData, setSlotData] = useState<CampaignSlotData>({
    productName: '',
    mid: '',
    url: '',
    keyword1: '',
    keyword2: '',
    keyword3: ''
  });
  
  // 폼 유효성 검사 상태
  const [errors, setErrors] = useState<{
    productName?: string;
    mid?: string;
    url?: string;
    keyword1?: string;
  }>({});
  
  // 알림 다이얼로그 상태
  const [alertDialogOpen, setAlertDialogOpen] = useState<boolean>(false);
  const [alertTitle, setAlertTitle] = useState<string>("");
  const [alertDescription, setAlertDescription] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(true);
  
  // 알림 다이얼로그 표시 함수
  const showAlert = (title: string, description: string, success: boolean = true) => {
    setAlertTitle(title);
    setAlertDescription(description);
    setIsSuccess(success);
    setAlertDialogOpen(true);
  };

  // useAuthContext 훅을 사용해 현재 로그인한 사용자 정보 가져오기
  const { currentUser } = useAuthContext();

  const [campaigns, setCampaigns] = useState<SupabaseCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  
  // 사용자 슬롯 목록 상태
  const [userSlots, setUserSlots] = useState<UserSlotData[]>([]);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
  const [totalCount, setTotalCount] = useState(0);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // 검색 필터 상태
  const [filters, setFilters] = useState<SearchFilters>({
    productName: '',
    mid: '',
    url: '',
    keyword: '',
    campaignId: null,
    status: null
  });

  // 필터 관련 핸들러
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value === '' ? (name === 'campaignId' || name === 'status' ? null : '') : 
              name === 'campaignId' ? parseInt(value, 10) : value
    }));
  };
  
  // 필터 초기화 핸들러
  const handleResetFilters = () => {
    setFilters({
      productName: '',
      mid: '',
      url: '',
      keyword: '',
      campaignId: null,
      status: null
    });
    fetchUserSlots();
  };
  
  // 검색 버튼 핸들러
  const handleSearch = () => {
    fetchUserSlots();
  };
  
  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // 항목 수 변경 핸들러
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };
  
  // 탭 변경 핸들러
  const handleTabChange = (tab: 'form' | 'list') => {
    setActiveTab(tab);
    if (tab === 'list') {
      fetchUserSlots();
    }
  };
  
  // 슬롯 데이터 가져오기
  const fetchUserSlots = async () => {
    try {
      setSlotsLoading(true);
      
      if (!currentUser?.id) {
        
        return;
      }
      
      
      
      
      
      // 쿼리 빌더 시작
      let query = supabase
        .from('slots')
        .select('*', { count: 'exact' })
        .eq('user_id', currentUser.id);
      
      // 필터 적용
      if (filters.productName) {
        query = query.filter('input_data->productName', 'ilike', `%${filters.productName}%`);
      }
      
      if (filters.mid) {
        query = query.filter('input_data->mid', 'ilike', `%${filters.mid}%`);
      }
      
      if (filters.url) {
        query = query.filter('input_data->url', 'ilike', `%${filters.url}%`);
      }
      
      if (filters.keyword) {
        // JSONB 배열에서 검색
        query = query.filter('input_data->keywords', 'cs', `{${filters.keyword}}`);
      }
      
      if (filters.campaignId) {
        query = query.eq('product_id', filters.campaignId);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      // 필터에 serviceType 적용 시도
      // 현재 캠페인 목록에서 현재 서비스 타입의 캠페인만 필터링
      // 서비스 타입 맵핑
      // 여기서는 이미 DB 타입으로 저장된 캠페인을 가져옵니다
      // campaigns 배열에 이미 DB 타입(ntraffic 등)으로 필터링된 캠페인만 있습니다
      
      // 모든 캠페인을 대상으로 함
      const serviceTypeCampaigns = [...campaigns];
      
      if (serviceTypeCampaigns.length > 0) {
        const campaignIds = serviceTypeCampaigns.map(c => c.id);
        
        
        query = query.in('product_id', campaignIds);
      }
      
      // 페이지네이션 적용
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      query = query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      // 쿼리 실행
      
      const { data, error, count } = await query;
      
      if (error) {
        
        throw error;
      }
      
      
      
      if (data) {
        // 캠페인 정보가 없는 슬롯 데이터 변환
        const processedData = data.map(slot => {
          // 관련 캠페인 정보를 캠페인 목록에서 찾기
          const relatedCampaign = campaigns.find(camp => camp.id === slot.product_id);
          
          return {
            ...slot,
            campaign: relatedCampaign ? {
              id: relatedCampaign.id,
              campaign_name: relatedCampaign.campaign_name,
              logo: relatedCampaign.logo,
              status: relatedCampaign.status,
              service_type: relatedCampaign.service_type
            } : undefined
          };
        });
        
        setUserSlots(processedData as UserSlotData[]);
        setTotalCount(count || 0);
      }
    } catch (error) {
      
      // 오류 메시지 표시
      showAlert('오류 발생', '슬롯 데이터를 불러오는 중 오류가 발생했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.', false);
    } finally {
      setSlotsLoading(false);
    }
  };
  
  // 캠페인 목록 가져오기
  // 모달이 열릴 때 캠페인 목록 가져오기
  useEffect(() => {
    if (open) {
      fetchCampaigns();
    }
  }, [open, serviceCode, category]); // serviceCode와 category 변경 시 캠페인 목록 갱신
  
  // 슬롯 목록 탭이 활성화되거나 페이지 변경 시 슬롯 데이터 가져오기
  useEffect(() => {
    if (open && activeTab === 'list' && campaigns.length > 0) {
      
      fetchUserSlots();
    }
  }, [open, activeTab, currentPage, itemsPerPage, filters.status, serviceCode, campaigns]);

  // 캠페인 배너 가져오기 함수
  const fetchCampaignBanner = async (campaign: SupabaseCampaign) => {
    if (!campaign) return;
    
    try {
      
      
      // add_info에서 배너 URL 가져오기
      let bannerUrl = null;
      if (campaign.add_info) {
        
        
        if (typeof campaign.add_info === 'string') {
          try {
            const addInfo = JSON.parse(campaign.add_info);
            
            bannerUrl = addInfo.banner_url || null;
          } catch (e) {
            
          }
        } else {
          bannerUrl = campaign.add_info.banner_url || null;
        }
        
        
      }
      
      setBannerUrl(bannerUrl);
    } catch (err) {
      
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      
      
      // 서비스 코드 맵핑
      const serviceTypeMap: Record<string, string> = {
        'NaverShopTraffic': 'ntraffic',
        'NaverBlogPosting': 'nblog',
        'NaverCafePosting': 'ncafe',
        'KakaoStory': 'kstory',
        'Instagram': 'instagram',
        // 추가 서비스 코드 매핑 필요 시 여기에 추가
      };
      
      // 서비스 코드를 DB service_type으로 변환 (없으면 기본값 ntraffic 사용)
      const serviceType = serviceTypeMap[serviceCode] || 'ntraffic';
      
      
      // Supabase 쿼리 준비
      let query = supabase
        .from('campaigns')
        .select('*, mat_id, add_info') // mat_id와 add_info 필드도 가져오기
        .neq('status', 'pause')
        .order('id', { ascending: true });
      
      // 카테고리나 서비스 타입이 있을 경우 필터 추가
      if (serviceType) {
        query = query.eq('service_type', serviceType);
      }
      
      // 쿼리 실행
      const { data, error } = await query;

      if (error) {
        
        throw error;
      }

      

      if (data && data.length > 0) {
        
        setCampaigns(data);
        
        // 첫 번째 캠페인을 기본값으로 설정하고 배너 정보 가져오기
        setSelectedCampaignId(data[0].id);
        
        
        // 배너 정보 가져오기
        fetchCampaignBanner(data[0]);
        
        // 슬롯 데이터에도 캠페인 ID 추가
        setSlotData(prev => ({
          ...prev,
          campaignId: data[0].id
        }));
      } else {
        
        // 사용자에게 캠페인이 없다는 메시지 표시
        showAlert('알림', '현재 사용 가능한 캠페인이 없습니다. 나중에 다시 시도해주세요.', false);
      }
    } catch (error) {
      
      // 오류 메시지 표시
      showAlert('오류 발생', '캠페인 목록을 불러오는 중 오류가 발생했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.', false);
    } finally {
      setLoading(false);
    }
  };

  // 입력 필드 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // 슬롯 데이터 업데이트
    setSlotData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 해당 필드의 오류 메시지 지우기
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // 캠페인 선택 변경 핸들러
  const handleCampaignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    
    setSelectedCampaignId(value);
    
    // 선택된 캠페인의 배너 정보 가져오기
    const selectedCampaign = campaigns.find(c => c.id === value);
    if (selectedCampaign) {
      fetchCampaignBanner(selectedCampaign);
    }
    
    // 슬롯 데이터에도 캠페인 ID 업데이트
    setSlotData(prev => ({
      ...prev,
      campaignId: value
    }));
  };

  // 폼 유효성 검사 함수
  const validateForm = (): boolean => {
    const newErrors: {
      productName?: string;
      mid?: string;
      url?: string;
      keyword1?: string;
    } = {};
    
    if (!slotData.productName.trim()) {
      newErrors.productName = '상품명을 입력해주세요';
    }
    
    if (!slotData.mid.trim()) {
      newErrors.mid = 'MID를 입력해주세요';
    }
    
    if (!slotData.url.trim()) {
      newErrors.url = 'URL을 입력해주세요';
    } else if (!slotData.url.startsWith('http://') && !slotData.url.startsWith('https://')) {
      newErrors.url = 'URL은 http:// 또는 https://로 시작해야 합니다';
    }
    
    if (!slotData.keyword1.trim()) {
      newErrors.keyword1 = '최소 1개의 키워드를 입력해주세요';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 저장 버튼 핸들러
  const handleSave = async () => {
    // 이미 저장 중이면 중복 실행 방지
    if (saving) return;
    
    try {
      // 저장 중 상태로 변경
      setSaving(true);
      
      // 선택된 캠페인이 없으면 저장 불가
      if (!selectedCampaignId) {
        showAlert('알림', '캠페인을 선택해주세요.', false);
        return;
      }
      
      // 폼 유효성 검사
      if (!validateForm()) {
        
        return;
      }

      // AuthContext의 currentUser 사용
      if (!currentUser || !currentUser.id) {
        throw new Error('로그인이 필요합니다.');
      }

      const userId = currentUser.id;

      // 선택된 캠페인 정보 가져오기
      const selectedCampaign = campaigns.find(camp => camp.id === selectedCampaignId);
      if (!selectedCampaign) {
        throw new Error('선택된 캠페인 정보를 찾을 수 없습니다.');
      }
      
      // 디버깅: 선택된 캠페인 정보 출력
      

      // 캠페인의 mat_id 가져오기 (이미 campaigns 배열에 있는 정보 사용)
      let matId = selectedCampaign.mat_id;
      
      if (!matId) {
        
        throw new Error('캠페인의 mat_id를 찾을 수 없습니다. 이 캠페인은 슬롯을 등록할 수 없습니다.');
      }

      // input_data JSON 데이터 생성
      const inputData = {
        productName: slotData.productName,
        mid: slotData.mid,
        url: slotData.url,
        keywords: [
          slotData.keyword1,
          slotData.keyword2,
          slotData.keyword3
        ].filter(keyword => keyword.trim() !== '') // 빈 키워드 제거
      };

      // 슬롯 서비스를 통한 등록 (클라이언트 측 처리)
      
      const result = await registerSlot(
        userId,
        selectedCampaignId,
        matId,
        inputData
      );
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      // 슬롯 등록 성공
      

      // 캠페인 단가 확인 (성공 메시지용)
      const unitPrice = selectedCampaign.unit_price || 1000; // 기본값 1000원

      // 성공 메시지 표시
      showAlert('성공', `슬롯이 성공적으로 등록되었습니다. ${unitPrice}원이 차감되었습니다.`, true);

      // 부모 컴포넌트의 onSave 함수 호출 (있다면)
      if (onSave) {
        onSave(slotData);
      }

      // 저장 후 슬롯 목록을 새로고침
      setTimeout(() => {
        fetchUserSlots().catch(error => {
          
          // UI 영향 최소화
        });
      }, 500);
      
      // 입력 폼 즉시 초기화 (UX 개선)
      setSlotData({
        productName: '',
        mid: '',
        url: '',
        keyword1: '',
        keyword2: '',
        keyword3: ''
      });
      setErrors({});

    } catch (error) {
      
      
      // 오류 메시지 처리 개선
      let errorMsg = '슬롯 저장 중 오류가 발생했습니다';
      
      if (error instanceof Error) {
        // 잔액 부족 오류 특별 처리
        if (error.message.includes('잔액이 부족합니다')) {
          errorMsg = `잔액이 부족합니다. 캐시를 충전해주세요.`;
        } else if (error.message.includes('타임아웃') || error.message.includes('서버 응답 지연')) {
          errorMsg = '서버 응답 지연으로 요청을 완료할 수 없습니다. 잠시 후 다시 시도해주세요.';
        } else {
          errorMsg = `${errorMsg}: ${error.message}`;
        }
      }
      
      showAlert('오류 발생', errorMsg, false);
    } finally {
      // 저장 중 상태 해제
      setSaving(false);
    }
  };

  // 현재 선택된 캠페인 찾기
  const selectedCampaign = campaigns.find(camp => camp.id === selectedCampaignId) || null;

  // Supabase 캠페인을 CampaignDetailData 형식으로 변환
  const formatCampaignToDetailData = (campaign: SupabaseCampaign): ICampaignDetailData => {
    // 로고 URL 처리
    let logoUrl = '';
    
    // add_info에서 로고 URL을 우선적으로 사용
    if (campaign.add_info) {
      if (typeof campaign.add_info === 'string') {
        try {
          const addInfo = JSON.parse(campaign.add_info);
          if (addInfo.logo_url) {
            logoUrl = addInfo.logo_url;
          }
        } catch (e) {
          
        }
      } else if (campaign.add_info.logo_url) {
        logoUrl = campaign.add_info.logo_url;
      }
    }
    
    // add_info에 로고가 없으면 campaign.logo 사용
    if (!logoUrl && campaign.logo) {
      logoUrl = campaign.logo;
    }
    
    // 절대 경로 처리
    if (logoUrl && !logoUrl.startsWith('/media') && !logoUrl.startsWith('http')) {
      logoUrl = `/media/${logoUrl}`;
    }
    
    return {
      id: String(campaign.id || ''),
      campaignName: campaign.campaign_name || '',
      description: campaign.description || '',
      logo: logoUrl,
      efficiency: String(campaign.efficiency || '0%'),
      minQuantity: String(campaign.min_quantity || '0개'),
      deadline: String(campaign.deadline || ''),
      unitPrice: String(campaign.unit_price || '0원'),
      additionalLogic: String(campaign.additional_logic || '없음'),
      status: {
        label: getStatusLabel(campaign.status),
        color: getStatusBadgeClass(campaign.status)
      }
    };
  };

  // 상태값에 따른 표시 텍스트 반환
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'active': return '진행중';
      case 'pause': return '표시안함';
      case 'pending': return '준비중';
      case 'completed': return '완료됨';
      case 'rejected': return '반려됨';
      default: return '준비중';
    }
  };

  // 상태값에 따른 배지 클래스 반환
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'active': return 'badge-success';
      case 'pause': return 'badge-warning';
      case 'pending': return 'badge-info';
      case 'completed': return 'badge-primary';
      case 'rejected': return 'badge-danger';
      default: return 'badge-gray-300';
    }
  };

  const campaignData = selectedCampaign ? formatCampaignToDetailData(selectedCampaign) : null;

  if (!open || !category) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-5xl p-0 overflow-hidden w-[95vw] md:w-auto max-w-full">
          <DialogHeader className="bg-background py-3 md:py-4 px-4 md:px-6 border-b">
            <DialogTitle className="text-base md:text-lg font-medium text-foreground truncate">
              {serviceCode === 'NaverShopTraffic'
                ? '네이버 쇼핑 트래픽 슬롯 관리'
                : serviceCode === 'NaverBlogPosting'
                  ? '네이버 블로그 포스팅 슬롯 관리'
                  : serviceCode === 'NaverCafePosting'
                    ? '네이버 카페 포스팅 슬롯 관리'
                    : serviceCode === 'KakaoStory'
                      ? '카카오스토리 슬롯 관리'
                      : serviceCode === 'Instagram'
                        ? '인스타그램 슬롯 관리'
                        : '캠페인 슬롯 관리'}
            </DialogTitle>
          <div className="flex mt-3 md:mt-4 border-b">
            <button
              onClick={() => handleTabChange('form')}
              className={`px-3 md:px-4 py-2 font-medium text-xs md:text-sm ${
                activeTab === 'form'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              슬롯 추가
            </button>
            <button
              onClick={() => handleTabChange('list')}
              className={`px-3 md:px-4 py-2 font-medium text-xs md:text-sm ${
                activeTab === 'list'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              내 슬롯 목록
            </button>
          </div>
        </DialogHeader>
        <DialogBody className="p-4 md:p-6 max-h-[65vh] md:max-h-[70vh] overflow-y-auto">
          {activeTab === 'form' ? (
            <>
              {/* 캠페인 선택 드롭박스 */}
              <div className="mb-6">
                <label htmlFor="campaign-select" className="block text-sm font-medium text-foreground mb-2">
                  캠페인 선택
                </label>
                {loading ? (
                  <div className="text-sm text-muted-foreground">캠페인 목록을 불러오는 중...</div>
                ) : campaigns.length > 0 ? (
                  <select
                    id="campaign-select"
                    value={selectedCampaignId || ''}
                    onChange={handleCampaignChange}
                    className="flex w-full bg-background rounded-md border border-input text-sm ring-offset-0 hover:border-gray-400 focus:border-primary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 h-10 px-3 py-2"
                  >
                    {campaigns.map((camp) => (
                      <option key={camp.id} value={camp.id}>
                        {camp.campaign_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-muted-foreground">사용 가능한 캠페인이 없습니다.</div>
                )}
              </div>
    
              {/* 반응형 레이아웃: 모바일에서는 세로, 태블릿/데스크톱에서는 가로 */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* 캠페인 상세 정보 */}
                <div className="w-full md:w-1/2 space-y-6 md:border-r md:border-border md:pr-6">
                  <div className="bg-background">
                    {/* 배너 이미지 */}
                    {loading ? (
                      <div className="w-full h-[180px] bg-gray-100 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    ) : bannerUrl ? (
                      <div className="w-full">
                        <img
                          src={bannerUrl}
                          alt="캠페인 배너"
                          className="w-full h-auto object-cover rounded-md"
                          style={{ maxHeight: '250px' }}
                          onError={(e) => {
                            
                            // 이미지 로드 실패 시 기본 배경으로 대체
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.className = "w-full h-[180px] bg-gradient-to-r from-primary/20 to-blue-500/20 flex items-center justify-center rounded-md";

                            // 로고 이미지 추가
                            const logoImg = document.createElement('img');
                            logoImg.src = toAbsoluteUrl('/media/app/mini-logo-primary.svg');
                            logoImg.alt = '캠페인 로고';
                            logoImg.className = 'h-16 w-auto opacity-50';
                            e.currentTarget.parentElement!.appendChild(logoImg);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full">
                        <div className="w-full h-[180px] bg-gradient-to-r from-primary/20 to-blue-500/20 flex items-center justify-center rounded-md">
                          <img
                            src={toAbsoluteUrl('/media/app/mini-logo-primary.svg')}
                            alt="캠페인 배너"
                            className="h-16 w-auto opacity-50"
                          />
                        </div>
                      </div>
                    )}

                    <div className="py-4">
                      {campaignData ? (
                        <>
                          {/* 캠페인 헤더 정보 */}
                          <div className="flex items-center gap-4 mb-6">
                            <img
                              src={campaignData.logo.startsWith('/')
                                ? toAbsoluteUrl(campaignData.logo)
                                : campaignData.logo.startsWith('http')
                                  ? campaignData.logo
                                  : toAbsoluteUrl(`/media/${campaignData.logo}`)}
                              className="rounded-full size-16 shrink-0 object-cover"
                              alt={campaignData.campaignName}
                              onError={(e) => {
                                
                                // 이미지 로드 실패 시 기본 이미지 사용
                                (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/animal/svg/lion.svg');
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h2 className="text-xl md:text-2xl font-bold text-foreground truncate">
                                {campaignData.campaignName}
                              </h2>
                              {campaignData.status && (
                                <div className="mt-1">
                                  <span className={`badge ${campaignData.status.color} badge-outline rounded-[30px] h-auto py-1`}>
                                    <span className={`size-1.5 rounded-full bg-${getStatusColorClass(campaignData.status.color)} me-1.5`}></span>
                                    {campaignData.status.label}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 캠페인 주요 정보 */}
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-muted p-3 md:p-4 rounded-md">
                              <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-1">건당 단가</h3>
                              <p className="text-lg md:text-xl font-semibold text-primary">
                                {campaignData.unitPrice ? (campaignData.unitPrice.endsWith('원') ? campaignData.unitPrice : `${campaignData.unitPrice}원`) : '1,000원'}
                              </p>
                            </div>
                            <div className="bg-muted p-3 md:p-4 rounded-md">
                              <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-1">마감 시간</h3>
                              <p className="text-lg md:text-xl font-semibold text-primary">{campaignData.deadline}</p>
                            </div>
                          </div>

                          {/* 캠페인 설명 */}
                          <div className="mb-6">
                            <h3 className="text-base md:text-lg font-semibold mb-2">캠페인 설명</h3>
                            <div className="bg-muted p-3 md:p-4 rounded-md">
                              <p className="text-sm md:text-base text-foreground whitespace-pre-line">
                                {campaignData.description || '설명이 없습니다.'}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-10">
                          <p className="text-muted-foreground">선택된 캠페인이 없거나 로딩 중입니다.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 슬롯 입력 폼 */}
                <div className="w-full md:w-1/2 space-y-6 pt-4 md:pt-0 border-t md:border-t-0 border-border mt-4 md:mt-0">
                  <h3 className="text-lg font-medium text-foreground mb-4">슬롯 정보 입력</h3>

                  <div className="space-y-4">
                    <div className="form-group">
                      <label htmlFor="productName" className="block text-sm font-medium text-foreground mb-2">
                        상품명 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="productName"
                        name="productName"
                        value={slotData.productName}
                        onChange={handleChange}
                        placeholder="상품명을 입력하세요"
                        className={`w-full ${errors.productName ? 'border-red-500' : ''}`}
                      />
                      {errors.productName && (
                        <p className="mt-1 text-xs text-red-500">{errors.productName}</p>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="mid" className="block text-sm font-medium text-foreground mb-2">
                        MID <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="mid"
                        name="mid"
                        value={slotData.mid}
                        onChange={handleChange}
                        placeholder="MID를 입력하세요"
                        className={`w-full ${errors.mid ? 'border-red-500' : ''}`}
                      />
                      {errors.mid && (
                        <p className="mt-1 text-xs text-red-500">{errors.mid}</p>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="url" className="block text-sm font-medium text-foreground mb-2">
                        URL <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="url"
                        name="url"
                        value={slotData.url}
                        onChange={handleChange}
                        placeholder="URL을 입력하세요 (예: https://example.com)"
                        className={`w-full ${errors.url ? 'border-red-500' : ''}`}
                      />
                      {errors.url && (
                        <p className="mt-1 text-xs text-red-500">{errors.url}</p>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="keyword1" className="block text-sm font-medium text-foreground mb-2">
                        키워드 1 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="keyword1"
                        name="keyword1"
                        value={slotData.keyword1}
                        onChange={handleChange}
                        placeholder="키워드 1을 입력하세요"
                        className={`w-full ${errors.keyword1 ? 'border-red-500' : ''}`}
                      />
                      {errors.keyword1 && (
                        <p className="mt-1 text-xs text-red-500">{errors.keyword1}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label htmlFor="keyword2" className="block text-sm font-medium text-foreground mb-2">
                          키워드 2
                        </label>
                        <Input
                          id="keyword2"
                          name="keyword2"
                          value={slotData.keyword2}
                          onChange={handleChange}
                          placeholder="키워드 2를 입력하세요"
                          className="w-full"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="keyword3" className="block text-sm font-medium text-foreground mb-2">
                          키워드 3
                        </label>
                        <Input
                          id="keyword3"
                          name="keyword3"
                          value={slotData.keyword3}
                          onChange={handleChange}
                          placeholder="키워드 3를 입력하세요"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // 내 슬롯 목록 탭
            <div className="w-full">
              {/* 필터 영역 - 모바일 반응형 */}
              <div className="bg-muted p-3 md:p-4 rounded-md mb-6">
                <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4">검색 필터</h3>
                {/* 첫번째 행: 상품명, MID, 상태 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
                  <div>
                    <label htmlFor="productName-filter" className="block text-xs md:text-sm font-medium mb-1">
                      상품명
                    </label>
                    <Input
                      id="productName-filter"
                      name="productName"
                      value={filters.productName}
                      onChange={handleFilterChange}
                      placeholder="상품명 검색"
                      className="w-full text-sm h-9 md:h-10"
                    />
                  </div>
                  <div>
                    <label htmlFor="mid-filter" className="block text-xs md:text-sm font-medium mb-1">
                      MID
                    </label>
                    <Input
                      id="mid-filter"
                      name="mid"
                      value={filters.mid}
                      onChange={handleFilterChange}
                      placeholder="MID 검색"
                      className="w-full text-sm h-9 md:h-10"
                    />
                  </div>
                  <div>
                    <label htmlFor="status-filter" className="block text-xs md:text-sm font-medium mb-1">
                      상태
                    </label>
                    <select
                      id="status-filter"
                      name="status"
                      value={filters.status || ''}
                      onChange={handleFilterChange}
                      className="flex w-full bg-background rounded-md border border-input text-sm h-9 md:h-10 px-3"
                    >
                      <option value="">전체 상태</option>
                      <option value="pending">대기중</option>
                      <option value="approved">승인됨</option>
                      <option value="rejected">반려됨</option>
                    </select>
                  </div>
                </div>
                {/* 두번째 행: 캠페인, 키워드 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                  <div>
                    <label htmlFor="campaign-filter" className="block text-xs md:text-sm font-medium mb-1">
                      캠페인
                    </label>
                    <select
                      id="campaign-filter"
                      name="campaignId"
                      value={filters.campaignId || ''}
                      onChange={handleFilterChange}
                      className="flex w-full bg-background rounded-md border border-input text-sm h-9 md:h-10 px-3"
                    >
                      <option value="">모든 캠페인</option>
                      {campaigns.map(camp => (
                        <option key={camp.id} value={camp.id}>
                          {camp.campaign_name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">※ 슬롯은 캠페인 등록 후 변경할 수 없습니다</p>
                  </div>
                  <div>
                    <label htmlFor="keyword-filter" className="block text-xs md:text-sm font-medium mb-1">
                      키워드 검색
                    </label>
                    <Input
                      id="keyword-filter"
                      name="keyword"
                      value={filters.keyword}
                      onChange={handleFilterChange}
                      placeholder="키워드 검색"
                      className="w-full text-sm h-9 md:h-10"
                    />
                  </div>
                </div>
                {/* 버튼 영역 */}
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={handleResetFilters}
                    variant="outline"
                    className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                  >
                    필터 초기화
                  </Button>
                  <Button
                    onClick={handleSearch}
                    className="bg-primary text-white hover:bg-primary/90 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                  >
                    검색
                  </Button>
                </div>
              </div>
            
              {/* 슬롯 목록 - 모바일에서는 카드 형식, 데스크톱에서는 테이블 */}
              {slotsLoading ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">슬롯 목록을 불러오는 중...</p>
                </div>
              ) : userSlots.length > 0 ? (
                <div>
                  {/* 모바일 뷰 - 카드 형식 */}
                  <div className="md:hidden space-y-4">
                    {userSlots.map(slot => (
                      <div key={slot.id} className="bg-background border rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div className="font-medium text-base truncate max-w-[70%]">
                            {slot.input_data?.productName || '-'}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            slot.status === 'approved' ? 'bg-success/20 text-success' :
                            slot.status === 'rejected' ? 'bg-danger/20 text-danger' :
                            'bg-warning/20 text-warning'
                          }`}>
                            {
                              slot.status === 'approved' ? '승인됨' :
                              slot.status === 'rejected' ? '반려됨' :
                              ['pending', 'submitted', 'draft'].includes(slot.status) ? '대기중' :
                              slot.status
                            }
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <p className="text-muted-foreground text-xs">MID</p>
                            <p className="truncate">{slot.input_data?.mid || '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">등록일</p>
                            <p>{new Date(slot.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-muted-foreground text-xs mb-1">키워드</p>
                          <p className="text-sm truncate">
                            {Array.isArray(slot.input_data?.keywords) ?
                              slot.input_data.keywords.join(', ') : '-'}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground text-xs mb-1">등록된 캠페인</p>
                          <div className="flex items-center">
                            <span className="font-medium text-primary text-sm">
                              {campaigns.find(c => c.id === slot.product_id)?.campaign_name ||
                              (slot.product_id ? `캠페인 #${slot.product_id}` : '-')}
                            </span>
                            {slot.campaign?.status === 'active' && (
                              <span className="ml-2 px-1.5 py-0.5 bg-success/10 text-success text-xs rounded-full">
                                진행중
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 데스크톱 뷰 - 테이블 */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse table-auto">
                      <thead>
                        <tr className="bg-muted border-b">
                          <th className="px-4 py-2 text-left">상품명</th>
                          <th className="px-4 py-2 text-left">MID</th>
                          <th className="px-4 py-2 text-left">키워드</th>
                          <th className="px-4 py-2 text-left">등록된 캠페인</th>
                          <th className="px-4 py-2 text-left">상태</th>
                          <th className="px-4 py-2 text-left">등록일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userSlots.map(slot => (
                          <tr key={slot.id} className="border-b hover:bg-muted/50">
                            <td className="px-4 py-3">
                              {slot.input_data?.productName || '-'}
                            </td>
                            <td className="px-4 py-3">
                              {slot.input_data?.mid || '-'}
                            </td>
                            <td className="px-4 py-3">
                              {Array.isArray(slot.input_data?.keywords) ?
                                slot.input_data.keywords.join(', ') : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center group relative">
                                <span className="font-medium text-primary">
                                  {campaigns.find(c => c.id === slot.product_id)?.campaign_name ||
                                  (slot.product_id ? `캠페인 #${slot.product_id}` : '-')}
                                </span>
                                {slot.campaign?.status === 'active' && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-success/10 text-success text-xs rounded-full">
                                    진행중
                                  </span>
                                )}
                                <div className="absolute hidden group-hover:block bg-black/90 text-white text-xs p-2 rounded-md w-48 z-10 left-0 -bottom-1 transform translate-y-full pointer-events-none">
                                  <p className="mb-1"><strong>캠페인:</strong> {campaigns.find(c => c.id === slot.product_id)?.campaign_name || '-'}</p>
                                  <p className="mb-1"><strong>타입:</strong> {slot.campaign?.service_type || '-'}</p>
                                  <p className="mb-1"><strong>등록일:</strong> {new Date(slot.created_at).toLocaleDateString()}</p>
                                  <p><em>※ 슬롯 등록 후 캠페인을 변경할 수 없습니다</em></p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                slot.status === 'approved' ? 'bg-success/20 text-success' :
                                slot.status === 'rejected' ? 'bg-danger/20 text-danger' :
                                'bg-warning/20 text-warning'
                              }`}>
                                {
                                  slot.status === 'approved' ? '승인됨' :
                                  slot.status === 'rejected' ? '반려됨' :
                                  ['pending', 'submitted', 'draft'].includes(slot.status) ? '대기중' :
                                  slot.status
                                }
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {new Date(slot.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-muted/20 rounded-md">
                  <p className="text-muted-foreground">등록된 슬롯이 없습니다.</p>
                </div>
              )}
              
              {/* 페이지네이션 - 모바일에서는 간단한 버전, 데스크톱에서는 상세 버전 */}
              {totalCount > 0 && (
                <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-2">
                  <div className="text-xs md:text-sm text-muted-foreground order-2 md:order-1">
                    총 {totalCount}개 항목 중 {(currentPage - 1) * itemsPerPage + 1}-
                    {Math.min(currentPage * itemsPerPage, totalCount)}개 표시
                  </div>

                  <div className="flex space-x-1 order-1 md:order-2">
                    {/* 모바일에서는 축약된 페이지네이션 (현재 페이지 전후로 1개씩만 표시) */}
                    {Array.from({ length: Math.ceil(totalCount / itemsPerPage) }, (_, i) => {
                      const pageNum = i + 1;
                      // 첫 페이지, 마지막 페이지, 현재 페이지 및 그 전후 페이지만 표시
                      const isMobile = window.innerWidth < 768;
                      const isFirstPage = pageNum === 1;
                      const isLastPage = pageNum === Math.ceil(totalCount / itemsPerPage);
                      const isCurrentPage = pageNum === currentPage;
                      const isAdjacentPage = Math.abs(pageNum - currentPage) <= 1;

                      // 모바일에서는 첫/마지막/현재/인접 페이지만 표시
                      if (isMobile && !isFirstPage && !isLastPage && !isCurrentPage && !isAdjacentPage) {
                        // 생략 표시 (...)는 연속된 숫자 사이에만 한 번 표시
                        if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                          return (
                            <span key={`ellipsis-${pageNum}`} className="px-2 py-1 text-muted-foreground">
                              …
                            </span>
                          );
                        }
                        return null;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center rounded-md text-xs md:text-sm ${
                            currentPage === pageNum
                              ? 'bg-primary text-white'
                              : 'bg-muted hover:bg-muted-foreground/10'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          
        </DialogBody>
        <DialogFooter className="px-4 md:px-6 py-3 md:py-4 border-t flex justify-end">
          <button
            onClick={handleSave}
            className="btn btn-sm md:btn-md btn-primary text-sm md:text-base px-4 md:px-6 h-9 md:h-10"
            disabled={loading || saving || !selectedCampaignId}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                저장 중...
              </>
            ) : '저장'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* 알림 다이얼로그 */}
    <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
      <CustomDialogContent className="max-w-md w-[90vw] md:w-auto">
        <div className="p-4 md:p-6">
          <div className="mb-4 text-center">
            {isSuccess ? (
              <div className="size-10 md:size-12 mx-auto rounded-full bg-success/20 mb-3 md:mb-4 flex items-center justify-center">
                <KeenIcon icon="Check" className="size-5 md:size-6 text-success" />
              </div>
            ) : (
              <div className="size-10 md:size-12 mx-auto rounded-full bg-danger/20 mb-3 md:mb-4 flex items-center justify-center">
                <KeenIcon icon="Information" className="size-5 md:size-6 text-danger" />
              </div>
            )}
            <h3 className="text-base md:text-lg font-medium">{alertTitle}</h3>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">{alertDescription}</p>
          </div>
          <div className="flex justify-center mt-4">
            <Button
              onClick={() => setAlertDialogOpen(false)}
              className={`text-sm md:text-base h-9 md:h-10 ${isSuccess ? "bg-success hover:bg-success/90 text-white" : "bg-danger hover:bg-danger/90 text-white"}`}
            >
              확인
            </Button>
          </div>
        </div>
      </CustomDialogContent>
    </Dialog>
    </>
  );
};

export { CampaignSlotInsertModal };