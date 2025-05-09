import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';
import { getFilteredRankingData, calculateDataStats } from '@/utils/ChartSampleData';
import { getStatusColorClass, CampaignDetailData } from '@/utils/CampaignFormat';
// ApexCharts 일반 임포트 (SSR이 필요하지 않은 Vite 프로젝트)
import ReactApexChart from 'react-apexcharts';

interface RankingChangeChartProps {
  open: boolean;
  onClose: () => void;
}

export const RankingChangeChart: React.FC<RankingChangeChartProps> = ({
  open,
  onClose
}) => {
  // 샘플 캠페인 데이터
  const [campaign, setCampaign] = useState<CampaignDetailData>({
    id: 'lion-traffic',
    campaignName: '라이언',
    description: '4가지 방식을 복합하여 진행하는 네이버 트래픽 고급형 캠페인입니다. 검색엔진 최적화부터 유기적 유입까지 다양한 방식으로 트래픽을 증가시킵니다.',
    logo: '/media/animal/svg/lion.svg',
    efficiency: '63%',
    minQuantity: '120개',
    deadline: '23:00',
    unitPrice: '1,800원',
    additionalLogic: '30개',
    detailedDescription: '라이언 네이버 트래픽 캠페인은 다음 4가지 방식을 복합적으로 활용합니다:\n\n1. 키워드 검색 활성화: 핵심 키워드로 사용자 검색 패턴을 분석하고 반영합니다.\n2. 콘텐츠 소비 유도: 검색 결과에서 링크 클릭 후 페이지 내 체류시간을 늘립니다.\n3. 관련 검색어 연계: 연관 검색어와 함께 연속 검색을 통해 관련성을 높입니다.\n4. 검색 반복성 확보: 주기적인 검색 패턴을 형성하여 랭킹 상승을 안정화합니다.\n\n이 캠페인은 모든 방식을 유기적으로 결합하여 최고 수준의 효율을 제공합니다. 네이버 검색엔진 내 상위 노출에 특화된 프리미엄 서비스입니다.',
    status: {
      label: '진행중',
      color: 'badge-success'
    }
  });

  // 활성 기간 상태 (7일, 14일, 30일)
  const [activePeriod, setActivePeriod] = useState<number>(30);
  
  // 차트 데이터
  const [chartData, setChartData] = useState({
    upperRank: [] as number[],
    lowerRank: [] as number[],
    dates: [] as string[]
  });

  // 차트 데이터 통계
  const [stats, setStats] = useState({
    upperRank: { min: 0, max: 0, avg: 0, bestImprovement: 0 },
    lowerRank: { min: 0, max: 0, avg: 0, bestImprovement: 0 }
  });
  
  // 다크 모드 감지
  const isDarkMode = () => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  };

  // 차트 옵션 상태
  const [chartOptions, setChartOptions] = useState<ApexCharts.ApexOptions>({
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      fontFamily: 'inherit',
      background: 'transparent',
      parentHeightOffset: 0
    },
    colors: ['#4285F4', '#F47E43'], // 파란색, 주황색 (원래 색상으로 복원)
    stroke: {
      width: [3, 3],
      curve: 'straight'
    },
    grid: {
      borderColor: isDarkMode() ? '#374151' : '#e0e0e0',
      padding: {
        right: 5,
        left: 5,
        bottom: 15
      }
    },
    markers: {
      size: 4,
      colors: ['#4285F4', '#F47E43'], // 파란색, 주황색
      strokeColors: isDarkMode() ? '#1f2937' : '#fff',
      strokeWidth: 2,
      hover: {
        size: 6
      }
    },
    xaxis: {
      categories: [],
      labels: {
        style: {
          colors: isDarkMode() ? '#d1d5db' : '#666',
          fontSize: '12px'
        },
        offsetY: 2,
        trim: false
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      min: 0,
      max: 50,
      reversed: true,  // 역순으로 표시(낮은 순위가 위에 오도록)
      tickAmount: 10,
      labels: {
        style: {
          colors: isDarkMode() ? '#d1d5db' : '#666',
          fontSize: '12px'
        },
        formatter: (value) => {
          // Y축 라벨을 실제 순위로 표시
          if (value === 0) return '';
          if (value === 1) return '1등';
          if (value === 5) return '5등';
          if (value === 10) return '10등';
          if (value === 15) return '15등';
          if (value === 20) return '20등';
          if (value === 25) return '25등';
          if (value === 30) return '30등';
          if (value === 40) return '40등';
          if (value === 50) return '50등';
          return '';
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: isDarkMode() ? 'dark' : 'light',
      style: {
        fontSize: '12px'
      },
      marker: {
        show: true
      },
      x: {
        show: true,
        formatter: (value, opts) => {
          let dateStr;
          
          // 직접 날짜 형식 생성
          if (opts && opts.dataPointIndex !== undefined) {
            const today = new Date();
            const daysFromToday = activePeriod - opts.dataPointIndex - 1;
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() - daysFromToday);
            
            const month = targetDate.getMonth() + 1;
            const day = targetDate.getDate();
            dateStr = `${month}월 ${day}일`;
          } else {
            dateStr = value;
          }
          
          return isDarkMode() 
            ? `<div class="font-semibold bg-blue-700 px-3 py-1.5 rounded text-white">${dateStr}</div>`
            : `<div class="font-semibold bg-blue-100 px-3 py-1.5 rounded text-blue-800">${dateStr}</div>`;
        }
      },
      y: {
        formatter: (value) => {
          // value는 이미 실제 순위이므로 직접 표시
          return `${Math.round(value)}등`;
        }
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'center',
      offsetY: 0,
      labels: {
        colors: isDarkMode() ? '#d1d5db' : '#666'
      }
    }
  });
  
  // 차트 시리즈 상태
  const [chartSeries, setChartSeries] = useState<ApexCharts.ApexOptions['series']>([
    {
      name: '30등 이내',
      data: []
    },
    {
      name: '30등 이하',
      data: []
    }
  ]);

  // 기간 변경 핸들러
  const handlePeriodChange = (period: number) => {
    setActivePeriod(period);
    loadChartData(period);
  };
  
  // 차트 데이터 로드 함수
  const loadChartData = (period: number) => {
    const data = getFilteredRankingData(period);
    setChartData(data);
    
    setStats({
      upperRank: calculateDataStats(data.upperRank),
      lowerRank: calculateDataStats(data.lowerRank)
    });
    
    // 차트 시리즈 및 옵션 업데이트
    setChartSeries([
      {
        name: '30등 이내',
        data: data.upperRank
      },
      {
        name: '30등 이하',
        data: data.lowerRank
      }
    ]);
    
    // X축 카테고리 확인
    console.log('X축 날짜 데이터:', data.dates);
    
    // 기간에 따라 X축 표시 간격 조정
    const tickAmount = period <= 7 ? 6 : period <= 14 ? 7 : 10;
    
    setChartOptions(prevOptions => ({
      ...prevOptions,
      chart: {
        ...prevOptions.chart,
        parentHeightOffset: 0
      },
      grid: {
        ...prevOptions.grid,
        padding: {
          right: 5,
          left: 5,
          bottom: 20
        }
      },
      xaxis: {
        ...prevOptions.xaxis,
        categories: data.dates,
        tickAmount: tickAmount,
        labels: {
          ...prevOptions.xaxis?.labels,
          rotate: 0,
          offsetY: 5,
          trim: false,
          style: {
            ...prevOptions.xaxis?.labels?.style,
            fontSize: '11px'
          }
        }
      },
      tooltip: {
        ...prevOptions.tooltip,
        theme: isDarkMode() ? 'dark' : 'light',
        x: {
          ...prevOptions.tooltip?.x,
          formatter: (value, opts) => {
            let dateStr;
            
            // 직접 날짜 형식 생성
            if (opts && opts.dataPointIndex !== undefined) {
              const today = new Date();
              const daysFromToday = period - opts.dataPointIndex - 1;
              const targetDate = new Date(today);
              targetDate.setDate(today.getDate() - daysFromToday);
              
              const month = targetDate.getMonth() + 1;
              const day = targetDate.getDate();
              dateStr = `${month}월 ${day}일`;
            } else {
              dateStr = value;
            }
            
            return isDarkMode() 
              ? `<div class="font-semibold bg-blue-700 px-3 py-1.5 rounded text-white">${dateStr}</div>`
              : `<div class="font-semibold bg-blue-100 px-3 py-1.5 rounded text-blue-800">${dateStr}</div>`;
          }
        }
      }
    }));
  };

  // 컴포넌트 마운트 시 차트 데이터 생성
  useEffect(() => {
    if (open) {
      loadChartData(activePeriod);
    }
  }, [open]);

  // 다크 모드 변경 감지 및 차트 테마 업데이트
  useEffect(() => {
    const updateChartTheme = () => {
      const isDark = isDarkMode();

      // 차트 시리즈 데이터 참조
      const currentSeries = chartSeries as ApexCharts.ApexOptions['series'];

      setChartOptions(prevOptions => ({
        ...prevOptions,
        chart: {
          ...prevOptions.chart,
          background: isDark ? '#1e293b' : 'transparent',
          foreColor: isDark ? '#d1d5db' : '#666',
          animations: {
            enabled: true, // 애니메이션 활성화
            easing: 'easeinout',
            speed: 800,
            animateGradually: {
              enabled: true,
              delay: 150
            },
            dynamicAnimation: {
              enabled: true,
              speed: 350
            }
          }
        },
        grid: {
          ...prevOptions.grid,
          borderColor: isDark ? '#475569' : '#e0e0e0',
          strokeDashArray: 3,
          padding: {
            right: 5,
            left: 5,
            bottom: 15
          }
        },
        markers: {
          ...prevOptions.markers,
          strokeColors: isDark ? '#1e293b' : '#fff'
        },
        xaxis: {
          ...prevOptions.xaxis,
          categories: chartData.dates, // 데이터 명시적 설정
          labels: {
            ...prevOptions.xaxis?.labels,
            show: true,
            offsetY: 2,
            trim: false,
            style: {
              ...prevOptions.xaxis?.labels?.style,
              colors: isDark ? '#d1d5db' : '#666'
            }
          },
          axisBorder: {
            ...prevOptions.xaxis?.axisBorder,
            color: isDark ? '#475569' : '#e0e0e0'
          },
          crosshairs: {
            stroke: {
              color: isDark ? '#475569' : '#e0e0e0'
            }
          }
        },
        yaxis: {
          ...prevOptions.yaxis,
          min: 0,
          max: 50,
          reversed: true,
          tickAmount: 10,
          labels: {
            style: {
              colors: isDark ? '#d1d5db' : '#666'
            },
            formatter: (value) => {
              if (value === 0) return '';
              if (value === 1) return '1등';
              if (value === 5) return '5등';
              if (value === 10) return '10등';
              if (value === 15) return '15등';
              if (value === 20) return '20등';
              if (value === 25) return '25등';
              if (value === 30) return '30등';
              if (value === 40) return '40등';
              if (value === 50) return '50등';
              return '';
            }
          }
        },
        tooltip: {
          ...prevOptions.tooltip,
          theme: isDark ? 'dark' : 'light'
        },
        legend: {
          ...prevOptions.legend,
          labels: {
            ...prevOptions.legend?.labels,
            colors: isDark ? '#d1d5db' : '#666'
          }
        }
      }));

      // 다크모드 변경 후 시리즈 데이터 재설정 (명시적으로 데이터 갱신)
      setTimeout(() => {
        setChartSeries([
          {
            name: '30등 이내',
            data: [...chartData.upperRank]
          },
          {
            name: '30등 이하',
            data: [...chartData.lowerRank]
          }
        ]);
      }, 50);
    };

    // MutationObserver로 다크 모드 변경 감지
    if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === 'attributes' &&
            mutation.attributeName === 'class'
          ) {
            updateChartTheme();
          }
        });
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });

      // 초기 설정 적용
      updateChartTheme();

      return () => observer.disconnect();
    }
  }, [chartData]);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[1280px] p-0 overflow-hidden">
        <DialogHeader className="bg-background py-5 px-8 border-b sticky top-0 z-10">
          <DialogTitle className="text-lg font-medium text-foreground">캠페인 상세 정보</DialogTitle>
        </DialogHeader>

        {/* 헤더 정보 - 고정 위치로 변경 */}
        <div className="sticky top-[61px] z-10 bg-background border-b px-8 py-4">
          <div className="flex items-center gap-4">
            <img
              src={campaign.logo.startsWith('/media') ? toAbsoluteUrl(campaign.logo) : toAbsoluteUrl(`/media/${campaign.logo}`)}
              className="rounded-full size-16 shrink-0"
              alt={campaign.campaignName}
              onError={(e) => {
                // 이미지 로드 실패 시 기본 이미지 사용
                (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/animal/svg/lion.svg');
              }}
            />
            <div>
              <h2 className="text-xl font-semibold text-foreground">{campaign.campaignName}</h2>
              <div className="mt-1">
                <span className={`badge ${campaign.status.color} badge-outline rounded-[30px] h-auto py-1`}>
                  <span className={`size-1.5 rounded-full bg-${getStatusColorClass(campaign.status.color)} me-1.5`}></span>
                  {campaign.status.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogBody className="p-8 pt-4 max-h-[70vh] overflow-y-auto">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 좌측: 캠페인 상세 정보 */}
            <div className="space-y-6 pr-2">
              <h3 className="text-lg font-medium text-foreground">캠페인 정보</h3>
              {/* 캠페인 정보 테이블 */}
              <div className="overflow-hidden border border-border rounded-xl">
                <table className="min-w-full divide-y divide-border">
                  <tbody className="divide-y divide-border">
                    <tr>
                      <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                        건당 단가
                      </th>
                      <td className="px-4 py-3 text-md text-foreground">
                        {campaign.unitPrice}
                      </td>
                    </tr>
                    <tr>
                      <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                        최소수량
                      </th>
                      <td className="px-4 py-3 text-md text-foreground">
                        {campaign.minQuantity}
                      </td>
                    </tr>
                    {campaign.additionalLogic && campaign.additionalLogic !== '없음' && (
                      <tr>
                        <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                          추가로직
                        </th>
                        <td className="px-4 py-3 text-md text-foreground">
                          {campaign.additionalLogic}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                        상승효율
                      </th>
                      <td className="px-4 py-3 text-md text-foreground">
                        {campaign.efficiency}
                      </td>
                    </tr>
                    <tr>
                      <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                        접수마감시간
                      </th>
                      <td className="px-4 py-3 text-md text-foreground">
                        {campaign.deadline}
                      </td>
                    </tr>
                    <tr>
                      <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                        캠페인 설명
                      </th>
                      <td className="px-4 py-3 text-md text-foreground whitespace-pre-line">
                        {campaign.description}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 캠페인 상세설명 */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">캠페인 상세설명</h3>
                <div className="bg-background border border-border p-5 rounded-xl text-md text-foreground whitespace-pre-line">
                  {campaign.detailedDescription ?
                    campaign.detailedDescription :
                    (campaign.description || '상세 설명이 없습니다.')}
                </div>
              </div>
              
              {/* 가이드라인 */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">캠페인 가이드라인</h3>
                <div className="bg-white p-5 rounded-xl text-md text-muted-foreground border border-border">
                  <ul className="list-disc list-inside space-y-1">
                    <li>해당 캠페인 건당 단가는 {campaign.unitPrice}입니다.</li>
                    <li>캠페인 접수 시간은 {campaign.deadline}까지 입니다.</li>
                    <li>최소 작업 수량은 {campaign.minQuantity}입니다.</li>
                    {campaign.additionalLogic && campaign.additionalLogic !== '없음' && (
                      <li>추가로직 필요 수량은 {campaign.additionalLogic}입니다.</li>
                    )}
                    <li>데이터는 24시간 내에 집계되며, 결과는 대시보드에서 확인할 수 있습니다.</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* 우측: 순위 변화 추이 */}
            <div className="border-l border-border pl-8 pr-3">
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-foreground">순위 변화 추이</h3>
                
                <div className="flex flex-wrap gap-5 mb-6">
                  <div className="bg-white p-4 rounded-xl flex-1 min-w-[120px] border border-border">
                    <div className="text-sm text-muted-foreground mb-1">30등 이내 평균</div>
                    <div className="text-2xl font-bold text-foreground">
                      {Math.round(stats.upperRank.avg)}등
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl flex-1 min-w-[120px] border border-border">
                    <div className="text-sm text-muted-foreground mb-1">30등 이하 평균</div>
                    <div className="text-2xl font-bold text-foreground">
                      {Math.round(stats.lowerRank.avg)}등
                    </div>
                  </div>
                </div>
                
                {/* 최고 상승폭 통계 */}
                <div className="flex flex-wrap gap-5 mb-6">
                  <div className="bg-white p-4 rounded-xl flex-1 min-w-[120px] border border-border">
                    <div className="text-sm text-muted-foreground mb-1">30등 이내 최고 상승</div>
                    <div className="text-2xl font-bold text-blue-600">+{Math.round(stats.upperRank.bestImprovement)}등</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl flex-1 min-w-[120px] border border-border">
                    <div className="text-sm text-muted-foreground mb-1">30등 이하 최고 상승</div>
                    <div className="text-2xl font-bold text-blue-600">+{Math.round(stats.lowerRank.bestImprovement)}등</div>
                  </div>
                </div>
                
                <div className="mb-4 flex justify-end gap-2">
                  <Button 
                    variant={activePeriod === 7 ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handlePeriodChange(7)}
                    className={`h-8 px-3 text-sm ${activePeriod === 7 
                      ? 'bg-blue-600 hover:bg-blue-800 text-white' 
                      : 'hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-600'}`}
                  >
                    7일
                  </Button>
                  <Button 
                    variant={activePeriod === 14 ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handlePeriodChange(14)}
                    className={`h-8 px-3 text-sm ${activePeriod === 14 
                      ? 'bg-blue-600 hover:bg-blue-800 text-white' 
                      : 'hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-600'}`}
                  >
                    14일
                  </Button>
                  <Button 
                    variant={activePeriod === 30 ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handlePeriodChange(30)}
                    className={`h-8 px-3 text-sm ${activePeriod === 30 
                      ? 'bg-blue-600 hover:bg-blue-800 text-white' 
                      : 'hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-600'}`}
                  >
                    30일
                  </Button>
                </div>
                
                <div className="h-[420px] w-full rounded-xl overflow-hidden bg-white p-3 pb-5 border border-border">
                  <ReactApexChart 
                    options={chartOptions}
                    series={chartSeries}
                    type="line"
                    height={400}
                  />
                </div>
                
                <div className="bg-white p-5 rounded-xl border border-border">
                  <h4 className="font-medium mb-3">추가 분석</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    최근 {activePeriod}일간의 랭킹 변화 추이를 분석한 결과, 전체적으로 상승세를 보이고 있습니다.
                  </p>
                  <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
                    <li>30위 이상 평균 순위: <span className="text-foreground font-medium">{Math.round(stats.upperRank.avg)}등</span></li>
                    <li>30위 이하 평균 순위: <span className="text-foreground font-medium">{Math.round(stats.lowerRank.avg)}등</span></li>
                    <li>30등 이내 최고 상승폭: <span className="text-foreground font-medium text-blue-600">+{Math.round(stats.upperRank.bestImprovement)}등</span></li>
                    <li>30등 이하 최고 상승폭: <span className="text-foreground font-medium text-blue-600">+{Math.round(stats.lowerRank.bestImprovement)}등</span></li>
                    <li>추세 분석: <span className="text-foreground font-medium">{activePeriod === 7 ? '단기' : activePeriod === 14 ? '중기' : '장기'} 상승세 유지중</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="px-8 py-5 border-t flex justify-end">
          <Button 
            onClick={onClose} 
            className="btn btn-md px-8 bg-blue-600 hover:bg-blue-800 text-white border-0"
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RankingChangeChart;