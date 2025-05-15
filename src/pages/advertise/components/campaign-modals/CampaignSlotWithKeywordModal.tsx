import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
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
    selectedKeywords: [],
    keywordDetails: [] // 빈 배열로 초기화하여 undefined 가능성 제거
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
    console.log(`showAlert 호출: ${title} - ${description} (성공: ${success})`);
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
      // 오류 발생해도 진행
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
            // JSON 파싱 오류 무시
          }
        } else {
          bannerUrl = campaign.add_info.banner_url || null;
        }
      }

      setBannerUrl(bannerUrl);
    } catch (err) {
      // 배너 불러오기 오류 무시
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
      setKeywordError("키워드 그룹을 불러오는 중 오류가 발생했습니다");
    }
  };

  // 이미 등록된 키워드 ID 목록 가져오기
  const fetchAlreadyRegisteredKeywords = async (campaignId: number) => {
    if (!campaignId || !currentUser?.id) return [];

    try {
      console.log(`이미 등록된 키워드 조회 시작 - 캠페인 ID: ${campaignId}, 사용자 ID: ${currentUser.id}`);
      
      // 현재 사용자가 같은 캠페인에 이미 등록한 키워드 슬롯 조회
      // 1. slots 테이블에서 keyword_id 직접 조회
      const { data: slotData, error: slotError } = await supabase
        .from('slots')
        .select('keyword_id, input_data')
        .eq('user_id', currentUser.id)
        .eq('product_id', campaignId)
        .neq('status', 'rejected') // 반려된 슬롯은 제외
        .order('created_at', { ascending: false });

      if (slotError) {
        console.error('슬롯 조회 오류:', slotError);
        return [];
      }

      // 등록된 키워드 ID 목록 생성 (Set으로 중복 제거)
      const registeredKeywordIds = new Set<number>();

      // slots.keyword_id에서 추출 (테이블 컬럼에 직접 저장된 ID)
      slotData.forEach(slot => {
        if (slot.keyword_id) {
          registeredKeywordIds.add(Number(slot.keyword_id));
        }
      });

      // input_data.keywordDetails에서 추출 (기존 방식 유지)
      slotData.forEach(slot => {
        if (slot.input_data && slot.input_data.keywordDetails) {
          slot.input_data.keywordDetails.forEach((detail: any) => {
            if (detail.id) {
              registeredKeywordIds.add(Number(detail.id));
            }
          });
        }
        
        // input_data.keyword_id도 확인 (단일 키워드 ID)
        if (slot.input_data && slot.input_data.keyword_id) {
          registeredKeywordIds.add(Number(slot.input_data.keyword_id));
        }
      });

      const result = Array.from(registeredKeywordIds);
      console.log(`이미 등록된 키워드 ID ${result.length}개 발견:`, result);
      return result;
    } catch (error) {
      console.error('등록된 키워드 조회 오류:', error);
      return [];
    }
  };

  // 선택된 그룹의 키워드 목록 가져오기
  const fetchKeywords = async (groupId: number) => {
    if (!groupId) return;

    setKeywordLoading(true);
    console.log(`키워드 목록 조회 시작 - 그룹 ID: ${groupId}`);

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

      // 이미 등록된 키워드 ID 목록 가져오기 - 최신 상태 확인
      console.log('이미 등록된 키워드 목록 조회 시작 - 캠페인 ID:', selectedCampaignId);
      const registeredKeywordIds = selectedCampaignId ?
        await fetchAlreadyRegisteredKeywords(selectedCampaignId) : [];
      console.log('등록된 키워드 수:', registeredKeywordIds.length);

      // 키워드 조회
      console.log('그룹 내 키워드 조회 시작');
      let query = supabase
        .from('keywords')
        .select('*', { count: 'exact' })
        .eq('group_id', groupId);

      // 검색어 필터링
      if (searchKeyword) {
        console.log('검색어 필터 적용:', searchKeyword);
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
        console.error('키워드 조회 오류:', error);
        setKeywordError("키워드를 불러오지 못했습니다");
        return;
      }

      console.log(`그룹에서 총 ${data.length}개 키워드 조회됨`);

      // 등록된 키워드 번호 배열 만들기 (숫자 타입으로 변환)
      const registeredIds = registeredKeywordIds.map(id => Number(id));
      
      // 스네이크 케이스에서 카멜 케이스로 데이터 변환
      const transformedData = data
        // 이미 등록된 키워드 필터링 (숫자 타입으로 비교)
        .filter(item => !registeredIds.includes(Number(item.id)))
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
        
      console.log(`필터링 후 ${transformedData.length}개 키워드 유효함 (${data.length - transformedData.length}개 제외됨)`);
      
      // 제외된 키워드들 로깅
      if (data.length > transformedData.length) {
        const excludedKeywords = data
          .filter(item => registeredIds.includes(Number(item.id)))
          .map(item => ({ id: item.id, mainKeyword: item.main_keyword }));
        console.log('제외된 키워드 목록:', excludedKeywords);
      }

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

        console.log(`캠페인 최소 타수 설정: ${minQuantity}`);

        // 키워드 목록에 기본 작업타수 설정 및 내일 날짜로 마감일 설정
        transformedData.forEach(keyword => {
          keyword.workCount = minQuantity as unknown as undefined;
          keyword.dueDate = getTomorrowDate() as unknown as undefined;
        });
      }

      setKeywords(transformedData);
      
      // 선택된 키워드들 중 유효하지 않은 항목(이미 등록된 키워드)이 있는지 확인
      if (selectedKeywords.length > 0) {
        console.log('선택된 키워드 ID 유효성 검사 시작');
        const validSelectedKeywords = selectedKeywords.filter(keywordId =>
          transformedData.some(k => k.id === keywordId)
        );
        
        // 유효하지 않은 키워드가 있으면 선택 목록에서 제거
        if (validSelectedKeywords.length !== selectedKeywords.length) {
          console.log('유효하지 않은 키워드가 선택 목록에서 제거됨:',
            selectedKeywords.filter(id => !validSelectedKeywords.includes(id)));
          setSelectedKeywords(validSelectedKeywords);
          
          // 금액 재계산
          setTimeout(() => calculateTotalPayment(validSelectedKeywords), 0);
        }
      }
    } catch (error) {
      console.error('키워드 로딩 오류:', error);
      setKeywordError("키워드를 불러오는 중 오류가 발생했습니다");
    } finally {
      setKeywordLoading(false);
      console.log('키워드 로딩 완료');
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

  // 마감일에 따른 일수 계산 함수
  const calculateDaysUntilDueDate = (dueDate: string): number => {
    if (!dueDate) return 1; // 마감일이 없으면 기본값 1일
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 오늘 날짜의 시작 시간으로 설정
    
    const dueDateObj = new Date(dueDate);
    dueDateObj.setHours(0, 0, 0, 0); // 마감일의 시작 시간으로 설정
    
    // 일수 차이 계산 (밀리초 단위를 일 단위로 변환)
    const differenceInTime = dueDateObj.getTime() - today.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    // 최소 1일 보장 (마감일이 오늘이거나 이미 지났더라도)
    return Math.max(1, differenceInDays);
  };

  // 총 결제 금액 계산
  const calculateTotalPayment = (selection: number[] = selectedKeywords) => {
    if (!selectedCampaign) {
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

    if (unitPrice <= 0) {
      setTotalPaymentAmount(0);
      return;
    }

    let total = 0;

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

        // 마감일에 따른 추가 계산
        const daysUntilDue = calculateDaysUntilDueDate(keyword.dueDate || getTomorrowDate());
        
        // 기존 공식 * 진행일자 (daysUntilDue)
        const keywordTotal = unitPrice * workCount * daysUntilDue;
        total += keywordTotal;
      }
    });

    // 부가세 10% 추가
    const totalWithTax = Math.round(total * 1.1);

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
    
    // 캠페인이 변경되면 모든 키워드 선택 해제
    setSelectedKeywords([]);

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
    console.log('validateForm 함수 내부 - 선택된 키워드:', selectedKeywords);
    
    // 체크박스로 선택한 키워드만 확인 (이제 input 필드 검증은 하지 않음)
    if (selectedKeywords.length === 0) {
      console.log('validateForm - 선택된 키워드 없음');
      showAlert('알림', '키워드를 한 개 이상 선택해주세요.', false);
      return false;
    }
    
    console.log('validateForm - 검증 통과');
    return true;
  };

  // 저장 버튼 핸들러
  const handleSave = async () => {
    console.log('handleSave 함수 호출됨');
    // 이미 저장 중이면 중복 실행 방지
    if (saving) {
      console.log('이미 저장 중');
      return;
    }

    try {
      // 저장 중 상태로 변경
      console.log('저장 중 상태로 변경');
      setSaving(true);

      // 선택된 캠페인이 없으면 저장 불가
      if (!selectedCampaignId) {
        console.log('선택된 캠페인 없음');
        showAlert('알림', '캠페인을 선택해주세요.', false);
        return;
      }

      // 폼 유효성 검사 (선택된 키워드 확인)
      console.log('폼 유효성 검사 시작');
      if (!validateForm()) {
        console.log('폼 유효성 검사 실패');
        return;
      }
      console.log('폼 유효성 검사 통과');

      // AuthContext의 currentUser 사용
      if (!currentUser || !currentUser.id) {
        console.log('로그인 상태 아님');
        throw new Error('로그인이 필요합니다.');
      }

      const userId = currentUser.id;
      console.log('사용자 ID:', userId);

      // 선택된 캠페인 정보 가져오기
      const selectedCampaign = campaigns.find(camp => camp.id === selectedCampaignId);
      if (!selectedCampaign) {
        console.log('선택된 캠페인 정보를 찾을 수 없음');
        throw new Error('선택된 캠페인 정보를 찾을 수 없습니다.');
      }
      console.log('선택된 캠페인:', selectedCampaign.campaign_name);

      // 캠페인의 mat_id 가져오기 (이미 campaigns 배열에 있는 정보 사용)
      let matId = selectedCampaign.mat_id;
      console.log('매트 ID (원본):', matId, '타입:', typeof matId);
      
      // mat_id 유효성 체크 (UUID 형식인지 확인)
      const isValidUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(matId));
      console.log('UUID 유효성 체크:', isValidUUID);
      
      if (!matId) {
        console.log('매트 ID 없음');
        throw new Error('캠페인의 mat_id를 찾을 수 없습니다. 이 캠페인은 슬롯을 등록할 수 없습니다.');
      }
      
      // UUID 형식이 아니면 일단 경고 로그
      if (!isValidUUID) {
        console.warn('매트 ID가 UUID 형식이 아닙니다. 데이터베이스 에러가 발생할 수 있습니다:', matId);
      }

      // 단가 확인
      const unitPrice = selectedCampaign.unit_price ?
        (typeof selectedCampaign.unit_price === 'string' ?
          parseInt(selectedCampaign.unit_price) : selectedCampaign.unit_price) : 0;
      console.log('단가:', unitPrice);

      if (unitPrice <= 0) {
        console.log('유효하지 않은 단가');
        throw new Error('유효하지 않은 캠페인 단가입니다.');
      }

      // 선택된 키워드 불러오기
      const selectedKeywordObjects = selectedKeywords
        .map(id => keywords.find(k => k.id === id))
        .filter(k => k) as Keyword[];
      console.log('선택된 키워드 수:', selectedKeywordObjects.length);

      // 마감일에 따른 가격 계산을 포함한 총 결제 금액 계산
      let calculatedTotalAmount = 0;
      const keywordPayments = selectedKeywordObjects.map(keyword => {
        const workCount = keyword.workCount || 1;
        const daysUntilDue = calculateDaysUntilDueDate(keyword.dueDate || getTomorrowDate());
        const amount = Math.round(unitPrice * workCount * daysUntilDue * 1.1); // 부가세 10% 추가
        calculatedTotalAmount += amount;
        
        console.log(`키워드: ${keyword.mainKeyword}, 작업타수: ${workCount}, 진행일수: ${daysUntilDue}, 금액: ${amount}`);
        
        return {
          keywordId: keyword.id,
          amount: amount,
          daysUntilDue: daysUntilDue,
          workCount: workCount
        };
      });
      console.log('계산된 총 금액:', calculatedTotalAmount);

      // 사용자의 캐시 잔액이 충분한지 확인
      console.log('사용자 잔액:', userCashBalance);
      console.log('계산된 필요 금액:', calculatedTotalAmount);
      
      if (userCashBalance < calculatedTotalAmount) {
        console.log('잔액 부족');
        showAlert('잔액 부족', 
          `현재 잔액이 부족합니다.\n현재 잔액: ${userCashBalance.toLocaleString()}원\n필요 금액: ${calculatedTotalAmount.toLocaleString()}원`, 
          false);
        return; // 함수 종료
      }

      // 타임아웃 설정 (30초)
      console.log('타임아웃 설정');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('서버 응답 지연으로 요청을 완료할 수 없습니다.')), 30000)
      );

      // 병렬로 슬롯 등록 요청 처리 (Promise.all 사용)
      console.log('슬롯 등록 요청 준비');
      const registrationPromises = selectedKeywordObjects.map(async (keyword, index) => {
        try {
          console.log(`키워드 "${keyword.mainKeyword}" 등록 시작`, {
            keywordId: keyword.id,
            workCount: keyword.workCount,
            dueDate: keyword.dueDate
          });
          
          // 진행일수 계산
          const daysUntilDue = calculateDaysUntilDueDate(keyword.dueDate || getTomorrowDate());
          console.log(`키워드 "${keyword.mainKeyword}" 계산된 진행일수:`, daysUntilDue);
          
          // 키워드에 대한 슬롯별 input_data 생성 (구조 통합 및 정리)
          const keywordInputData = {
            productName: slotData.productName || keyword.mainKeyword,
            mid: slotData.mid || String(keyword.mid || ''),
            url: slotData.url || keyword.url || '',
            // 키워드 정보 구조화 - keyword1,2,3 형식 우선
            // 코드 유지보수를 위한 주석: mainKeyword를 keyword1에 넣고 기존 keyword1,2,3는 순서를 밀어서 저장
            keyword1: keyword.keyword1 || '', 
            keyword2: keyword.keyword2 || '', 
            keyword3: keyword.keyword3 || '', 
            // 단일 형태로 하나의 키워드 배열로도 추가 (후방 호환성)
            keywords: [keyword.mainKeyword].filter(k => k && k.trim() !== ''),
            // 기존 구조도 지원 (후방 호환성)
            mainKeyword: keyword.mainKeyword,
            // 슬롯 메타데이터
            keyword_id: keyword.id, // slots 테이블의 keyword_id 필드를 위해 추가
            quantity: keyword.workCount || 1, // slots 테이블의 quantity 필드를 위해 추가
            days_until_due: daysUntilDue, // 계산용으로 필드로 추가
            due_date: keyword.dueDate || getTomorrowDate(), // 마감일 (deadline 필드에 사용됨)
            // 결제 정보
            payment: keywordPayments[index],
            calculated_price: keywordPayments[index].amount // 정확한 계산된 가격
          };
          console.log(`키워드 "${keyword.mainKeyword}" input_data 정리 완료:`, JSON.stringify(keywordInputData));

          // 슬롯 등록 요청
          console.log(`키워드 "${keyword.mainKeyword}" registerSlot 호출 직전 - 매개변수:`, {
            userId,
            campaignId: selectedCampaignId,
            matId: matId,
            calculatedPrice: keywordPayments[index].amount,
            keyword_id: keyword.id,
            dueDate: keyword.dueDate || getTomorrowDate(),
            days_until_due: daysUntilDue
          });
          
          const result = await registerSlot(
            userId,
            selectedCampaignId,
            matId,
            keywordInputData
          );
          
          console.log(`키워드 "${keyword.mainKeyword}" registerSlot 결과:`, JSON.stringify(result));

          if (!result.success) {
            console.error(`키워드 "${keyword.mainKeyword}" 등록 실패:`, result.message);
          }

          return { 
            keyword, 
            result, 
            success: result.success, 
            workCount: keyword.workCount || 1,
            payment: keywordPayments[index].amount,
            daysUntilDue: daysUntilDue,
            slotId: result.data?.id 
          };
        } catch (error) {
          console.error(`키워드 "${keyword.mainKeyword}" 등록 중 예외 발생:`, error);
          if (error instanceof Error) {
            console.error('스택:', error.stack);
          }
          return { 
            keyword, 
            error, 
            success: false,
            workCount: keyword.workCount || 1,
            daysUntilDue: calculateDaysUntilDueDate(keyword.dueDate || getTomorrowDate()),
            payment: 0 
          };
        }
      });

      // 타임아웃과 함께 모든 등록 요청 처리
      console.log('Promise.race 시작');
      const results = await Promise.race([
        Promise.all(registrationPromises),
        timeoutPromise
      ]) as Array<{
        keyword: Keyword;
        result?: any;
        error?: any;
        success: boolean;
        workCount: number;
        daysUntilDue: number;
        payment: number;
        slotId?: string | number;
      }>;
      console.log('Promise.race 완료, 결과:', results);

      // 성공 및 실패 케이스 분리 및 상세 로깅
      const succeeded = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      console.log('성공 개수:', succeeded.length, '실패 개수:', failed.length);
      
      // 각 실패 케이스 상세 정보 로그
      if (failed.length > 0) {
        console.error('=== 실패한 키워드 목록 ===');
        failed.forEach((f, i) => {
          console.error(`[${i+1}/${failed.length}] 키워드: ${f.keyword.mainKeyword}`, {
            message: f.result?.message || '메시지 없음',
            result: f.result || 'result 없음',
            error: f.error || 'error 없음'
          });
        });
      }
      
      // 실제 처리된 결제 금액 계산 (성공한 항목만)
      const actualPaymentAmount = succeeded.reduce((total, s) => total + s.payment, 0);
      console.log('실제 결제 금액:', actualPaymentAmount);
      
      // 사용자의 캐시 잔액 업데이트 (UI 표시용, 실제 성공한 항목의 금액만 차감)
      setUserCashBalance(prev => prev - actualPaymentAmount);

      // 성공 메시지 구성
      let successMessage = '';
      if (succeeded.length === results.length) {
        // 모두 성공한 경우
        successMessage = `${succeeded.length}개의 키워드 슬롯이 성공적으로 등록되었습니다. 총 ${actualPaymentAmount.toLocaleString()}원이 차감되었습니다.`;
      } else if (succeeded.length > 0 && failed.length > 0) {
        // 일부만 성공한 경우
        const failedKeywords = failed.map(f => f.keyword.mainKeyword).join(', ');
        successMessage = `${succeeded.length}/${results.length}개의 키워드 슬롯이 등록되었습니다. (실패: ${failedKeywords})\n총 ${actualPaymentAmount.toLocaleString()}원이 차감되었습니다.`;
      } else {
        // 모두 실패한 경우
        throw new Error('모든 키워드 슬롯 등록에 실패했습니다.');
      }
      console.log('성공 메시지:', successMessage);

      // 성공 메시지 표시
      console.log('알림 표시 직전');
      showAlert('성공', successMessage, succeeded.length === results.length);
      console.log('알림 표시 완료');

      // 부모 컴포넌트의 onSave 함수 호출 (있다면)
      if (onSave && succeeded.length > 0) {
        console.log('onSave 호출');
        onSave(slotData);
      }

      // 모두 성공했거나 일부 성공한 경우 입력 폼 초기화 및 목록 새로고침
      if (succeeded.length > 0) {
        console.log('입력 폼 초기화 및 키워드 목록 새로고침');
        
        // 입력 폼 즉시 초기화 (UX 개선)
        setSlotData({
          productName: '',
          mid: '',
          url: '',
          keyword1: '',
          keyword2: '',
          keyword3: '',
          selectedKeywords: [],
          keywordDetails: []
        });
        setErrors({});
        setSelectedKeywords([]);
        setTotalPaymentAmount(0);
        
        // 성공한 키워드 ID 목록
        const succeededKeywordIds = succeeded.map(s => s.keyword.id);
        console.log('성공한 키워드 IDs:', succeededKeywordIds);
        
        // 키워드 목록 새로고침 - 현재 선택된 그룹의 키워드만 다시 불러옴
        if (selectedGroupId) {
          console.log('키워드 목록 새로고침 시작 - 그룹 ID:', selectedGroupId);
          fetchKeywords(selectedGroupId);
        }
        
        // 캠페인 정보 새로고침 (선택적)
        fetchCampaigns();
        
        // 사용자 잔액 정보 새로고침
        fetchUserBalance();
        
      } else if (failed.length > 0) {
        // 모두 실패한 경우, 실패한 키워드만 유지
        console.log('실패한 키워드만 유지');
        const failedKeywordIds = failed.map(f => f.keyword.id);
        setSelectedKeywords(failedKeywordIds);
      }

    } catch (error) {
      console.error('handleSave 에러:', error);
      // 오류 메시지 처리 개선
      let errorMsg = '슬롯 저장 중 오류가 발생했습니다';

      if (error instanceof Error) {
        // 오류 유형별 처리
        if (error.message.includes('잔액이 부족합니다')) {
          errorMsg = `잔액이 부족합니다. 캐시를 충전해주세요.`;
        } else if (error.message.includes('타임아웃') || error.message.includes('서버 응답 지연')) {
          errorMsg = '서버 응답 지연으로 요청을 완료할 수 없습니다. 잠시 후 다시 시도해주세요.';
        } else {
          errorMsg = `${errorMsg}: ${error.message}`;
        }
      }

      console.log('오류 알림 표시 직전:', errorMsg);
      showAlert('오류 발생', errorMsg, false);
      console.log('오류 알림 표시 완료');
    } finally {
      // 저장 중 상태 해제
      console.log('저장 중 상태 해제');
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
        <DialogContent className="!max-w-[95vw] sm:!max-w-[1000px] md:!max-w-[1200px] p-0 overflow-hidden flex flex-col max-h-[95vh] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 duration-300">
          <DialogHeader className="bg-background py-3 sm:py-5 px-4 sm:px-8 border-b sticky top-0 z-10">
            <DialogTitle className="text-sm md:text-lg font-bold text-foreground truncate">
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
            <div className="flex mt-3 md:mt-4 justify-end items-center">
              <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-full text-xs md:text-sm border border-blue-100 dark:border-blue-900 shadow-sm">
                <span className="font-semibold text-gray-600 dark:text-gray-300">캐시 잔액:</span>
                <span className="ml-1 font-extrabold text-primary dark:text-primary-foreground">{userCashBalance.toLocaleString()}원</span>
              </div>
            </div>
          </DialogHeader>
          <DialogBody className="p-3 sm:p-5 md:p-8 overflow-hidden">
            {/* 수직 레이아웃: 캠페인 선택이 위에, 키워드 관리가 아래에 */}
            <div className="flex flex-col gap-6">
              {/* 캠페인 상세 정보 - 더 컴팩트하게 */}
              <div className="w-full border-b border-border pb-4">
                <div className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-3 sm:mb-4">
                  {/* 캠페인 선택 드롭박스 */}
                  <div className="w-full md:w-1/3">
                    <label htmlFor="campaign-select" className="block text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                      <KeenIcon icon="document" className="text-blue-500 size-4" />
                      캠페인 선택
                    </label>
                    {loading ? (
                      <div className="text-sm text-muted-foreground">캠페인 목록을 불러오는 중...</div>
                    ) : campaigns.length > 0 ? (
                      <select
                        id="campaign-select"
                        value={selectedCampaignId || ''}
                        onChange={handleCampaignChange}
                        className="select flex w-full bg-background rounded-md border border-input text-sm ring-offset-0 hover:border-gray-400 focus:border-primary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 h-10 px-3 py-2"
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
                  
                  {/* 선택된 캠페인 정보 - 고정 높이 유지 */}
                  <div className="w-full md:w-2/3 min-h-[110px] sm:min-h-[130px] bg-white rounded-lg border border-border shadow-sm p-2 sm:p-3">
                    {campaignData ? (
                      <div className="flex gap-4">
                        <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] shrink-0 relative rounded-md overflow-hidden">
                          {bannerUrl ? (
                            <>
                              <div className="absolute inset-0">
                                <img
                                  src={bannerUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  style={{ filter: 'blur(4px) brightness(0.9)', transform: 'scale(1.1)' }}
                                />
                                <div className="absolute inset-0 bg-black/20"></div>
                              </div>
                              <div className="relative z-10 flex justify-center items-center h-full">
                                <img
                                  src={bannerUrl}
                                  alt="캠페인 배너"
                                  className="object-contain max-h-[60px] max-w-[60px] sm:max-h-[80px] sm:max-w-[80px] shadow-sm rounded"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const parentDiv = e.currentTarget.parentElement;
                                    if (parentDiv) {
                                      parentDiv.innerHTML = `
                                        <div class="size-10 rounded-full bg-white/30 flex items-center justify-center">
                                          <img src="${toAbsoluteUrl('/media/app/mini-logo-primary.svg')}" 
                                          alt="캠페인 로고" class="h-8 w-auto" />
                                        </div>
                                      `;
                                    }
                                  }}
                                />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-blue-500/20 flex items-center justify-center">
                              <div className="size-10 rounded-full bg-white/30 flex items-center justify-center">
                                <img
                                  src={toAbsoluteUrl('/media/app/mini-logo-primary.svg')}
                                  alt="캠페인 로고"
                                  className="h-8 w-auto"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between mb-2">
                            <h2 className="text-lg font-bold text-foreground truncate">
                              {campaignData.campaignName}
                            </h2>
                            {campaignData.status && (
                              <span className={`badge ${campaignData.status.color} badge-outline rounded-[30px] h-auto py-0.5 px-2 text-sm`}>
                                <span className={`size-1.5 rounded-full bg-${getStatusColorClass(campaignData.status.color)} me-1`}></span>
                                {campaignData.status.label}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <div className="flex items-center gap-1.5 text-sm">
                              <KeenIcon icon="wallet" className="text-primary size-4" />
                              <span className="text-muted-foreground">단가:</span>
                              <span className="font-bold text-primary">
                                {campaignData.unitPrice ? (campaignData.unitPrice.endsWith('원') ? campaignData.unitPrice : `${campaignData.unitPrice}원`) : '1,000원'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-sm">
                              <KeenIcon icon="timer" className="text-blue-500 size-4" />
                              <span className="text-muted-foreground">마감:</span>
                              <span className="font-bold">{campaignData.deadline}</span>
                            </div>
                          </div>
                          
                          <div className="text-sm">
                            <div className="bg-blue-50/50 p-2 rounded border border-blue-100/50 text-gray-700 line-clamp-2">
                              {campaignData.description || '설명이 없습니다.'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground text-sm">선택된 캠페인이 없거나 로딩 중입니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 키워드 선택 영역 */}
              <div className="w-full space-y-6 pt-4">
                <div className="space-y-6">
                  {/* 키워드 그룹 선택 및 검색 - 한 행에 모두 배치 */}
                  <div className="flex flex-wrap gap-2 sm:gap-4 mb-2">
                    {/* 섹션 제목 */}
                    <div className="flex items-center gap-2 min-w-32">
                      <KeenIcon icon="search" className="text-blue-600 size-5" />
                      <h3 className="text-base font-medium text-foreground">키워드 관리</h3>
                    </div>
                    
                    {/* 그룹 선택 */}
                    <div className="flex-1 min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <KeenIcon icon="folder" className="text-blue-500 size-4 shrink-0" />
                        <select
                          id="group-select"
                          value={selectedGroupId || ''}
                          onChange={(e) => handleGroupSelect(Number(e.target.value))}
                          className="select flex-1 w-full bg-background rounded-md border border-input text-sm hover:border-gray-400 focus:border-primary h-9 px-3"
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
                    </div>

                    {/* 키워드 검색 */}
                    <div className="flex-1 min-w-[220px]">
                      <div className="relative flex items-center">
                        <KeenIcon icon="magnifying-glass" className="text-blue-500 size-4 absolute left-3" />
                        <Input
                          value={searchKeyword}
                          onChange={(e) => setSearchKeyword(e.target.value)}
                          placeholder="키워드 검색어 입력"
                          className="w-full pl-9 pr-3 h-9 bg-white border-gray-300 focus:border-blue-400 focus:ring-blue-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 키워드 목록 - 테이블 구역 최적화 */}
                  <div className="border rounded-md overflow-hidden shadow-sm">
                    {keywordLoading ? (
                      <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-3 text-muted-foreground text-sm">키워드 목록을 불러오는 중...</p>
                      </div>
                    ) : keywordError ? (
                      <div className="p-6 text-center text-red-500">
                        <p>{keywordError}</p>
                      </div>
                    ) : keywords.length === 0 ? (
                      <div className="p-6 text-center">
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
                        <div className="bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white py-1.5 sm:py-2 px-3 sm:px-4 border-b flex justify-between items-center rounded-t-md">
                          <div className="flex items-center gap-2">
                            <KeenIcon icon="list" className="text-white size-4" />
                            <div className="text-sm font-semibold antialiased">
                              총 {keywords.length}개의 키워드
                            </div>
                          </div>
                          <div className="inline-flex items-center gap-1.5 text-sm bg-green-500/30 py-1 px-2 md:py-1.5 md:px-3 rounded-full">
                            <KeenIcon icon="check-circle" className="text-green-300 size-4" />
                            <span className="font-semibold text-green-100 antialiased">선택됨: {selectedKeywords.length} 개</span>
                          </div>
                        </div>
                        <div className="h-[280px] md:h-[320px] overflow-y-auto bg-white dark:bg-slate-900">
                          <table className="w-full table-fixed border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-600/95 to-indigo-600/95 text-white shadow-sm">
                              <tr className="text-left">
                                <th className="w-[7%] px-1 sm:px-2 py-2 sm:py-3 text-[10px] sm:text-sm font-medium border border-blue-500/50 rounded-tl-md">
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
                                      className="size-3 sm:size-4 cursor-pointer rounded"
                                    />
                                    <div className="absolute hidden group-hover:block z-20 bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
                                      {selectedKeywords.length === keywords.length ? '선택 초기화' : '전체 선택'}
                                    </div>
                                  </div>
                                </th>
                                <th className="w-[28%] sm:w-[30%] px-1 py-2 md:px-3 md:py-3 text-[9px] md:text-xs font-semibold border border-blue-500/50 uppercase tracking-wider antialiased">키워드</th>
                                <th className="w-[35%] sm:w-[35%] px-1 py-2 md:px-3 md:py-3 text-[9px] md:text-xs font-semibold border border-blue-500/50 uppercase tracking-wider antialiased">정보</th>
                                <th className="w-[12%] sm:w-[10%] px-1 py-2 md:px-3 md:py-3 text-[9px] md:text-xs font-semibold border border-blue-500/50 uppercase tracking-wider antialiased">타수</th>
                                <th className="w-[18%] sm:w-[18%] px-1 py-2 md:px-3 md:py-3 text-[9px] md:text-xs font-semibold border border-blue-500/50 rounded-tr-md uppercase tracking-wider antialiased">마감일</th>
                              </tr>
                            </thead>
                            <tbody>
                              {keywords.map(keyword => (
                                <tr
                                  key={keyword.id}
                                  className={`transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/70 ${selectedKeywords.includes(keyword.id)
                                    ? 'bg-blue-50 dark:bg-blue-900/80 shadow-sm'
                                    : 'bg-white dark:bg-slate-800'
                                    }`}
                                >
                                  <td className="w-[7%] px-1 sm:px-2 py-2 sm:py-3 border border-gray-200 align-middle text-center">
                                    <div className="flex justify-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedKeywords.includes(keyword.id)}
                                        onChange={() => handleKeywordToggle(keyword.id)}
                                        className="size-3 sm:size-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                    </div>
                                  </td>
                                  <td className="w-[28%] sm:w-[30%] px-1 sm:px-2 py-1 sm:py-2 md:px-3 md:py-3 border border-gray-200 group" onClick={() => handleKeywordToggle(keyword.id)}>
                                    <div className="cursor-pointer transition-all">
                                      <p className="font-semibold text-xs sm:text-sm text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 line-clamp-1 antialiased">{keyword.mainKeyword}</p>
                                      <div className="flex flex-wrap gap-1 mt-1.5 text-xs">
                                        {keyword.keyword1 && <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-xs transition-colors group-hover:bg-indigo-100 dark:group-hover:bg-indigo-800/40 font-medium antialiased">{keyword.keyword1}</span>}
                                        {keyword.keyword2 && <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-xs transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-800/40 font-medium antialiased">{keyword.keyword2}</span>}
                                        {keyword.keyword3 && <span className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-xs transition-colors group-hover:bg-amber-100 dark:group-hover:bg-amber-800/40 font-medium antialiased">{keyword.keyword3}</span>}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="w-[35%] px-1 sm:px-2 py-1 sm:py-2 md:px-3 md:py-3 border border-gray-200 align-middle">
                                    <div className="text-xs">
                                      {keyword.mid && <p className="text-gray-600 mb-1 flex items-center gap-1 font-medium"><span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs font-semibold">MID</span> {keyword.mid}</p>}
                                      {keyword.url && <p className="text-blue-600 truncate max-w-[300px] hover:text-blue-700 font-medium">{keyword.url}</p>}
                                    </div>
                                  </td>
                                  <td className="w-[12%] sm:w-[10%] px-1 sm:px-2 py-1 sm:py-2 md:px-3 md:py-3 border border-gray-200 align-middle">
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
                                      className="w-full min-w-[30px] sm:min-w-[60px] px-1 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white font-medium"
                                      onClick={e => e.stopPropagation()}
                                    />
                                  </td>
                                  <td className="w-[18%] sm:w-[18%] px-1 sm:px-2 py-1 sm:py-2 md:px-3 md:py-3 border border-gray-200 align-middle">
                                    <input
                                      type="date"
                                      value={keyword.dueDate || getTomorrowDate()}
                                      onChange={(e) => handleDueDateChange(keyword.id, e.target.value)}
                                      className="w-full px-0 sm:px-2 py-0.5 sm:py-1.5 text-[9px] sm:text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white font-medium" 
                                      style={{ minWidth: '60px' }}
                                      onClick={e => e.stopPropagation()}
                                    />
                                  </td>
                                </tr>
                              ))}
                              {keywords.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="px-3 py-8 text-center text-gray-600 border border-gray-200 font-bold">
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
          <DialogFooter className="px-3 sm:px-5 md:px-8 py-3 sm:py-4 md:py-5 border-t flex flex-col sm:flex-row justify-between items-center gap-3 sticky bottom-0 z-10 bg-background shadow-lg">
            <div className="flex items-center">
              {selectedKeywords.length > 0 && (
                <div className="flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 border border-blue-100 dark:border-blue-900 shadow-sm w-full sm:w-auto">
                  <KeenIcon icon="wallet" className="text-primary size-5 mr-2 translate-y-[4px]" />
                  <div className="flex items-baseline flex-wrap">
                    <span className="font-semibold text-gray-600 dark:text-gray-300 text-sm">결제 금액:</span>
                    <span className="ml-2 font-extrabold text-primary dark:text-primary-foreground text-base sm:text-lg">{totalPaymentAmount.toLocaleString()}원</span>
                    <span className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">(부가세 포함)</span>
                  </div>
                </div>
              )}
            </div>
            <Button
              onClick={() => {
                console.log("=== 구매하기 버튼 클릭 ===");
                console.log("선택된 키워드 수:", selectedKeywords.length);
                console.log("선택된 캠페인:", selectedCampaignId);
                console.log("저장 상태:", saving);
                console.log("로딩 상태:", loading);
                if (selectedKeywords.length === 0) {
                  console.log("선택된 키워드가 없어 버튼이 비활성화되어야 함");
                }
                handleSave();
              }}
              type="button"
              className="px-4 sm:px-6 md:px-8 bg-blue-600 hover:bg-blue-800 text-white transition-all duration-300 h-9 sm:h-10 rounded-lg shadow-sm w-full sm:w-auto"
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
        <CustomDialogContent className="max-w-md w-[92vw] md:w-auto overflow-hidden bg-white dark:bg-slate-900 rounded-xl shadow-xl">
          <div className="p-0">
            {/* 헤더 영역 */}
            <div className={`px-4 sm:px-6 py-3 sm:py-4 ${isSuccess ? "bg-gradient-to-r from-green-500 to-emerald-600" : "bg-gradient-to-r from-red-500 to-rose-600"} text-white`}>
              <div className="flex items-center gap-2 sm:gap-3">
                {isSuccess ? (
                  <div className="size-8 sm:size-10 rounded-full bg-white/20 flex items-center justify-center">
                    <KeenIcon icon="Check" className="size-4 sm:size-5 text-white" />
                  </div>
                ) : (
                  <div className="size-8 sm:size-10 rounded-full bg-white/20 flex items-center justify-center">
                    <KeenIcon icon="Information" className="size-4 sm:size-5 text-white" />
                  </div>
                )}
                <h3 className="text-base sm:text-lg font-semibold">{alertTitle}</h3>
              </div>
            </div>
            
            {/* 내용 영역 */}
            <div className="p-4 sm:p-6">
              <p className="text-foreground mb-4 sm:mb-6 text-sm md:text-base whitespace-pre-line">{alertDescription}</p>
              <div className="flex justify-end">
                <Button
                  onClick={() => setAlertDialogOpen(false)}
                  className={`text-sm md:text-base px-4 sm:px-5 py-1.5 sm:py-2 h-8 sm:h-10 rounded-lg shadow-sm ${isSuccess 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                    : "bg-rose-600 hover:bg-rose-700 text-white"}`}
                >
                  확인
                </Button>
              </div>
            </div>
          </div>
        </CustomDialogContent>
      </Dialog>
    </>
  );
};

export { CampaignSlotWithKeywordModal };