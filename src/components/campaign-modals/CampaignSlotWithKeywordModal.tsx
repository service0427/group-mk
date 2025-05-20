import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogHeaderSpacer
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/auth';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { getStatusLabel, getStatusColor, CampaignServiceType, SERVICE_TYPE_LABELS } from './types';
import { getStatusColorClass } from '@/utils/CampaignFormat';
import { resolveServiceType } from '@/utils/serviceTypeResolver';

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
  dueDate?: string | null;   // 마감일 (기존: 날짜 형식)
  dueDays?: number | null;   // 마감 일수 (변경: 숫자 형식)
  // 사용자 입력 필드 데이터
  inputData?: Record<string, string>; // 추가 입력 필드 데이터 (필드명: 값)
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
  campaign?: any | null;
  onSave?: (data: CampaignSlotData) => void;
  serviceCode?: string | CampaignServiceType; // 서비스 코드 (NAVER_SHOPPING_TRAFFIC, NAVER_AUTO 등)
  initialCampaignId?: number; // 구매하기 버튼을 통해 특정 캠페인을 선택한 경우 해당 ID
  sourcePageInfo?: {
    page: string;     // 어떤 페이지에서 열렸는지 (예: 'campaignInfo', 'myService' 등)
    buttonType: string; // 어떤 버튼으로 열렸는지 (예: 'buy', 'add', 'manage' 등)
  };
}

// 키워드 상세 정보 인터페이스
interface KeywordDetail {
  id: number;
  mainKeyword: string;
  workCount: number;
  dueDays: number; // 마감 일수 (변경됨)
  inputData?: Record<string, string>; // 추가 입력 필드 데이터
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
  // 추가: 키워드 상세 정보 (작업타수, 마감일수, 추가 입력 데이터 등)
  keywordDetails?: KeywordDetail[];
  // 추가 입력 필드 데이터
  input_data?: Record<string, any>; // 키워드별 추가 입력 필드 데이터
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
  add_info?: {
    logo_url?: string;
    banner_url?: string;
    add_field?: Array<{ fieldName: string; description: string }>; // 추가 입력 필드 목록
    [key: string]: any;
  } | string; // 배너 URL 등의 추가 정보
}

const CampaignSlotWithKeywordModal: React.FC<CampaignSlotWithKeywordModalProps> = ({
  open,
  onClose,
  category,
  campaign,
  onSave,
  serviceCode = CampaignServiceType.NAVER_SHOPPING_TRAFFIC, // 기본값 설정
  initialCampaignId,
  sourcePageInfo
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

  // 현재 위치 정보 가져오기
  const location = useLocation();

  // 서비스 타입 값을 다양한 소스에서 체계적으로 추출 - 최적화를 위해 의존성을 명확히 함
  const finalServiceCode = useMemo(() => {
    try {
      // URL 내에 naver-shopping-traffic이 포함되어 있으면 직접 반환 (최적화)
      if (location.pathname.includes('naver-shopping-traffic')) {
        return CampaignServiceType.NAVER_SHOPPING_TRAFFIC;
      }
      
      return resolveServiceType({
        campaign,
        serviceCode,
        pathname: location.pathname,
        category
      });
    } catch (e) {
      // 오류 발생 시 기본값 사용
      return CampaignServiceType.NAVER_TRAFFIC;
    }
  }, [campaign, serviceCode, location.pathname, category]);

  // 모달이 열릴 때만 한 번 데이터 로드 (모든 데이터를 한 번에 로드)
  useEffect(() => {
    if (open) {
      fetchCampaigns(); // 캠페인 목록 조회
      fetchKeywordGroups(); // 키워드 그룹 조회
      fetchUserBalance(); // 사용자 잔액 가져오기
    }
  }, [open, finalServiceCode]); // finalServiceCode가 변경될 때만 다시 로드

  // 캠페인 로고 또는 아이콘 가져오기 함수
  const fetchCampaignBanner = async (campaign: SupabaseCampaign) => {
    if (!campaign) return;

    try {
      // add_info에서 로고 URL 또는 배너 URL 가져오기
      let logoUrl = null;
      if (campaign.add_info) {
        if (typeof campaign.add_info === 'string') {
          try {
            const addInfo = JSON.parse(campaign.add_info);
            // 로고 URL을 우선으로, 없으면 배너 URL 사용
            logoUrl = addInfo.logo_url || addInfo.banner_url || null;
          } catch (e) {
            // JSON 파싱 오류 무시
          }
        } else {
          // 로고 URL을 우선으로, 없으면 배너 URL 사용
          logoUrl = campaign.add_info.logo_url || campaign.add_info.banner_url || null;
        }
      }

      // 로고 URL이 없으면 campaign.logo 필드 확인
      if (!logoUrl && campaign.logo) {
        // campaign.logo가 animal 이름인 경우
        if (!campaign.logo.includes('/')) {
          logoUrl = `/media/animal/svg/${campaign.logo}.svg`;
        } else {
          logoUrl = campaign.logo;
        }
      }

      setBannerUrl(logoUrl);
    } catch (err) {
      // 로고 불러오기 오류 무시
      setBannerUrl(null);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);

      // DB 쿼리를 위한 서비스 타입 변환 - finalServiceCode 기반
      const dbServiceType = finalServiceCode;

      // Supabase 쿼리 준비
      let query = supabase
        .from('campaigns')
        .select('*, mat_id, add_info') // mat_id와 add_info 필드도 가져오기
        .eq('status', 'active') // 항상 active 상태인 캠페인만 가져오기
        .order('id', { ascending: true });

      // 서비스 타입으로 필터 추가 - 문자열로 변환하여 저장
      query = query.eq('service_type', String(dbServiceType));

      // 쿼리 실행
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setCampaigns(data);

        // initialCampaignId가 있으면 해당 캠페인을 찾아 선택
        let selectedCampaign = null;

        if (initialCampaignId || campaign?.campaign_name) {
          // 1. ID로 먼저 매칭 시도
          if (initialCampaignId !== undefined && initialCampaignId !== null && initialCampaignId !== 0) {
            // ID 비교 시 Number 형변환으로 안전하게 비교
            selectedCampaign = data.find(c => Number(c.id) === Number(initialCampaignId));
          }

          // 2. ID로 매칭 실패 시 캠페인 이름으로 매칭 시도
          if (!selectedCampaign && campaign?.campaign_name) {
            // 캠페인 이름이 정확히 일치하는 케이스 먼저 찾기
            selectedCampaign = data.find(c =>
              c.campaign_name.toLowerCase() === campaign.campaign_name.toLowerCase()
            );

            // 여전히 찾지 못했을 경우, 부분 매칭 시도 (이름에 포함된 경우)
            if (!selectedCampaign) {
              selectedCampaign = data.find(c =>
                c.campaign_name.toLowerCase().includes(campaign.campaign_name.toLowerCase()) ||
                campaign.campaign_name.toLowerCase().includes(c.campaign_name.toLowerCase())
              );
            }
          }
        }

        // 특정 캠페인이 지정되지 않았거나 찾지 못한 경우 첫 번째 캠페인 선택
        if (!selectedCampaign) {
          selectedCampaign = data[0];
        }

        // 선택된 캠페인 ID 설정
        setSelectedCampaignId(selectedCampaign.id);

        // 배너 정보 가져오기
        fetchCampaignBanner(selectedCampaign);

        // 슬롯 데이터에도 캠페인 ID 추가
        setSlotData(prev => ({
          ...prev,
          campaignId: selectedCampaign.id
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
      return result;
    } catch (error) {
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

      // 이미 등록된 키워드 ID 목록 가져오기 - 최신 상태 확인
      const registeredKeywordIds = selectedCampaignId ?
        await fetchAlreadyRegisteredKeywords(selectedCampaignId) : [];

      // 키워드 조회
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
        setKeywordError("키워드를 불러오지 못했습니다");
        return;
      }

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
          dueDate: undefined,
          dueDays: 0,
          inputData: {}
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

        // 키워드 목록에 기본 작업타수 설정 및 기본 마감일수 설정
        transformedData.forEach(keyword => {
          keyword.workCount = minQuantity as unknown as undefined;
          keyword.dueDays = 1; // 기본 마감일수 1일로 설정
          keyword.inputData = {}; // 추가 입력 데이터 초기화
        });
      }

      setKeywords(transformedData);

      // 선택된 키워드들 중 유효하지 않은 항목(이미 등록된 키워드)이 있는지 확인
      if (selectedKeywords.length > 0) {
        const validSelectedKeywords = selectedKeywords.filter(keywordId =>
          transformedData.some(k => k.id === keywordId)
        );

        // 유효하지 않은 키워드가 있으면 선택 목록에서 제거
        if (validSelectedKeywords.length !== selectedKeywords.length) {
          setSelectedKeywords(validSelectedKeywords);

          // 금액 재계산
          setTimeout(() => calculateTotalPayment(validSelectedKeywords), 0);
        }
      }
    } catch (error) {
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
            dueDays: 1  // 마감일수를 기본값 1일로 설정
          } : k
        )
      );
    }
  };

  // 마감 일수 획득 함수 - 숫자 입력값을 직접 반환
  const getDueDays = (keyword: Keyword): number => {
    // dueDays가 있으면 그 값을 사용, 없으면 기본값 1일
    return keyword.dueDays ?? 1;
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

        // 마감일 수를 getDueDays 함수를 사용하여 가져옴
        const dueDays = getDueDays(keyword);

        // 기존 공식 * 진행일자 (이제 dueDays 사용)
        const keywordTotal = unitPrice * workCount * dueDays;
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

  // 캠페인의 추가 입력 필드 가져오기
  const getAdditionalFields = (campaign: SupabaseCampaign | null): Array<{ fieldName: string; description: string }> => {
    if (!campaign || !campaign.add_info) return [];
    
    let addFields: Array<{ fieldName: string; description: string }> = [];
    
    try {
      // 문자열인 경우 파싱 시도
      if (typeof campaign.add_info === 'string') {
        const parsedInfo = JSON.parse(campaign.add_info);
        if (parsedInfo.add_field && Array.isArray(parsedInfo.add_field)) {
          addFields = parsedInfo.add_field;
        }
      } 
      // 객체인 경우 직접 접근
      else if (campaign.add_info.add_field && Array.isArray(campaign.add_info.add_field)) {
        addFields = campaign.add_info.add_field;
      }
    } catch (e) {
      console.error('추가 입력 필드 파싱 오류:', e);
      return [];
    }
    
    return addFields;
  };

  // 마감 일수 변경 핸들러
  const handleDueDaysChange = (keywordId: number, value: number) => {
    // 값이 1 미만이면 1로 설정
    const days = value < 1 ? 1 : value;
    
    setKeywords(prev =>
      prev.map(k =>
        k.id === keywordId ? { ...k, dueDays: days } : k
      )
    );
    
    // 해당 키워드가 선택된 상태인지 확인하고 결제 금액 재계산
    if (selectedKeywords.includes(keywordId)) {
      setTimeout(() => calculateTotalPayment(), 0);
    }
  };

  // 키워드 입력 데이터 변경 핸들러
  const handleInputDataChange = (keywordId: number, fieldName: string, value: string) => {
    setKeywords(prev =>
      prev.map(k =>
        k.id === keywordId ? { 
          ...k, 
          inputData: { 
            ...k.inputData || {}, 
            [fieldName]: value 
          } 
        } : k
      )
    );
  };

  // 폼 유효성 검사 함수
  const validateForm = (): boolean => {
    // 키워드 선택 확인만 체크
    if (selectedKeywords.length === 0) {
      showAlert('알림', '키워드를 한 개 이상 선택해주세요.', false);
      return false;
    }
    
    // 추가 입력 필드는 필수값 아님 - 빈 값으로 허용
    return true;
  };

  // 직접 Supabase에 슬롯 데이터 저장하는 함수
  const saveSlotToSupabase = async (slotData: any) => {
    try {
      if (!currentUser?.id) {
        throw new Error('로그인 정보를 찾을 수 없습니다.');
      }

      const now = new Date().toISOString();

      // 1. 선택된 캠페인 단가 확인
      let unitPrice: number = 0;
      if (selectedCampaign) {
        if (typeof selectedCampaign.unit_price === 'string') {
          unitPrice = parseInt(selectedCampaign.unit_price) || 0;
        } else if (typeof selectedCampaign.unit_price === 'number') {
          unitPrice = selectedCampaign.unit_price;
        }
      }

      if (unitPrice <= 0) {
        throw new Error('유효한 캠페인 단가를 찾을 수 없습니다.');
      }

      // 2. 각 키워드에 대한 총 결제 금액 계산
      let totalAmount = 0;
      for (const detail of slotData.keywordDetails) {
        // 개별 키워드 가격 계산 (단가 * 작업타수 * 진행일수)
        const keywordPrice = unitPrice * detail.workCount * detail.dueDays;
        totalAmount += keywordPrice;
      }

      // 부가세 10% 추가
      totalAmount = Math.round(totalAmount * 1.1);

      // 3. 사용자 잔액 확인
      const { data: userBalance, error: balanceError } = await supabase
        .from('user_balances')
        .select('paid_balance, free_balance, total_balance')
        .eq('user_id', currentUser.id)
        .single();

      if (balanceError) {
        throw new Error('사용자 잔액 정보를 가져올 수 없습니다.');
      }

      // 사용자 현재 잔액
      const paidBalance = parseFloat(String(userBalance.paid_balance || 0));
      const freeBalance = parseFloat(String(userBalance.free_balance || 0));
      const totalBalance = parseFloat(String(userBalance.total_balance || (paidBalance + freeBalance)));

      // 잔액 부족 체크
      if (totalBalance < totalAmount) {
        throw new Error(`잔액이 부족합니다. 현재 잔액: ${totalBalance.toLocaleString()}원, 필요 금액: ${totalAmount.toLocaleString()}원`);
      }

      // 4. 사용할 무료/유료 캐시 계산
      let freeBalanceToUse = Math.min(freeBalance, totalAmount);
      let paidBalanceToUse = totalAmount - freeBalanceToUse;

      // 5. 각 키워드에 대한 슬롯 데이터 준비
      const slotEntries = [];

      for (const detail of slotData.keywordDetails) {
        const keyword = keywords.find(k => k.id === detail.id);
        if (!keyword) continue;

        // 개별 키워드 가격 계산 (단가 * 작업타수 * 진행일수)
        const keywordPrice = Math.round(unitPrice * detail.workCount * detail.dueDays * 1.1); // 부가세 포함

        // 키워드 ID에 대한 상세 입력 데이터 가져오기
        const keywordInputData = slotData.input_data[`keyword_${detail.id}`] || {};

        // 슬롯 데이터 구성 - 테이블 구조에 맞게 수정
        const slotEntry = {
          user_id: currentUser.id,
          mat_id: selectedCampaign?.mat_id || currentUser.id, // 총판 ID (없으면 사용자 ID 사용)
          product_id: slotData.campaignId, // 캠페인 ID
          status: 'pending', // 기본 상태는 'pending'
          created_at: now,
          updated_at: now,
          submitted_at: now,
          keyword_id: detail.id, // 키워드 ID
          quantity: detail.workCount, // 작업타수 (quantity 사용)
          // deadline 필드는 DB에서 기본값이 null이므로 저장 항목에서 제외
          input_data: {
            ...keywordInputData,
            mainKeyword: keyword.mainKeyword,
            workCount: detail.workCount,
            dueDays: detail.dueDays,
            keywordId: detail.id,
            price: keywordPrice, // 가격 정보는 input_data에 저장 (부가세 포함)
            url: keyword.url || '',
            mid: keyword.mid || '',
            // 키워드1, 키워드2, 키워드3 값 명시적으로 추가
            keyword1: keyword.keyword1 || '',
            keyword2: keyword.keyword2 || '',
            keyword3: keyword.keyword3 || '',
            campaign_name: selectedCampaign?.campaign_name || '',
            service_type: selectedCampaign?.service_type || '',
            // dueDays 정보는 input_data에만 저장하고 deadline 필드는 사용하지 않음
            expected_deadline: new Date(new Date().getTime() + (detail.dueDays * 24 * 60 * 60 * 1000)).toISOString()
          }
        };

        slotEntries.push(slotEntry);
      }

      // 슬롯 데이터가 없으면 오류 리턴
      if (slotEntries.length === 0) {
        throw new Error('저장할 슬롯 데이터가 없습니다.');
      }

      // 6. 트랜잭션 시작 (Supabase에서는 직접 지원하지 않으므로 순차적으로 진행)
      
      // 7. 사용자 잔액 차감
      const { error: updateBalanceError } = await supabase
        .from('user_balances')
        .update({
          free_balance: Math.max(0, freeBalance - freeBalanceToUse),
          paid_balance: Math.max(0, paidBalance - paidBalanceToUse),
          total_balance: Math.max(0, totalBalance - totalAmount),
          updated_at: now
        })
        .eq('user_id', currentUser.id);

      if (updateBalanceError) {
        throw new Error(`잔액 차감 오류: ${updateBalanceError.message}`);
      }

      // 8. 슬롯 데이터 일괄 저장
      const { data: insertedSlots, error: insertError } = await supabase
        .from('slots')
        .insert(slotEntries)
        .select();

      if (insertError) {
        // 슬롯 저장 실패 시 잔액 롤백 필요
        await supabase
          .from('user_balances')
          .update({
            free_balance: freeBalance,
            paid_balance: paidBalance,
            total_balance: totalBalance,
            updated_at: now
          })
          .eq('user_id', currentUser.id);
          
        throw new Error(`슬롯 등록 오류: ${insertError.message}`);
      }

      // 9. 각 슬롯에 대한 히스토리 로그 생성 및 pending_balances 추가
      if (insertedSlots && insertedSlots.length > 0) {
        // 슬롯 히스토리 로그 항목 생성
        const historyEntries = insertedSlots.map(slot => ({
          slot_id: slot.id,
          user_id: currentUser.id,
          old_status: null, // 최초 생성이므로 이전 상태 없음
          new_status: 'pending',
          action: 'create',
          details: {
            product_id: slot.product_id,
            product_name: selectedCampaign?.campaign_name || '상품',
            keyword_id: slot.keyword_id,
            keyword_name: slot.input_data?.mainKeyword || '키워드',
            workCount: slot.quantity,
            price: slot.input_data?.price || 0
          },
          created_at: now
        }));

        // 히스토리 로그 저장
        const { error: historyError } = await supabase
          .from('slot_history_logs')
          .insert(historyEntries);

        if (historyError) {
          console.error('슬롯 히스토리 로그 저장 오류:', historyError);
          // 히스토리 로그 오류는 중요하지만 사용자 경험을 위해 실패로 처리하지 않음
        }

        // 보류 잔액 항목 생성 - 테이블 구조에 맞게 수정
        const pendingBalanceEntries = insertedSlots.map(slot => {
          // 개별 키워드 가격 계산 (input_data에서 추출)
          const price = slot.input_data?.price || 0;
          
          return {
            slot_id: slot.id,
            user_id: currentUser.id,
            product_id: slot.product_id,
            amount: Math.round(price), // 정수로 변환 (DB 요구사항)
            status: 'pending',
            created_at: now,
            notes: JSON.stringify({
              payment_details: {
                free_balance_used: freeBalanceToUse > 0 ? Math.min(Math.round(freeBalanceToUse), Math.round(price)) : 0,
                paid_balance_used: paidBalanceToUse > 0 ? Math.min(Math.round(paidBalanceToUse), Math.round(price)) : 0,
                total_amount: Math.round(price)
              }
            })
          };
        });

        // 보류 잔액 저장
        const { error: pendingBalanceError } = await supabase
          .from('slot_pending_balances')
          .insert(pendingBalanceEntries);

        if (pendingBalanceError) {
          console.error('슬롯 보류 잔액 저장 오류:', pendingBalanceError);
          // 보류 잔액 오류는 중요하지만 사용자 경험을 위해 실패로 처리하지 않음
        }
      }

      // 10. 캐시 사용 히스토리 기록
      await recordCashHistory(currentUser.id, totalAmount, freeBalanceToUse, paidBalanceToUse, insertedSlots, slotData);

      // 11. 완료된 결과 반환
      return {
        success: true,
        slots: insertedSlots
      };
    } catch (error) {
      console.error('슬롯 저장 중 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      };
    }
  };

  // 캐시 사용 히스토리 기록 헬퍼 함수 - 테이블 구조에 맞게 수정
  const recordCashHistory = async (
    userId: string,
    totalAmount: number,
    freeBalanceUsed: number,
    paidBalanceUsed: number,
    insertedSlots: any[],
    slotData: any
  ) => {
    const now = new Date().toISOString();
    const keywordCount = insertedSlots.length;
    const referenceSlotId = insertedSlots[0]?.id || null;
    const matId = selectedCampaign?.mat_id || null; // 총판 ID
    const campaignName = selectedCampaign?.campaign_name || '키워드 구매';
    
    try {
      // 1. 무료 캐시와 유료 캐시가 모두 사용된 경우 (혼합)
      if (freeBalanceUsed > 0 && paidBalanceUsed > 0) {
        // 무료 캐시 사용 내역
        await supabase
          .from('user_cash_history')
          .insert({
            user_id: userId,
            amount: -Math.round(freeBalanceUsed), // 음수로 표시하여 차감 표시 (integer로 변환)
            transaction_type: 'purchase',
            reference_id: referenceSlotId,
            description: `${campaignName} - ${keywordCount}개 구매(무료 캐시)`,
            transaction_at: now,
            mat_id: matId,
            balance_type: 'free' // 무료 캐시 부분
          });
        
        // 유료 캐시 사용 내역
        await supabase
          .from('user_cash_history')
          .insert({
            user_id: userId,
            amount: -Math.round(paidBalanceUsed), // 음수로 표시하여 차감 표시 (integer로 변환)
            transaction_type: 'purchase',
            reference_id: referenceSlotId,
            description: `${campaignName} - ${keywordCount}개 구매(유료 캐시)`,
            transaction_at: now,
            mat_id: matId,
            balance_type: 'paid' // 유료 캐시 부분
          });
      }
      // 2. 무료 캐시만 사용하거나 유료 캐시만 사용한 경우
      else {
        const balanceType = freeBalanceUsed > 0 ? 'free' : 'paid';
        const usedAmount = freeBalanceUsed > 0 ? freeBalanceUsed : paidBalanceUsed;
        
        await supabase
          .from('user_cash_history')
          .insert({
            user_id: userId,
            amount: -Math.round(usedAmount), // 음수로 표시하여 차감 표시 (integer로 변환)
            transaction_type: 'purchase', // purchase 타입으로 차감
            reference_id: referenceSlotId,
            description: `${campaignName} - ${keywordCount}개 구매(${balanceType === 'free' ? '무료' : '유료'} 캐시)`,
            transaction_at: now,
            mat_id: matId,
            balance_type: balanceType
          });
      }
    } catch (error) {
      console.error('캐시 사용 히스토리 기록 오류:', error);
      // 히스토리 오류는 중요하지만 사용자 경험을 위해 실패로 처리하지 않음
    }
  };
  
  // 알림 생성 함수
  const createNotification = async (
    userId: string,
    title: string,
    message: string,
    link: string,
    referenceId: string | null
  ) => {
    try {
      const now = new Date().toISOString();
      
      // notifications 테이블에 알림 생성
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'slot_created', // 슬롯 생성 타입
          title: title,
          message: message,
          link: link,
          reference_id: referenceId,
          status: 'unread', // 기본 상태는 읽지 않음
          created_at: now,
          priority: 'medium' // 우선순위 추가
        });
    } catch (error) {
      console.error('알림 생성 오류:', error);
      // 알림 생성 실패는 전체 프로세스 실패로 처리하지 않음
    }
  };

  // 저장 버튼 핸들러
  const handleSave = async () => {
    // 이미 저장 중이면 중복 실행 방지
    if (saving) return;

    // 폼 유효성 검사
    if (!validateForm()) return;

    try {
      setSaving(true);

      // 선택한 캠페인이 없으면 오류 처리
      if (!selectedCampaignId) {
        showAlert('오류', '캠페인을 선택해주세요.', false);
        return;
      }

      // 선택된 키워드가 없으면 오류 처리
      if (selectedKeywords.length === 0) {
        showAlert('오류', '하나 이상의 키워드를 선택해주세요.', false);
        return;
      }

      // 선택된 키워드 상세 정보 수집 - dueDays 필드 사용
      const keywordDetails: KeywordDetail[] = selectedKeywords.map(keywordId => {
        const keyword = keywords.find(k => k.id === keywordId);
        if (!keyword) return null;

        // 최소 작업타수 확인
        let minQuantity = 1;
        if (selectedCampaign) {
          if (typeof selectedCampaign.min_quantity === 'string') {
            minQuantity = parseInt(selectedCampaign.min_quantity) || 1;
          } else if (typeof selectedCampaign.min_quantity === 'number') {
            minQuantity = selectedCampaign.min_quantity;
          }
        }

        // 작업타수가 최소값보다 작으면 최소값 사용
        const workCount = keyword.workCount === null || keyword.workCount === undefined || keyword.workCount < minQuantity
          ? minQuantity
          : keyword.workCount;

        // 상세 정보 반환 - dueDays 필드 사용 (dueDate 대신)
        return {
          id: keyword.id,
          mainKeyword: keyword.mainKeyword,
          workCount,
          dueDays: keyword.dueDays || 1, // dueDays 필드 사용, 없으면 기본값 1
          inputData: keyword.inputData || {} // 각 키워드의 입력 데이터 포함
        };
      }).filter(Boolean) as KeywordDetail[]; // null 값 필터링

      // 각 키워드의 inputData를 slots.input_data에 올바르게 저장하기 위한 처리
      const input_data: Record<string, any> = {};
      
      // 각 키워드에 대한 처리
      keywordDetails.forEach(detail => {
        // 키워드 ID를 문자열로 변환하여 키로 사용
        const keywordId = `keyword_${detail.id}`;
        
        // 원본 키워드 데이터 찾기
        const keyword = keywords.find(k => k.id === detail.id);
        
        // 모든 키워드에 대해 항상 inputData 객체 생성 (빈 객체라도)
        input_data[keywordId] = { 
          ...detail.inputData || {},
          // 키워드의 keyword1, keyword2, keyword3 값 추가
          keyword1: keyword?.keyword1 || '',
          keyword2: keyword?.keyword2 || '',
          keyword3: keyword?.keyword3 || ''
        };
        
        // 추가 필드가 있는 경우, 입력되지 않은 필드에 대해 빈 문자열 추가
        if (selectedCampaign) {
          const additionalFields = getAdditionalFields(selectedCampaign);
          additionalFields.forEach(field => {
            if (!input_data[keywordId][field.fieldName]) {
              input_data[keywordId][field.fieldName] = '';
            }
          });
        }
      });
      
      // 공통 정보도 저장
      input_data.keyword_details = keywordDetails;
      input_data.campaign_id = selectedCampaignId;
      input_data.campaign_name = selectedCampaign?.campaign_name || '';
      input_data.service_type = selectedCampaign?.service_type || '';

      // 캠페인 슬롯 데이터 구성
      const campaignSlotData: CampaignSlotData = {
        ...slotData,
        campaignId: selectedCampaignId,
        selectedKeywords,
        keywordDetails,
        input_data // 키워드 ID별로 구조화된 input_data
      };

      // Supabase에 직접 슬롯 데이터 저장
      const result = await saveSlotToSupabase(campaignSlotData);

      if (!result.success) {
        throw new Error(result.error || '슬롯 저장 중 오류가 발생했습니다.');
      }

      // 알림 생성 (notifications 테이블에 저장)
      if (result.slots && result.slots.length > 0) {
        // 사용자에게 구매 완료 알림 전송
        await createNotification(
          currentUser?.id || '',
          '키워드 구매 신청 완료',
          `${selectedCampaign?.campaign_name || ''} - ${result.slots.length}개의 키워드 구매 신청이 완료되었습니다.`,
          '/myinfo/services',
          result.slots[0].id
        );
      }

      // 상위 컴포넌트에 데이터 전달 (기존 동작 유지)
      if (onSave) {
        onSave(campaignSlotData);
      }

      // 성공 알림 표시 - 메시지 변경
      showAlert('구매 신청 완료', `${selectedCampaign?.campaign_name || '키워드'} 구매 신청이 성공적으로 완료되었습니다.`, true);
      
      // 모달 닫기
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('키워드 구매 신청 중 오류:', error);
      showAlert('구매 신청 실패', (error instanceof Error ? error.message : '키워드 구매 신청 중 오류가 발생했습니다. 다시 시도해주세요.'), false);
    } finally {
      setSaving(false);
    }
  };

  // 현재 선택된 캠페인 찾기
  const selectedCampaign = campaigns.find(camp => camp.id === selectedCampaignId) || null;

  if (!open || !category) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[95vw] max-w-full sm:max-w-[1000px] md:max-w-[1200px] p-0 overflow-hidden flex flex-col max-h-[95vh]" aria-describedby={undefined}>
          <DialogHeader className="bg-background py-4 px-6 border-b sticky top-0 z-10 shadow-sm flex-shrink-0">
            <DialogTitle className="text-lg font-semibold text-foreground">
              {typeof serviceCode === 'string'
                ? '캠페인 슬롯 관리' // 문자열이면 기본 타이틀 표시
                : SERVICE_TYPE_LABELS[serviceCode] + ' 슬롯 관리' // enum 값 사용
              }
            </DialogTitle>
            <DialogHeaderSpacer />
            <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-full text-xs md:text-sm border border-blue-100 dark:border-blue-900 shadow-sm">
              <span className="font-semibold text-gray-600 dark:text-gray-300">캐시 잔액:</span>
              <span className="ml-1 font-extrabold text-primary dark:text-primary-foreground">{userCashBalance.toLocaleString()}원</span>
            </div>
          </DialogHeader>
          <div className="p-6 bg-background flex-grow overflow-auto">
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
                        onChange={(e) => {
                          const campId = Number(e.target.value);
                          setSelectedCampaignId(campId);
                          // 캠페인 변경 시 슬롯 데이터 업데이트
                          setSlotData(prev => ({
                            ...prev,
                            campaignId: campId
                          }));
                          // 배너 정보 가져오기
                          const selected = campaigns.find(c => c.id === campId);
                          if (selected) {
                            fetchCampaignBanner(selected);
                          }
                        }}
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
                    {selectedCampaign ? (
                      <div className="flex gap-4">
                        <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] shrink-0 rounded-md overflow-hidden flex items-center justify-center bg-gray-50">
                          {/* 동물 아이콘 사용 */}
                          {selectedCampaign.campaign_name && (
                            <img
                              src={bannerUrl ? toAbsoluteUrl(bannerUrl) : toAbsoluteUrl('/media/animal/svg/lion.svg')}
                              alt="캠페인 로고"
                              className="size-[60px] sm:size-[70px] object-contain"
                              onError={(e) => {
                                // 로고 로드 실패 시 기본 동물 아이콘으로 대체
                                // 캠페인 이름에서 동물 이름 추출 시도
                                const name = selectedCampaign.campaign_name.toLowerCase();
                                let animalIcon = 'lion';

                                const animals = [
                                  'bear', 'cat', 'cow', 'dog', 'dolphin', 'elephant', 'flamingo',
                                  'giraffe', 'horse', 'kangaroo', 'koala', 'lion', 'owl', 'penguin'
                                ];

                                for (const animal of animals) {
                                  if (name.includes(animal)) {
                                    animalIcon = animal;
                                    break;
                                  }
                                }

                                // 한글 동물 이름 체크
                                if (name.includes('곰')) animalIcon = 'bear';
                                if (name.includes('고양이')) animalIcon = 'cat';
                                if (name.includes('소')) animalIcon = 'cow';
                                if (name.includes('개')) animalIcon = 'dog';
                                if (name.includes('돌고래')) animalIcon = 'dolphin';
                                if (name.includes('코끼리')) animalIcon = 'elephant';
                                if (name.includes('플라밍고')) animalIcon = 'flamingo';
                                if (name.includes('기린')) animalIcon = 'giraffe';
                                if (name.includes('말')) animalIcon = 'horse';
                                if (name.includes('캥거루')) animalIcon = 'kangaroo';
                                if (name.includes('코알라')) animalIcon = 'koala';
                                if (name.includes('사자')) animalIcon = 'lion';
                                if (name.includes('올빼미')) animalIcon = 'owl';
                                if (name.includes('펭귄')) animalIcon = 'penguin';

                                (e.target as HTMLImageElement).src = toAbsoluteUrl(`/media/animal/svg/${animalIcon}.svg`);
                              }}
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-bold text-foreground truncate">
                              {selectedCampaign.campaign_name}
                            </h2>
                            <span className={`badge badge-${getStatusColor(selectedCampaign.status)} badge-outline rounded-[30px] h-auto py-1`}>
                              <span className={`size-1.5 rounded-full bg-${getStatusColor(selectedCampaign.status)} me-1.5`}></span>
                              {getStatusLabel(selectedCampaign.status)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <div className="flex items-center gap-1.5 text-sm">
                              <KeenIcon icon="wallet" className="text-primary size-4" />
                              <span className="text-muted-foreground">단가:</span>
                              <span className="font-bold text-primary">
                                {selectedCampaign.unit_price ? `${selectedCampaign.unit_price}원` : '1,000원'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-sm">
                              <KeenIcon icon="timer" className="text-blue-500 size-4" />
                              <span className="text-muted-foreground">마감:</span>
                              <span className="font-bold">{selectedCampaign.deadline}</span>
                            </div>
                          </div>

                          <div className="text-sm">
                            <div className="bg-blue-50/50 p-2 rounded border border-blue-100/50 text-gray-700 line-clamp-2">
                              {selectedCampaign.description || '설명이 없습니다.'}
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
                            <Link to="/keyword" className="text-primary hover:underline">
                              키워드 관리 페이지에서 키워드를 추가해주세요.
                            </Link>
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
                                <th className="w-[5%] px-1 sm:px-2 py-2 sm:py-3 text-[10px] sm:text-sm font-medium border border-blue-500/50 rounded-tl-md">
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
                                                dueDays: k.dueDays || 1
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
                                <th className="w-[25%] sm:w-[26%] px-1 py-2 md:px-3 md:py-3 text-[9px] md:text-xs font-semibold border border-blue-500/50 uppercase tracking-wider antialiased">키워드</th>
                                <th className="w-[25%] px-1 py-2 md:px-3 md:py-3 text-[9px] md:text-xs font-semibold border border-blue-500/50 uppercase tracking-wider antialiased">정보</th>
                                <th className="w-[8%] px-1 py-2 md:px-3 md:py-3 text-[9px] md:text-xs font-semibold border border-blue-500/50 uppercase tracking-wider antialiased">타수</th>
                                <th className="w-[8%] px-1 py-2 md:px-3 md:py-3 text-[9px] md:text-xs font-semibold border border-blue-500/50 uppercase tracking-wider antialiased">작업일</th>
                                {selectedCampaign && getAdditionalFields(selectedCampaign).map((field, index) => (
                                  <th
                                    key={index}
                                    className={`px-1 py-2 md:px-3 md:py-3 text-[9px] md:text-xs font-semibold border border-blue-500/50 uppercase tracking-wider antialiased relative group ${
                                      index === getAdditionalFields(selectedCampaign).length - 1 ? 'rounded-tr-md' : ''
                                    }`}
                                    style={{ width: `${35 / Math.max(1, getAdditionalFields(selectedCampaign).length)}%` }}
                                  >
                                    <div className="flex items-center justify-center">
                                      <span>{field.fieldName}</span>
                                      {field.description && (
                                        <span className="ml-1 inline-flex items-center justify-center">
                                          <KeenIcon icon="information" className="size-3 text-blue-300" />
                                          <div className="hidden group-hover:block absolute top-full left-1/2 transform -translate-x-1/2 z-50 mt-1 px-2 py-1 text-xs text-white bg-gray-800 rounded-md shadow-lg whitespace-nowrap">
                                            {field.description}
                                          </div>
                                        </span>
                                      )}
                                    </div>
                                  </th>
                                ))}
                                {/* 마지막 컬럼의 오른쪽 모서리를 둥글게 하기 위한 클래스 적용 */}
                                {(!selectedCampaign || getAdditionalFields(selectedCampaign).length === 0) && (
                                  <th className="px-0 py-0 w-0 border-none rounded-tr-md">
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {keywords.map(keyword => {
                                return (
                                  <tr
                                    key={keyword.id}
                                    className={`transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/70 ${
                                      selectedKeywords.includes(keyword.id)
                                        ? 'bg-blue-50 dark:bg-blue-900/80 shadow-sm'
                                        : 'bg-white dark:bg-slate-800'
                                    }`}
                                  >
                                    <td className="w-[5%] px-1 sm:px-2 py-2 sm:py-3 border border-gray-200 align-middle text-center">
                                      <div className="flex justify-center">
                                        <input
                                          type="checkbox"
                                          checked={selectedKeywords.includes(keyword.id)}
                                          onChange={() => handleKeywordToggle(keyword.id)}
                                          className="size-3 sm:size-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                      </div>
                                    </td>
                                    <td className="w-[25%] sm:w-[26%] px-1 sm:px-2 py-1 sm:py-2 md:px-3 md:py-3 border border-gray-200 group" onClick={() => handleKeywordToggle(keyword.id)}>
                                      <div className="cursor-pointer transition-all">
                                        <p className="font-semibold text-xs sm:text-sm text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 line-clamp-1 antialiased">{keyword.mainKeyword}</p>
                                        <div className="flex flex-wrap gap-1 mt-1.5 text-xs">
                                          {keyword.keyword1 && <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-xs transition-colors group-hover:bg-indigo-100 dark:group-hover:bg-indigo-800/40 font-medium antialiased">{keyword.keyword1}</span>}
                                          {keyword.keyword2 && <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-xs transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-800/40 font-medium antialiased">{keyword.keyword2}</span>}
                                          {keyword.keyword3 && <span className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-xs transition-colors group-hover:bg-amber-100 dark:group-hover:bg-amber-800/40 font-medium antialiased">{keyword.keyword3}</span>}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="w-[25%] px-1 sm:px-2 py-1 sm:py-2 md:px-3 md:py-3 border border-gray-200 align-middle">
                                      <div className="text-xs">
                                        {keyword.mid && <p className="text-gray-600 mb-1 flex items-center gap-1 font-medium"><span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs font-semibold">MID</span> {keyword.mid}</p>}
                                        {keyword.url && <p className="text-blue-600 truncate max-w-[300px] hover:text-blue-700 font-medium">{keyword.url}</p>}
                                      </div>
                                    </td>
                                    <td className="w-[8%] px-1 sm:px-2 py-1 sm:py-2 md:px-3 md:py-3 border border-gray-200 align-middle">
                                      <input
                                        type="text"
                                        placeholder="타수"
                                        value={keyword.workCount === null || keyword.workCount === undefined ? '' : keyword.workCount}
                                        onChange={(e) => {
                                          const inputValue = e.target.value;
                                          if (inputValue === '') {
                                            // 빈 문자열은 임시로 null 처리
                                            handleWorkCountChange(keyword.id, null);
                                            return;
                                          }
                                          
                                          // 숫자만 입력 허용
                                          if (/^\d+$/.test(inputValue)) {
                                            const numValue = parseInt(inputValue);
                                            handleWorkCountChange(keyword.id, numValue);
                                          }
                                        }}
                                        onBlur={() => handleWorkCountBlur(keyword.id)}
                                        className="w-full min-w-[30px] sm:min-w-[40px] px-1 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white font-medium"
                                        onClick={e => e.stopPropagation()}
                                      />
                                    </td>
                                    <td className="w-[8%] px-1 sm:px-2 py-1 sm:py-2 md:px-3 md:py-3 border border-gray-200 align-middle">
                                      <input
                                        type="text"
                                        placeholder="작업일"
                                        value={keyword.dueDays === null ? '' : keyword.dueDays}
                                        onChange={(e) => {
                                          // 빈 문자열이거나 숫자가 아니면 null로 처리
                                          const inputValue = e.target.value;
                                          if (inputValue === '') {
                                            // 빈 문자열을 허용하고 임시로 null 처리
                                            setKeywords(prev =>
                                              prev.map(k =>
                                                k.id === keyword.id ? { ...k, dueDays: null } : k
                                              )
                                            );
                                            return;
                                          }
                                          
                                          // 숫자만 입력 허용
                                          if (/^\d+$/.test(inputValue)) {
                                            const numValue = parseInt(inputValue);
                                            handleDueDaysChange(keyword.id, numValue);
                                          }
                                        }}
                                        onBlur={(e) => {
                                          // 포커스를 잃을 때 빈 값이면 기본값 1로 설정
                                          if (e.target.value === '' || keyword.dueDays === null) {
                                            handleDueDaysChange(keyword.id, 1);
                                          }
                                          
                                          // 해당 키워드가 선택된 상태인 경우 금액 재계산
                                          if (selectedKeywords.includes(keyword.id)) {
                                            setTimeout(() => calculateTotalPayment(), 0);
                                          }
                                        }}
                                        className="w-full px-0 sm:px-2 py-0.5 sm:py-1.5 text-[9px] sm:text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white font-medium"
                                        style={{ minWidth: '40px' }}
                                        onClick={e => e.stopPropagation()}
                                      />
                                    </td>
                                    {/* 각 추가 필드를 별도의 td로 분리 */}
                                    {selectedCampaign && getAdditionalFields(selectedCampaign).map((field, index) => (
                                      <td 
                                        key={index} 
                                        className="px-1 sm:px-2 py-1 sm:py-2 md:px-3 md:py-3 border border-gray-200 align-middle relative group"
                                        style={{ width: `${35 / Math.max(1, getAdditionalFields(selectedCampaign).length)}%` }}
                                      >
                                        {selectedKeywords.includes(keyword.id) ? (
                                          <div className="relative">
                                            <input
                                              type="text"
                                              placeholder={`${field.fieldName} 입력`}
                                              value={keyword.inputData?.[field.fieldName] || ''}
                                              onChange={(e) => handleInputDataChange(keyword.id, field.fieldName, e.target.value)}
                                              className="w-full px-1.5 py-1 text-[9px] sm:text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-slate-800"
                                              onClick={e => e.stopPropagation()}
                                            />
                                            {field.description && (
                                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-help">
                                                <KeenIcon icon="information" className="size-3 text-blue-400" />
                                                <div className="hidden group-hover:block absolute bottom-full right-0 z-50 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded-md shadow-lg whitespace-nowrap max-w-xs">
                                                  {field.description}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="text-[9px] sm:text-xs text-gray-400 italic">
                                            선택 후 입력
                                          </div>
                                        )}
                                      </td>
                                    ))}
                                    {/* 추가 필드가 없을 경우 빈 셀 (너비 0) */}
                                    {(!selectedCampaign || getAdditionalFields(selectedCampaign).length === 0) && (
                                      <td className="w-0 p-0 border-none">
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                              {keywords.length === 0 && (
                                <tr>
                                  <td 
                                    colSpan={selectedCampaign && getAdditionalFields(selectedCampaign).length > 0 
                                      ? 5 + getAdditionalFields(selectedCampaign).length 
                                      : 5} 
                                    className="px-3 py-8 text-center text-gray-600 border border-gray-200 font-bold"
                                  >
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
          </div>
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-3 flex-shrink-0 bg-background sticky bottom-0 z-10 shadow-sm">
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
              onClick={handleSave}
              type="button"
              className="px-4 sm:px-6 md:px-8 bg-primary hover:bg-primary/90 text-white transition-all duration-300 h-9 sm:h-10 rounded-md shadow-sm w-full sm:w-auto"
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
          </div>
        </DialogContent>
      </Dialog>

      {/* 알림 다이얼로그 */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent className="w-[95vw] max-w-full sm:max-w-[500px] p-0 overflow-hidden" aria-describedby={undefined}>
          <DialogHeader className={`py-4 px-6 border-b sticky top-0 z-10 shadow-sm ${isSuccess ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
            <DialogTitle className="text-lg font-semibold text-foreground">
              <div className="flex items-center gap-2">
                {isSuccess ? (
                  <KeenIcon icon="Check" className="size-5 text-green-600 dark:text-green-400" />
                ) : (
                  <KeenIcon icon="Information" className="size-5 text-red-600 dark:text-red-400" />
                )}
                <span className={isSuccess ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}>{alertTitle}</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 bg-background">
            <p className="text-foreground mb-6 whitespace-pre-line">{alertDescription}</p>
            <div className="flex justify-end">
              <Button
                onClick={() => setAlertDialogOpen(false)}
                className={isSuccess ? "bg-green-600 hover:bg-green-700 text-white" : "bg-primary hover:bg-primary/90 text-white"}
              >
                확인
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { CampaignSlotWithKeywordModal };