import React, { useState, useEffect } from 'react';
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
import { RankingChangeChart } from '@/components/charts/RankingChangeChart';

// 개발자 대시보드 통계 데이터 인터페이스
interface DeveloperStats {
  systemUsers: { count: number; trend: number };
  apiCalls: { count: number; trend: number };
  dbStorage: { count: number; trend: number };
  responseTime: { count: number; trend: number };
}

export const DashboardContent: React.FC = () => {
  // 모바일 화면 감지 (md 이하인지 여부)
  const isMobile = useResponsive('down', 'md');

  // 순위 변화 차트 모달 상태
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);

  // 대시보드 데이터 상태 관리
  const [stats, setStats] = useState<DeveloperStats>({
    systemUsers: { count: 0, trend: 0 },
    apiCalls: { count: 8524, trend: 24.8 },
    dbStorage: { count: 2500, trend: 3.7 },
    responseTime: { count: 127, trend: -5.2 },
  });

  // 사용자 정보 로드
  const loadUserStats = async () => {
    try {
      // 전체 사용자 수 가져오기
      const { count: totalUsers, error: countError } = await supabase
        .from('users')
        .select('id', { count: 'exact' });
      
      if (countError) {
        
        return;
      }

      // 지난 달 활성 사용자 수 (1개월 이내 생성된 계정)
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const { count: newUsers, error: newUsersError } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .gte('created_at', oneMonthAgo.toISOString());
      
      if (newUsersError) {
        
        return;
      }

      // 증가율 계산: (신규 사용자 / 전체 사용자) * 100
      const trend = totalUsers ? ((newUsers || 0) / totalUsers) * 100 : 0;
      
      // 상태 업데이트
      setStats(prevStats => ({
        ...prevStats,
        systemUsers: { 
          count: totalUsers || 0, 
          trend: parseFloat(trend.toFixed(1))
        }
      }));
    } catch (error: any) {
      
    }
  };

  // 활성 프로젝트 데이터
  const activeProjects = [
    { id: 'PRJ-001', name: '사용자 인증 시스템', status: '진행중', progress: 75, activity: '높음' },
    { id: 'PRJ-002', name: '결제 모듈 개선', status: '검토중', progress: 42, activity: '중간' },
    { id: 'PRJ-003', name: '관리자 대시보드', status: '진행중', progress: 90, activity: '높음' },
    { id: 'PRJ-004', name: '푸시 알림 서비스', status: '대기중', progress: 10, activity: '낮음' },
    { id: 'PRJ-005', name: '성능 최적화', status: '진행중', progress: 68, activity: '중간' },
  ];

  // 시스템 로그 데이터
  interface SystemLog {
    id: string;
    timestamp: string;
    level: string;
    message: string;
  }
  
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  
  // 시스템 로그 데이터 로드 - system_logs 테이블에서 로드 (관리자 권한 사용)
  const loadSystemLogs = async () => {
    try {
      // 관리자 클라이언트로 system_logs 테이블에서 최근 로그 가져오기
      const { data: systemLogs, error } = await supabaseAdmin
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        
        setSystemLogs([]); // 빈 배열로 설정하여 "최근 내역이 없습니다" 메시지 표시
        return;
      }
      
      // 로그 데이터가 있는 경우 형식 변환 후 상태 업데이트
      if (systemLogs && systemLogs.length > 0) {
        const formattedLogs = systemLogs.map(log => {
          // 날짜 형식 변환 - 더 간결하게 (MM-DD HH:MM 형식)
          const date = new Date(log.created_at);
          const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          
          return {
            id: `LOG-${log.id}`,
            timestamp: formattedDate,
            level: log.level || 'INFO', // 레벨이 없으면 INFO로 기본값 설정
            message: log.message || '시스템 로그'
          };
        });
        
        setSystemLogs(formattedLogs);
      } else {
        setSystemLogs([]); // 빈 배열로 설정하여 "최근 내역이 없습니다" 메시지 표시
      }
    } catch (error: any) {
      
      setSystemLogs([]); // 오류 발생 시 빈 배열로 설정
    }
  };

  // API 상태 데이터
  const apiStatus = [
    { name: '인증 API', status: '정상', response: '45ms', uptime: '99.98%' },
    { name: '결제 API', status: '정상', response: '120ms', uptime: '99.95%' },
    { name: '검색 API', status: '주의', response: '350ms', uptime: '99.82%' },
    { name: '푸시 알림 API', status: '정상', response: '85ms', uptime: '99.92%' },
    { name: '분석 API', status: '오류', response: '1250ms', uptime: '98.75%' },
  ];

  // 진행 상태에 따른 색상 지정
  const getStatusColor = (status: string) => {
    switch (status) {
      case '진행중': return 'bg-green-100 text-green-800';
      case '검토중': return 'bg-yellow-100 text-yellow-800';
      case '대기중': return 'bg-gray-100 text-gray-800';
      case '정상': return 'bg-green-100 text-green-800';
      case '주의': return 'bg-yellow-100 text-yellow-800';
      case '오류': return 'bg-red-100 text-red-800';
      case 'INFO': return 'bg-blue-100 text-blue-800';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 진행률 색상 계산
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // 데이터 로드
  useEffect(() => {
    loadUserStats();
    loadSystemLogs();
    
    // 5분마다 데이터 자동 갱신
    const refreshInterval = setInterval(() => {
      loadUserStats();
      loadSystemLogs();
    }, 5 * 60 * 1000);
    
    // 컴포넌트 언마운트 시 인터벌 클리어
    return () => clearInterval(refreshInterval);
  }, []);

  return (
    <DashboardTemplate
      title="개발자 대시보드"
      description="시스템 모니터링, 프로젝트 진행 상황 및 API 상태를 확인할 수 있는 개발자 대시보드입니다."
      headerBgClass="bg-purple-600"
      headerTextClass="text-white"
      toolbarActions={
        <>
          {/* 순위 변화 차트 테스트 버튼 */}
          <Button 
            variant="outline" 
            className="ml-2 bg-primary-600 text-white hover:bg-primary-700"
            onClick={() => setIsChartModalOpen(true)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-1.5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M3 3a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 000 2h6a1 1 0 100-2H3zm0 4a1 1 0 100 2h8a1 1 0 100-2H3zm10-4a1 1 0 100 2h3a1 1 0 100-2h-3z" 
                clipRule="evenodd" 
              />
            </svg>
            캠페인 순위 분석
          </Button>
        </>
      }
    >
      {/* 첫 번째 줄: 4개의 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <DashboardColorCard
          title="시스템 사용자"
          value={stats.systemUsers.count}
          unit="명"
          trend={stats.systemUsers.trend}
          icon="profile-user"
          iconColor="bg-blue-600"
        />
        <DashboardColorCard
          title="API 호출 횟수 (개발필요)"
          value={stats.apiCalls.count}
          unit="회"
          trend={stats.apiCalls.trend}
          icon="chart-line"
          iconColor="bg-purple-600"
        />
        <DashboardColorCard
          title="데이터베이스 용량 (개발필요)"
          value={stats.dbStorage.count}
          unit="MB"
          trend={stats.dbStorage.trend}
          icon="database"
          iconColor="bg-green-600"
        />
        <DashboardColorCard
          title="평균 응답시간 (개발필요)"
          value={stats.responseTime.count}
          unit="ms"
          trend={stats.responseTime.trend}
          icon="clock"
          iconColor="bg-orange-600"
        />
      </div>

      {/* 두 번째 줄: 프로젝트 & 시스템 로그 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* 프로젝트 현황 */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-purple-100 text-purple-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">프로젝트 현황 (개발필요)</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-4">
              새 프로젝트
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="py-3 px-4 text-left">프로젝트명</TableHead>
                  <TableHead className="py-3 px-4 text-center">상태</TableHead>
                  <TableHead className="py-3 px-4 text-center">활동</TableHead>
                  <TableHead className="py-3 px-4 text-left">진행률</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeProjects.map((project, index) => (
                  <TableRow key={index} className="border-b border-gray-200">
                    <TableCell className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-purple-600">{project.name}</span>
                        <span className="text-xs text-gray-500">{project.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <span className="text-sm">{project.activity}</span>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${getProgressColor(project.progress)}`} 
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-right mt-1">{project.progress}%</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* 시스템 로그 */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-100 text-blue-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">시스템 로그</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-4">
              전체 로그
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="py-3 px-4 text-center">레벨</TableHead>
                  <TableHead className="py-3 px-4 text-left">메시지</TableHead>
                  <TableHead className="py-3 px-4 text-center">시간</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemLogs.length > 0 ? (
                  systemLogs.map((log, index) => (
                    <TableRow key={index} className="border-b border-gray-200">
                      <TableCell className="py-2 px-4 text-center">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] leading-tight font-medium ${getStatusColor(log.level)}`}>
                          {log.level}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-4">
                        <span className="text-sm">{log.message}</span>
                      </TableCell>
                      <TableCell className="py-2 px-4 text-center">
                        <span className="text-xs text-gray-500">{log.timestamp}</span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="py-4 px-4 text-center text-gray-500">
                      최근 내역이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* 세 번째 줄: API 상태 */}
      <div className="grid grid-cols-1 gap-5 mb-5">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-green-100 text-green-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">API 상태 (개발필요)</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-4">
              상세 분석
            </Button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
              {apiStatus.map((api, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium text-gray-700">{api.name}</div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(api.status)}`}>
                      {api.status}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="text-gray-500">응답 시간:</div>
                    <div className="text-right font-medium">{api.response}</div>
                    <div className="text-gray-500">가동 시간:</div>
                    <div className="text-right font-medium">{api.uptime}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-50 p-5 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-base">API 요청량</h4>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="h-8 px-3">
                    시간별
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-3">
                    일별
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-3">
                    주별
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row justify-between">
                <div className="mb-4 md:mb-0 md:w-1/2 md:pr-4">
                  <div className="text-sm text-gray-500 mb-2">총 API 호출</div>
                  <div className="text-3xl font-bold text-gray-800">4,251,837</div>
                  <div className="text-sm text-green-600 mt-1">↑ 8.4% 증가 (지난 24시간)</div>
                </div>
                
                <div className="md:w-1/2 md:pl-4 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0">
                  <div className="text-sm text-gray-500 mb-2">평균 응답 시간</div>
                  <div className="text-3xl font-bold text-gray-800">127ms</div>
                  <div className="text-sm text-red-600 mt-1">↑ 12ms 증가 (지난 24시간)</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 순위 변화 분석 차트 모달 */}
      <RankingChangeChart 
        open={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
      />
    </DashboardTemplate>
  );
};

export default DashboardContent;