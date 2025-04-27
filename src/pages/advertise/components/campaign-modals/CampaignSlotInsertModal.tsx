import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle
} from '@/components/ui/dialog';
import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';
import { getStatusColorClass, CampaignDetailData as ICampaignDetailData, CampaignData } from '@/utils/CampaignFormat';
import { Input } from '@/components/ui/input';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/auth';


interface CampaignSlotInsertModalProps {
  open: boolean;
  onClose: () => void;
  category: string | null;
  campaign?: CampaignData | null;
  onSave?: (data: CampaignSlotData) => void;
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
}

const CampaignSlotInsertModal: React.FC<CampaignSlotInsertModalProps> = ({
  open,
  onClose,
  category,
  campaign,
  onSave
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

  // useAuthContext 훅을 사용해 현재 로그인한 사용자 정보 가져오기
  const { currentUser } = useAuthContext();

  const [campaigns, setCampaigns] = useState<SupabaseCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  
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
        console.error('로그인 정보를 찾을 수 없습니다.');
        return;
      }
      
      // 쿼리 빌더 시작
      let query = supabase
        .from('slots')
        .select('*, campaign:campaigns(id, campaign_name, logo, status, service_type)', { count: 'exact' })
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
      
      // 페이지네이션 적용
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      query = query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setUserSlots(data as UserSlotData[]);
        setTotalCount(count || 0);
      }
    } catch (error) {
      console.error('슬롯 데이터 가져오기 오류:', error);
    } finally {
      setSlotsLoading(false);
    }
  };
  
  // 캠페인 목록 가져오기
  useEffect(() => {
    if (open) {
      fetchCampaigns();
      if (activeTab === 'list') {
        fetchUserSlots();
      }
    }
  }, [open, currentPage, itemsPerPage]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      console.log('Supabase 쿼리 시작...');
      
      // Supabase 쿼리 수행
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, mat_id') // mat_id를 명시적으로 선택
        .eq('service_type', 'NaverShopTraffic')
        .neq('status', 'pause')
        .order('id', { ascending: true });

      if (error) {
        console.error('Supabase 쿼리 오류:', error);
        throw error;
      }

      console.log('Supabase에서 가져온 데이터:', data);

      if (data && data.length > 0) {
        console.log(`${data.length}개의 캠페인을 가져왔습니다.`);
        setCampaigns(data);
        
        // 첫 번째 캠페인을 기본값으로 설정
        setSelectedCampaignId(data[0].id);
        console.log('선택된 캠페인 ID 설정:', data[0].id);
        
        // 슬롯 데이터에도 캠페인 ID 추가
        setSlotData(prev => ({
          ...prev,
          campaignId: data[0].id
        }));
      } else {
        console.log('가져온 캠페인이 없습니다.');
      }
    } catch (error) {
      console.error('캠페인 가져오기 오류:', error);
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
    console.log("선택된 캠페인 ID:", value);
    setSelectedCampaignId(value);
    
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
        alert('캠페인을 선택해주세요.');
        return;
      }
      
      // 폼 유효성 검사
      if (!validateForm()) {
        console.log('폼 유효성 검사 실패:', errors);
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

      // 캠페인의 mat_id 가져오기 (이미 campaigns 배열에 있는 정보 사용)
      const matId = selectedCampaign.mat_id;
      if (!matId) {
        throw new Error('캠페인의 mat_id를 찾을 수 없습니다.');
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

      // slots 테이블에 데이터 삽입
      const { data: insertedData, error: insertError } = await supabase
        .from('slots')
        .insert({
          mat_id: matId,
          product_id: selectedCampaignId,
          user_id: userId,
          status: 'draft', // 초기 상태: 작성 중
          input_data: inputData, // jsonb 타입 필드에 저장
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (insertError) {
        throw insertError;
      }

      console.log('슬롯이 성공적으로 저장되었습니다:', insertedData);

      // 부모 컴포넌트의 onSave 함수 호출 (있다면)
      if (onSave) {
        onSave(slotData);
      }

      // 저장 후 슬롯 목록을 새로고침
      fetchUserSlots();
      
      // 입력 폼 초기화
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
      console.error('슬롯 저장 중 오류 발생:', error);
      alert(`슬롯 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      // 저장 중 상태 해제
      setSaving(false);
    }
  };

  // 현재 선택된 캠페인 찾기
  const selectedCampaign = campaigns.find(camp => camp.id === selectedCampaignId) || null;

  // Supabase 캠페인을 CampaignDetailData 형식으로 변환
  const formatCampaignToDetailData = (campaign: SupabaseCampaign): ICampaignDetailData => {
    return {
      id: String(campaign.id || ''),
      campaignName: campaign.campaign_name || '',
      description: campaign.description || '',
      logo: campaign.logo || '',
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
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl p-0 overflow-hidden">
        <DialogHeader className="bg-background py-4 px-6 border-b">
          <DialogTitle className="text-lg font-medium text-foreground">캠페인 슬롯 관리</DialogTitle>
          <div className="flex mt-4 border-b">
            <button
              onClick={() => handleTabChange('form')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'form'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              슬롯 추가
            </button>
            <button
              onClick={() => handleTabChange('list')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'list'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              내 슬롯 목록
            </button>
          </div>
        </DialogHeader>
        <DialogBody className="p-6 max-h-[70vh] overflow-y-auto">
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

          <div className="flex flex-row gap-6">
            {/* 왼쪽: 캠페인 상세 정보 */}
            <div className="w-1/2 space-y-6 border-r border-border pr-6">
              {campaignData ? (
                <>
                  {/* 헤더 정보 */}
                  <div className="flex items-center gap-4">
                    <img
                      src={campaignData.logo?.startsWith('/media') ? toAbsoluteUrl(campaignData.logo) : toAbsoluteUrl(`/media/${campaignData.logo}`)}
                      className="rounded-full size-16 shrink-0"
                      alt={campaignData.campaignName}
                      onError={(e) => {
                        // 이미지 로드 실패 시 기본 이미지 사용
                        (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/animal/svg/lion.svg');
                      }}
                    />
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{campaignData.campaignName}</h2>
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

                  {/* 캠페인 정보 테이블 */}
                  <div className="overflow-hidden border border-border rounded-lg mb-6">
                    <table className="min-w-full divide-y divide-border">
                      <tbody className="divide-y divide-border">
                        <tr>
                          <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                            건당 단가
                          </th>
                          <td className="px-4 py-3 text-md text-foreground">
                            {campaignData.unitPrice ? (campaignData.unitPrice.endsWith('원') ? campaignData.unitPrice : `${campaignData.unitPrice} 원`) : '1,000 원'}
                          </td>
                        </tr>
                        <tr>
                          <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                            최소수량
                          </th>
                          <td className="px-4 py-3 text-md text-foreground">
                            {campaignData.minQuantity ? (campaignData.minQuantity.endsWith('개') ? campaignData.minQuantity : `${campaignData.minQuantity} 개`) : '0 개'}
                          </td>
                        </tr>
                        {campaignData.additionalLogic && campaignData.additionalLogic !== '없음' && (
                          <tr>
                            <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                              추가로직
                            </th>
                            <td className="px-4 py-3 text-md text-foreground">
                              {campaignData.additionalLogic ? (campaignData.additionalLogic.endsWith('개') ? campaignData.additionalLogic : `${campaignData.additionalLogic} 개`) : '0 개'}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                            상승효율
                          </th>
                          <td className="px-4 py-3 text-md text-foreground">
                            {campaignData.efficiency ? (campaignData.efficiency.endsWith('%') ? campaignData.efficiency : `${campaignData.efficiency} %`) : '0 %'}
                          </td>
                        </tr>
                        <tr>
                          <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                            접수마감시간
                          </th>
                          <td className="px-4 py-3 text-md text-foreground">
                            {campaignData.deadline}
                          </td>
                        </tr>
                        <tr>
                          <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                            캠페인 설명
                          </th>
                          <td className="px-4 py-3 text-md text-foreground whitespace-pre-line">
                            {campaignData.description}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 캠페인 상세설명 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-foreground mb-2">캠페인 상세설명</h3>
                    <div className="bg-background border border-border p-4 rounded text-md text-foreground whitespace-pre-line">
                      {campaignData.detailedDescription ? 
                        campaignData.detailedDescription : 
                        (campaignData.description || '상세 설명이 없습니다.')}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">선택된 캠페인이 없거나 로딩 중입니다.</p>
                </div>
              )}
            </div>

            {/* 오른쪽: 슬롯 입력 폼 */}
            <div className="w-1/2 space-y-6">
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
                    placeholder="키워드 3을 입력하세요"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="px-6 py-4 border-t flex justify-end">
          <button 
            onClick={handleSave}
            className="btn btn-md btn-primary"
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
  );
};

export { CampaignSlotInsertModal };