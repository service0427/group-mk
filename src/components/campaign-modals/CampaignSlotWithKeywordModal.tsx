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
import { getStatusLabel, getStatusColor, CampaignServiceType, SERVICE_TYPE_LABELS, FieldType } from './types';
import { getStatusColorClass } from '@/utils/CampaignFormat';
import { resolveServiceType } from '@/utils/serviceTypeResolver';
import { useKeywordFieldConfig } from '@/pages/keyword/hooks/useKeywordFieldConfig';
import { GuaranteeQuoteRequestModal } from './GuaranteeQuoteRequestModal';

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
  workCount?: number | null; // 작업수
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
  // 추가: 키워드 상세 정보 (작업수, 마감일수, 추가 입력 데이터 등)
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
  banner_image?: string;
  status: string;
  service_type: string;
  efficiency?: string | number;
  min_quantity?: string | number;
  max_quantity?: string | number;
  deadline?: string;
  unit_price?: string | number;
  detailed_description?: string;
  additional_logic?: string | number;
  user_input_fields?: string;
  rejection_reason?: string;
  mat_id?: string; // 총판의 UUID
  user_id?: string; // 관리자/총판 ID
  // 보장형 관련 필드 추가
  slot_type?: 'standard' | 'guarantee';
  guarantee_count?: number;
  guarantee_unit?: string;
  min_guarantee_price?: number;
  max_guarantee_price?: number;
  target_rank?: number;
  is_guarantee?: boolean;
  is_negotiable?: boolean;
  add_info?: {
    logo_url?: string;
    banner_url?: string;
    add_field?: Array<{ fieldName: string; description: string; isRequired?: boolean }>; // 추가 입력 필드 목록
    [key: string]: any;
  } | string; // 배너 URL 등의 추가 정보
}

const CampaignSlotWithKeywordModal: React.FC<CampaignSlotWithKeywordModalProps> = ({
  open,
  onClose,
  category,
  campaign,
  onSave,
  serviceCode = CampaignServiceType.NAVER_SHOPPING_RANK, // 기본값 설정
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

  // 보장형 견적 요청 모달 상태
  const [quoteRequestModalOpen, setQuoteRequestModalOpen] = useState(false);

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
  // 컴팩트 모드 상태 (화면 높이 1050px 이하)
  const [isCompactMode, setIsCompactMode] = useState(false);

  // 키워드 관련 상태
  const [keywordGroups, setKeywordGroups] = useState<KeywordGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<number[]>([]);
  const [keywordLoading, setKeywordLoading] = useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [keywordSearchMode, setKeywordSearchMode] = useState<boolean>(false); // 키워드 검색 모드

  // 비동기 작업 오류 상태
  const [keywordError, setKeywordError] = useState<string | null>(null);

  // 선택된 서비스 코드 상태
  const [selectedServiceCode, setSelectedServiceCode] = useState<CampaignServiceType | string>(serviceCode);

  // 선택된 키워드 그룹
  const selectedGroup = useMemo(() => {
    return keywordGroups.find(group => group.id === selectedGroupId) || null;
  }, [keywordGroups, selectedGroupId]);

  // 키워드 필드 설정 훅 사용
  const { getFieldConfig, isHidden } = useKeywordFieldConfig(selectedGroup?.campaignType);

  // 필드별 라벨 가져오기
  const getFieldLabel = (fieldName: string, defaultLabel: string) => {
    const config = getFieldConfig(fieldName);
    return config?.label || defaultLabel;
  };

  // 모달이 열릴 때 서비스 코드 초기화
  useEffect(() => {
    if (open) {
      setSelectedServiceCode(serviceCode);
    }
  }, [open, serviceCode]);

  // 뷰포트 크기 감지하여 컴팩트 모드 설정
  useEffect(() => {
    const checkViewportSize = () => {
      // 모바일 기기 감지
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // 모바일은 무조건 컴팩트 모드, PC는 높이 1050px 이하에서만 컴팩트 모드
      if (isMobile) {
        setIsCompactMode(true);
      } else {
        setIsCompactMode(window.innerHeight <= 1050);
      }
    };

    checkViewportSize();
    window.addEventListener('resize', checkViewportSize);
    return () => window.removeEventListener('resize', checkViewportSize);
  }, []);

  // 서비스 변경 처리 함수
  const handleServiceChange = async (newServiceCode: string) => {
    setSelectedServiceCode(newServiceCode);

    // 캠페인 선택 초기화
    setSelectedCampaignId(null);
    setCampaigns([]);
    setBannerUrl(null);

    // 키워드 그룹 및 선택 초기화
    setKeywordGroups([]);
    setSelectedGroupId(null);
    setKeywords([]);
    setSelectedKeywords([]);

    // 새로운 서비스에 맞는 캠페인 목록 불러오기
    try {
      setLoading(true);

      // DB 쿼리를 위한 서비스 타입 변환
      const dbServiceType = newServiceCode;

      // Supabase 쿼리 준비
      let query = supabase
        .from('campaigns')
        .select('*, mat_id, add_info')
        .eq('service_type', dbServiceType)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('캠페인 불러오기 실패:', error);
        setCampaigns([]);
        return;
      }

      if (data && data.length > 0) {
        const transformedCampaigns = data.map(campaign => ({
          id: campaign.id,
          campaign_name: campaign.campaign_name,
          description: campaign.description,
          efficiency: campaign.efficiency,
          min_quantity: campaign.min_quantity,
          max_quantity: campaign.max_quantity,
          deadline: campaign.deadline,
          status: campaign.status,
          unit_price: campaign.unit_price,
          detailed_description: campaign.detailed_description,
          additional_logic: campaign.additional_logic,
          user_input_fields: campaign.user_input_fields,
          rejection_reason: campaign.rejection_reason,
          logo: campaign.logo,
          banner_image: campaign.banner_image,
          service_type: campaign.service_type,
          mat_id: campaign.mat_id,
          add_info: campaign.add_info,
          created_at: campaign.created_at
        }));

        setCampaigns(transformedCampaigns);

        // 첫 번째 캠페인 자동 선택
        const firstCampaign = transformedCampaigns[0];
        setSelectedCampaignId(firstCampaign.id);

        // 캠페인 배너 이미지 가져오기 - fetchCampaignBanner 함수 사용
        fetchCampaignBanner(firstCampaign);
      } else {
        // 캠페인이 없는 경우 처리
        setCampaigns([]);
        setSelectedCampaignId(null);
        setBannerUrl(null);
      }
    } catch (error) {
      console.error('캠페인 불러오기 중 오류:', error);
      setCampaigns([]);
      setSelectedCampaignId(null);
      setBannerUrl(null);
    } finally {
      setLoading(false);
    }
  };

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

      if (location.pathname.includes('naver-shopping-rank')) {
        return CampaignServiceType.NAVER_SHOPPING_RANK;
      }

      if (location.pathname.includes('naver-place-rank')) {
        return CampaignServiceType.NAVER_PLACE_RANK;
      }

      return resolveServiceType({
        campaign,
        serviceCode,
        pathname: location.pathname,
        category
      });
    } catch (e) {
      // 오류 발생 시 기본값 사용
      return CampaignServiceType.NAVER_SHOPPING_RANK;
    }
  }, [campaign, serviceCode, location.pathname, category]);

  // 모달이 열릴 때만 한 번 데이터 로드 (모든 데이터를 한 번에 로드)
  useEffect(() => {
    if (open) {
      // campaign prop에서 초기 키워드 데이터 추출
      if (campaign?.initialKeywordData) {
        const initialData = campaign.initialKeywordData;

        // slotData 초기화
        setSlotData({
          productName: initialData.productName || '',
          mid: initialData.mid || '',
          url: initialData.url || '',
          keyword1: initialData.keyword1 || '',
          keyword2: initialData.keyword2 || '',
          keyword3: initialData.keyword3 || '',
          selectedKeywords: initialData.selectedKeywords || [],
          keywordDetails: initialData.keywordDetails || []
        });

        // 선택된 키워드 설정
        if (initialData.selectedKeywords && initialData.selectedKeywords.length > 0) {
          setSelectedKeywords(initialData.selectedKeywords);
          setKeywordSearchMode(true); // 키워드 모드로 설정
        }
      }

      fetchCampaigns(); // 캠페인 목록 조회
      fetchKeywordGroups(); // 키워드 그룹 조회
      fetchUserBalance(); // 사용자 잔액 가져오기

      // 선택된 그룹 ID 설정은 그룹 목록이 로드된 후에 처리됨 (fetchKeywordGroups 내부에서)
    }
  }, [open, finalServiceCode]); // finalServiceCode가 변경될 때만 다시 로드

  // 선택된 캠페인이 변경될 때 로고 업데이트 및 키워드 그룹 다시 불러오기
  useEffect(() => {
    if (selectedCampaignId && campaigns.length > 0) {
      const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
      if (selectedCampaign) {
        fetchCampaignBanner(selectedCampaign);
        // 캠페인이 변경되면 해당 서비스 타입의 키워드 그룹만 다시 불러오기
        fetchKeywordGroups();
      }
    }
  }, [selectedCampaignId, campaigns]);

  // 초기 키워드 데이터가 설정되고 캠페인이 선택되었을 때 금액 계산
  useEffect(() => {
    if (campaign?.initialKeywordData && selectedCampaignId && campaigns.length > 0 && keywords.length > 0) {
      // 캠페인 정보와 키워드 정보가 모두 준비되었을 때 금액 계산
      const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
      if (selectedCampaign && campaign.initialKeywordData.selectedKeywords?.length > 0) {
        // 키워드가 keywords 배열에 있는지 확인
        const keywordExists = keywords.find(k => k.id === campaign.initialKeywordData.selectedKeywords[0]);
        if (keywordExists) {
          // 키워드 정보 설정 후 금액 계산
          setTimeout(() => {
            calculateTotalPayment(campaign.initialKeywordData.selectedKeywords);
          }, 100);
        }
      }
    }
  }, [campaign?.initialKeywordData, selectedCampaignId, campaigns, keywords]);

  // 그룹이 선택되었을 때 키워드 로드
  useEffect(() => {
    if (selectedGroupId && campaign?.selectedGroupId === selectedGroupId) {
      fetchKeywords(selectedGroupId);
    }
  }, [selectedGroupId]);

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
            let rawLogoUrl = addInfo.logo_url || addInfo.banner_url || null;

            // 경로 수정 로직 적용
            if (rawLogoUrl) {
              if (rawLogoUrl.startsWith('animal/')) {
                logoUrl = `/media/${rawLogoUrl}`;
              } else if (!rawLogoUrl.startsWith('/') && !rawLogoUrl.startsWith('http')) {
                logoUrl = `/${rawLogoUrl}`;
              } else {
                logoUrl = rawLogoUrl;
              }
            }
          } catch (e) {
            // JSON 파싱 오류 무시
          }
        } else {
          // 로고 URL을 우선으로, 없으면 배너 URL 사용
          let rawLogoUrl = campaign.add_info.logo_url || campaign.add_info.banner_url || null;

          // 경로 수정 로직 적용
          if (rawLogoUrl) {
            if (rawLogoUrl.startsWith('animal/')) {
              logoUrl = `/media/${rawLogoUrl}`;
            } else if (!rawLogoUrl.startsWith('/') && !rawLogoUrl.startsWith('http')) {
              logoUrl = `/${rawLogoUrl}`;
            } else {
              logoUrl = rawLogoUrl;
            }
          }
        }
      }

      // 로고 URL이 없으면 campaign.logo 필드 확인
      if (!logoUrl && campaign.logo) {
        // 이미 경로가 포함된 경우 올바른 절대 경로로 수정
        if (campaign.logo.startsWith('animal/')) {
          logoUrl = `/media/${campaign.logo}`;
        } else if (!campaign.logo.startsWith('/') && !campaign.logo.startsWith('http')) {
          logoUrl = `/${campaign.logo}`;
        } else {
          logoUrl = campaign.logo;
        }
      }

      // banner_image 필드도 확인
      if (!logoUrl && campaign.banner_image) {
        // banner_image도 동일한 경로 수정 로직 적용
        if (campaign.banner_image.startsWith('animal/')) {
          logoUrl = `/media/${campaign.banner_image}`;
        } else if (!campaign.banner_image.startsWith('/') && !campaign.banner_image.startsWith('http')) {
          logoUrl = `/${campaign.banner_image}`;
        } else {
          logoUrl = campaign.banner_image;
        }
      }

      setBannerUrl(logoUrl);
    } catch (err) {
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

      // 선택된 캠페인의 service_type 가져오기
      const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
      const campaignServiceType = selectedCampaign?.service_type;

      let query = supabase
        .from('keyword_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      // 캠페인의 service_type이 있으면 campaign_type으로 필터링
      if (campaignServiceType) {
        query = query.eq('campaign_type', campaignServiceType);
      }

      const { data, error } = await query;

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

      // campaign prop에서 selectedGroupId가 전달되었으면 해당 그룹 선택
      if (campaign?.selectedGroupId) {
        // 전달받은 그룹이 목록에 있는지 확인
        const targetGroup = transformedData.find(g => g.id === campaign.selectedGroupId);
        if (targetGroup) {
          setSelectedGroupId(campaign.selectedGroupId);
        } else if (transformedData.length > 0) {
          // 해당 그룹이 없으면 첫 번째 그룹 선택
          const defaultGroup = transformedData.find(g => g.isDefault);
          setSelectedGroupId(defaultGroup?.id || transformedData[0].id);
        }
      } else if (transformedData.length > 0 && !selectedGroupId) {
        // selectedGroupId가 없을 때만 첫 번째 그룹 선택
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
      // 진행중인 슬롯만 확인 (pending, submitted, approved 상태)
      const { data: slotData, error: slotError } = await supabase
        .from('slots')
        .select('keyword_id, input_data, status')
        .eq('user_id', currentUser.id)
        .eq('product_id', campaignId)
        .in('status', ['pending', 'submitted', 'approved']) // 진행중인 슬롯만
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

        // 키워드 목록에 기본 작업수 설정 및 기본 마감일수 설정
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

      // campaign의 initialKeywordData가 있으면 해당 키워드의 작업타수와 마감일수 설정
      if (campaign?.initialKeywordData && campaign.initialKeywordData.selectedKeywords?.length > 0) {
        const initialKeywordId = campaign.initialKeywordData.selectedKeywords[0];
        const keywordInList = transformedData.find(k => k.id === initialKeywordId);

        if (keywordInList) {
          // 선택된 캠페인의 최소 수량 가져오기
          const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
          let minQty = 1;
          if (selectedCampaign && selectedCampaign.min_quantity) {
            if (typeof selectedCampaign.min_quantity === 'string') {
              minQty = parseInt(selectedCampaign.min_quantity) || 1;
            } else {
              minQty = selectedCampaign.min_quantity;
            }
          }

          // 해당 키워드의 작업타수와 마감일수 설정
          setKeywords(prev => prev.map(k =>
            k.id === initialKeywordId
              ? {
                ...k,
                workCount: campaign.initialKeywordData.keywordDetails?.[0]?.workCount || minQty,
                dueDays: campaign.initialKeywordData.keywordDetails?.[0]?.dueDays || 1
              }
              : k
          ));
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

    // 선택 시 선택된 캠페인의 min_quantity를 작업수로 자동 설정
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
        // 작업수가 null, undefined, 0, 음수인 경우 최소값을 구해서 적용
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

  // 작업수 변경 핸들러 (입력 중)
  const handleWorkCountChange = (keywordId: number, value: number | null) => {
    // 입력 중에는 임시로 어떤 값이든 허용하고, 결제 금액 계산은 하지 않음
    setKeywords(prev => {
      const newKeywords = prev.map(k =>
        k.id === keywordId ? { ...k, workCount: value } : k
      );
      return newKeywords;
    });
  };

  // 작업수 입력 완료(blur) 핸들러
  const handleWorkCountBlur = (keywordId: number) => {
    // 선택된 키워드 찾기
    const keyword = keywords.find(k => k.id === keywordId);
    if (!keyword) return;

    // 선택된 캠페인의 최소 작업수 가져오기
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
  const getAdditionalFields = (campaign: SupabaseCampaign | null): Array<{
    fieldName: string;
    description: string;
    isRequired?: boolean;
    fieldType?: FieldType;
    enumOptions?: string[];
    fileOptions?: { maxSizeMB?: number; acceptedTypes?: string[] };
  }> => {
    if (!campaign || !campaign.add_info) return [];

    let addFields: Array<{
      fieldName: string;
      description: string;
      isRequired?: boolean;
      fieldType?: FieldType;
      enumOptions?: string[];
      fileOptions?: { maxSizeMB?: number; acceptedTypes?: string[] };
    }> = [];

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

      // fieldType이 문자열인 경우 FieldType enum으로 변환
      addFields = addFields.map(field => ({
        ...field,
        fieldType: field.fieldType || FieldType.TEXT, // 기본값 TEXT
        enumOptions: field.enumOptions || undefined,
        fileOptions: field.fieldType === FieldType.FILE
          ? {
            maxSizeMB: 10, // 10MB 고정
            // 추후 타입들은 여기에 추가 해야 한다. 현재는 image들만
            acceptedTypes: ['image/*'] // 이미지 파일만 허용 (고정)
          }
          : undefined
      }));

    } catch (e) {
      console.error('추가 입력 필드 파싱 오류:', e);
      return [];
    }

    return addFields;
  };

  // 예상 작업기간 계산 함수
  const calculateExpectedDate = (dueDays: number): { startDate: string; endDate: string } => {
    const today = new Date();
    const startDateObj = new Date(today);
    const endDateObj = new Date(today);

    // 시작일은 오늘 + 1일 (총판 승인 후 다음날부터 작업 시작)
    startDateObj.setDate(startDateObj.getDate() + 1);

    // 종료일은 시작일 + 작업기간
    endDateObj.setDate(endDateObj.getDate() + 1 + dueDays - 1);

    // 시작일 포맷
    const startYear = startDateObj.getFullYear();
    const startMonth = String(startDateObj.getMonth() + 1).padStart(2, '0');
    const startDay = String(startDateObj.getDate()).padStart(2, '0');
    const startDate = `${startYear}-${startMonth}-${startDay}`;

    // 종료일 포맷
    const endYear = endDateObj.getFullYear();
    const endMonth = String(endDateObj.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDateObj.getDate()).padStart(2, '0');
    const endDate = `${endYear}-${endMonth}-${endDay}`;

    return { startDate, endDate };
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

  // 숫자만 입력받는 핸들러
  const handleNumberInputChange = (keywordId: number, fieldName: string, value: string) => {
    // 빈 문자열이면 그대로 처리 (필드를 비울 수 있도록)
    if (value === '') {
      handleInputDataChange(keywordId, fieldName, '');
      return;
    }

    // 숫자만 허용 (한글 및 특수문자 제거)
    const numericValue = value.replace(/[^0-9]/g, '');

    // 숫자가 아닌 값이 입력되었다면 기존 값 유지
    if (value !== numericValue) {
      // 입력이 차단되었음을 사용자에게 알릴 수 있음
      return;
    }

    handleInputDataChange(keywordId, fieldName, numericValue);
  };

  // 파일 업로드 핸들러
  const handleFileUpload = async (keywordId: number, fieldName: string, file: File, fileOptions?: { maxSizeMB?: number; acceptedTypes?: string[] }) => {
    try {
      // 파일 크기 검증
      const maxSizeMB = fileOptions?.maxSizeMB || 10; // 기본값 10MB
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        showAlert('오류', `파일 크기는 ${maxSizeMB}MB를 초과할 수 없습니다.`, false);
        return;
      }

      // 파일 타입 검증 (기본값: image/*)
      const acceptedTypes = fileOptions?.acceptedTypes || ['image/*'];
      const fileType = file.type;
      const fileNameLower = file.name.toLowerCase();
      const isAccepted = acceptedTypes.some(acceptedType => {
        if (acceptedType.includes('*')) {
          // 예: 'image/*'
          const prefix = acceptedType.split('/')[0];
          return fileType.startsWith(prefix + '/');
        } else if (acceptedType.startsWith('.')) {
          // 예: '.pdf'
          return fileNameLower.endsWith(acceptedType);
        } else {
          // 예: 'application/pdf'
          return fileType === acceptedType;
        }
      });

      if (!isAccepted) {
        showAlert('오류', `허용되지 않는 파일 형식입니다. 이미지 파일만 업로드 가능합니다.`, false);
        return;
      }

      // Supabase Storage에 업로드
      // 파일명을 안전하게 처리 (한글 및 특수문자 제거)
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `campaign-files/${currentUser?.id || 'anonymous'}/${safeFileName}`;

      // RLS 정책 우회를 위해 upsert 사용
      const { data, error } = await supabase.storage
        .from('campaign-files')
        .upload(filePath, file, {
          upsert: true, // 파일이 이미 존재하면 덮어쓰기
          cacheControl: '3600'
        });

      if (error) {
        console.error('파일 업로드 오류:', error);
        showAlert('오류', '파일 업로드 중 오류가 발생했습니다.', false);
        return;
      }

      // 공개 URL 가져오기
      const { data: urlData } = supabase.storage
        .from('campaign-files')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        // 파일 URL을 inputData에 저장
        handleInputDataChange(keywordId, fieldName, urlData.publicUrl);
        // 파일명도 별도로 저장 (나중에 표시용)
        handleInputDataChange(keywordId, `${fieldName}_fileName`, file.name);
      }
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      showAlert('오류', '파일 업로드 중 오류가 발생했습니다.', false);
    }
  };

  // 파일 삭제 핸들러
  const handleFileRemove = (keywordId: number, fieldName: string) => {
    handleInputDataChange(keywordId, fieldName, '');
    handleInputDataChange(keywordId, `${fieldName}_fileName`, '');
  };

  // 폼 유효성 검사 함수
  const validateForm = (): boolean => {
    // 키워드 선택 확인만 체크
    if (selectedKeywords.length === 0) {
      showAlert('알림', '키워드를 한 개 이상 선택해주세요.', false);
      return false;
    }

    // 필수 입력 필드 검증
    if (selectedCampaign) {
      const additionalFields = getAdditionalFields(selectedCampaign);
      const requiredFields = additionalFields.filter(field => field.isRequired);

      if (requiredFields.length > 0) {
        // 선택된 키워드들의 필수 필드 값 검사
        for (const keywordId of selectedKeywords) {
          const keyword = keywords.find(k => k.id === keywordId);
          if (keyword) {
            for (const field of requiredFields) {
              const value = keyword.inputData?.[field.fieldName];
              if (!value || value.trim() === '') {
                showAlert('알림', `'${keyword.mainKeyword}' 키워드의 '${field.fieldName}' 필드는 필수 입력항목입니다.`, false);
                return false;
              }

              // INTEGER 타입 필드 검증
              if (field.fieldType === FieldType.INTEGER && value) {
                if (!/^\d+$/.test(value)) {
                  showAlert('알림', `'${keyword.mainKeyword}' 키워드의 '${field.fieldName}' 필드는 숫자만 입력 가능합니다.`, false);
                  return false;
                }
              }

              // FILE 타입 필드 검증 (필수 파일 필드가 비어있는지 확인)
              if (field.fieldType === FieldType.FILE && field.isRequired) {
                const fileUrl = keyword.inputData?.[field.fieldName];
                if (!fileUrl || fileUrl.trim() === '') {
                  showAlert('알림', `'${keyword.mainKeyword}' 키워드의 '${field.fieldName}' 파일은 필수입니다.`, false);
                  return false;
                }
              }
            }
          }
        }
      }
    }

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
        // 개별 키워드 가격 계산 (단가 * 작업수 * 진행일수)
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

        // 개별 키워드 가격 계산 (단가 * 작업수 * 진행일수)
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
          quantity: detail.workCount, // 작업수 (quantity 사용)
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
    link: string
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

    // 보장형 캠페인인 경우 견적 요청 모달 열기
    if (selectedCampaign?.slot_type === 'guarantee') {
      setQuoteRequestModalOpen(true);
      return;
    }

    try {
      setSaving(true);

      // 선택된 키워드 상세 정보 수집 - dueDays 필드 사용
      const keywordDetails: KeywordDetail[] = selectedKeywords.map(keywordId => {
        const keyword = keywords.find(k => k.id === keywordId);
        if (!keyword) return null;

        // 최소 작업수 확인
        let minQuantity = 1;
        if (selectedCampaign) {
          if (typeof selectedCampaign.min_quantity === 'string') {
            minQuantity = parseInt(selectedCampaign.min_quantity) || 1;
          } else if (typeof selectedCampaign.min_quantity === 'number') {
            minQuantity = selectedCampaign.min_quantity;
          }
        }

        // 작업수가 최소값보다 작으면 최소값 사용
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
          '/myinfo/services'
        );
      }

      // 상위 컴포넌트에 데이터 전달 (기존 동작 유지)
      if (onSave) {
        onSave(campaignSlotData);
      }

      // 구매 완료 후 상태 초기화
      // 선택된 키워드 초기화
      setSelectedKeywords([]);

      // 키워드 입력 데이터 초기화
      setKeywords(prev =>
        prev.map(k => ({
          ...k,
          workCount: null,
          dueDays: null,
          inputData: {}
        }))
      );

      // 슬롯 데이터 초기화
      setSlotData({
        productName: '',
        mid: '',
        url: '',
        keyword1: '',
        keyword2: '',
        keyword3: '',
        campaignId: selectedCampaignId,
        selectedKeywords: [],
        keywordDetails: []
      });

      // 결제 금액 초기화
      setTotalPaymentAmount(0);

      // 이미 등록된 키워드 목록 다시 가져오기
      if (selectedCampaignId) {
        await fetchAlreadyRegisteredKeywords(selectedCampaignId);
        // 키워드 목록도 다시 가져오기 (등록된 키워드 표시를 위해)
        if (selectedGroupId) {
          await fetchKeywords(selectedGroupId);
        }
      }

      // 성공 알림 표시
      showAlert('구매 신청 완료', `${selectedCampaign?.campaign_name || '키워드'} 구매 신청이 성공적으로 완료되었습니다.`, true);
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
        <DialogContent className={cn(
          "w-[100vw] sm:w-[95vw] p-0 overflow-hidden flex flex-col",
          isCompactMode
            ? "h-[100vh] h-[100dvh] sm:h-[90vh] max-w-full sm:max-w-[500px] md:max-w-[1000px] lg:max-w-[1200px]"
            : "h-[95vh] h-[95dvh] max-w-full sm:max-w-[1000px] md:max-w-[1200px]"
        )} aria-describedby={undefined}>
          <DialogHeader className="bg-background py-3 sm:py-4 px-4 sm:px-6 border-b sticky top-0 z-10 shadow-sm flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <DialogTitle className="text-base sm:text-lg font-semibold text-foreground">
                캠페인 슬롯 구매
              </DialogTitle>
              <div className="px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-full text-xs sm:text-sm border border-blue-100 dark:border-blue-900 shadow-sm flex items-center gap-1.5 sm:gap-2">
                <KeenIcon icon="dollar" className="text-primary size-4 sm:size-4" />
                <span className="hidden sm:inline font-semibold text-gray-600 dark:text-gray-300">캐시 잔액:</span>
                <span className="font-extrabold text-primary dark:text-primary-foreground text-xs sm:text-sm">{userCashBalance.toLocaleString()}원</span>
              </div>
            </div>
          </DialogHeader>
          <div className="p-4 sm:p-6 bg-background flex-1 overflow-y-auto flex flex-col">
            {/* 수직 레이아웃: 캠페인 선택이 위에, 키워드 관리가 아래에 */}
            <div className="flex flex-col gap-4 h-full min-h-0">
              {/* 캠페인 상세 정보 - 컴팩트 모드 지원 */}
              <div className="w-full">
                {isCompactMode ? (
                  /* 컴팩트 모드 - 일반 모드와 동일한 레이아웃 */
                  <div className="space-y-3">
                    {/* 상단: 섹션 제목과 select들을 한 줄에 배치 */}
                    <div className="flex items-center justify-between">
                      {/* 좌측: 섹션 제목 - 모바일에서는 숨김 */}
                      <div className="hidden sm:flex items-center gap-2">
                        <KeenIcon icon="document" className="text-primary size-4" />
                        <span className="text-sm font-medium text-foreground">캠페인 정보</span>
                      </div>

                      {/* 우측: 서비스 선택 및 캠페인 선택 - 모바일에서는 전체 너비 */}
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* 모바일용 아이콘 */}
                        <KeenIcon icon="document" className="text-primary size-4 shrink-0 sm:hidden" />
                        {/* 서비스 선택 */}
                        <KeenIcon icon="category" className="text-green-500 size-4 shrink-0" />
                        <div className="w-1/2 sm:w-48">
                          <select
                            id="service-select"
                            value={selectedServiceCode}
                            onChange={(e) => {
                              handleServiceChange(e.target.value);
                            }}
                            className="select flex w-full bg-white rounded-md border border-input text-sm ring-offset-0 hover:border-gray-400 focus:border-primary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 h-8 pl-2 pr-6"
                          >
                            {Object.entries(SERVICE_TYPE_LABELS).map(([type, label]) => (
                              <option key={type} value={type}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 캠페인 선택 */}
                        <KeenIcon icon="document" className="text-blue-500 size-4 shrink-0" />
                        <div className="w-1/2 sm:w-64">
                          {loading ? (
                            <div className="flex items-center h-8 text-xs text-muted-foreground pl-2">로딩중...</div>
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
                              className="select flex w-full bg-background rounded-md border border-input text-sm ring-offset-0 hover:border-gray-400 focus:border-primary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 h-8 pl-2 pr-6"
                            >
                              {campaigns.map((camp) => (
                                <option key={camp.id} value={camp.id}>
                                  {camp.slot_type === 'guarantee' ? '[보장형] ' : '[일반형] '}{camp.campaign_name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="flex items-center h-8 text-xs text-muted-foreground pl-2">없음</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 캠페인 정보 박스 - blue border for standard, purple for guarantee */}
                    {selectedCampaign && (
                      <div className={cn(
                        "flex flex-col gap-2 px-3 py-2 border-2 rounded-md",
                        selectedCampaign.slot_type === 'guarantee'
                          ? "bg-purple-50 dark:bg-purple-900/20 border-purple-400 dark:border-purple-600"
                          : "bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600"
                      )}>
                        {/* 캠페인명과 상태 */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {/* 캠페인 로고 */}
                            <div className="w-8 h-8 shrink-0 rounded-md overflow-hidden flex items-center justify-center bg-white border border-gray-200">
                              {bannerUrl ? (
                                <img
                                  src={bannerUrl}
                                  alt={selectedCampaign.campaign_name}
                                  className="w-6 h-6 object-contain"
                                  onError={() => setBannerUrl(null)}
                                />
                              ) : (
                                <KeenIcon icon="image" className="size-4 text-gray-400" />
                              )}
                            </div>
                            {/* 캠페인명 */}
                            <h3 className="text-sm font-semibold text-foreground truncate flex-1">
                              {selectedCampaign.campaign_name}
                            </h3>
                          </div>
                          {/* 서비스 타입 배지 */}
                          <span className={`badge ${selectedCampaign.slot_type === 'guarantee'
                            ? 'badge-info'
                            : 'badge-primary'
                            } badge-outline rounded-[30px] h-auto py-0.5 px-2 text-xs shrink-0`}>
                            <KeenIcon icon={selectedCampaign.slot_type === 'guarantee' ? 'shield-tick' : 'element-11'} className="size-3 me-1" />
                            {selectedCampaign.slot_type === 'guarantee' ? '보장형' : '일반형'}
                          </span>
                          {/* 상태 배지 */}
                          <span className={`badge badge-${getStatusColor(selectedCampaign.status)} badge-outline rounded-[30px] h-auto py-0.5 px-2 text-xs shrink-0`}>
                            <span className={`size-1.5 rounded-full bg-${getStatusColor(selectedCampaign.status)} me-1`}></span>
                            {getStatusLabel(selectedCampaign.status)}
                          </span>
                        </div>
                        {/* 캠페인 상세 정보 */}
                        <div className={cn(
                          "text-xs flex flex-wrap items-center gap-x-3 gap-y-1",
                          selectedCampaign.slot_type === 'guarantee'
                            ? "text-purple-700 dark:text-purple-300"
                            : "text-blue-700 dark:text-blue-300"
                        )}>
                          {selectedCampaign.slot_type === 'guarantee' ? (
                            <>
                              <span className="flex items-center gap-1">
                                <span className="text-purple-600 dark:text-purple-400">가격범위:</span>
                                <span className="font-semibold text-primary">
                                  {(() => {
                                    const minPrice = Number(selectedCampaign.min_guarantee_price?.toString().replace(/[^\d]/g, '') || 0);
                                    const maxPrice = Number(selectedCampaign.max_guarantee_price?.toString().replace(/[^\d]/g, '') || 0);

                                    if (minPrice && maxPrice) {
                                      const formatPrice = (price: number) => {
                                        if (price >= 100000000) {
                                          const billions = price / 100000000;
                                          return billions % 1 === 0 ? `${billions}억` : `${billions.toFixed(1)}억`;
                                        } else if (price >= 10000000) {
                                          const tenMillions = price / 10000000;
                                          return tenMillions % 1 === 0 ? `${tenMillions}천만` : `${tenMillions.toFixed(1)}천만`;
                                        } else if (price >= 10000) {
                                          const tenThousands = price / 10000;
                                          return tenThousands % 1 === 0 ? `${tenThousands}만` : `${tenThousands.toFixed(1)}만`;
                                        }
                                        return price.toLocaleString();
                                      };

                                      return `${formatPrice(minPrice)}~${formatPrice(maxPrice)}원`;
                                    }
                                    return '가격 협의';
                                  })()}
                                </span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="text-purple-600 dark:text-purple-400">{selectedCampaign.guarantee_unit === '회' ? '보장회수:' : '보장일수:'}</span>
                                <span className="font-semibold">{selectedCampaign.guarantee_count || 30}{selectedCampaign.guarantee_unit || '일'}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="text-purple-600 dark:text-purple-400">효율:</span>
                                <span className="font-semibold text-green-600">{selectedCampaign.efficiency || '-%'}</span>
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="flex items-center gap-1">
                                <span className="text-blue-600 dark:text-blue-400">단가:</span>
                                <span className="font-semibold text-primary">{selectedCampaign.unit_price ? `${Number(selectedCampaign.unit_price.toString().replace(/[^\d]/g, '')).toLocaleString()}원` : '1,000원'}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="text-blue-600 dark:text-blue-400">최소:</span>
                                <span className="font-semibold">{selectedCampaign.min_quantity ? `${Number(selectedCampaign.min_quantity.toString().replace(/[^\d]/g, '')).toLocaleString()}개` : '1개'}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="text-blue-600 dark:text-blue-400">효율:</span>
                                <span className="font-semibold text-green-600">{selectedCampaign.efficiency || '-%'}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  /* 일반 모드 - 기존 레이아웃 */
                  <>
                    {/* 1행: 서비스 선택 및 캠페인 선택 */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      {/* 좌측: 섹션 제목 */}
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <KeenIcon icon="document" className="text-primary size-4" />
                          <span className="text-sm font-medium text-foreground">캠페인 정보</span>
                        </div>

                        {/* 우측: 서비스 선택 및 캠페인 선택 */}
                        <div className="flex items-center gap-3">
                          {/* 서비스 선택 */}
                          <KeenIcon icon="category" className="text-green-500 size-4 shrink-0" />
                          <div className="w-1/2 sm:w-48">
                            <select
                              id="service-select"
                              value={selectedServiceCode}
                              onChange={(e) => {
                                handleServiceChange(e.target.value);
                              }}
                              className="select flex w-full bg-white rounded-md border border-input text-sm ring-offset-0 hover:border-gray-400 focus:border-primary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 h-10 pl-3 py-2"
                            >
                              {Object.entries(SERVICE_TYPE_LABELS).map(([type, label]) => (
                                <option key={type} value={type}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 캠페인 선택 */}
                          <KeenIcon icon="document" className="text-blue-500 size-4 shrink-0" />
                          <div className="w-1/2 sm:w-64">
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
                                className="select flex w-full bg-background rounded-md border border-input text-sm ring-offset-0 hover:border-gray-400 focus:border-primary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 h-10 pl-3 py-2"
                              >
                                {campaigns.map((camp) => (
                                  <option key={camp.id} value={camp.id}>
                                    {camp.slot_type === 'guarantee' ? '[보장형] ' : '[일반형] '}{camp.campaign_name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="text-sm text-muted-foreground">사용 가능한 캠페인이 없습니다.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2행: 선택된 캠페인 정보 */}
                    <div className={cn(
                      "w-full bg-white rounded-lg shadow-sm p-3 sm:p-4 mt-3",
                      selectedCampaign?.slot_type === 'guarantee'
                        ? "border-2 border-purple-400 dark:border-purple-600"
                        : "border-2 border-blue-400 dark:border-blue-600"
                    )}>
                      {selectedCampaign ? (
                        <div className="flex gap-4">
                          <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] shrink-0 rounded-md overflow-hidden flex items-center justify-center bg-gray-50">
                            {bannerUrl && (
                              <img
                                src={bannerUrl}
                                alt="캠페인 로고"
                                className="size-[60px] sm:size-[70px] object-contain"
                                onError={() => {
                                  // 로고 로드 실패 시 상태 초기화
                                  setBannerUrl(null);
                                }}
                              />
                            )}
                            {!bannerUrl && (
                              <div className="text-xs text-gray-400 text-center">
                                로고 없음
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h2 className="text-lg font-bold text-foreground truncate">
                                {selectedCampaign.campaign_name}
                              </h2>
                              {/* 서비스 타입 배지 */}
                              <span className={`badge ${selectedCampaign.slot_type === 'guarantee'
                                ? 'badge-info'
                                : 'badge-primary'
                                } badge-outline rounded-[30px] h-auto py-1`}>
                                <KeenIcon icon={selectedCampaign.slot_type === 'guarantee' ? 'shield-tick' : 'element-11'} className="size-3.5 me-1.5" />
                                {selectedCampaign.slot_type === 'guarantee' ? '보장형' : '일반형'}
                              </span>
                              <span className={`badge badge-${getStatusColor(selectedCampaign.status)} badge-outline rounded-[30px] h-auto py-1`}>
                                <span className={`size-1.5 rounded-full bg-${getStatusColor(selectedCampaign.status)} me-1.5`}></span>
                                {getStatusLabel(selectedCampaign.status)}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-sm mb-2">
                              {selectedCampaign.slot_type === 'guarantee' ? (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <KeenIcon icon="wallet" className="text-primary size-4" />
                                    <span className="text-muted-foreground">가격범위:</span>
                                    <span className="font-bold text-primary">
                                      {(() => {
                                        const minPrice = Number(selectedCampaign.min_guarantee_price?.toString().replace(/[^\d]/g, '') || 0);
                                        const maxPrice = Number(selectedCampaign.max_guarantee_price?.toString().replace(/[^\d]/g, '') || 0);

                                        if (minPrice && maxPrice) {
                                          const formatPrice = (price: number) => {
                                            if (price >= 100000000) {
                                              const billions = price / 100000000;
                                              return billions % 1 === 0 ? `${billions}억` : `${billions.toFixed(1)}억`;
                                            } else if (price >= 10000000) {
                                              const tenMillions = price / 10000000;
                                              return tenMillions % 1 === 0 ? `${tenMillions}천만` : `${tenMillions.toFixed(1)}천만`;
                                            } else if (price >= 10000) {
                                              const tenThousands = price / 10000;
                                              return tenThousands % 1 === 0 ? `${tenThousands}만` : `${tenThousands.toFixed(1)}만`;
                                            }
                                            return price.toLocaleString();
                                          };

                                          return `${formatPrice(minPrice)}~${formatPrice(maxPrice)}원`;
                                        }
                                        return '가격 협의';
                                      })()}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <KeenIcon icon="shield-tick" className="text-purple-500 size-4" />
                                    <span className="text-muted-foreground">{selectedCampaign.guarantee_unit === '회' ? '보장회수:' : '보장일수:'}</span>
                                    <span className="font-bold">
                                      {selectedCampaign.guarantee_count || 30}{selectedCampaign.guarantee_unit || '일'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <KeenIcon icon="rocket" className="text-green-500 size-4" />
                                    <span className="text-muted-foreground">효율:</span>
                                    <span className="font-bold text-green-600">
                                      {selectedCampaign.efficiency || '-%'}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <KeenIcon icon="wallet" className="text-primary size-4" />
                                    <span className="text-muted-foreground">단가:</span>
                                    <span className="font-bold text-primary">
                                      {selectedCampaign.unit_price
                                        ? `${Number(selectedCampaign.unit_price.toString().replace(/[^\d]/g, '')).toLocaleString()}원`
                                        : '1,000원'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <KeenIcon icon="purchase" className="text-orange-500 size-4" />
                                    <span className="text-muted-foreground">최소:</span>
                                    <span className="font-bold">
                                      {selectedCampaign.min_quantity
                                        ? `${Number(selectedCampaign.min_quantity.toString().replace(/[^\d]/g, '')).toLocaleString()}개`
                                        : '1개'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <KeenIcon icon="rocket" className="text-green-500 size-4" />
                                    <span className="text-muted-foreground">효율:</span>
                                    <span className="font-bold text-green-600">
                                      {selectedCampaign.efficiency || '-%'}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="text-sm">
                              <div className="bg-blue-50/50 p-2 rounded border border-blue-100/50 text-gray-700 line-clamp-2">
                                {selectedCampaign.description || '설명이 없습니다.'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <p className="text-muted-foreground text-sm">선택된 캠페인이 없거나 로딩 중입니다.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* 키워드 선택 영역 */}
              <div className="w-full space-y-4 flex-1 flex flex-col min-h-0">
                <div className="space-y-4 flex-1 flex flex-col min-h-0">
                  {/* 1행: 제목과 컨트롤들 */}
                  {isCompactMode ? (
                    /* 컴팩트 모드 - 키워드 영역 (일반 모드와 동일한 레이아웃) */
                    <div className="space-y-3">
                      {/* 모바일에서는 2행으로 표시 */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 w-full">
                        {/* 첫 번째 행: 제목과 작업시작일 안내 - 데스크톱에서만 표시 */}
                        <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <KeenIcon icon="pencil" className="text-success size-4" />
                            <span className="text-sm font-medium text-foreground">내 키워드에서 가져오기</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md px-2.5 py-1.5">
                            <KeenIcon icon="information-2" className="text-blue-600 dark:text-blue-400 size-3.5" />
                            <span className="font-semibold">작업 시작일:</span>
                            <span>총판 승인 다음날부터</span>
                          </div>
                        </div>

                        {/* 첫 번째 행: 모바일에서는 select들만 표시 */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {/* 모바일용 아이콘 */}
                          <KeenIcon icon="pencil" className="text-success size-4 shrink-0 sm:hidden" />
                          {/* 그룹 선택 */}
                          <KeenIcon icon="folder" className="text-blue-500 size-4 shrink-0" />
                          <div className="w-1/2 sm:w-48">
                            <select
                              id="group-select"
                              value={selectedGroupId || ''}
                              onChange={(e) => handleGroupSelect(Number(e.target.value))}
                              className="select w-full bg-background rounded-md border border-input text-sm hover:border-gray-400 focus:border-primary h-8 pl-2 pr-6"
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
                          <KeenIcon icon="magnifier" className="text-blue-500 size-4 shrink-0" />
                          <div className="w-1/2 sm:w-52">
                            <Input
                              value={searchKeyword}
                              onChange={(e) => setSearchKeyword(e.target.value)}
                              placeholder="키워드 검색"
                              className="input w-full pl-2 pr-2 h-8 bg-white border-gray-300 focus:border-blue-400 focus:ring-blue-300 text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 두 번째 행: 모바일에서만 작업시작일 안내 표시 */}
                      <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md px-2.5 py-1.5 sm:hidden">
                        <KeenIcon icon="information-2" className="text-blue-600 dark:text-blue-400 size-3.5" />
                        <span className="font-semibold">작업 시작일:</span>
                        <span>총판 승인 다음날부터</span>
                      </div>
                    </div>
                  ) : (
                    /* 일반 모드 - 키워드 영역 */
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-2">
                      {/* 좌측: 섹션 제목과 작업시작일 안내 */}
                      <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                        <div className="flex items-center gap-3">
                          <KeenIcon icon="pencil" className="text-success size-4" />
                          <span className="text-sm font-medium text-foreground">내 키워드에서 가져오기</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md px-2.5 py-1.5">
                          <KeenIcon icon="information-2" className="text-blue-600 dark:text-blue-400 size-3.5" />
                          <span className="font-semibold">작업 시작일:</span>
                          <span>총판 승인 다음날부터</span>
                        </div>
                      </div>

                      {/* 우측: 그룹 선택과 키워드 검색 */}
                      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
                        {/* 그룹 선택 */}
                        <KeenIcon icon="folder" className="text-blue-500 size-4 shrink-0" />
                        <div className="flex-1 sm:w-48 sm:flex-none min-w-0">
                          <select
                            id="group-select"
                            value={selectedGroupId || ''}
                            onChange={(e) => handleGroupSelect(Number(e.target.value))}
                            className="select w-full bg-background rounded-md border border-input text-sm hover:border-gray-400 focus:border-primary h-9 pl-3"
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
                        <KeenIcon icon="magnifier" className="text-blue-500 size-4 shrink-0" />
                        <div className="flex-1 sm:w-52 sm:flex-none min-w-0">
                          <Input
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            placeholder="키워드 검색어 입력"
                            className="input w-full pl-3 pr-3 h-9 bg-white border-gray-300 focus:border-blue-400 focus:ring-blue-300"
                          />
                        </div>
                      </div>
                    </div>
                  )}


                  {/* 키워드 목록 - 테이블 구역 최적화 */}
                  <div className="border rounded-md overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
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
                        <div className="bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white py-1 px-3 sm:px-4 border-b flex justify-between items-center rounded-t-md">
                          <div className="flex items-center gap-2">
                            <KeenIcon icon="list" className="text-white size-3" />
                            <div className="text-xs font-medium antialiased">
                              총 {keywords.length}개의 키워드
                            </div>
                          </div>
                          <div className="inline-flex items-center gap-1 text-xs bg-green-500/30 py-0.5 px-2 rounded-full">
                            <KeenIcon icon="check-circle" className="text-green-300 size-3" />
                            <span className="font-medium text-green-100 antialiased">선택됨: {selectedKeywords.length} 개</span>
                          </div>
                        </div>
                        <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900 min-h-0">
                          <div className="h-full overflow-x-auto overflow-y-auto custom-scrollbar">
                            <table className={`w-full border-separate border-spacing-0`} style={{ minWidth: `${1200 + (getAdditionalFields(selectedCampaign).length * 150)}px` }}>
                              <thead className="sticky top-0 z-20 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white shadow-lg backdrop-blur-sm">
                                <tr className="text-left">
                                  <th className="min-w-[50px] w-[50px] px-2 py-3 text-xs font-medium border border-blue-400/30 dark:border-blue-400/20 rounded-tl-md">
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

                                            // 선택된 캠페인의 min_quantity를 작업수로 자동 설정
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
                                        className="size-4 sm:size-4 cursor-pointer rounded"
                                      />
                                    </div>
                                  </th>
                                  <th className="min-w-[200px] px-3 py-3 text-xs font-semibold border border-blue-400/30 dark:border-blue-400/20 uppercase tracking-wider antialiased">{getFieldLabel('main_keyword', '키워드')}</th>
                                  {(() => {
                                    // 보이는 필드들을 체크하여 정보 헤더 표시 여부 결정
                                    const hasVisibleInfoFields =
                                      !isHidden('mid') ||
                                      !isHidden('url') ||
                                      !isHidden('description') ||
                                      !isHidden('keyword1') ||
                                      !isHidden('keyword2') ||
                                      !isHidden('keyword3');

                                    if (hasVisibleInfoFields) {
                                      return (
                                        <th className="min-w-[250px] px-3 py-3 text-xs font-semibold border border-blue-400/30 dark:border-blue-400/20 uppercase tracking-wider antialiased">정보</th>
                                      );
                                    }
                                    return null;
                                  })()}
                                  <th className="min-w-[80px] px-3 py-3 text-xs font-semibold border border-blue-400/30 dark:border-blue-400/20 uppercase tracking-wider antialiased">작업수</th>
                                  <th className="min-w-[100px] px-3 py-3 text-xs font-semibold border border-blue-400/30 dark:border-blue-400/20 uppercase tracking-wider antialiased">작업기간</th>
                                  <th className="min-w-[150px] px-3 py-3 text-xs font-semibold border border-blue-400/30 dark:border-blue-400/20 uppercase tracking-wider antialiased">예상 작업기간</th>
                                  {selectedCampaign && getAdditionalFields(selectedCampaign).map((field, index) => (
                                    <th
                                      key={index}
                                      className={`px-1 py-2 md:px-3 md:py-3 text-[9px] md:text-xs font-semibold border border-blue-400/30 dark:border-blue-400/20 uppercase tracking-wider antialiased relative group ${index === getAdditionalFields(selectedCampaign).length - 1 ? 'rounded-tr-md' : ''
                                        }`}
                                      style={{ minWidth: '150px' }}
                                    >
                                      <div className="flex items-center justify-center">
                                        <span>{field.fieldName}</span>
                                        {field.isRequired && (
                                          <span className="ml-0.5 text-red-500 font-bold">*</span>
                                        )}
                                        {field.description && (
                                          <span className="ml-1 inline-flex items-center justify-center">
                                            <KeenIcon icon="information" className="size-4 text-blue-300" />
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
                                      className={`transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/70 ${selectedKeywords.includes(keyword.id)
                                        ? 'bg-blue-50 dark:bg-blue-900/80 shadow-sm'
                                        : 'bg-white dark:bg-slate-800'
                                        }`}
                                    >
                                      <td className="min-w-[50px] w-[50px] px-2 py-3 border border-gray-200 align-middle text-center">
                                        <div className="flex justify-center">
                                          <input
                                            type="checkbox"
                                            checked={selectedKeywords.includes(keyword.id)}
                                            onChange={() => handleKeywordToggle(keyword.id)}
                                            className="size-4 sm:size-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                          />
                                        </div>
                                      </td>
                                      <td className="min-w-[200px] px-3 py-3 border border-gray-200 group" onClick={() => handleKeywordToggle(keyword.id)}>
                                        <div className="cursor-pointer transition-all">
                                          <p className="font-semibold text-xs sm:text-sm text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 line-clamp-1 antialiased">{keyword.mainKeyword}</p>
                                          <div className="flex flex-wrap gap-1 mt-1.5 text-xs">
                                            {keyword.keyword1 && !isHidden('keyword1') && <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-xs transition-colors group-hover:bg-indigo-100 dark:group-hover:bg-indigo-800/40 font-medium antialiased">{keyword.keyword1}</span>}
                                            {keyword.keyword2 && !isHidden('keyword2') && <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-xs transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-800/40 font-medium antialiased">{keyword.keyword2}</span>}
                                            {keyword.keyword3 && !isHidden('keyword3') && <span className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-xs transition-colors group-hover:bg-amber-100 dark:group-hover:bg-amber-800/40 font-medium antialiased">{keyword.keyword3}</span>}
                                          </div>
                                        </div>
                                      </td>
                                      {(() => {
                                        // 보이는 필드들을 체크하여 정보 열 표시 여부 결정
                                        const hasVisibleInfoFields =
                                          !isHidden('mid') ||
                                          !isHidden('url') ||
                                          !isHidden('description') ||
                                          !isHidden('keyword1') ||
                                          !isHidden('keyword2') ||
                                          !isHidden('keyword3');

                                        if (hasVisibleInfoFields) {
                                          return (
                                            <td className="min-w-[250px] px-3 py-3 border border-gray-200 align-middle">
                                              <div className="text-xs">
                                                {keyword.mid && !isHidden('mid') && <p className="text-gray-600 mb-1 flex items-center gap-1 font-medium"><span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs font-semibold">{getFieldLabel('mid', 'MID')}</span> {keyword.mid}</p>}
                                                {keyword.url && !isHidden('url') && <p className="text-blue-600 truncate max-w-[300px] hover:text-blue-700 font-medium">{keyword.url}</p>}
                                                {keyword.description && !isHidden('description') && <p className="text-gray-500 text-xs mt-1 truncate max-w-[300px]">{keyword.description}</p>}
                                              </div>
                                            </td>
                                          );
                                        }
                                        return null;
                                      })()}
                                      <td className="min-w-[80px] px-3 py-3 border border-gray-200 align-middle">
                                        <input
                                          type="text"
                                          placeholder="작업수"
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
                                          className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white font-medium"
                                          onClick={e => e.stopPropagation()}
                                        />
                                      </td>
                                      <td className="min-w-[100px] px-3 py-3 border border-gray-200 align-middle">
                                        <input
                                          type="text"
                                          placeholder="작업기간"
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
                                          className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white font-medium"
                                          onClick={e => e.stopPropagation()}
                                        />
                                      </td>
                                      <td className="min-w-[150px] px-3 py-3 border border-gray-200 align-middle">
                                        {keyword.dueDays && keyword.dueDays > 0 && (
                                          <div className="text-xs text-gray-700 dark:text-gray-300">
                                            <div className="flex flex-col gap-1.5">
                                              <div className="whitespace-nowrap">
                                                <span className="font-semibold text-gray-600 dark:text-gray-400">시작:</span>
                                                <span className="ml-1 font-medium">{calculateExpectedDate(keyword.dueDays || 1).startDate}</span>
                                              </div>
                                              <div className="whitespace-nowrap">
                                                <span className="font-semibold text-gray-600 dark:text-gray-400">완료:</span>
                                                <span className="ml-1 font-medium">{calculateExpectedDate(keyword.dueDays || 1).endDate}</span>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </td>
                                      {/* 각 추가 필드를 별도의 td로 분리 */}
                                      {selectedCampaign && getAdditionalFields(selectedCampaign).map((field, index) => (
                                        <td
                                          key={index}
                                          className="px-1 sm:px-2 py-1 sm:py-2 md:px-3 md:py-3 border border-gray-200 align-middle relative group"
                                          style={{ minWidth: '150px' }}
                                        >
                                          {selectedKeywords.includes(keyword.id) ? (
                                            <div className="relative">
                                              {/* 필드 타입에 따른 입력 방식 */}
                                              {field.fieldType === FieldType.ENUM && field.enumOptions ? (
                                                // ENUM 타입: 드롭다운 선택
                                                <select
                                                  value={keyword.inputData?.[field.fieldName] || ''}
                                                  onChange={(e) => handleInputDataChange(keyword.id, field.fieldName, e.target.value)}
                                                  className={`w-full px-1.5 py-1 text-[9px] sm:text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-slate-800 ${field.isRequired && (!keyword.inputData?.[field.fieldName] || keyword.inputData[field.fieldName].trim() === '')
                                                    ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                                                    : ''
                                                    }`}
                                                  onClick={e => e.stopPropagation()}
                                                  required={field.isRequired}
                                                >
                                                  <option value="">선택하세요</option>
                                                  {field.enumOptions.map((option, optionIndex) => (
                                                    <option key={optionIndex} value={option}>
                                                      {option}
                                                    </option>
                                                  ))}
                                                </select>
                                              ) : field.fieldType === FieldType.INTEGER ? (
                                                // INTEGER 타입: 숫자만 입력
                                                <input
                                                  type="text"
                                                  inputMode="numeric"
                                                  pattern="[0-9]*"
                                                  placeholder={`${field.fieldName} 입력${field.isRequired ? ' (필수)' : ''} (숫자만)`}
                                                  value={keyword.inputData?.[field.fieldName] || ''}
                                                  onChange={(e) => handleNumberInputChange(keyword.id, field.fieldName, e.target.value)}
                                                  onKeyPress={(e) => {
                                                    // 숫자가 아닌 키 입력 차단
                                                    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
                                                      e.preventDefault();
                                                    }
                                                  }}
                                                  className={`w-full px-1.5 py-1 text-[9px] sm:text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-slate-800 ${field.isRequired && (!keyword.inputData?.[field.fieldName] || keyword.inputData[field.fieldName].trim() === '')
                                                    ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                                                    : ''
                                                    }`}
                                                  onClick={e => e.stopPropagation()}
                                                  required={field.isRequired}
                                                />
                                              ) : field.fieldType === FieldType.FILE ? (
                                                // FILE 타입: 파일 업로드
                                                <div className="w-full">
                                                  {keyword.inputData?.[field.fieldName] ? (
                                                    // 파일이 업로드된 경우
                                                    <div className="flex items-center gap-1">
                                                      <KeenIcon icon="picture" className="size-3 text-gray-500" />
                                                      <a
                                                        href={keyword.inputData?.[field.fieldName]}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[9px] sm:text-xs text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[100px] flex-1"
                                                        title={keyword.inputData?.[`${field.fieldName}_fileName`] || '파일 보기 (새 탭에서 열림)'}
                                                        onClick={(e) => e.stopPropagation()}
                                                      >
                                                        {keyword.inputData?.[`${field.fieldName}_fileName`] || '파일'}
                                                      </a>
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleFileRemove(keyword.id, field.fieldName);
                                                        }}
                                                        className="text-red-500 hover:text-red-700 p-0.5"
                                                        title="파일 삭제"
                                                      >
                                                        <KeenIcon icon="cross" className="size-3" />
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    // 파일 선택 버튼
                                                    <label className={`flex items-center justify-center px-2 py-1 text-[9px] sm:text-xs border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${field.isRequired && !keyword.inputData?.[field.fieldName]
                                                      ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                                                      : 'border-gray-300'
                                                      }`}>
                                                      <KeenIcon icon="file-up" className="size-3 mr-1" />
                                                      파일 선택
                                                      <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                          e.stopPropagation();
                                                          const file = e.target.files?.[0];
                                                          if (file) {
                                                            handleFileUpload(keyword.id, field.fieldName, file, field.fileOptions);
                                                          }
                                                        }}
                                                        onClick={e => e.stopPropagation()}
                                                      />
                                                    </label>
                                                  )}
                                                </div>
                                              ) : (
                                                // TEXT 타입 (기본값): 일반 텍스트 입력
                                                <input
                                                  type="text"
                                                  placeholder={`${field.fieldName} 입력${field.isRequired ? ' (필수)' : ''}`}
                                                  value={keyword.inputData?.[field.fieldName] || ''}
                                                  onChange={(e) => handleInputDataChange(keyword.id, field.fieldName, e.target.value)}
                                                  className={`w-full px-1.5 py-1 text-[9px] sm:text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-slate-800 ${field.isRequired && (!keyword.inputData?.[field.fieldName] || keyword.inputData[field.fieldName].trim() === '')
                                                    ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                                                    : ''
                                                    }`}
                                                  onClick={e => e.stopPropagation()}
                                                  required={field.isRequired}
                                                />
                                              )}
                                              {field.description && (
                                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-help">
                                                  <KeenIcon icon="information" className="size-4 text-blue-400" />
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
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-3 flex-shrink-0 bg-background">
            <div className="flex items-center">
              {selectedKeywords.length > 0 && (
                <div className={cn(
                  "flex items-center rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 border shadow-sm w-full sm:w-auto",
                  selectedCampaign?.slot_type === 'guarantee'
                    ? "bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/40 border-purple-200 dark:border-purple-800"
                    : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-blue-100 dark:border-blue-900"
                )}>
                  <KeenIcon icon="wallet" className={cn(
                    "size-5 mr-2 translate-y-[4px]",
                    selectedCampaign?.slot_type === 'guarantee' ? "text-purple-600 dark:text-purple-400" : "text-primary"
                  )} />
                  <div className="flex items-baseline flex-wrap">
                    <span className="font-semibold text-gray-600 dark:text-gray-300 text-sm">
                      {selectedCampaign?.slot_type === 'guarantee' ? '예상 금액:' : '결제 금액:'}
                    </span>
                    <span className={cn(
                      "ml-2 font-extrabold text-base sm:text-lg",
                      selectedCampaign?.slot_type === 'guarantee'
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-primary dark:text-primary-foreground"
                    )}>
                      {selectedCampaign?.slot_type === 'guarantee' ? '견적 요청 필요' : `${totalPaymentAmount.toLocaleString()}원`}
                    </span>
                    {selectedCampaign?.slot_type !== 'guarantee' && (
                      <span className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">(부가세 포함)</span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Button
              onClick={handleSave}
              type="button"
              className={cn(
                "px-4 sm:px-6 md:px-8 text-white transition-all duration-300 h-9 sm:h-10 rounded-md shadow-sm w-full sm:w-auto",
                selectedCampaign?.slot_type === 'guarantee'
                  ? "bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                  : "bg-primary hover:bg-primary/90"
              )}
              disabled={loading || saving || !selectedCampaignId || selectedKeywords.length === 0}
            >
              {saving ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full me-2" role="status" aria-hidden="true"></span>
                  {selectedCampaign?.slot_type === 'guarantee' ? '요청 중...' : '구매 중...'}
                </>
              ) : (
                <>
                  {selectedCampaign?.slot_type === 'guarantee' ? (
                    <>
                      <KeenIcon icon="message-text" className="size-4 me-1.5" />
                      견적요청
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 me-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      구매하기
                    </>
                  )}
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
                  <KeenIcon icon="check-circle" className="size-5 text-green-600 dark:text-green-400" />
                ) : (
                  <KeenIcon icon="information-1" className="size-5 text-red-600 dark:text-red-400" />
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

      {/* 보장형 견적 요청 모달 */}
      <GuaranteeQuoteRequestModal
        open={quoteRequestModalOpen}
        onClose={() => setQuoteRequestModalOpen(false)}
        campaign={selectedCampaign}
        keywordDetails={selectedKeywords.map(keywordId => {
          const keyword = keywords.find(k => k.id === keywordId);
          if (!keyword || !keyword.workCount || !keyword.dueDays) return null;

          return {
            id: keyword.id,
            mainKeyword: keyword.mainKeyword,
            workCount: keyword.workCount,
            dueDays: keyword.dueDays,
            inputData: keyword.inputData || {}
          };
        }).filter(Boolean) as KeywordDetail[]}
        onSuccess={() => {
          // 견적 요청 성공 후 처리
          setQuoteRequestModalOpen(false);
          showAlert('견적 요청 완료', '견적 요청이 성공적으로 접수되었습니다. 총판에서 검토 후 연락드리겠습니다.', true);

          // 상태 초기화
          setSelectedKeywords([]);
          setKeywords(prev =>
            prev.map(k => ({
              ...k,
              workCount: null,
              dueDays: null,
              inputData: {}
            }))
          );
          setTotalPaymentAmount(0);
        }}
      />
    </>
  );
};

export { CampaignSlotWithKeywordModal };