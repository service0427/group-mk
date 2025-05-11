import React, { useEffect, useState } from 'react';
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
import { supabase, supabaseAdmin } from '@/supabase';
import { toast } from 'sonner';

// Supabase 테이블 인터페이스 정의
interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  status: string;
}

interface WithdrawRequest {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  requested_at: string;
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
  processed_at?: string;
  user?: User;
}

interface CashTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  transaction_at: string;
}

interface CashGlobalSettings {
  id: number;
  free_cash_percentage: number;
  min_request_amount: number;
  expiry_months: number;
}

interface CashUserSettings {
  user_id: string;
  free_cash_percentage: number;
  min_request_amount: number;
  expiry_months: number;
  is_active: boolean;
}

// 운영자 대시보드 통계 데이터 인터페이스
interface OperatorStats {
  totalDistributors: { count: number; trend: number };
  totalCampaigns: { active: number; total: number; trend: number };
  monthlyRevenue: { count: number; trend: number };
  pendingWithdrawals: { count: number; trend: number };
}

export const DashboardContent: React.FC = () => {
  // 모바일 화면 감지 (md 이하인지 여부)
  const isMobile = useResponsive('down', 'md');

  // 데이터 로딩 상태
  const [loading, setLoading] = useState(true);
  
  // 대시보드 데이터 상태 관리
  const [stats, setStats] = useState<OperatorStats>({
    totalDistributors: { count: 0, trend: 0 },
    totalCampaigns: { active: 0, total: 0, trend: 0 },
    monthlyRevenue: { count: 0, trend: 0 },
    pendingWithdrawals: { count: 0, trend: 0 },
  });
  
  // 통계 데이터 로드
  const loadStats = async () => {
    try {
      setLoading(true);
      
      // 1. 총 총판 수 (현재 & 1개월 전)
      const currentDate = new Date();
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(currentDate.getMonth() - 1);
      
      // 현재 총판 수
      const { count: currentDistributors, error: currentDistributorsError } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('role', 'distributor');
      
      if (currentDistributorsError) {
        
        throw new Error('총판 수 조회 중 오류가 발생했습니다.');
      }
      
      // 1개월 전 총판 수
      const { count: prevDistributors, error: prevDistributorsError } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('role', 'distributor')
        .lt('created_at', lastMonthDate.toISOString());
      
      if (prevDistributorsError) {
        
        throw new Error('이전 총판 수 조회 중 오류가 발생했습니다.');
      }
      
      // 총판 수 증가율 계산
      const distributorCount = currentDistributors || 0;
      const prevDistributorCount = prevDistributors || 0;
      const distributorTrend = prevDistributorCount > 0 
        ? ((distributorCount - prevDistributorCount) / prevDistributorCount) * 100 
        : 0;
      
      // 2. 총 캠페인 수 및 활성 캠페인 수
      // 전체 캠페인 수
      const { count: totalCampaigns, error: totalCampaignsError } = await supabase
        .from('campaigns')
        .select('id', { count: 'exact' });
      
      if (totalCampaignsError) {
        
        throw new Error('총 캠페인 수 조회 중 오류가 발생했습니다.');
      }
      
      // campaigns 테이블 샘플 데이터 (지금은 사용하지 않음)
      let sampleCampaign = null;
      
      // 활성 캠페인 수 (status가 'active'인 캠페인)
      let activeCampaigns = 0;
      try {
        const { count, error } = await supabase
          .from('campaigns')
          .select('id', { count: 'exact' })
          .eq('status', 'active');
        
        if (!error) {
          activeCampaigns = count || 0;
        } else {
          activeCampaigns = 0;
        }
      } catch (error) {
        activeCampaigns = 0;
      }
      
      // 1개월 전 캠페인 수
      const { count: prevCampaigns, error: prevCampaignsError } = await supabase
        .from('campaigns')
        .select('id', { count: 'exact' })
        .lt('created_at', lastMonthDate.toISOString());
      
      if (prevCampaignsError) {
        
        throw new Error('이전 캠페인 수 조회 중 오류가 발생했습니다.');
      }
      
      // 캠페인 수 증가율 계산
      const totalCampaignCount = totalCampaigns || 0;
      const activeCampaignCount = activeCampaigns; // 임시값 사용
      const prevCampaignCount = prevCampaigns || 0;
      const campaignTrend = prevCampaignCount > 0 
        ? ((totalCampaignCount - prevCampaignCount) / prevCampaignCount) * 100 
        : 0;
      
      // 3. 월 거래액 (현재 월의 purchase 트랜잭션 합)
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString();
      const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();
      
      // 현재 월 거래액
      const { data: currentTransactions, error: currentTransactionsError } = await supabase
        .from('user_cash_history')
        .select('amount')
        .eq('transaction_type', 'purchase')
        .gte('transaction_at', startOfMonth)
        .lte('transaction_at', endOfMonth);
      
      if (currentTransactionsError) {
        
        throw new Error('현재 월 거래액 조회 중 오류가 발생했습니다.');
      }
      
      // 이전 월 거래액
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const startOfPrevMonth = new Date(prevYear, prevMonth - 1, 1).toISOString();
      const endOfPrevMonth = new Date(prevYear, prevMonth, 0, 23, 59, 59).toISOString();
      
      const { data: prevTransactions, error: prevTransactionsError } = await supabase
        .from('user_cash_history')
        .select('amount')
        .eq('transaction_type', 'purchase')
        .gte('transaction_at', startOfPrevMonth)
        .lte('transaction_at', endOfPrevMonth);
      
      if (prevTransactionsError) {
        
        throw new Error('이전 월 거래액 조회 중 오류가 발생했습니다.');
      }
      
      // 월 거래액 계산
      const currentRevenue = currentTransactions?.reduce((sum, transaction) => 
        sum + Math.abs(transaction.amount), 0) || 0;
      
      const prevRevenue = prevTransactions?.reduce((sum, transaction) => 
        sum + Math.abs(transaction.amount), 0) || 0;
      
      // 월 거래액 증가율 계산
      const revenueTrend = prevRevenue > 0 
        ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 
        : 0;
      
      // 4. 보류 중인 출금 요청 금액 합계
      const { data: pendingWithdrawals, error: pendingWithdrawalsError } = await supabase
        .from('withdraw_requests')
        .select('amount')
        .eq('status', 'pending');
      
      if (pendingWithdrawalsError) {
        
        throw new Error('보류 중인 출금 요청 조회 중 오류가 발생했습니다.');
      }
      
      // 보류 중인 출금 요청 금액 합계 계산
      const pendingWithdrawalAmount = pendingWithdrawals?.reduce((sum, withdrawal) => 
        sum + withdrawal.amount, 0) || 0;
      
      // 이전 데이터가 없으면 임의로 2% 증가로 설정 (실제 환경에서는 더 정확한 계산 필요)
      const withdrawalTrend = 2;
      
      // 상태 업데이트
      setStats({
        totalDistributors: { 
          count: distributorCount, 
          trend: parseFloat(distributorTrend.toFixed(1)) 
        },
        totalCampaigns: { 
          active: activeCampaignCount,
          total: totalCampaignCount, 
          trend: parseFloat(campaignTrend.toFixed(1)) 
        },
        monthlyRevenue: { 
          count: currentRevenue, 
          trend: parseFloat(revenueTrend.toFixed(1))
        },
        pendingWithdrawals: { 
          count: pendingWithdrawalAmount, 
          trend: withdrawalTrend
        },
      });
      
    } catch (error) {
      
      toast.error('통계 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 캐시 지급 설정 관련 상태 관리
  const [cashSettings, setCashSettings] = useState<CashGlobalSettings | null>(null);
  const [defaultBonusRate, setDefaultBonusRate] = useState("");
  const [individualBonusRate, setIndividualBonusRate] = useState("5"); // 기본값 5%
  const [individualAccount, setIndividualAccount] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  
  // 캐시 설정 로드
  const loadCashSettings = async () => {
    try {
      // 전역 캐시 설정 로드
      const { data, error } = await supabase
        .from('cash_global_settings')
        .select('*')
        .order('id', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        
        throw new Error('캐시 설정을 불러오는 중 오류가 발생했습니다.');
      }
      
      if (data) {
        setCashSettings(data);
        setDefaultBonusRate(String(data.free_cash_percentage || 0));
      }
    } catch (error) {
      
      toast.error('캐시 설정을 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 출금 요청 관리 데이터
  const [withdrawalRequests, setWithdrawalRequests] = useState<Array<{
    id: string;
    name: string;
    amount: number;
    date: string;
    user_id?: string;
  }>>([]);
  
  // 출금 요청 데이터 로드
  const loadWithdrawalRequests = async () => {
    try {
      // 출금 요청 중 status가 pending인 항목만 조회
      const { data, error } = await supabase
        .from('withdraw_requests')
        .select(`
          id,
          user_id,
          amount,
          requested_at,
          users!withdraw_requests_user_id_fkey (
            full_name,
            role
          )
        `)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false })
        .limit(5);
      
      if (error) {
        
        throw new Error('출금 요청 데이터를 불러오는 중 오류가 발생했습니다.');
      }
      
      // 총판 역할을 가진 사용자의 출금 요청만 필터링
      const distributorRequests = data
        ?.filter(request => {
          // users는 배열로 반환되므로 첫 번째 항목 사용 (조인 관계)
          const userInfo = Array.isArray(request.users) ? request.users[0] : null;
          return userInfo?.role === 'distributor';
        })
        ?.map(request => {
          // users는 배열로 반환되므로 첫 번째 항목 사용 (조인 관계)
          const userInfo = Array.isArray(request.users) ? request.users[0] : null;
          return {
            id: request.id,
            name: userInfo?.full_name || '이름 없음',
            amount: request.amount,
            date: new Date(request.requested_at).toISOString().split('T')[0],
            user_id: request.user_id
          };
        }) || [];
      
      setWithdrawalRequests(distributorRequests);
    } catch (error) {
      
    }
  };

  // 총판 관리 데이터
  const [distributorList, setDistributorList] = useState<Array<{
    id: string;
    name: string;
    productCount: number;
    revenue: number;
  }>>([]);
  
  // 총판 데이터 로드
  const loadDistributors = async () => {
    try {
      // 1. 먼저 총판 역할을 가진 사용자 목록을 가져옴
      const { data: distributors, error: distributorsError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'distributor')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (distributorsError) {
        
        throw new Error('총판 목록을 불러오는 중 오류가 발생했습니다.');
      }
      
      if (!distributors || distributors.length === 0) {
        setDistributorList([]);
        return;
      }
      
      // campaigns 테이블 구조 확인을 위한 샘플 데이터
      let campaignSample;
      try {
        const { data } = await supabase
          .from('campaigns')
          .select('*')
          .limit(1);
          
        campaignSample = data;
      } catch (error) {
        campaignSample = null;
      }
      
      // 총판별 캠페인 수와 매출을 가져오기 위한 Promise 배열
      const distributorDataPromises = distributors.map(async (distributor) => {
        let productCount = 0;
        
        // campaigns 테이블에서 creator_id 또는 user_id로 필터링 시도
        try {
          // 2. 총판별 캠페인 수 - 다양한 컬럼 이름 시도
          if (campaignSample && campaignSample[0]) {
            if ('creator_id' in campaignSample[0]) {
              const { count, error } = await supabase
                .from('campaigns')
                .select('id', { count: 'exact' })
                .eq('creator_id', distributor.id);
              
              if (!error) productCount = count || 0;
            } else if ('user_id' in campaignSample[0]) {
              const { count, error } = await supabase
                .from('campaigns')
                .select('id', { count: 'exact' })
                .eq('user_id', distributor.id);
              
              if (!error) productCount = count || 0;
            } else if ('distributor_id' in campaignSample[0]) {
              const { count, error } = await supabase
                .from('campaigns')
                .select('id', { count: 'exact' })
                .eq('distributor_id', distributor.id);
              
              if (!error) productCount = count || 0;
            }
          }
        } catch (error) {
          productCount = 0; // 오류 발생 시 0으로 설정
        }
        
        // 3. 총판별 매출 (user_cash_history 테이블에서 해당 총판의 거래 합계)
        let revenue = 0;
        try {
          const { data: transactions, error: transactionsError } = await supabase
            .from('user_cash_history')
            .select('amount')
            .eq('mat_id', distributor.id) // mat_id가 총판 ID를 나타낸다고 가정
            .eq('transaction_type', 'purchase');
          
          if (!transactionsError) {
            // 매출 총액 계산
            revenue = transactions?.reduce((sum, transaction) => 
              sum + Math.abs(transaction.amount), 0) || 0;
          }
        } catch (error) {
          revenue = 0;
        }
        
        return {
          id: distributor.id.substring(0, 8), // ID 앞 8자리만 사용
          name: distributor.full_name || '이름 없음',
          productCount: productCount || 0,
          revenue: revenue
        };
      });
      
      // 모든 Promise가 완료될 때까지 기다림
      const distributorData = await Promise.all(distributorDataPromises);
      
      // 매출액 기준으로 내림차순 정렬
      const sortedDistributorData = distributorData.sort((a, b) => b.revenue - a.revenue);
      
      setDistributorList(sortedDistributorData);
    } catch (error) {
      
    }
  };

  // 기본 보너스 지급률 적용 처리 함수
  const handleApplyDefaultBonus = async () => {
    try {
      setSettingsLoading(true);
      
      // 입력값 검증
      const bonusRate = parseFloat(defaultBonusRate);
      if (isNaN(bonusRate) || bonusRate < 0 || bonusRate > 100) {
        toast.error('0에서 100 사이의 유효한 숫자를 입력하세요.');
        return;
      }
      
      // 전역 설정이 없는 경우 새로 생성
      if (!cashSettings) {
        const { data, error } = await supabase
          .from('cash_global_settings')
          .insert({
            free_cash_percentage: bonusRate,
            min_request_amount: 10000, // 기본값
            expiry_months: 3 // 기본값
          })
          .select()
          .single();
        
        if (error) {
          
          throw new Error('캐시 설정을 생성하는 중 오류가 발생했습니다.');
        }
        
        setCashSettings(data);
        toast.success(`기본 보너스 ${bonusRate}%로 설정되었습니다.`);
      } else {
        // 기존 설정 업데이트
        const { error } = await supabase
          .from('cash_global_settings')
          .update({
            free_cash_percentage: bonusRate
          })
          .eq('id', cashSettings.id);
        
        if (error) {
          
          throw new Error('캐시 설정을 업데이트하는 중 오류가 발생했습니다.');
        }
        
        setCashSettings({
          ...cashSettings,
          free_cash_percentage: bonusRate
        });
        
        toast.success(`기본 보너스가 ${bonusRate}%로 업데이트되었습니다.`);
      }
    } catch (error) {
      
      toast.error('기본 보너스 설정 중 오류가 발생했습니다.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // 개별 보너스 적용 처리 함수
  const handleApplyIndividualBonus = async () => {
    try {
      setSettingsLoading(true);
      
      // 입력값 검증
      if (!individualAccount) {
        toast.error('계정을 입력해주세요.');
        return;
      }
      
      const bonusRate = parseFloat(individualBonusRate);
      if (isNaN(bonusRate) || bonusRate < 0 || bonusRate > 100) {
        toast.error('0에서 100 사이의 유효한 숫자를 입력하세요.');
        return;
      }
      
      // 사용자 확인
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .or(`email.ilike.%${individualAccount}%,full_name.ilike.%${individualAccount}%`)
        .limit(1)
        .single();
      
      if (userError) {
        
        toast.error('해당 계정을 찾을 수 없습니다.');
        return;
      }
      
      // 기존 사용자 설정 확인
      const { data: existingSettings, error: settingsError } = await supabase
        .from('cash_user_settings')
        .select('*')
        .eq('user_id', userData.id)
        .single();
      
      if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 is "not found"
        
        throw new Error('사용자 설정을 조회하는 중 오류가 발생했습니다.');
      }
      
      // 기존 설정이 없으면 생성, 있으면 업데이트
      let result;
      if (!existingSettings) {
        // 새 설정 생성
        const { data, error } = await supabase
          .from('cash_user_settings')
          .insert({
            user_id: userData.id,
            free_cash_percentage: bonusRate,
            min_request_amount: cashSettings?.min_request_amount || 10000,
            expiry_months: cashSettings?.expiry_months || 3,
            is_active: true
          });
        
        result = { data, error };
      } else {
        // 기존 설정 업데이트
        const { data, error } = await supabase
          .from('cash_user_settings')
          .update({
            free_cash_percentage: bonusRate,
            is_active: true
          })
          .eq('user_id', userData.id);
        
        result = { data, error };
      }
      
      if (result.error) {
        
        throw new Error('사용자 설정을 저장하는 중 오류가 발생했습니다.');
      }
      
      toast.success(`${userData.full_name || userData.email}의 보너스가 ${bonusRate}%로 설정되었습니다.`);
      setIndividualAccount(''); // 입력 필드 초기화
      setIndividualBonusRate(''); // 보너스율 필드도 초기화
    } catch (error) {
      
      toast.error('개별 보너스 설정 중 오류가 발생했습니다.');
    } finally {
      setSettingsLoading(false);
    }
  };
  
  // 설정 초기화 함수
  const handleResetSettings = async () => {
    try {
      setSettingsLoading(true);
      
      // 기본 보너스율을 5%로 변경
      const defaultBonus = 5;
      
      // 전역 설정이 없는 경우 새로 생성
      if (!cashSettings) {
        const { data, error } = await supabase
          .from('cash_global_settings')
          .insert({
            free_cash_percentage: defaultBonus,
            min_request_amount: 10000, // 기본값
            expiry_months: 3 // 기본값
          })
          .select()
          .single();
        
        if (error) {
          
          throw new Error('캐시 설정을 초기화하는 중 오류가 발생했습니다.');
        }
        
        setCashSettings(data);
      } else {
        // 기존 설정 업데이트
        const { error } = await supabase
          .from('cash_global_settings')
          .update({
            free_cash_percentage: defaultBonus
          })
          .eq('id', cashSettings.id);
        
        if (error) {
          
          throw new Error('캐시 설정을 업데이트하는 중 오류가 발생했습니다.');
        }
        
        setCashSettings({
          ...cashSettings,
          free_cash_percentage: defaultBonus
        });
      }
      
      // 입력 필드 초기화
      setDefaultBonusRate(String(defaultBonus));
      setIndividualBonusRate('');
      setIndividualAccount('');
      
      toast.success('캐시 설정이 초기화되었습니다.');
    } catch (error) {
      
      toast.error('설정 초기화 중 오류가 발생했습니다.');
    } finally {
      setSettingsLoading(false);
    }
  };
  
  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadStats();
    loadWithdrawalRequests();
    loadDistributors();
    loadCashSettings();
    
    // 1분마다 데이터 자동 갱신
    const refreshInterval = setInterval(() => {
      loadStats();
      loadWithdrawalRequests();
      loadDistributors();
      loadCashSettings();
    }, 60 * 1000);
    
    // 컴포넌트 언마운트 시 인터벌 클리어
    return () => clearInterval(refreshInterval);
  }, []);

  return (
    <DashboardTemplate
      title="운영자 대시보드"
      description="총판 및 개별을 관리하고 시스템 설정을 변경할 수 있는 중앙 관리 시스템입니다. 운영자 권한이 있는 사용자만 접근할 수 있습니다."
      headerBgClass="bg-indigo-600"
      headerTextClass="text-white"
    >
      {/* 첫 번째 줄: 4개의 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <DashboardColorCard
          title="총 총판 수"
          value={stats.totalDistributors.count}
          unit="개"
          trend={0} // 요율 제거 (0으로 설정)
          icon="element-11"
          iconColor="bg-purple-600"
        />
        <DashboardColorCard
          title="활성 캠페인 수"
          value={stats.totalCampaigns.active}
          unit={`개 (총 ${stats.totalCampaigns.total.toLocaleString()}개)`}
          trend={0} // 요율 제거 (0으로 설정)
          icon="basket"
          iconColor="bg-blue-600"
        />
        <DashboardColorCard
          title="월 거래액"
          value={isMobile ? stats.monthlyRevenue.count / 10000 : stats.monthlyRevenue.count}
          unit={isMobile ? "만원" : "원"}
          trend={0} // 요율 제거 (0으로 설정)
          icon="dollar"
          iconColor="bg-green-600"
        />
        <DashboardColorCard
          title="보류 중인 출금"
          value={isMobile ? stats.pendingWithdrawals.count / 10000 : stats.pendingWithdrawals.count}
          unit={isMobile ? "만원" : "원"}
          trend={0} // 요율 제거 (0으로 설정)
          icon="bank"
          iconColor="bg-amber-600"
        />
      </div>

      {/* 두 번째 줄: 출금 요청 관리 & 총판 관리 테이블 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* 출금 요청 관리 */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-indigo-100 text-indigo-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1.5V3a1 1 0 00-1-1h-5a1 1 0 00-1 1v1H4zm6 1V3h3v2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">총판 출금 요청 관리</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-4">
              요청 목록
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="py-3 px-4 text-left">ID</TableHead>
                  <TableHead className="py-3 px-4 text-left">총판명</TableHead>
                  <TableHead className="py-3 px-4 text-right">금액(원)</TableHead>
                  <TableHead className="py-3 px-4 text-center">요청일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawalRequests.map((request, index) => (
                  <TableRow key={index} className="border-b border-gray-200">
                    <TableCell className="py-3 px-4">
                      <span className="font-medium text-indigo-600">{request.id}</span>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span>{request.name}</span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <span className="font-medium">
                        {isMobile
                          ? formatCurrencyInTenThousand(request.amount)
                          : formatCurrency(request.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <span className="text-gray-500">{request.date}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* 총판 관리 */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-green-100 text-green-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">총판 관리</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="py-3 px-4 text-left">ID</TableHead>
                  <TableHead className="py-3 px-4 text-left">총판명</TableHead>
                  <TableHead className="py-3 px-4 text-center">상품 수</TableHead>
                  <TableHead className="py-3 px-4 text-right">총 매출(원)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distributorList.map((distributor, index) => (
                  <TableRow key={index} className="border-b border-gray-200">
                    <TableCell className="py-3 px-4">
                      <span className="font-medium text-green-600">{distributor.id}</span>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span>{distributor.name}</span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        {distributor.productCount}개
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <span className="font-medium">
                        {isMobile
                          ? formatCurrencyInTenThousand(distributor.revenue)
                          : formatCurrency(distributor.revenue)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* 세 번째 줄: 캐시 지급 설정 */}
      <div className="grid grid-cols-1 gap-5 mb-5">
        <Card className="overflow-hidden">
          <div className="flex items-center p-5 border-b border-gray-200">
            <div className="w-8 h-8 flex items-center justify-center rounded-md bg-amber-100 text-amber-600 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">캐시 지급 설정</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* 기본 보너스 지급률 */}
              <div className="bg-gray-50 p-5 rounded-lg">
                <h4 className="font-medium text-base mb-4">기본 보너스 지급률</h4>
                <div className="flex items-center">
                  <input
                    type="number"
                    className="w-20 h-10 py-2 px-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={defaultBonusRate}
                    onChange={(e) => setDefaultBonusRate(e.target.value)}
                  />
                  <span className="mx-2 text-gray-700">%</span>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-10 px-4 ml-2 bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleApplyDefaultBonus}
                    disabled={settingsLoading}
                  >
                    {settingsLoading ? '처리 중...' : '적용하기'}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-3">모든 신규 계정에 적용되는 기본 보너스 비율입니다.</p>
              </div>

              {/* 개별 보너스 설정 */}
              <div className="bg-gray-50 p-5 rounded-lg">
                <h4 className="font-medium text-base mb-4">개별 보너스 설정</h4>
                <div className="flex items-center">
                  <input
                    type="text"
                    className="flex-1 h-10 py-2 px-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="이메일 또는 이름"
                    value={individualAccount}
                    onChange={(e) => setIndividualAccount(e.target.value)}
                  />
                  <input
                    type="number"
                    className="w-20 h-10 py-2 px-3 bg-white border border-gray-300 rounded-md ml-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={individualBonusRate}
                    onChange={(e) => setIndividualBonusRate(e.target.value)}
                  />
                  <span className="mx-2 text-gray-700">%</span>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleApplyIndividualBonus}
                    disabled={settingsLoading}
                  >
                    {settingsLoading ? '처리 중...' : '적용하기'}
                  </Button>
                </div>
              </div>
            </div>

            {/* 설정 적용 상태 및 초기화 */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h4 className="font-medium text-base">현재 설정</h4>
                <p className="text-sm text-gray-600 mt-1">
                  기본 보너스 지급률: <span className="font-semibold">{cashSettings ? cashSettings.free_cash_percentage : 0}%</span>
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-4"
                onClick={handleResetSettings}
                disabled={settingsLoading}
              >
                {settingsLoading ? '처리 중...' : '설정 초기화'}
              </Button>
            </div>

            {/* 현재 적용된 설정 정보 */}
            <div className="bg-gray-50 p-4 rounded-lg mb-5">
              <h4 className="font-medium text-sm mb-2">설정 정보</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 기본 보너스는 모든 충전 시 자동으로 적용됩니다.</li>
                <li>• 개별 보너스는 특정 사용자에게만 적용됩니다.</li>
                <li>• 설정 초기화 시 기본값(5%)으로 변경됩니다.</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </DashboardTemplate>
  );
};

export default DashboardContent;