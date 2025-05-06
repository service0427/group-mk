import React, { useState } from 'react';
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

// 개발자 대시보드 통계 데이터 인터페이스
interface DeveloperStats {
  activeProjects: { count: number; trend: number };
  issuesResolved: { count: number; trend: number };
  codeQuality: { count: number; trend: number };
  deployments: { count: number; trend: number };
}

export const DashboardContent: React.FC = () => {
  // 모바일 화면 감지 (md 이하인지 여부)
  const isMobile = useResponsive('down', 'md');

  // 대시보드 데이터 상태 관리
  const [stats, setStats] = useState<DeveloperStats>({
    activeProjects: { count: 8, trend: 12.5 },
    issuesResolved: { count: 342, trend: 24.8 },
    codeQuality: { count: 92, trend: 3.7 },
    deployments: { count: 18, trend: -5.2 },
  });

  // 활성 프로젝트 데이터
  const activeProjects = [
    { id: 'PRJ-001', name: '사용자 인증 시스템', status: '진행중', progress: 75, activity: '높음' },
    { id: 'PRJ-002', name: '결제 모듈 개선', status: '검토중', progress: 42, activity: '중간' },
    { id: 'PRJ-003', name: '관리자 대시보드', status: '진행중', progress: 90, activity: '높음' },
    { id: 'PRJ-004', name: '푸시 알림 서비스', status: '대기중', progress: 10, activity: '낮음' },
    { id: 'PRJ-005', name: '성능 최적화', status: '진행중', progress: 68, activity: '중간' },
  ];

  // 시스템 로그 데이터
  const systemLogs = [
    { id: 'LOG-1234', timestamp: '2023-05-20 14:32:46', level: 'INFO', message: '로그인 시스템 업데이트 완료' },
    { id: 'LOG-1233', timestamp: '2023-05-20 12:15:30', level: 'WARNING', message: 'API 응답 지연 감지' },
    { id: 'LOG-1232', timestamp: '2023-05-20 10:42:12', level: 'ERROR', message: '결제 처리 중 시스템 오류 발생' },
    { id: 'LOG-1231', timestamp: '2023-05-20 09:18:55', level: 'INFO', message: '데이터베이스 백업 완료' },
    { id: 'LOG-1230', timestamp: '2023-05-19 23:42:10', level: 'WARNING', message: '메모리 사용량 높음 (85%)' },
  ];

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

  return (
    <DashboardTemplate
      title="개발자 대시보드"
      description="시스템 모니터링, 프로젝트 진행 상황 및 API 상태를 확인할 수 있는 개발자 대시보드입니다."
      headerBgClass="bg-purple-600"
      headerTextClass="text-white"
      toolbarActions={
        <>
          <Button variant="outline" size="sm" className="h-9 bg-white/20 text-white hover:bg-white/30 border-white/40">
            시스템 설정
          </Button>
          <Button variant="outline" size="sm" className="h-9 bg-white/20 text-white hover:bg-white/30 border-white/40">
            API 문서
          </Button>
        </>
      }
    >
      {/* 첫 번째 줄: 4개의 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <DashboardColorCard
          title="활성 프로젝트"
          value={stats.activeProjects.count}
          unit="개"
          trend={stats.activeProjects.trend}
          icon="code"
          iconColor="bg-purple-600"
        />
        <DashboardColorCard
          title="해결된 이슈"
          value={stats.issuesResolved.count}
          unit="개"
          trend={stats.issuesResolved.trend}
          icon="check-circle"
          iconColor="bg-purple-600"
        />
        <DashboardColorCard
          title="코드 품질"
          value={stats.codeQuality.count}
          unit="%"
          trend={stats.codeQuality.trend}
          icon="shield-check"
          iconColor="bg-green-600"
        />
        <DashboardColorCard
          title="금주 배포"
          value={stats.deployments.count}
          unit="회"
          trend={stats.deployments.trend}
          icon="rocket"
          iconColor="bg-blue-600"
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
              <h3 className="text-lg font-semibold text-gray-800">프로젝트 현황</h3>
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
                  <TableHead className="py-3 px-4 text-left">시간</TableHead>
                  <TableHead className="py-3 px-4 text-center">레벨</TableHead>
                  <TableHead className="py-3 px-4 text-left">메시지</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemLogs.map((log, index) => (
                  <TableRow key={index} className="border-b border-gray-200">
                    <TableCell className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">{log.timestamp}</span>
                        <span className="text-xs text-gray-400">{log.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.level)}`}>
                        {log.level}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span className="text-sm">{log.message}</span>
                    </TableCell>
                  </TableRow>
                ))}
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
              <h3 className="text-lg font-semibold text-gray-800">API 상태</h3>
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
    </DashboardTemplate>
  );
};

export default DashboardContent;