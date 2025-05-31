import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardTemplate } from '@/components/pageTemplate/DashboardTemplate';
import { DashboardColorCard } from '@/pages/dashboards/components/DashboardColorCard';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { useResponsive } from '@/hooks';
import { formatCurrency, formatCurrencyInTenThousand } from '@/utils/Format';
import { supabase } from '@/supabase';
import { getUserCashBalance } from '@/pages/withdraw/services/withdrawService';
import { useAuthContext } from '@/auth/useAuthContext';
import { toast } from 'sonner';
import { CashService } from '@/pages/cash/CashService';

// 에이전시 대시보드 통계 데이터 인터페이스
interface AgencyStats {
  currentBalance: { count: number; trend: number };
  activeCampaigns: { count: number; trend: number };
  totalSpent: { count: number; trend: number };
  bonusCash: { count: number; trend: number };
}

export const DashboardContent: React.FC = () => {
  // 모바일 화면 감지 (md 이하인지 여부)
  const isMobile = useResponsive('down', 'md');
  const { currentUser } = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 대시보드 데이터 상태 관리
  const [stats, setStats] = useState<AgencyStats>({
    currentBalance: { count: 0, trend: 0.5 },
    activeCampaigns: { count: 0, trend: 0.5 },
    totalSpent: { count: 0, trend: 0.5 },
    bonusCash: { count: 0, trend: 0.5 },
  });

  // 활성 캠페인 데이터
  const [activeCampaigns, setActiveCampaigns] = useState<Array<{
    id: string;
    name: string; 
    service_type: string;
    client: string;
    status: string;
    input_data: string;
    start_date: string;
    end_date: string;
  }>>([]);
  
  // 구매 가능한 캠페인 목록 상태
  const [availableCampaigns, setAvailableCampaigns] = useState<Array<{
    id: string;
    campaign_name: string;
    service_type: string;
    unit_price: number;
    min_quantity: number;
  }>>([]);
  
  // 현재 선택된 캠페인과 수량 상태
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  
  // 캐시 충전 관련 상태
  const [chargeAmount, setChargeAmount] = useState<string>('');
  const [koreanAmount, setKoreanAmount] = useState<string>('');
  const [depositorName, setDepositorName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [cashSetting, setCashSetting] = useState<any>(null);
  const [bonusAmount, setBonusAmount] = useState<number>(0);
  const [isEligibleForBonus, setIsEligibleForBonus] = useState<boolean>(false);
  const [showPointInfo, setShowPointInfo] = useState<boolean>(false);
  
  // 거래 내역 관련 상태
  const [transactionHistory, setTransactionHistory] = useState<Array<{
    id: string;
    content: string; 
    subContent?: string;
    date: string;
    amount: number;
    status: string;
  }>>([]);
  
  // 통계 데이터 로드 함수
  const loadStats = async () => {
    try {
      setLoading(true);
      
      if (!currentUser) {
        return;
      }
      
      // 1. 현재 캐시 잔액 조회 - getUserCashBalance 함수 사용
      let userCash = 0;
      let cashTrend = 0.5;
      try {
        const balance = await getUserCashBalance(currentUser.id || '', currentUser.role);
        userCash = balance || 0;
        
        // 트렌드 계산을 위해 최근 거래 내역 조회
        const { data: historyData, error: historyError } = await supabase
          .from('user_cash_history')
          .select('amount, transaction_at')
          .eq('user_id', currentUser.id)
          .order('transaction_at', { ascending: false })
          .limit(10);
        
        if (!historyError && historyData && historyData.length > 1) {
          // 최근 거래 내역을 기준으로 트렌드 계산
          const recentTransactions = historyData.slice(0, 5);
          const olderTransactions = historyData.slice(5, 10);
          
          const recentSum = recentTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
          const olderSum = olderTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
          
          if (olderSum !== 0) {
            // 변화율 계산 (%)
            cashTrend = ((recentSum - olderSum) / Math.abs(olderSum)) * 100;
          }
        }
      } catch (error) {
        
      }
      
      // 2. 진행 중인 캠페인 수 조회 - slots 테이블 사용
      let activeCampaignsCount = 0;
      let campaignsTrend = 0.5;
      
      try {
        // 사용자의 활성 슬롯 카운트 조회
        const { count, error } = await supabase
          .from('slots')
          .select('*', { count: 'exact' })
          .eq('user_id', currentUser.id)
          .eq('status', 'active');
        
        if (!error) {
          activeCampaignsCount = count || 0;
        }
        
        // 이전 달의 활성 슬롯 수 조회 (트렌드 계산용)
        const previousMonth = new Date();
        previousMonth.setMonth(previousMonth.getMonth() - 1);
        
        const { count: prevCount, error: prevError } = await supabase
          .from('slots')
          .select('*', { count: 'exact' })
          .eq('user_id', currentUser.id)
          .eq('status', 'active')
          .lt('created_at', previousMonth.toISOString());
        
        if (!prevError && prevCount && prevCount > 0) {
          campaignsTrend = ((activeCampaignsCount - prevCount) / prevCount) * 100;
        }
      } catch (error) {
        
      }
      
      // 3. 총 구매 금액 조회 - user_cash_history 테이블의 'purchase' 트랜잭션 합계
      let totalSpent = 0;
      let spentTrend = 0.5;
      
      try {
        // 모든 구매 거래 내역 조회
        const { data: purchaseData, error: purchaseError } = await supabase
          .from('user_cash_history')
          .select('amount')
          .eq('user_id', currentUser.id)
          .eq('transaction_type', 'purchase');
        
        if (!purchaseError && purchaseData) {
          // 모든 구매 금액 합산
          totalSpent = purchaseData.reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
        }
        
        // 이전 달의 구매 금액 (트렌드 계산용)
        const currentMonth = new Date();
        const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const firstDayOfPrevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        
        const { data: currentMonthData, error: currentMonthError } = await supabase
          .from('user_cash_history')
          .select('amount')
          .eq('user_id', currentUser.id)
          .eq('transaction_type', 'purchase')
          .gte('transaction_at', firstDayOfMonth.toISOString());
        
        const { data: prevMonthData, error: prevMonthError } = await supabase
          .from('user_cash_history')
          .select('amount')
          .eq('user_id', currentUser.id)
          .eq('transaction_type', 'purchase')
          .gte('transaction_at', firstDayOfPrevMonth.toISOString())
          .lt('transaction_at', firstDayOfMonth.toISOString());
        
        if (!currentMonthError && !prevMonthError && currentMonthData && prevMonthData) {
          const currentMonthSpent = currentMonthData.reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
          const prevMonthSpent = prevMonthData.reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
          
          if (prevMonthSpent > 0) {
            spentTrend = ((currentMonthSpent - prevMonthSpent) / prevMonthSpent) * 100;
          }
        }
      } catch (error) {
        
      }
      
      // 4. 보너스 캐시 잔액 조회 - user_balances 테이블의 free_balance
      let bonusCash = 0;
      let bonusTrend = 0.5;
      
      try {
        // 사용자의 free_balance 조회
        const { data: balanceData, error: balanceError } = await supabase
          .from('user_balances')
          .select('free_balance')
          .eq('user_id', currentUser.id)
          .single();
        
        if (!balanceError && balanceData) {
          bonusCash = balanceData.free_balance || 0;
        }
        
        // 이전 달의 무료 캐시 내역 조회 (트렌드 계산용)
        const { data: freeHistoryData, error: freeHistoryError } = await supabase
          .from('user_cash_history')
          .select('amount, transaction_at')
          .eq('user_id', currentUser.id)
          .eq('balance_type', 'free')
          .order('transaction_at', { ascending: false })
          .limit(10);
        
        if (!freeHistoryError && freeHistoryData && freeHistoryData.length > 1) {
          // 최근 거래 내역을 기준으로 트렌드 계산
          const recentTransactions = freeHistoryData.slice(0, 5);
          const olderTransactions = freeHistoryData.slice(5, 10);
          
          const recentSum = recentTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
          const olderSum = olderTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
          
          if (olderSum !== 0) {
            // 변화율 계산 (%)
            bonusTrend = ((recentSum - olderSum) / Math.abs(olderSum)) * 100;
          }
        }
      } catch (error) {
        
      }
      
      // 상태 업데이트
      setStats({
        currentBalance: { 
          count: userCash, 
          trend: parseFloat(cashTrend.toFixed(1)) || 0.5
        },
        activeCampaigns: { 
          count: activeCampaignsCount, 
          trend: parseFloat(campaignsTrend.toFixed(1)) || 0.5
        },
        totalSpent: { 
          count: totalSpent, 
          trend: parseFloat(spentTrend.toFixed(1)) || 0.5
        },
        bonusCash: { 
          count: bonusCash, 
          trend: parseFloat(bonusTrend.toFixed(1)) || 0.5
        }
      });
      
      // 활성 캠페인 데이터 가져오기 (슬롯)
      try {
        const { data: slotsData, error: slotsError } = await supabase
          .from('slots')
          .select(`
            id,
            product_id,
            status,
            created_at,
            updated_at,
            campaigns:product_id (
              campaign_name,
              logo,
              efficiency
            )
          `)
          .eq('user_id', currentUser.id)
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(5);
        
        if (!slotsError && slotsData && slotsData.length > 0) {
          // 실제 슬롯 데이터가 있는 경우 사용
          const formattedCampaigns = slotsData.map((slot, index) => {
            const campaign = slot.campaigns as { campaign_name?: string; logo?: string; efficiency?: number; service_type?: string } || {};
            const campaignName = campaign.campaign_name || '알 수 없는 캠페인';
            const serviceType = campaign.service_type || '네이버';
            
            // 현재 날짜를 기준으로 임의의 시작일과 종료일 생성
            const today = new Date();
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - Math.floor(Math.random() * 30)); // 0~30일 전
            
            const endDate = new Date(today);
            endDate.setDate(today.getDate() + Math.floor(Math.random() * 60) + 30); // 30~90일 후
            
            const formatDate = (date: Date) => {
              return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            };
            
            // 임의의 입력 데이터 생성
            const inputData = `키워드${index + 1} 외 ${Math.floor(Math.random() * 10) + 1}건`;
            
            return {
              id: `SLOT-${slot.id.substring(0, 4)}`,
              name: `${serviceType}-${campaignName}`,
              service_type: serviceType,
              client: '클라이언트 정보',
              status: slot.status === 'active' ? '진행중' : '대기중',
              input_data: inputData,
              start_date: formatDate(startDate),
              end_date: formatDate(endDate)
            };
          });
          
          setActiveCampaigns(formattedCampaigns);
        }
      } catch (error) {
        
      }
    } catch (error) {
      
      toast.error('통계 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 클라이언트 리스트 데이터
  const clientList = [
    { id: 'CL-001', name: '메가 브랜드', campaigns: 5, totalSpend: 12500000, status: '활성' },
    { id: 'CL-002', name: '퍼포먼스 브랜드', campaigns: 3, totalSpend: 8200000, status: '활성' },
    { id: 'CL-003', name: '디자인 슈퍼', campaigns: 4, totalSpend: 9400000, status: '활성' },
    { id: 'CL-004', name: '리테일 마스터', campaigns: 2, totalSpend: 4800000, status: '활성' },
    { id: 'CL-005', name: '서비스 원', campaigns: 3, totalSpend: 6300000, status: '휴면' },
  ];

  // 진행 상태에 따른 색상 지정
  const getStatusColor = (status: string) => {
    switch (status) {
      case '진행중': return 'bg-green-100 text-green-800';
      case '검토중': return 'bg-amber-100 text-amber-800';
      case '대기중': return 'bg-gray-100 text-gray-800';
      case '활성': return 'bg-emerald-100 text-emerald-800';
      case '휴면': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 진행률 색상 계산
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  // 금액을 천 단위 쉼표가 있는 형식으로 변환
  const formatNumberWithCommas = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // 금액 선택 핸들러 (누적 방식)
  const handleAmountSelect = (amount: string) => {
    const currentAmount = chargeAmount ? parseInt(chargeAmount) : 0;
    const addAmount = parseInt(amount);
    const newAmount = (currentAmount + addAmount).toString();
    
    setChargeAmount(newAmount);
  };

  // 활성 캠페인 로드 함수
  const loadAvailableCampaigns = async () => {
    try {
      if (!currentUser) return;
      
      // Supabase에서 활성 상태인 캠페인만 로드 시도
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, campaign_name, service_type, unit_price, min_quantity')
        .eq('status', 'active');
        
      if (error) {
        console.error('캠페인 데이터 로드 중 오류:', error);
        
        // status 필드 관련 오류인 경우 필터링 없이 다시 시도
        if (error.message && error.message.includes("status")) {
          // status 필드 필터링 실패, 필터링 없이 재시도
          
          // status 필터링 없이 다시 시도
          const { data: allData, error: secondError } = await supabase
            .from('campaigns')
            .select('id, campaign_name, service_type, unit_price, min_quantity');
            
          if (!secondError && allData) {
            setAvailableCampaigns(allData);
            return;
          }
        }
        
        setAvailableCampaigns([]);
        return;
      }
      
      if (data && data.length > 0) {
        setAvailableCampaigns(data);
      } else {
        setAvailableCampaigns([]);
      }
    } catch (error) {
      console.error('캠페인 데이터 로드 중 예외 발생:', error);
      setAvailableCampaigns([]);
    }
  };
  
  // 캠페인 선택 시 호출되는 함수
  const handleCampaignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const campaignId = e.target.value;
    
    if (!campaignId) {
      setSelectedCampaign('');
      setQuantity(1); // 캠페인 초기화 시 수량도 기본값으로 초기화
      setTotalPrice(0);
      return;
    }
    
    // 선택된 캠페인 찾기
    const selected = availableCampaigns.find(campaign => {
      // 문자열로 변환하여 비교 (타입 불일치 방지)
      return String(campaign.id) === String(campaignId);
    });
    
    if (selected) {
      // 수량을 최소 수량으로 바로 설정
      setQuantity(selected.min_quantity);
      setSelectedCampaign(campaignId);
      setTotalPrice(selected.unit_price * selected.min_quantity);
    } else {
      setSelectedCampaign(''); // 캠페인을 찾을 수 없을 때는 선택을 초기화
      setQuantity(1);
      setTotalPrice(0);
    }
  };
  
  // 수량 변경 함수
  const handleQuantityChange = (newQuantity: number) => {
    if (!selectedCampaign) {
      return;
    }
    
    // 문자열로 변환하여 비교 (타입 불일치 방지)
    const selected = availableCampaigns.find(campaign => String(campaign.id) === String(selectedCampaign));
    if (!selected) {
      return;
    }
    
    // 최소 수량 검증
    if (newQuantity < selected.min_quantity) {
      newQuantity = selected.min_quantity;
    }
    
    // 수량과 총액 업데이트
    setQuantity(newQuantity);
    setTotalPrice(selected.unit_price * newQuantity);
  };
  
  // 캠페인 구매 함수
  const handlePurchaseCampaign = async () => {
    try {
      if (!currentUser || !selectedCampaign || quantity <= 0) {
        toast.error('캠페인과 수량을 선택해주세요.');
        return;
      }
      
      // 현재 선택된 캠페인 정보 찾기
      // 문자열로 변환하여 비교 (타입 불일치 방지)
      const selected = availableCampaigns.find(campaign => String(campaign.id) === String(selectedCampaign));
      if (!selected) {
        toast.error('선택한 캠페인 정보를 찾을 수 없습니다.');
        return;
      }
      
      // 현재 잔액 확인
      const balance = await getUserCashBalance(currentUser.id || '');
      if (balance < totalPrice) {
        toast.error('잔액이 부족합니다. 충전 후 다시 시도해주세요.');
        return;
      }
      
      // 구매 처리 로직 - 실제로는 슬롯 생성 및 캐시 차감 API 호출 필요
      toast.success('캠페인 구매가 완료되었습니다.');
      
      // 데이터 갱신
      setSelectedCampaign('');
      setQuantity(1);
      setTotalPrice(0);
      loadStats();
      
    } catch (error) {
      
      toast.error('캠페인 구매 중 오류가 발생했습니다.');
    }
  };
  
  // 캐시 충전 함수
  const handleCashCharge = async () => {
    try {
      setError(null);
      
      console.log('=== 캐시 충전 요청 시작 ===');
      console.log('현재 사용자:', currentUser);
      console.log('충전 금액:', chargeAmount);
      console.log('입금자명:', depositorName);
      
      if (!currentUser) {
        setError('로그인이 필요합니다.');
        return;
      }

      if (!chargeAmount || Number(chargeAmount) <= 0) {
        setError('충전할 금액을 입력해주세요.');
        return;
      }

      if (!depositorName.trim()) {
        setError('입금자명을 입력해주세요.');
        return;
      }

      setIsLoading(true);

      console.log('CashService.createChargeRequest 호출 전');
      console.log('매개변수:', {
        userId: currentUser.id || '',
        amount: Number(chargeAmount),
        depositorName: depositorName.trim()
      });

      const result = await CashService.createChargeRequest(
        currentUser.id || '',
        Number(chargeAmount),
        depositorName.trim()
      );

      console.log('CashService.createChargeRequest 결과:', result);

      if (result.success) {
        toast.success('충전 요청이 완료되었습니다. 관리자 승인 후 충전됩니다.');
        // 폼 초기화
        setChargeAmount('');
        setDepositorName('');
        setKoreanAmount('');
        console.log('충전 요청 성공 - 폼 초기화 완료');
      } else {
        console.error('충전 요청 실패:', result.message);
        setError(result.message);
        toast.error(result.message);
      }
    } catch (err: any) {
      console.error('캐시 충전 중 예외 발생:', err);
      const errorMessage = err.message || '충전 요청 중 오류가 발생했습니다.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      console.log('=== 캐시 충전 요청 종료 ===');
    }
  };
  
  // 금액을 한글 단위로 변환 (억, 만)
  const formatToKorean = (value: string): string => {
    if (!value) return '';

    const num = parseInt(value);

    // 값이 0이면 '0'을 반환
    if (num === 0)
      return '0';

    const eok = Math.floor(num / 100000000);
    const man = Math.floor((num % 100000000) / 10000);
    const rest = num % 10000;

    let result = '';

    if (eok > 0) {
      result += formatNumberWithCommas(eok) + '억 ';
    }

    if (man > 0) {
      result += formatNumberWithCommas(man) + '만 ';
    }

    if (rest > 0) {
      result += formatNumberWithCommas(rest);
    }

    return result.trim();
  };
  
  // 캐시 설정 불러오기
  const fetchCashSetting = async () => {
    if (!currentUser) return;

    try {
      const result = await CashService.getCashSetting(currentUser.id || '');

      if (result.success && result.data) {
        const settingData = result.data;
        setCashSetting(settingData);
        
        // 포인트 표시 여부 설정
        const showPoints = settingData.free_cash_percentage > 0;
        setShowPointInfo(showPoints);
      } else {
        setShowPointInfo(false);
      }
    } catch (err) {
      setShowPointInfo(false);
    }
  };

  // 보너스(무료캐시) 금액 계산
  const calculateBonusAmount = () => {
    if (!cashSetting || !chargeAmount) {
      setBonusAmount(0);
      setIsEligibleForBonus(false);
      return;
    }

    const amount = parseInt(chargeAmount);

    // 최소 충전 금액 이상인지 확인
    if (amount >= cashSetting.min_request_amount) {
      const bonus = Math.floor((amount * cashSetting.free_cash_percentage) / 100);
      setBonusAmount(bonus);
      setIsEligibleForBonus(true);
    } else {
      setBonusAmount(0);
      setIsEligibleForBonus(false);
    }
  };

  // 금액이 변경될 때마다 한글 단위 표시 업데이트 및 보너스 금액 계산
  useEffect(() => {
    if (chargeAmount) {
      setKoreanAmount(formatToKorean(chargeAmount));
      calculateBonusAmount();
    } else {
      setKoreanAmount('');
      setBonusAmount(0);
      setIsEligibleForBonus(false);
    }

    // 입력값이 '0'일 때 특별 처리
    if (chargeAmount === '0') {
      setKoreanAmount('0');
    }
  }, [chargeAmount, cashSetting]);

  // 거래 내역 로드 함수
  const loadTransactionHistory = async () => {
    try {
      if (!currentUser) return;
      
      // 사용자의 거래 내역 로드
      const { data, error } = await supabase
        .from('user_cash_history')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('transaction_at', { ascending: false })
        .limit(10);
      
      if (error) {
        
        setTransactionHistory([]);
        return;
      }
      
      if (data && data.length > 0) {
        const formattedHistory = data.map(tx => {
          // 거래 유형에 따른 내용 설정
          let content = '';
          let subContent = '';
          
          if (tx.transaction_type === 'charge') {
            content = '캐시 충전';
          } else if (tx.transaction_type === 'purchase') {
            content = '캠페인 구매';
            // 캠페인 구매일 경우 추가 정보
            if (tx.meta && tx.meta.campaign_name) {
              subContent = tx.meta.campaign_name;
            } else if (tx.meta && tx.meta.package_name) {
              subContent = tx.meta.package_name;
            } else {
              subContent = '광고 패키지';
            }
          } else if (tx.transaction_type === 'bonus') {
            content = '보너스 캐시 적립';
          }
          
          // 날짜 포맷팅
          const date = new Date(tx.transaction_at);
          const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          
          return {
            id: `TRX-${tx.id.substring(0, 4)}`,
            content,
            subContent,
            date: formattedDate,
            amount: tx.amount,
            status: tx.status || '완료'
          };
        });
        
        setTransactionHistory(formattedHistory);
      } else {
        setTransactionHistory([]);
      }
    } catch (error) {
      
      setTransactionHistory([]);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadStats();
    loadAvailableCampaigns();
    loadTransactionHistory();
    fetchCashSetting(); // 캐시 설정 불러오기 추가
    
    // 1분마다 데이터 자동 갱신
    const refreshInterval = setInterval(() => {
      loadStats();
      loadTransactionHistory();
    }, 60 * 1000);
    
    // 컴포넌트 언마운트 시 인터벌 클리어
    return () => clearInterval(refreshInterval);
  }, [currentUser]);

  return (
    <DashboardTemplate
      title="대행사 대시보드"
      description="클라이언트 및 캠페인을 관리하고 마케팅 성과를 추적할 수 있는 관리 시스템입니다."
      // 역할 기반 테마 적용
      headerTextClass="text-white"
      toolbarActions={
        loading && (
          <div className="flex items-center ml-2">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            <span className="text-white text-xs">데이터 로드 중...</span>
          </div>
        )
      }
    >
      {/* 첫 번째 줄: 4개의 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <DashboardColorCard
          title="현재 캐시 잔액"
          value={isMobile ? stats.currentBalance.count / 10000 : stats.currentBalance.count}
          unit={isMobile ? "만원" : "원"}
          trend={0} // 요율 제거 (0으로 설정)
          icon="dollar"
          iconColor="bg-green-600"
        />
        <DashboardColorCard
          title="진행 중인 캠페인"
          value={stats.activeCampaigns.count}
          unit="개"
          trend={0} // 요율 제거 (0으로 설정)
          icon="rocket"
          iconColor="bg-blue-600"
        />
        <DashboardColorCard
          title="총 구매액"
          value={isMobile ? stats.totalSpent.count / 10000 : stats.totalSpent.count}
          unit={isMobile ? "만원" : "원"}
          trend={0} // 요율 제거 (0으로 설정)
          icon="dollar"
          iconColor="bg-purple-600"
        />
        <DashboardColorCard
          title="보너스 캐시"
          value={isMobile ? stats.bonusCash.count / 10000 : stats.bonusCash.count}
          unit={isMobile ? "만원" : "원"}
          trend={0} // 요율 제거 (0으로 설정)
          icon="gift"
          iconColor="bg-amber-600"
        />
      </div>

      {/* 두 번째 줄: 캠페인 구매 카드 & 캐시 충전 신청 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* 캠페인 구매 카드 */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-100 text-blue-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">캠페인 구매</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-4">
              전체 보기
            </Button>
          </div>
          <div className="p-5">
            <div className="text-sm text-gray-600 mb-4">
              활성화된 캠페인을 선택하고 수량을 조정하여 구매할 수 있습니다.
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="mb-3">
                <label htmlFor="campaign-select" className="block text-sm font-medium text-gray-700 mb-1">캠페인 선택</label>
                <select 
                  id="campaign-select"
                  className="select w-full h-10 py-2 px-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring text-foreground dark:bg-gray-800 dark:border-gray-700"
                  value={selectedCampaign}
                  onChange={handleCampaignChange}
                >
                  <option value="">캠페인을 선택하세요</option>
                  {availableCampaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.service_type ? `${campaign.service_type}-` : ""}{campaign.campaign_name} ({formatCurrency(campaign.unit_price)}/개)
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">수량 선택</label>
                  {selectedCampaign && (
                    <span className="text-xs text-gray-500">
                      최소수량: {availableCampaigns.find(campaign => String(campaign.id) === String(selectedCampaign))?.min_quantity || 1}개
                    </span>
                  )}
                </div>
                <div className="flex items-center">
                  <button 
                    className="w-10 h-10 bg-muted rounded-l-md border border-input flex items-center justify-center hover:bg-muted/60 text-foreground dark:bg-gray-800 dark:border-gray-700"
                    onClick={(e) => {
                      e.preventDefault(); // 기본 동작 방지
                      if (selectedCampaign) {
                        handleQuantityChange(Math.max(1, quantity - 1));
                      }
                    }}
                    disabled={!selectedCampaign}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-foreground/70" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <input 
                    type="number" 
                    className="h-10 w-16 border-y border-input bg-background text-center text-foreground dark:bg-gray-800 dark:border-gray-700"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      if (selectedCampaign) {
                        handleQuantityChange(val);
                      }
                    }}
                    disabled={!selectedCampaign}
                  />
                  <button 
                    className="w-10 h-10 bg-muted rounded-r-md border border-input flex items-center justify-center hover:bg-muted/60 text-foreground dark:bg-gray-800 dark:border-gray-700"
                    onClick={(e) => {
                      e.preventDefault(); // 기본 동작 방지
                      if (selectedCampaign) {
                        handleQuantityChange(quantity + 1);
                      }
                    }}
                    disabled={!selectedCampaign}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-foreground/70" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="ml-3 text-sm text-gray-600">
                    <span>총 금액: <span className="font-medium">{formatCurrency(totalPrice)}</span></span>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="default" 
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
                onClick={handlePurchaseCampaign}
                disabled={!selectedCampaign || quantity <= 0}
              >
                구매하기
              </Button>
            </div>
            
            <Button
              variant="outline"
              className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={() => navigate('/advertise/campaigns/info/naver-traffic')}
            >
              캠페인 소개 페이지로 이동
            </Button>
          </div>
        </Card>

        {/* 캐시 충전 신청 */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-green-100 text-green-600 mr-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <span className="font-bold">W</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">캐시 충전 신청</h3>
            </div>
            <Button
              variant="default"
              size="sm"
              className="h-8 px-4 bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate('/cash/charge')}
            >
              충전 페이지
            </Button>
          </div>
          <div className="p-5">
            {/* 오류 메시지 표시 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="flex justify-between bg-gray-50 p-3 rounded-lg mb-4">
              <span className="text-gray-600">현재 캐시 잔액</span>
              <span className="font-medium">{isMobile ? formatCurrencyInTenThousand(stats.currentBalance.count) : formatCurrency(stats.currentBalance.count)}</span>
            </div>
            
            {/* 금액 입력 필드 */}
            <div className="mb-4">
              <p className="text-muted-foreground text-sm mb-2">충전할 금액을 입력해 주세요.</p>
              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={chargeAmount ? formatNumberWithCommas(parseInt(chargeAmount)) : ''}
                    onChange={(e) => {
                      // 숫자만 입력 가능하도록
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setChargeAmount(value);
                    }}
                    placeholder="0"
                    className="w-full border-t-0 border-l-0 border-r-0 rounded-none border-b border-input text-lg focus:border-b-foreground dark:border-gray-700 dark:focus:border-b-gray-500 pl-0 pr-8 bg-transparent text-foreground placeholder:text-muted-foreground"
                  />
                  {chargeAmount && (
                    <button
                      onClick={() => setChargeAmount('')}
                      type="button"
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                    </button>
                  )}
                </div>
                {(koreanAmount || chargeAmount === '0') && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {chargeAmount === '0' ? '0원' : `${koreanAmount}원`}
                  </div>
                )}
              </div>
              <div className="h-[1px] w-full bg-gray-200 mt-1"></div>
              
              {/* 보너스 캐시 정보 표시 */}
              {chargeAmount && cashSetting && showPointInfo && (
                <div className="mt-3 p-3 bg-muted/40 rounded-md">
                  {isEligibleForBonus ? (
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground">충전 금액:</span>
                        <span className="font-medium">{formatNumberWithCommas(parseInt(chargeAmount))}원</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-foreground">무료 보너스 캐시 ({cashSetting.free_cash_percentage}%):</span>
                        <span className="font-medium text-green-600">+{formatNumberWithCommas(bonusAmount)}원</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-foreground">총 충전 금액:</span>
                        <span className="font-medium text-lg">{formatNumberWithCommas(parseInt(chargeAmount) + bonusAmount)}원</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        * 무료 캐시는 {cashSetting.expiry_months > 0 ? `${cashSetting.expiry_months}개월` : '무기한'}
                        {cashSetting.min_usage_amount > 0 && `, ${formatNumberWithCommas(cashSetting.min_usage_amount)}원 이상 결제`} 시 사용 가능합니다.
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {formatNumberWithCommas(cashSetting.min_request_amount)}원 이상 충전 시
                      <span className="text-green-600 font-medium"> {cashSetting.free_cash_percentage}% 무료 캐시</span>를 추가로 받을 수 있습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* 금액 빠른 선택 */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <button
                className="py-3 border border-gray-300 rounded text-sm bg-card hover:bg-muted/60"
                onClick={() => handleAmountSelect('10000')}
                type="button"
              >
                +1만
              </button>
              <button
                className="py-3 border border-gray-300 rounded text-sm bg-card hover:bg-muted/60"
                onClick={() => handleAmountSelect('50000')}
                type="button"
              >
                +5만
              </button>
              <button
                className="py-3 border border-gray-300 rounded text-sm bg-card hover:bg-muted/60"
                onClick={() => handleAmountSelect('100000')}
                type="button"
              >
                +10만
              </button>
              <button
                className="py-3 border border-gray-300 rounded text-sm bg-card hover:bg-muted/60"
                onClick={() => handleAmountSelect('1000000')}
                type="button"
              >
                +100만
              </button>
            </div>
            
            {/* 입금 계좌 정보 및 입금자명 */}
            {cashSetting && (cashSetting.bank_name || cashSetting.account_number || cashSetting.account_holder) && (
              <div className="mb-4">
                {/* 입금 계좌 정보 - 간략한 한 줄 표시 */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">입금계좌</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {cashSetting.bank_name} {cashSetting.account_number} ({cashSetting.account_holder})
                    </span>
                  </div>
                </div>
                
                {/* 입금자명 입력 필드 */}
                <div>
                  <label htmlFor="depositor-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    입금자명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="depositor-name"
                    type="text"
                    value={depositorName}
                    onChange={(e) => setDepositorName(e.target.value)}
                    placeholder="실제 입금하실 이름을 입력해주세요"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                  />
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleCashCharge}
              disabled={isLoading || !chargeAmount || parseInt(chargeAmount) < 10000}
              type="button"
              className={`w-full py-4 ${chargeAmount && parseInt(chargeAmount) >= 10000 && !isLoading
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600'
              } font-medium rounded-md transition-colors mt-5 ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              {isLoading ? '처리 중...' : '요청하기'}
            </Button>
            
            {showPointInfo && isEligibleForBonus && (
              <div className="text-center text-sm mt-2 text-green-600">
                {formatNumberWithCommas(bonusAmount)}원 무료 캐시가 추가로 지급됩니다!
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 세 번째 줄: 진행 중인 캠페인 리스트 */}
      <div className="grid grid-cols-1 gap-5 mb-5">
        <div className="card shadow-sm overflow-hidden border border-border rounded-lg">
          <div className="card-header p-5 pb-4 flex justify-between items-center bg-card border-b border-border">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-primary-lighter dark:bg-primary-dark mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary dark:text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-base font-medium text-card-foreground">진행 중인 캠페인 (개발필요)</h3>
            </div>
            <button className="btn btn-sm btn-outline">
              전체 보기
            </button>
          </div>
          <div className="bg-card">
            <div className="hidden md:block overflow-x-auto">
              {activeCampaigns.length > 0 ? (
                <table className="table align-middle text-sm w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-muted dark:bg-gray-800/60">
                      <th className="py-3 px-4 text-start font-medium">캠페인명</th>
                      <th className="py-3 px-4 text-start font-medium">클라이언트</th>
                      <th className="py-3 px-4 text-center font-medium">상태</th>
                      <th className="py-3 px-4 text-start font-medium">입력정보</th>
                      <th className="py-3 px-4 text-center font-medium">시작일</th>
                      <th className="py-3 px-4 text-center font-medium">종료일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCampaigns.map((campaign, index) => (
                      <tr key={index} className="border-b border-border hover:bg-muted/40">
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-primary">{campaign.name}</span>
                            <span className="text-xs text-muted-foreground">{campaign.id}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-foreground">{campaign.client}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{campaign.input_data}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-sm text-muted-foreground">{campaign.start_date}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-sm text-muted-foreground">{campaign.end_date}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-base font-medium">진행 중인 캠페인이 없습니다</p>
                    <p className="text-sm mt-1">새로운 캠페인을 구매하여 마케팅을 시작해보세요.</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* 모바일용 카드 리스트 (md 미만 화면에서만 표시) */}
            <div className="block md:hidden">
              {activeCampaigns.length > 0 ? (
                <div className="divide-y divide-border">
                  {activeCampaigns.map((campaign, index) => (
                    <div key={index} className="p-4 hover:bg-muted/40">
                      <div className="flex gap-3">
                        {/* 왼쪽: 번호 */}
                        <div className="flex-none w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground/60 font-medium text-sm">
                          {index + 1}
                        </div>
                        {/* 오른쪽: 캠페인 내용 */}
                        <div className="flex-1 min-w-0">
                          {/* 헤더: 캠페인명과 상태 */}
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="font-medium text-foreground text-sm line-clamp-1">{campaign.name}</h3>
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                              {campaign.status}
                            </span>
                          </div>
                          
                          {/* ID & 클라이언트 */}
                          <div className="flex justify-between">
                            <p className="text-xs text-muted-foreground mb-2">{campaign.id}</p>
                            <p className="text-xs font-medium">{campaign.client}</p>
                          </div>
                          
                          {/* 입력정보 */}
                          <div className="flex flex-col gap-1 text-xs mb-3">
                            <div className="flex items-start gap-1">
                              <span className="text-muted-foreground mr-1 flex-none mt-0.5">입력정보:</span>
                              <span className="font-medium text-sm">{campaign.input_data}</span>
                            </div>
                            <div className="flex justify-between mt-2">
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">시작일:</span>
                                <span className="font-medium">{campaign.start_date}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">종료일:</span>
                                <span className="font-medium">{campaign.end_date}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  진행 중인 캠페인이 없습니다
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 네 번째 줄: 거래 내역 */}
      <div className="grid grid-cols-1 gap-5 mb-5">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-amber-100 text-amber-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">거래 내역</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-4">
              전체 내역
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="py-3 px-4 text-left">거래 ID</TableHead>
                  <TableHead className="py-3 px-4 text-left">내용</TableHead>
                  <TableHead className="py-3 px-4 text-center">날짜</TableHead>
                  <TableHead className="py-3 px-4 text-right">금액(원)</TableHead>
                  <TableHead className="py-3 px-4 text-center">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionHistory.length > 0 ? (
                  transactionHistory.map((transaction, index) => (
                    <TableRow key={index} className="border-b border-gray-200">
                      <TableCell className="py-3 px-4">
                        <span className="text-xs text-gray-500">{transaction.id}</span>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{transaction.content}</span>
                          {transaction.subContent && (
                            <span className="text-xs text-gray-500">{transaction.subContent}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center">
                        <span className="text-sm text-gray-500">{transaction.date}</span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        <span className={`font-medium ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {transaction.amount < 0 ? '-' : '+'}{isMobile 
                            ? formatCurrencyInTenThousand(Math.abs(transaction.amount))
                            : formatCurrency(Math.abs(transaction.amount))}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === '완료' ? 'bg-green-100 text-green-800' : 
                          transaction.status === '진행중' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-base font-medium">거래 내역이 없습니다</p>
                        <p className="text-sm mt-1">캐시를 충전하거나 캠페인을 구매하여 첫 거래를 시작하세요.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </DashboardTemplate>
  );
};

export default DashboardContent;