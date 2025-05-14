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

// 사용자 키워드 인터페이스
interface Keyword {
  id: number;
  groupId: number;
  mainKeyword: string;
  mid?: number;
  url?: string;
  keyword1?: string;
  keyword2?: string;
  keyword3?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // 추가 필드
  workCount?: number | null; // 작업타수
  dueDate?: string | null;   // 마감일
}

// 키워드 그룹 인터페이스
interface KeywordGroup {
  id: number;
  userId: string;
  name: string;
  campaignName: string | null;
  campaignType: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CampaignSlotWithKeywordModalProps {
  open: boolean;
  onClose: () => void;
  category: string | null;
  campaign?: CampaignData | null;
  onSave?: (data: CampaignSlotData) => void;
  serviceCode?: string; // 서비스 코드 (NaverShopTraffic, BlogPosting 등)
}

// 키워드 상세 정보 인터페이스
interface KeywordDetail {
  id: number;
  mainKeyword: string;
  workCount: number;
  dueDate: string;
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
  // 추가: 선택된 키워드 목록
  selectedKeywords?: number[];
  // 추가: 키워드 상세 정보 (작업타수, 마감일 등)
  keywordDetails?: KeywordDetail[];
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

const CampaignSlotWithKeywordModal: React.FC<CampaignSlotWithKeywordModalProps> = ({
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
    keyword3: '',
    selectedKeywords: []
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
  // 사용자의 캐시 잔액
  const [userCashBalance, setUserCashBalance] = useState<number>(0);
  // 총 결제 금액
  const [totalPaymentAmount, setTotalPaymentAmount] = useState<number>(0);
  
  // 키워드 관련 상태
  const [keywordGroups, setKeywordGroups] = useState<KeywordGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<number[]>([]);
  const [keywordLoading, setKeywordLoading] = useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // 탭 관련 상태
  const [activeTab, setActiveTab] = useState<'form' | 'keywords'>('keywords');
  
  // 비동기 작업 오류 상태
  const [keywordError, setKeywordError] = useState<string | null>(null);

  // 사용자의 캐시 잔액 가져오기
  const fetchUserBalance = async () => {
    if (!currentUser?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_balances')
        .select('total_balance, paid_balance, free_balance')
        .eq('user_id', currentUser.id)
        .single();
        
      if (error) {
        console.error("Error fetching user balance:", error);
        return;
      }
      
      if (data) {
        // total_balance가 있으면 사용, 없으면 paid_balance와 free_balance 합계 사용
        const totalBalance = data.total_balance !== null && data.total_balance !== undefined 
          ? parseFloat(String(data.total_balance)) 
          : parseFloat(String(data.paid_balance || 0)) + parseFloat(String(data.free_balance || 0));
          
        setUserCashBalance(totalBalance);
      }
    } catch (error) {
      console.error("Error in fetchUserBalance:", error);
    }
  };
  
  // 캠페인 목록 가져오기
  // 모달이 열릴 때 캠페인 목록 가져오기
  useEffect(() => {
    if (open) {
      fetchCampaigns();
      fetchKeywordGroups();
      fetchUserBalance(); // 사용자 잔액 가져오기
    }
  }, [open, serviceCode, category]); // serviceCode와 category 변경 시 캠페인 목록 갱신

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
            console.error("banner_url parsing error", e);
          }
        } else {
          bannerUrl = campaign.add_info.banner_url || null;
        }
      }
      
      setBannerUrl(bannerUrl);
    } catch (err) {
      console.error("Error fetching banner:", err);
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
        console.error("Error fetching campaigns:", error);
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
        console.log("No campaigns available");
        // 사용자에게 캠페인이 없다는 메시지 표시
        showAlert('알림', '현재 사용 가능한 캠페인이 없습니다. 나중에 다시 시도해주세요.', false);
      }
    } catch (error) {
      console.error("Error in fetchCampaigns:", error);
      // 오류 메시지 표시
      showAlert('오류 발생', '캠페인 목록을 불러오는 중 오류가 발생했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.', false);
    } finally {
      setLoading(false);
    }
  };

  // 키워드 그룹 가져오기 함수
  const fetchKeywordGroups = async () => {
    try {
      if (!currentUser?.id) {
        setKeywordError("로그인이 필요합니다");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setKeywordError("로그인이 필요합니다");
        return;
      }

      const { data, error } = await supabase
        .from('keyword_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error("Error fetching keyword groups:", error);
        setKeywordError("키워드 그룹을 불러오지 못했습니다");
        return;
      }

      // 스네이크 케이스에서 카멜 케이스로 변환
      const transformedData = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        campaignName: item.campaign_name,
        campaignType: item.campaign_type,
        isDefault: item.is_default,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      setKeywordGroups(transformedData);

      // 그룹이 있으면 첫 번째 그룹 선택
      if (transformedData.length > 0) {
        // 기본 그룹을 우선 선택, 없으면, 첫 번째 그룹
        const defaultGroup = transformedData.find(g => g.isDefault);
        setSelectedGroupId(defaultGroup?.id || transformedData[0].id);
      }
    } catch (error) {
      console.error("Error in fetchKeywordGroups:", error);
      setKeywordError("키워드 그룹을 불러오는 중 오류가 발생했습니다");
    }
  };

  // 이미 등록된 키워드 ID 목록 가져오기
  const fetchAlreadyRegisteredKeywords = async (campaignId: number) => {
    if (!campaignId || !currentUser?.id) return [];
    
    try {
      // 현재 사용자가 같은 캠페인에 이미 등록한 키워드 슬롯 조회
      const { data, error } = await supabase
        .from('slots')
        .select('input_data')
        .eq('user_id', currentUser.id)
        .eq('product_id', campaignId)
        .neq('status', 'rejected') // 반려된 슬롯은 제외
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching registered slots:", error);
        return [];
      }
      
      // 모든 슬롯의 input_data에서 keywordDetails 추출하여 키워드 ID 목록 생성
      const registeredKeywordIds = new Set<number>();
      
      data.forEach(slot => {
        if (slot.input_data && slot.input_data.keywordDetails) {
          slot.input_data.keywordDetails.forEach((detail: any) => {
            if (detail.id) {
              registeredKeywordIds.add(detail.id);
            }
          });
        }
      });
      
      return Array.from(registeredKeywordIds);
    } catch (error) {
      console.error("Error in fetchAlreadyRegisteredKeywords:", error);
      return [];
    }
  };

  // 선택된 그룹의 키워드 목록 가져오기
  const fetchKeywords = async (groupId: number) => {
    if (!groupId) return;
    
    setKeywordLoading(true);
    
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setKeywordError("로그인이 필요합니다");
        return;
      }

      // 그룹이 현재 사용자의 것인지 확인
      const { data: groupData, error: groupError } = await supabase
        .from('keyword_groups')
        .select('*')
        .eq('id', groupId)
        .eq('user_id', user.id)
        .single();

      if (groupError) {
        setKeywordError("해당 그룹에 접근할 권한이 없습니다");
        return;
      }
      
      // 이미 등록된 키워드 ID 목록 가져오기
      const registeredKeywordIds = selectedCampaignId ? 
        await fetchAlreadyRegisteredKeywords(selectedCampaignId) : [];

      let query = supabase
        .from('keywords')
        .select('*', { count: 'exact' })
        .eq('group_id', groupId);

      // 검색어 필터링
      if (searchKeyword) {
        query = query.or(
          `main_keyword.ilike.%${searchKeyword}%,keyword1.ilike.%${searchKeyword}%,keyword2.ilike.%${searchKeyword}%,keyword3.ilike.%${searchKeyword}%`
        );
      }

      // 활성 상태 필터
      query = query.eq('is_active', true);

      // 정렬
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching keywords:", error);
        setKeywordError("키워드를 불러오지 못했습니다");
        return;
      }

      // 스네이크 케이스에서 카멜 케이스로 데이터 변환
      const transformedData = data
        // 이미 등록된 키워드 필터링
        .filter(item => !registeredKeywordIds.includes(item.id))
        .map(item => ({
          id: item.id,
          groupId: item.group_id,
          mainKeyword: item.main_keyword,
          mid: item.mid,
          url: item.url,
          keyword1: item.keyword1,
          keyword2: item.keyword2,
          keyword3: item.keyword3,
          description: item.description,
          isActive: item.is_active,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          workCount: undefined,
          dueDate: undefined
        }));
      
      // 선택된 캠페인의 min_quantity 가져와서 각 키워드에 자동 추가
      if (selectedCampaign) {
        // min_quantity 값 추출 (문자열 또는 숫자)
        let minQuantity: number;
        
        if (typeof selectedCampaign.min_quantity === 'string') {
          minQuantity = parseInt(selectedCampaign.min_quantity) || 1;
        } else if (typeof selectedCampaign.min_quantity === 'number') {
          minQuantity = selectedCampaign.min_quantity;
        } else {
          minQuantity = 1; // 기본값
        }
        
        console.log(`캠페인 최소 수량: ${minQuantity}`, typeof minQuantity);
            
        // 키워드 목록에 기본 작업타수 설정 및 내일 날짜로 마감일 설정
        transformedData.forEach(keyword => {
          keyword.workCount = minQuantity as unknown as undefined;
          keyword.dueDate = getTomorrowDate() as unknown as undefined;
          console.log(`키워드 ${keyword.mainKeyword}의 작업타수 설정: ${keyword.workCount}`);
        });
      }

      setKeywords(transformedData);
    } catch (error) {
      console.error("Error in fetchKeywords:", error);
      setKeywordError("키워드를 불러오는 중 오류가 발생했습니다");
    } finally {
      setKeywordLoading(false);
    }
  };

  // 그룹 선택 시 또는 캠페인 변경 시 키워드 목록 가져오기
  useEffect(() => {
    if (selectedGroupId) {
      fetchKeywords(selectedGroupId);
    }
  }, [selectedGroupId, searchKeyword, selectedCampaignId]);

  // 키워드 검색은 useEffect에서 searchKeyword가 변경될 때마다 자동으로 실행됨

  // 키워드 그룹 선택 핸들러
  const handleGroupSelect = (groupId: number) => {
    setSelectedGroupId(groupId);
  };

  // 키워드 선택 토글 핸들러
  const handleKeywordToggle = (keywordId: number) => {
    setSelectedKeywords(prev => {
      const newSelection = prev.includes(keywordId)
        ? prev.filter(id => id !== keywordId)
        : [...prev, keywordId];
      
      // 선택된 키워드 변경 시 총 결제 금액 계산
      calculateTotalPayment(newSelection);
      return newSelection;
    });
    
    // 선택 시 선택된 캠페인의 min_quantity를 작업타수로 자동 설정
    if (!keywords.find(k => k.id === keywordId)?.workCount && selectedCampaign) {
      const minQuantity = selectedCampaign.min_quantity ? 
        (typeof selectedCampaign.min_quantity === 'string' ? 
          parseInt(selectedCampaign.min_quantity) : selectedCampaign.min_quantity) : 1;
      
      setKeywords(prev => 
        prev.map(k => 
          k.id === keywordId ? { 
            ...k, 
            workCount: minQuantity,
            dueDate: k.dueDate || getTomorrowDate()  // 마감일이 없으면 내일 날짜로 설정
          } : k
        )
      );
    }
  };
  
  // 총 결제 금액 계산
  const calculateTotalPayment = (selection: number[] = selectedKeywords) => {
    if (!selectedCampaign) {
      console.log("선택된 캠페인이 없어 금액 계산 불가");
      return;
    }
    
    // 캠페인 단가 추출 (문자열 또는 숫자)
    let unitPrice: number;
    
    if (typeof selectedCampaign.unit_price === 'string') {
      unitPrice = parseInt(selectedCampaign.unit_price) || 0;
    } else if (typeof selectedCampaign.unit_price === 'number') {
      unitPrice = selectedCampaign.unit_price;
    } else {
      unitPrice = 0;
    }
    
    console.log(`캠페인 단가: ${unitPrice}원`, typeof unitPrice);
    
    if (unitPrice <= 0) {
      console.log("유효하지 않은 단가: 0원 이하");
      setTotalPaymentAmount(0);
      return;
    }
      
    let total = 0;
    console.log(`===== 결제 금액 계산 시작 (선택 키워드: ${selection.length}개) =====`);
    
    selection.forEach(keywordId => {
      const keyword = keywords.find(k => k.id === keywordId);
      if (keyword) {
        // 작업타수가 null, undefined, 0, 음수인 경우 최소값을 구해서 적용
        let minQuantity = 1; // 기본 최소값
        if (selectedCampaign) {
          if (typeof selectedCampaign.min_quantity === 'string') {
            minQuantity = parseInt(selectedCampaign.min_quantity) || 1;
          } else if (typeof selectedCampaign.min_quantity === 'number') {
            minQuantity = selectedCampaign.min_quantity;
          }
        }
        
        // null/undefined 값이면 최소값, 값이 있으면 해당 값과 최소값 중 큰 값 사용
        const workCount = keyword.workCount === null || keyword.workCount === undefined ? 
          minQuantity : 
          Math.max(keyword.workCount, minQuantity);
          
        const keywordTotal = unitPrice * workCount;
        total += keywordTotal;
        
        console.log(`- 키워드: ${keyword.mainKeyword}, 작업타수: ${workCount}, 금액: ${keywordTotal.toLocaleString()}원`);
      } else {
        console.log(`- 키워드 ID ${keywordId}를 찾을 수 없음`);
      }
    });
    
    // 부가세 10% 추가
    const totalWithTax = Math.round(total * 1.1);
    
    console.log(`합계: ${total.toLocaleString()}원`);
    console.log(`부가세(10%): ${(totalWithTax - total).toLocaleString()}원`);
    console.log(`총 결제 금액: ${totalWithTax.toLocaleString()}원`);
    console.log(`===== 결제 금액 계산 완료 =====`);
    
    setTotalPaymentAmount(totalWithTax);
  };
  
  // 작업타수 변경 핸들러 (입력 중)
  const handleWorkCountChange = (keywordId: number, value: number | null) => {
    // 입력 중에는 임시로 어떤 값이든 허용하고, 결제 금액 계산은 하지 않음
    setKeywords(prev => {
      const newKeywords = prev.map(k => 
        k.id === keywordId ? { ...k, workCount: value } : k
      );
      return newKeywords;
    });
    
    // 입력 중에는 결제 금액 계산하지 않음 (blur 이벤트에서만 계산)
  };
  
  // 작업타수 입력 완료(blur) 핸들러
  const handleWorkCountBlur = (keywordId: number) => {
    // 선택된 키워드 찾기
    const keyword = keywords.find(k => k.id === keywordId);
    if (!keyword) return;
    
    // 선택된 캠페인의 최소 작업타수 가져오기
    let minQuantity = 1; // 기본 최소값
    if (selectedCampaign) {
      if (typeof selectedCampaign.min_quantity === 'string') {
        minQuantity = parseInt(selectedCampaign.min_quantity) || 1;
      } else if (typeof selectedCampaign.min_quantity === 'number') {
        minQuantity = selectedCampaign.min_quantity;
      }
    }
    
    // 값이 없거나 최소값보다 작으면 최소값 적용
    const currentValue = keyword.workCount;
    if (currentValue === null || currentValue === undefined || currentValue < minQuantity) {
      // 최소값으로 업데이트
      setKeywords(prev => {
        const newKeywords = prev.map(k => 
          k.id === keywordId ? { ...k, workCount: minQuantity } : k
        );
        return newKeywords;
      });
    }
    
    // 해당 키워드가 선택된 상태인지 확인 (blur 시점에 항상 결제 금액 재계산)
    if (selectedKeywords.includes(keywordId)) {
      // setTimeout을 사용하여 state 업데이트 완료 후 계산 (React 상태 업데이트는 비동기)
      setTimeout(() => calculateTotalPayment(), 0);
    }
  };
  
  // 내일 날짜 계산 함수 (재사용성을 위해 분리)
  const getTomorrowDate = (): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    
    // yyyy-mm-dd 형식으로 반환
    const result = `${year}-${month}-${day}`;
    
    // 로그로 확인 (개발 중 디버깅용, 실제 배포 시 제거)
    console.log(`내일 날짜 계산: ${result} (오늘: ${today.toISOString().split('T')[0]})`);
    
    return result;
  };
  
  // 마감일 변경 핸들러
  const handleDueDateChange = (keywordId: number, value: string) => {
    setKeywords(prev => 
      prev.map(k => 
        k.id === keywordId ? { ...k, dueDate: value } : k
      )
    );
  };

  // 선택된 키워드 적용 핸들러
  const applySelectedKeywords = () => {
    // 선택된 키워드 객체 가져오기
    const selectedKeywordObjects = selectedKeywords
      .map(id => keywords.find(k => k.id === id))
      .filter(k => k) as Keyword[];
    
    // 메인 키워드가 비어있으면 첫 번째 선택된 키워드의 메인 키워드를 사용
    let newSlotData = { ...slotData };
    
    if (selectedKeywordObjects.length > 0 && (!newSlotData.productName || newSlotData.productName.trim() === '')) {
      newSlotData.productName = selectedKeywordObjects[0].mainKeyword;
    }
    
    // MID와 URL도 첫 번째 선택된 키워드의 값을 사용 (비어있는 경우에만)
    if (selectedKeywordObjects.length > 0 && selectedKeywordObjects[0].mid && (!newSlotData.mid || newSlotData.mid.trim() === '')) {
      newSlotData.mid = String(selectedKeywordObjects[0].mid);
    }
    
    if (selectedKeywordObjects.length > 0 && selectedKeywordObjects[0].url && (!newSlotData.url || newSlotData.url.trim() === '')) {
      newSlotData.url = selectedKeywordObjects[0].url;
    }
    
    // 키워드1, 키워드2, 키워드3에 선택된 키워드의 메인 키워드 할당
    if (selectedKeywordObjects.length > 0) {
      newSlotData.keyword1 = selectedKeywordObjects[0].mainKeyword;
    }
    
    if (selectedKeywordObjects.length > 1) {
      newSlotData.keyword2 = selectedKeywordObjects[1].mainKeyword;
    }
    
    if (selectedKeywordObjects.length > 2) {
      newSlotData.keyword3 = selectedKeywordObjects[2].mainKeyword;
    }
    
    // 선택된 키워드 ID 목록 저장
    newSlotData.selectedKeywords = selectedKeywords;

    // 작업타수와 마감일 정보도 포함 (inputData에 포함시키기 위해)
    newSlotData.keywordDetails = selectedKeywordObjects.map(keyword => ({
      id: keyword.id,
      mainKeyword: keyword.mainKeyword,
      workCount: keyword.workCount || 0,
      dueDate: keyword.dueDate || new Date().toISOString().split('T')[0]
    }));
    
    setSlotData(newSlotData);
    
    // 폼 탭으로 전환
    setActiveTab('form');
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
      
      // 캠페인의 min_quantity 값 추출 (문자열 또는 숫자)
      let minQuantity: number;
      
      if (typeof selectedCampaign.min_quantity === 'string') {
        minQuantity = parseInt(selectedCampaign.min_quantity) || 1;
      } else if (typeof selectedCampaign.min_quantity === 'number') {
        minQuantity = selectedCampaign.min_quantity;
      } else {
        minQuantity = 1; // 기본값
      }
      
      console.log(`캠페인 변경: ${selectedCampaign.campaign_name}, 최소 수량: ${minQuantity}`);
      
      // 모든 키워드의 작업타수를 해당 캠페인의 min_quantity로 업데이트
      setKeywords(prev => 
        prev.map(k => ({
          ...k,
          workCount: minQuantity,
          dueDate: k.dueDate || getTomorrowDate()
        }))
      );
      
      // 총 결제 금액 즉시 재계산
      calculateTotalPayment();
    }
    
    // 슬롯 데이터에도 캠페인 ID 업데이트
    setSlotData(prev => ({
      ...prev,
      campaignId: value
    }));

    // 캠페인에 맞는 키워드 그룹 필터링 (serviceCode와 일치하는 그룹만 표시)
    filterKeywordGroups(value);
  };

  // 캠페인에 맞는 키워드 그룹 필터링
  const filterKeywordGroups = (campaignId: number) => {
    const selectedCampaign = campaigns.find(c => c.id === campaignId);
    if (!selectedCampaign) return;

    // 서비스 코드 맵핑
    const serviceTypeMap: Record<string, string> = {
      'ntraffic': 'NaverShopTraffic',
      'nblog': 'NaverBlogPosting',
      'ncafe': 'NaverCafePosting',
      'kstory': 'KakaoStory',
      'instagram': 'Instagram',
    };

    const campaignType = serviceTypeMap[selectedCampaign.service_type] || 'NaverShopTraffic';
    
    // 캠페인 타입과 일치하는 그룹이 있으면 해당 그룹을 우선 선택
    const matchingGroup = keywordGroups.find(g => g.campaignType === campaignType);
    if (matchingGroup) {
      setSelectedGroupId(matchingGroup.id);
    }
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
      
      // 선택된 키워드가 없으면 저장 불가
      if (selectedKeywords.length === 0) {
        showAlert('알림', '키워드를 한 개 이상 선택해주세요.', false);
        return;
      }
      
      // 폼 유효성 검사 - 백업 키워드 캠페인에서 체크된 키워드를 구매할 때는 우회
      // 현재 경로가 백업 키워드 캠페인인지 확인
      const isBackupKeywordCampaign = window.location.pathname.includes('/backup-keyword-campaign');
      
      if (!isBackupKeywordCampaign && !validateForm()) {
        console.log("Form validation failed", errors);
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
      let matId = selectedCampaign.mat_id;
      
      if (!matId) {
        console.error("Campaign mat_id not found");
        throw new Error('캠페인의 mat_id를 찾을 수 없습니다. 이 캠페인은 슬롯을 등록할 수 없습니다.');
      }

      // 단가 확인
      const unitPrice = selectedCampaign.unit_price ? 
        (typeof selectedCampaign.unit_price === 'string' ? 
          parseInt(selectedCampaign.unit_price) : selectedCampaign.unit_price) : 0;
          
      if (unitPrice <= 0) {
        throw new Error('유효하지 않은 캠페인 단가입니다.');
      }
      
      // 선택된 키워드 불러오기
      const selectedKeywordObjects = selectedKeywords
        .map(id => keywords.find(k => k.id === id))
        .filter(k => k) as Keyword[];
      
      // 사용자의 캐시 잔액이 충분한지 확인
      if (userCashBalance < totalPaymentAmount) {
        throw new Error(`잔액이 부족합니다. 현재 잔액: ${userCashBalance.toLocaleString()}원, 필요 금액: ${totalPaymentAmount.toLocaleString()}원`);
      }
      
      // 저장 성공 메시지용 변수
      let successMessage = '';
      let totalProcessed = 0;
      let processedSlots = [];
      
      // 각 키워드마다 개별 슬롯 생성
      for (const keyword of selectedKeywordObjects) {
        // 키워드에 대한 슬롯별 input_data 생성
        const keywordInputData = {
          productName: slotData.productName || keyword.mainKeyword,
          mid: slotData.mid || String(keyword.mid || ''),
          url: slotData.url || keyword.url || '',
          keywords: [keyword.mainKeyword].filter(k => k.trim() !== ''), // 단일 키워드
          keywordDetails: [{
            id: keyword.id,
            mainKeyword: keyword.mainKeyword,
            workCount: keyword.workCount || 1,
            dueDate: keyword.dueDate || getTomorrowDate()
          }]
        };
        
        // 단일 키워드에 대한 결제 금액 계산
        const workCount = keyword.workCount || 1;
        const keywordPayment = Math.round(unitPrice * workCount * 1.1); // 부가세 10% 추가
        
        console.log(`Registering slot for keyword ${keyword.mainKeyword} with:`, {
          userId, 
          selectedCampaignId, 
          matId, 
          keywordInputData,
          payment: keywordPayment
        });
        
        // 슬롯 등록 요청
        const result = await registerSlot(
          userId,
          selectedCampaignId,
          matId,
          keywordInputData
        );
        
        if (result.success) {
          totalProcessed++;
          processedSlots.push({
            keyword: keyword.mainKeyword,
            workCount: workCount,
            payment: keywordPayment,
            slotId: result.data?.id
          });
        } else {
          console.error(`Error registering slot for keyword ${keyword.mainKeyword}:`, result.message);
        }
      }
      
      // 사용자의 캐시 잔액 업데이트 (UI 표시용)
      setUserCashBalance(prev => prev - totalPaymentAmount);
      
      // 성공 메시지 구성
      if (totalProcessed === selectedKeywordObjects.length) {
        successMessage = `${totalProcessed}개의 키워드 슬롯이 성공적으로 등록되었습니다. 총 ${totalPaymentAmount.toLocaleString()}원이 차감되었습니다.`;
      } else {
        successMessage = `${totalProcessed}/${selectedKeywordObjects.length}개의 키워드 슬롯이 등록되었습니다. 총 ${totalPaymentAmount.toLocaleString()}원이 차감되었습니다.`;
      }
      
      // 성공 메시지 표시
      showAlert('성공', successMessage, true);

      // 부모 컴포넌트의 onSave 함수 호출 (있다면)
      if (onSave) {
        onSave(slotData);
      }
      
      // 입력 폼 즉시 초기화 (UX 개선)
      setSlotData({
        productName: '',
        mid: '',
        url: '',
        keyword1: '',
        keyword2: '',
        keyword3: '',
        selectedKeywords: []
      });
      setErrors({});
      setSelectedKeywords([]);
      setTotalPaymentAmount(0);

    } catch (error) {
      console.error("Error in handleSave:", error);
      
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
          console.error("Error parsing add_info for logo_url", e);
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
        <DialogContent className="!max-w-[1200px] sm:!max-w-[1200px] md:!max-w-[1200px] p-0 overflow-hidden flex flex-col max-h-[95vh] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 duration-300">
          <DialogHeader className="bg-background py-4 sm:py-5 px-5 sm:px-8 border-b sticky top-0 z-10">
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
          <div className="flex mt-3 md:mt-4 border-b justify-end items-center">
            <div className="px-3 md:px-4 py-2 text-xs md:text-sm">
              <span className="font-medium text-gray-500">캐시 잔액:</span> 
              <span className="ml-1 font-bold text-primary">{userCashBalance.toLocaleString()}원</span>
            </div>
          </div>
        </DialogHeader>
        <DialogBody className="p-5 sm:p-8 max-h-[70vh] md:max-h-[75vh] overflow-y-auto">
          {/* 반응형 레이아웃: 모바일에서는 세로, 태블릿/데스크톱에서는 가로 */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* 캠페인 상세 정보 */}
            <div className="w-full md:w-[30%] space-y-6 md:border-r md:border-border md:pr-6">
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
                        console.error("Banner image error");
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
                            console.error("Logo image error");
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

            {/* 키워드 선택 영역 */}
            <div className="w-full md:w-[70%] space-y-6 pt-4 md:pt-0 border-t md:border-t-0 border-border mt-4 md:mt-0">
              <div className="space-y-6">
                {/* 키워드 그룹 및 검색 */}
                <div className="flex flex-col md:flex-row gap-4">
                  {/* 그룹 선택 */}
                  <div className="w-full md:w-1/2">
                    <label htmlFor="group-select" className="block text-sm font-medium text-foreground mb-2">
                      키워드 그룹
                    </label>
                    <select
                      id="group-select"
                      value={selectedGroupId || ''}
                      onChange={(e) => handleGroupSelect(Number(e.target.value))}
                      className="flex w-full bg-background rounded-md border border-input text-sm hover:border-gray-400 focus:border-primary h-10 px-3 py-2"
                    >
                      {keywordGroups.length === 0 ? (
                        <option value="">그룹이 없습니다</option>
                      ) : (
                        keywordGroups.map(group => (
                          <option key={group.id} value={group.id}>
                            {group.name} {group.isDefault ? '(기본)' : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* 키워드 검색 */}
                  <div className="w-full md:w-1/2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      키워드 검색
                    </label>
                    <div className="relative">
                      <Input
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="키워드 검색어 입력"
                        className="w-full pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 키워드 목록 */}
                <div className="border rounded-md overflow-hidden shadow-sm">
                  {keywordLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-4 text-muted-foreground">키워드 목록을 불러오는 중...</p>
                    </div>
                  ) : keywordError ? (
                    <div className="p-8 text-center text-red-500">
                      <p>{keywordError}</p>
                    </div>
                  ) : keywords.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">
                        {searchKeyword ? '검색 결과가 없습니다.' : '등록된 키워드가 없습니다.'}
                      </p>
                      {!searchKeyword && (
                        <p className="mt-2 text-sm">
                          <a href="/keyword" target="_blank" className="text-primary hover:underline">
                            키워드 관리 페이지에서 키워드를 추가해주세요.
                          </a>
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white p-3 border-b flex justify-between items-center">
                        <div className="text-sm font-medium">
                          총 {keywords.length}개의 키워드
                        </div>
                        <div className="text-sm">
                          선택됨: {selectedKeywords.length}개
                        </div>
                      </div>
                      <div className="max-h-[550px] overflow-y-auto">
                        <table className="w-full table-fixed border-separate border-spacing-0">
                          <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                            <tr className="text-left">
                              <th className="w-[7%] px-3 py-3 text-xs font-medium border border-blue-500 rounded-tl-md">
                                <div className="flex items-center justify-center relative group">
                                  <input 
                                    type="checkbox"
                                    checked={selectedKeywords.length > 0 && selectedKeywords.length === keywords.length}
                                    onChange={() => {
                                      if (selectedKeywords.length === keywords.length) {
                                        // 모든 키워드가 선택된 경우, 선택 초기화
                                        setSelectedKeywords([]);
                                      } else {
                                        // 전체 선택
                                        const allIds = keywords.map(k => k.id);
                                        setSelectedKeywords(allIds);
                                        
                                        // 선택된 캠페인의 min_quantity를 작업타수로 자동 설정
                                        if (selectedCampaign) {
                                          const minQuantity = selectedCampaign.min_quantity ? 
                                            (typeof selectedCampaign.min_quantity === 'string' ? 
                                              parseInt(selectedCampaign.min_quantity) : selectedCampaign.min_quantity) : 1;
                                          
                                          setKeywords(prev => 
                                            prev.map(k => ({
                                              ...k,
                                              workCount: k.workCount || minQuantity,
                                              dueDate: k.dueDate || getTomorrowDate()
                                            }))
                                          );
                                        }
                                        
                                        // 결제 금액 재계산
                                        setTimeout(() => calculateTotalPayment(allIds), 0);
                                      }
                                    }}
                                    className="size-4 cursor-pointer"
                                  />
                                  <div className="absolute hidden group-hover:block z-20 bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                    {selectedKeywords.length === keywords.length ? '선택 초기화' : '전체 선택'}
                                  </div>
                                </div>
                              </th>
                              <th className="w-[37%] px-3 py-3 text-xs font-medium border border-blue-500">키워드</th>
                              <th className="w-[25%] px-3 py-3 text-xs font-medium border border-blue-500">정보</th>
                              <th className="w-[13%] px-3 py-3 text-xs font-medium border border-blue-500">작업타수</th>
                              <th className="w-[22%] px-3 py-3 text-xs font-medium border border-blue-500 rounded-tr-md">마감일</th>
                            </tr>
                          </thead>
                          <tbody>
                            {keywords.map(keyword => (
                              <tr
                                key={keyword.id}
                                className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                  selectedKeywords.includes(keyword.id) 
                                    ? 'bg-blue-50 dark:bg-blue-900/20' 
                                    : ''
                                }`}
                              >
                                <td className="w-[8%] px-3 py-3.5 border border-gray-200 align-middle text-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedKeywords.includes(keyword.id)}
                                    onChange={() => handleKeywordToggle(keyword.id)}
                                    className="size-4 cursor-pointer"
                                  />
                                </td>
                                <td className="w-[30%] px-3 py-3.5 border border-gray-200" onClick={() => handleKeywordToggle(keyword.id)}>
                                  <div className="cursor-pointer">
                                    <p className="font-medium text-sm text-blue-700 dark:text-blue-400">{keyword.mainKeyword}</p>
                                    <div className="flex flex-wrap gap-1 mt-1.5 text-xs">
                                      {keyword.keyword1 && <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[10px]">{keyword.keyword1}</span>}
                                      {keyword.keyword2 && <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-1.5 py-0.5 rounded text-[10px]">{keyword.keyword2}</span>}
                                      {keyword.keyword3 && <span className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-1.5 py-0.5 rounded text-[10px]">{keyword.keyword3}</span>}
                                    </div>
                                  </div>
                                </td>
                                <td className="w-[28%] px-3 py-3.5 border border-gray-200 align-middle">
                                  <div className="text-xs">
                                    {keyword.mid && <p className="text-gray-500 mb-1">MID: {keyword.mid}</p>}
                                    {keyword.url && <p className="text-blue-500 truncate max-w-[300px]">{keyword.url}</p>}
                                  </div>
                                </td>
                                <td className="w-[10%] px-3 py-3.5 border border-gray-200 align-middle">
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="타수"
                                    value={keyword.workCount === null || keyword.workCount === undefined ? '' : keyword.workCount}
                                    onChange={(e) => {
                                      // 입력이 비어있으면 null로 처리, 아니면 숫자로 변환
                                      const value = e.target.value === '' ? null : parseInt(e.target.value) || 0;
                                      handleWorkCountChange(keyword.id, value);
                                    }}
                                    onBlur={() => handleWorkCountBlur(keyword.id)}
                                    className="w-full min-w-[60px] px-2 py-2 text-base border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                                    onClick={e => e.stopPropagation()}
                                  />
                                </td>
                                <td className="w-[24%] px-3 py-3.5 border border-gray-200 align-middle">
                                  <input
                                    type="date"
                                    value={keyword.dueDate || getTomorrowDate()}
                                    onChange={(e) => handleDueDateChange(keyword.id, e.target.value)}
                                    className="w-full min-w-[130px] px-2 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                                    onClick={e => e.stopPropagation()}
                                  />
                                </td>
                              </tr>
                            ))}
                            {keywords.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-3 py-8 text-center text-gray-500 border border-gray-200">
                                  <p>키워드가 없습니다. 키워드를 추가하거나 다른 그룹을 선택해주세요.</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="px-5 sm:px-8 py-4 sm:py-5 border-t flex justify-between items-center sticky bottom-0 z-10 bg-background shadow-lg">
          <div className="flex items-center">
            {selectedKeywords.length > 0 && (
              <div className="text-sm">
                <span className="font-medium text-gray-600">결제 금액:</span> 
                <span className="ml-1 font-bold text-primary text-lg">{totalPaymentAmount.toLocaleString()}원</span>
                <span className="ml-1 text-xs text-gray-500">(부가세 포함)</span>
              </div>
            )}
          </div>
          <Button
            onClick={handleSave}
            className="px-6 sm:px-8 bg-blue-600 hover:bg-blue-800 text-white transition-all duration-300"
            disabled={loading || saving || !selectedCampaignId || selectedKeywords.length === 0}
          >
            {saving ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full me-2" role="status" aria-hidden="true"></span>
                구매 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 me-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                구매하기
              </>
            )}
          </Button>
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

export { CampaignSlotWithKeywordModal };