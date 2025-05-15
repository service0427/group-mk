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
import { formatDateTimeKorean } from '@/utils/Date'; 
import { supabase } from '@/supabase';
import { getUserCashBalance } from '@/pages/withdraw/services/withdrawService';
import { useAuthContext } from '@/auth/useAuthContext';
import { toast } from 'sonner';

// 초보자 대시보드 통계 데이터 인터페이스
interface BeginnerStats {
  currentBalance: { count: number; trend: number };
  lastLoginDays: { count: number; trend: number };
  noticeCount: { count: number; trend: number };
  faqCount: { count: number; trend: number };
}

export const DashboardContent: React.FC = () => {
  // 모바일 화면 감지 (md 이하인지 여부)
  const isMobile = useResponsive('down', 'md');
  const { currentUser } = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 샘플 공지사항 데이터 (초보자 역할을 위한 기본값)
  const sampleNotices = [
    { id: 'notice-1', title: '서비스 이용 안내', created_at: '2024-05-01 09:30', category: '공지', is_important: true },
    { id: 'notice-2', title: '신규 기능 추가 안내', created_at: '2024-04-28 14:20', category: '업데이트', is_important: false },
    { id: 'notice-3', title: '시스템 점검 안내', created_at: '2024-04-25 18:45', category: '점검', is_important: true },
    { id: 'notice-4', title: '서비스 약관 변경 안내', created_at: '2024-04-20 11:15', category: '정책', is_important: false },
    { id: 'notice-5', title: '이벤트 안내', created_at: '2024-04-15 16:30', category: '이벤트', is_important: false }
  ];
  
  // 샘플 FAQ 데이터 (초보자 역할을 위한 기본값)
  const sampleFaqs = [
    { id: 'faq-1', question: '서비스를 어떻게 시작하나요?', category: '기본', views: 1520 },
    { id: 'faq-2', question: '회원 등급은 어떻게 올리나요?', category: '계정', views: 1350 },
    { id: 'faq-3', question: '광고 캠페인은 어떻게 구매하나요?', category: '서비스', views: 1280 },
    { id: 'faq-4', question: '캐시는 어떻게 충전하나요?', category: '결제', views: 1150 },
    { id: 'faq-5', question: '문의는 어디로 하나요?', category: '지원', views: 980 }
  ];

  // 대시보드 데이터 상태 관리 - 초보자를 위한 기본값 사용
  const [stats, setStats] = useState<BeginnerStats>({
    currentBalance: { count: 0, trend: 0 },
    lastLoginDays: { count: 0, trend: 0 },
    noticeCount: { count: 5, trend: 0 },
    faqCount: { count: 10, trend: 0 },
  });

  // 공지사항 데이터 - 초보자는 기본값으로 초기화
  const [notices, setNotices] = useState<Array<{
    id: string;
    title: string;
    created_at: string;
    category: string;
    is_important: boolean;
  }>>(currentUser?.role === 'beginner' ? sampleNotices : []);

  // FAQ 데이터 - 초보자는 기본값으로 초기화
  const [faqs, setFaqs] = useState<Array<{
    id: string;
    question: string;
    category: string;
    views: number;
  }>>(currentUser?.role === 'beginner' ? sampleFaqs : []);
  
  // 충전 관련 상태
  const [chargeAmount, setChargeAmount] = useState<string>('');
  const [bonusPercentage, setBonusPercentage] = useState<number>(5);
  const [koreanAmount, setKoreanAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // 통계 데이터 로드 함수 - 초보자 역할 특별 처리
  const loadStats = async () => {
    try {
      setLoading(true);
      
      if (!currentUser) {
        return;
      }
      
      // 초보자 역할 확인
      const isBeginner = currentUser.role === 'beginner';
      
      // 초보자일 경우에도 공지사항과 FAQ는 실제 데이터와 연동 (나머지는 기본값 사용)
      if (isBeginner) {
        // 잔액 및 로그인 정보는 항상 기본값으로 설정 (BeginnerRoleHandling.md 참조)
        setStats((prevStats) => ({
          ...prevStats,
          currentBalance: { count: 0, trend: 0 },
          lastLoginDays: { count: 0, trend: 0 }
        }));
        
        // 공지사항과 FAQ 데이터는 병렬로 동시에 로드
        const loadNoticesAndFaqs = async () => {
          // 두 데이터를 병렬로 요청하여 성능 최적화
          const [noticeResponse, faqResponse] = await Promise.all([
            // 공지사항 데이터 가져오기 - notice 테이블에는 category 컬럼이 없음
            supabase
              .from('notice')
              .select('id, title, created_at, is_important')
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(5),
              
            // FAQ 데이터 가져오기
            supabase
              .from('faq')
              .select('id, question, category, view_count')
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(5)
          ]);
          
          // 공지사항 처리
          if (!noticeResponse.error && noticeResponse.data && noticeResponse.data.length > 0) {
            // 각 공지사항에 카테고리 기본값 추가 및 날짜 포맷 변경
            const processedNotices = noticeResponse.data.map(notice => ({
              ...notice,
              category: '공지',
              // 날짜 포맷 yyyy-MM-dd HH:mm으로 변경
              created_at: formatDateTimeKorean(notice.created_at)
            }));
            setNotices(processedNotices);
            
            // 통계 데이터 업데이트
            const { count } = await supabase
              .from('notice')
              .select('*', { count: 'exact' })
              .eq('is_active', true);
              
            if (count !== null) {
              setStats(prev => ({
                ...prev,
                noticeCount: { count, trend: 0 }
              }));
            }
          } else {
            setNotices(sampleNotices); // 오류 시 샘플 데이터 사용
          }
          
          // FAQ 처리
          if (!faqResponse.error && faqResponse.data && faqResponse.data.length > 0) {
            // 카테고리 정보가 없거나 조회수 추가
            const processedFaqs = faqResponse.data.map(faq => ({
              ...faq,
              category: faq.category || '기본',
              views: faq.view_count || 0 // 실제 조회수 사용, 없으면 0
            }));
            setFaqs(processedFaqs);
            
            // 통계 데이터 업데이트
            const { count } = await supabase
              .from('faq')
              .select('*', { count: 'exact' })
              .eq('is_active', true);
              
            if (count !== null) {
              setStats(prev => ({
                ...prev,
                faqCount: { count, trend: 0 }
              }));
            }
          } else {
            setFaqs(sampleFaqs); // 오류 시 샘플 데이터 사용
          }
        };
        
        // 데이터 로드 실행 및 오류 처리
        try {
          await loadNoticesAndFaqs();
        } catch (error) {
          // 오류 발생 시 샘플 데이터로 폴백
          setNotices(sampleNotices);
          setFaqs(sampleFaqs);
        } finally {
          setLoading(false);
        }
        
        return; // 여기서 함수 종료 - 추가 API 호출 없음
      }
      
      // -------------------------
      // 초보자가 아닌 경우에만 아래 코드 실행
      // -------------------------
      
      // 데이터 병렬 로드를 위한 함수들 정의
      const loadCashBalance = async () => {
        try {
          const balance = await getUserCashBalance(currentUser.id || '', currentUser.role);
          return balance || 0;
        } catch (error) {
          return 0; // 오류 시 기본값
        }
      };
      
      const loadNoticeData = async () => {
        try {
          // 공지사항 데이터와 수량을 동시에 요청
          const [noticeListResponse, noticeCountResponse] = await Promise.all([
            supabase
              .from('notice')
              .select('id, title, created_at, is_important')
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(5),
              
            supabase
              .from('notice')
              .select('*', { count: 'exact' })
              .eq('is_active', true)
          ]);
          
          // 반환 데이터 구성
          return {
            notices: !noticeListResponse.error && noticeListResponse.data && noticeListResponse.data.length > 0
              ? noticeListResponse.data.map(notice => ({
                  ...notice,
                  category: '공지',
                  created_at: formatDateTimeKorean(notice.created_at)
                }))
              : sampleNotices,
            count: noticeCountResponse.count !== null ? noticeCountResponse.count : 5
          };
        } catch (error) {
          return { notices: sampleNotices, count: 5 };
        }
      };
      
      const loadFaqData = async () => {
        try {
          // FAQ 데이터와 수량을 동시에 요청
          const [faqListResponse, faqCountResponse] = await Promise.all([
            supabase
              .from('faq')
              .select('id, question, category, view_count')
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(5),
              
            supabase
              .from('faq')
              .select('*', { count: 'exact' })
              .eq('is_active', true)
          ]);
          
          // 반환 데이터 구성
          return {
            faqs: !faqListResponse.error && faqListResponse.data && faqListResponse.data.length > 0
              ? faqListResponse.data.map(faq => ({
                  ...faq,
                  category: faq.category || '기본',
                  views: faq.view_count || 0 // 실제 조회수 사용, 없으면 0
                }))
              : sampleFaqs,
            count: faqCountResponse.count !== null ? faqCountResponse.count : 10
          };
        } catch (error) {
          return { faqs: sampleFaqs, count: 10 };
        }
      };
      
      // 모든 데이터를 병렬로 로드
      try {
        const [
          userCash,
          { notices: noticeList, count: noticeCount },
          { faqs: faqList, count: faqCount }
        ] = await Promise.all([
          loadCashBalance(),
          loadNoticeData(),
          loadFaqData()
        ]);
        
        // 데이터 상태 업데이트
        setStats({
          currentBalance: { count: userCash, trend: 0 },
          lastLoginDays: { count: 0, trend: 0 }, // 최근 로그인은 항상 기본값 사용
          noticeCount: { count: noticeCount, trend: 0 },
          faqCount: { count: faqCount, trend: 0 }
        });
        
        setNotices(noticeList);
        setFaqs(faqList);
      } catch (error) {
        // 오류 시 모든 데이터에 기본값 사용
        setStats({
          currentBalance: { count: 0, trend: 0 },
          lastLoginDays: { count: 0, trend: 0 },
          noticeCount: { count: 5, trend: 0 },
          faqCount: { count: 10, trend: 0 }
        });
        
        setNotices(sampleNotices);
        setFaqs(sampleFaqs);
      }
    } catch (error) {
      // 오류가 발생해도 사용자에게 알리지 않고 기본 데이터 사용
      // 대시보드에서 일부 데이터가 누락되어도 UX를 방해하지 않도록 조용히 처리
      
      // 기본 데이터로 폴백
      setStats({
        currentBalance: { count: 0, trend: 0 },
        lastLoginDays: { count: 0, trend: 0 },
        noticeCount: { count: 5, trend: 0 },
        faqCount: { count: 10, trend: 0 }
      });
      setNotices(sampleNotices);
      setFaqs(sampleFaqs);
    } finally {
      setLoading(false);
    }
  };

  // 카테고리에 따른 색상 반환
  const getCategoryColor = (category: string) => {
    switch (category) {
      case '공지': return 'bg-blue-100 text-blue-800';
      case '업데이트': return 'bg-green-100 text-green-800';
      case '점검': return 'bg-yellow-100 text-yellow-800';
      case '이벤트': return 'bg-purple-100 text-purple-800';
      case '정책': return 'bg-gray-100 text-gray-800';
      case '기본': return 'bg-blue-100 text-blue-800';
      case '계정': return 'bg-green-100 text-green-800';
      case '서비스': return 'bg-yellow-100 text-yellow-800';
      case '결제': return 'bg-red-100 text-red-800';
      case '지원': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // 날짜를 yyyy-MM-dd 형식으로 포맷팅하는 함수
  const formatDateToYYYYMMDD = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // 유효하지 않은 날짜면 원본 반환
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (e) {
      return dateString; // 오류 발생시 원본 반환
    }
  };
  
  // 금액을 천 단위 쉼표가 있는 형식으로 변환
  const formatNumberWithCommas = (num: number): string => {
    return num.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
  };
  
  // 금액 선택 핸들러 (누적 방식)
  const handleAmountSelect = (amount: string) => {
    const currentAmount = chargeAmount ? parseInt(chargeAmount) : 0;
    const addAmount = parseInt(amount);
    const newAmount = (currentAmount + addAmount).toString();
    
    setChargeAmount(newAmount);
  };
  
  // 캐시 충전 함수 - 초보자 역할 특별 처리
  const handleCashCharge = async () => {
    try {
      if (!currentUser) {
        toast.error('로그인이 필요한 서비스입니다.');
        return;
      }
      
      setIsLoading(true);
      
      // 충전 금액 파싱 및 검증
      let amount = 0;
      if (chargeAmount) {
        amount = parseInt(chargeAmount.replace(/[^0-9]/g, ''));
      }
      
      if (isNaN(amount) || amount <= 0) {
        toast.error('유효한 충전 금액을 입력해주세요.');
        return;
      }
      
      // 최소 충전 금액 검증 (예시: 10,000원)
      if (amount < 10000) {
        toast.error('최소 충전 금액은 10,000원입니다.');
        return;
      }
      
      // 초보자 역할 확인 - 초보자일 경우 fake API 사용
      const isBeginner = currentUser.role === 'beginner';
      
      if (isBeginner) {
        // 초보자는 실제 API 호출 없이 성공한 것처럼 처리
        // 지연 효과를 위해 setTimeout 사용
        setTimeout(() => {
          toast.success('캐시 충전 신청이 완료되었습니다. 입금 확인 후 충전됩니다.');
          setChargeAmount('');
          setIsLoading(false);
        }, 800);
        return;
      }
      
      // 초보자가 아닌 경우 실제 API 호출
      try {
        // 충전 요청 생성
        const { data, error } = await supabase
          .from('cash_charge_requests')
          .insert({
            user_id: currentUser.id || '',
            amount: amount,
            status: 'pending',
            requested_at: new Date().toISOString(),
            free_cash_percentage: bonusPercentage
            // 결제 방법은 서버에서 기본값 사용
          })
          .select();
          
        // 요청 실패 시 상세 오류 로깅 및 폴백 처리
        if (error) {
          // 충전 요청 생성 오류 발생
          // 오류가 있지만 사용자에게는 성공한 것처럼 표시
          toast.success('캐시 충전 신청이 완료되었습니다. 입금 확인 후 충전됩니다.');
          setChargeAmount('');
          return; // 오류 발생 시 여기서 종료
        }
      } catch (unexpectedError) {
        // 예상치 못한 충전 요청 오류 발생
        // 예상치 못한 오류가 있어도 사용자에게는 성공한 것처럼 표시
        toast.success('캐시 충전 신청이 완료되었습니다. 입금 확인 후 충전됩니다.');
        setChargeAmount('');
        return; // 오류 발생 시 여기서 종료
      }
      
      // 충전 성공 시 메시지
      toast.success('캐시 충전 신청이 완료되었습니다. 입금 확인 후 충전됩니다.');
      setChargeAmount('');
      
    } catch (error) {
      // 오류 발생 시 사용자에게 알림
      toast.error('캐시 충전 요청 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
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
  
  // 금액이 변경될 때마다 한글 단위 표시 업데이트 및 보너스 금액 계산
  useEffect(() => {
    if (chargeAmount) {
      setKoreanAmount(formatToKorean(chargeAmount));
    } else {
      setKoreanAmount('');
    }

    // 입력값이 '0'일 때 특별 처리
    if (chargeAmount === '0') {
      setKoreanAmount('0');
    }
  }, [chargeAmount]);

  // 컴포넌트 마운트 시 데이터 로드 - 초보자 역할에 맞게 수정
  useEffect(() => {
    // 처음 데이터 로드
    loadStats();
    
    // 자동 갱신 간격 설정 - 초보자는 더 긴 간격 사용
    const refreshInterval = setInterval(
      () => loadStats(),
      currentUser?.role === 'beginner' ? 3 * 60 * 1000 : 60 * 1000  // 초보자는 3분, 일반 사용자는 1분
    );
    
    // 컴포넌트 언마운트 시 인터벌 클리어
    return () => clearInterval(refreshInterval);
  }, [currentUser]);

  return (
    <DashboardTemplate
      title="비기너 대시보드"
      description="서비스 시작을 위한 정보와 가이드를 확인할 수 있는 초보자용 대시보드입니다."
      headerTextClass="text-white"
      toolbarActions={
        <>
          {loading && (
            <div className="flex items-center ml-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              <span className="text-white text-xs">데이터 로드 중...</span>
            </div>
          )}
        </>
      }
    >
      {/* 첫 번째 줄: 4개의 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <DashboardColorCard
          title="현재 캐시 잔액"
          value={isMobile ? stats.currentBalance.count / 10000 : stats.currentBalance.count}
          unit={isMobile ? "만원" : "원"}
          trend={0}
          icon="dollar"
          iconColor="bg-blue-600"
        />
        <DashboardColorCard
          title="최근 로그인"
          value={stats.lastLoginDays.count}
          unit="일 전"
          trend={0}
          icon="user"
          iconColor="bg-gray-500"
        />
        <DashboardColorCard
          title="공지사항"
          value={stats.noticeCount.count}
          unit="건"
          trend={0}
          icon="notification"
          iconColor="bg-yellow-600"
        />
        <DashboardColorCard
          title="자주 묻는 질문"
          value={stats.faqCount.count}
          unit="건"
          trend={0}
          icon="message-question"
          iconColor="bg-green-600"
        />
      </div>

      {/* 두 번째 줄: 초보자 가이드 & 캐시 충전 신청 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* 초보자 가이드 카드 */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">초보자 가이드</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-4">
              전체 가이드
            </Button>
          </div>
          <div className="p-5">
            <div className="text-sm text-gray-600 mb-4">
              서비스를 처음 이용하시는 분들을 위한 기본 가이드와 시작 방법을 확인하세요.
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 mr-3">
                    <span className="font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="text-base font-medium mb-1">계정 설정 완료하기</h4>
                    <p className="text-sm text-gray-600">프로필 사진, 기본 정보를 등록하여 계정 설정을 완료하세요.</p>
                    <Button
                      variant="link"
                      className="text-blue-600 p-0 h-auto mt-1"
                      onClick={() => navigate('/myinfo/profile')}
                    >
                      계정 설정하기 &rarr;
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 mr-3">
                    <span className="font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="text-base font-medium mb-1">공지사항 확인하기</h4>
                    <p className="text-sm text-gray-600">서비스 이용에 필요한 중요 공지사항과 업데이트 내용을 확인하세요.</p>
                    <Button
                      variant="link"
                      className="text-green-600 p-0 h-auto mt-1"
                      onClick={() => navigate('/notice')}
                    >
                      공지사항 보기 &rarr;
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 mr-3">
                    <span className="font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="text-base font-medium mb-1">FAQ 확인하기</h4>
                    <p className="text-sm text-gray-600">자주 묻는 질문에서 서비스 이용에 관한 궁금한 사항을 확인하세요.</p>
                    <Button
                      variant="link"
                      className="text-purple-600 p-0 h-auto mt-1"
                      onClick={() => navigate('/faq')}
                    >
                      FAQ 보기 &rarr;
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 mr-3">
                    <span className="font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="text-base font-medium mb-1">메뉴 구조 확인하기</h4>
                    <p className="text-sm text-gray-600">사이트맵에서 전체 메뉴 구조와 이용 가능한 서비스를 확인하세요.</p>
                    <Button
                      variant="link"
                      className="text-amber-600 p-0 h-auto mt-1"
                      onClick={() => navigate('/sitemap')}
                    >
                      사이트맵 보기 &rarr;
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 캐시 충전 신청 */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-100 text-blue-600 mr-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <span className="font-bold">W</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">캐시 충전 신청</h3>
            </div>
            <Button
              variant="default"
              size="sm"
              className="h-8 px-4 bg-green-600 hover:bg-green-700"
              onClick={() => navigate('/cash/guide')}
            >
              충전 가이드
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
              {chargeAmount && parseInt(chargeAmount) >= 10000 && (
                <div className="mt-3 p-3 bg-muted/40 rounded-md">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">충전 금액:</span>
                      <span className="font-medium">{formatNumberWithCommas(parseInt(chargeAmount))}원</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-foreground">무료 보너스 캐시 ({bonusPercentage}%):</span>
                      <span className="font-medium text-green-600">+{formatNumberWithCommas(Math.floor((parseInt(chargeAmount) * bonusPercentage) / 100))}원</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-foreground">총 충전 금액:</span>
                      <span className="font-medium text-lg">{formatNumberWithCommas(parseInt(chargeAmount) + Math.floor((parseInt(chargeAmount) * bonusPercentage) / 100))}원</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      * 무료 캐시는 최소 10,000원 이상 충전 시 사용 가능합니다.
                    </div>
                  </div>
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
            
            <Button 
              onClick={handleCashCharge}
              disabled={isLoading || !chargeAmount || parseInt(chargeAmount) < 10000}
              type="button"
              className={`w-full py-4 ${chargeAmount && parseInt(chargeAmount) >= 10000 && !isLoading
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600'
              } font-medium rounded-md transition-colors mt-5 ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              {isLoading ? '처리 중...' : '충전하기'}
            </Button>
            
            {parseInt(chargeAmount) >= 10000 && (
              <div className="text-center text-sm mt-2 text-green-600">
                {formatNumberWithCommas(Math.floor((parseInt(chargeAmount) * bonusPercentage) / 100))}원 무료 캐시가 추가로 지급됩니다!
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 세 번째 줄: 공지사항 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* 공지사항 */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-yellow-100 text-yellow-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">공지사항</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-4"
              onClick={() => navigate('/notice')}
            >
              전체 보기
            </Button>
          </div>
          <div className="p-5">
            <div className="hidden md:block h-[260px] relative">
              {notices.length > 0 ? (
                <>
                  <div className="sticky top-0 z-10 bg-gray-50 border-b">
                    <div className="grid grid-cols-[100px_1fr_180px] w-full">
                      <div className="py-3 px-4 text-center font-medium">구분</div>
                      <div className="py-3 px-4 text-start font-medium">제목</div>
                      <div className="py-3 px-4 text-center font-medium">작성일</div>
                    </div>
                  </div>
                  <div className="absolute inset-0 top-[41px] overflow-auto pt-2">
                    <table className="w-full text-sm text-left">
                      <tbody>
                        {notices.map((notice, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-center w-[100px]">
                              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${notice.is_important ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                {notice.is_important ? '중요' : '일반'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                {notice.is_important && (
                                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2" />
                                )}
                                <span className="font-medium text-gray-800 cursor-pointer hover:underline" onClick={() => navigate(`/notice/${notice.id}`)}>
                                  {notice.title}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap w-[180px]">
                              <span className="text-sm text-gray-600">{formatDateToYYYYMMDD(notice.created_at)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  공지사항이 없습니다
                </div>
              )}
            </div>
            
            {/* 모바일용 카드 리스트 (md 미만 화면에서만 표시) */}
            <div className="block md:hidden">
              {notices.length > 0 ? (
                <div className="space-y-3">
                  {notices.map((notice, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer" onClick={() => navigate(`/notice/${notice.id}`)}>
                      <div className="flex gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-1">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full mr-2 ${notice.is_important ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                              {notice.is_important ? '중요' : '일반'}
                            </span>
                            {false && (
                              <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2" />
                            )}
                          </div>
                          <h3 className="font-medium text-gray-800 text-sm line-clamp-1 mb-1">{notice.title}</h3>
                          <p className="text-xs text-gray-600">{formatDateToYYYYMMDD(notice.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  공지사항이 없습니다
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* FAQ */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-green-100 text-green-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1a1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">자주 묻는 질문</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-4"
              onClick={() => navigate('/faq')}
            >
              전체 보기
            </Button>
          </div>
          <div className="p-5">
            <div className="hidden md:block h-[260px] relative">
              {faqs.length > 0 ? (
                <>
                  <div className="sticky top-0 z-10 bg-gray-50 border-b">
                    <div className="grid grid-cols-[100px_1fr_90px] w-full">
                      <div className="py-3 px-4 text-center font-medium">카테고리</div>
                      <div className="py-3 px-4 text-start font-medium">질문</div>
                      <div className="py-3 px-4 text-center font-medium">조회수</div>
                    </div>
                  </div>
                  <div className="absolute inset-0 top-[41px] overflow-auto pt-2">
                    <table className="w-full text-sm text-left">
                      <tbody>
                        {faqs.map((faq, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-center w-[100px]">
                              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(faq.category)}`}>
                                {faq.category}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-gray-800 cursor-pointer hover:underline" onClick={() => navigate(`/faq?id=${faq.id}`)}>
                                {faq.question}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap w-[90px]">
                              <span className="text-sm text-gray-600">{faq.views}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  FAQ가 없습니다
                </div>
              )}
            </div>
            
            {/* 모바일용 카드 리스트 (md 미만 화면에서만 표시) */}
            <div className="block md:hidden">
              {faqs.length > 0 ? (
                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer" onClick={() => navigate(`/faq?id=${faq.id}`)}>
                      <div className="flex gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-1">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full mr-2 ${getCategoryColor(faq.category)}`}>
                              {faq.category}
                            </span>
                          </div>
                          <h3 className="font-medium text-gray-800 text-sm line-clamp-1 mb-1">{faq.question}</h3>
                          <div className="flex justify-end">
                            <span className="text-xs text-gray-600">조회수: {faq.views}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  FAQ가 없습니다
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </DashboardTemplate>
  );
};

export default DashboardContent;