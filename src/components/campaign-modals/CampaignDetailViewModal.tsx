import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogHeaderSpacer
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';
import { supabase } from '@/supabase';
import ReactApexChart from 'react-apexcharts';
import { getFilteredRankingData, calculateDataStats } from '@/utils/ChartSampleData';
import { getStatusColorClass } from '@/utils/CampaignFormat';
import { ICampaign, getStatusColor, getStatusLabel } from './types';
import { getCampaignDetail } from '@/pages/advertise/campaigns/services/campaignDetailService';

// 가격에 콤마 추가하는 함수
const formatPriceWithCommas = (price: string | number): string => {
  if (price === undefined || price === null) return '0';

  // 문자열로 변환
  let priceStr = String(price);

  // "원" 단위가 포함된 경우 제거
  priceStr = priceStr.replace(/원/g, '');

  // 숫자만 추출
  priceStr = priceStr.replace(/[^0-9]/g, '');

  // 비어있으면 0 반환
  if (!priceStr) return '0';

  // 숫자에 천 단위 콤마 추가
  return priceStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

interface CampaignDetailViewModalProps {
  open: boolean;
  onClose: () => void;
  campaign: ICampaign | null;
}

const CampaignDetailViewModal: React.FC<CampaignDetailViewModalProps> = ({
  open,
  onClose,
  campaign
}) => {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [campaignDetail, setCampaignDetail] = useState<any>(null);

  // 차트 관련 상태
  const [activePeriod, setActivePeriod] = useState<number>(7);
  const [chartData, setChartData] = useState({
    upperRank: [] as number[],
    lowerRank: [] as number[],
    dates: [] as string[]
  });
  const [stats, setStats] = useState({
    upperRank: { min: -1, max: -1, avg: -1, bestImprovement: -1 },
    lowerRank: { min: -1, max: -1, avg: -1, bestImprovement: -1 }
  });
  const [hasRankingData, setHasRankingData] = useState<boolean>(false);

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
    colors: ['#4285F4', '#F47E43'], // 파란색, 주황색
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
    },
    noData: {
      text: '기간별 통계 데이터가 없습니다',
      align: 'center',
      verticalAlign: 'middle',
      offsetX: 0,
      offsetY: 0,
      style: {
        color: '#6B7280',
        fontSize: '16px',
        fontFamily: 'inherit'
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
    // 항상 데이터가 없는 것처럼 표시
    const hasData = false;
    setHasRankingData(hasData);

    if (!hasData) {
      // 데이터가 없는 경우 빈 배열로 설정
      setChartData({
        upperRank: [],
        lowerRank: [],
        dates: []
      });
      setStats({
        upperRank: { min: -1, max: -1, avg: -1, bestImprovement: -1 },
        lowerRank: { min: -1, max: -1, avg: -1, bestImprovement: -1 }
      });
      setChartSeries([
        { name: '30등 이내', data: [] },
        { name: '30등 이하', data: [] }
      ]);
      return;
    }

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
  }, [open, campaign]);

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
          position: 'top',
          horizontalAlign: 'center',
          offsetY: 0,
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

  // 캠페인 ID로 Supabase에서 캠페인 상세 정보 가져오기
  useEffect(() => {
    if (open && campaign && campaign.id) {
      const fetchCampaignDetail = async () => {
        setLoading(true);
        try {
          // 새 서비스 함수를 사용하여 상세 정보 가져오기
          const detail = await getCampaignDetail(campaign.id);
          
          if (detail) {
            setCampaignDetail(detail);
            
            // 배너 URL 설정
            let bannerUrl = null;
            if (detail.add_info) {
              if (typeof detail.add_info === 'string') {
                try {
                  const addInfo = JSON.parse(detail.add_info);
                  bannerUrl = addInfo.banner_url || null;
                } catch (e) {
                  // JSON 파싱 오류 무시
                }
              } else {
                bannerUrl = detail.add_info.banner_url || null;
              }
            }
            
            setBannerUrl(bannerUrl);
          }
        } catch (err) {
          // 오류 처리
        } finally {
          setLoading(false);
        }
      };

      fetchCampaignDetail();
    }
  }, [open, campaign?.id]);

  if (!campaign) return null;

  // 캠페인 ID는 업데이트 조건으로만 사용
  const campaignId = campaign.id;

  // 상태가 문자열 또는 객체일 수 있음을 처리
  // 1. 상태 원시값 (active, pause 등) 가져오기
  let statusRaw = 'active'; // 기본값

  if (typeof campaign.status === 'string') {
    statusRaw = campaign.status;
  } else if (campaign.status && typeof campaign.status === 'object') {
    // 객체의 경우 status 필드 먼저 확인 (원시 상태값)
    if ((campaign.status as any).status) {
      statusRaw = (campaign.status as any).status;
    }
    // color 필드에서 상태 추출 시도 (badge-success 형태에서 success 추출)
    else if ((campaign.status as any).color && (campaign.status as any).color.startsWith('badge-')) {
      statusRaw = (campaign.status as any).color.replace('badge-', '');
    }
    // 그 외의 경우 color 필드 사용
    else if ((campaign.status as any).color) {
      statusRaw = (campaign.status as any).color;
    }
  }

  // 2. 배지 색상 클래스 (badge-success 등)
  const statusBadge = statusRaw.startsWith('badge-') ? statusRaw : `badge-${statusRaw}`;

  // 3. 점 색상 클래스 (success, primary 등)
  const statusDotColor = statusRaw.startsWith('badge-') ?
    statusRaw.replace('badge-', '') : statusRaw;

  // 4. 상태 라벨 텍스트
  const statusLabel = typeof campaign.status === 'string' ?
    getStatusLabel(campaign.status) :
    (campaign.status as any)?.label || '준비중';

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[900px] p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="bg-background py-3 px-5">
          <DialogTitle className="text-lg font-medium text-foreground">캠페인 상세 정보</DialogTitle>
          <DialogHeaderSpacer />
        </DialogHeader>
        <div className="bg-background flex flex-col h-[85vh] w-full">
          <div className="flex-shrink-0">
            {/* 배너 이미지 영역 - 항상 표시, 배너가 없으면 기본 이미지 사용 */}
            {loading ? (
              <div className="w-full h-[150px] bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="w-full relative h-[220px]">
                <div className="absolute inset-0 overflow-hidden">
                  {/* 배경 이미지(블러용) */}
                  <img
                    src={bannerUrl || toAbsoluteUrl('/media/app/default-logo.svg')}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ filter: 'blur(8px) brightness(0.9)', transform: 'scale(1.1)' }}
                  />
                  {/* 배경 오버레이 */}
                  <div className="absolute inset-0 bg-black/20"></div>
                </div>
                {/* 실제 이미지 (블러 없음) */}
                <div className="relative z-10 flex justify-center items-center h-full">
                  <img
                    src={bannerUrl || toAbsoluteUrl('/media/app/mini-logo-primary.svg')}
                    alt="캠페인 배너"
                    className="object-contain max-h-[180px] max-w-[90%] shadow-lg rounded-md"
                    onError={(e) => {
                      // 이미지 로드 실패 시 기본 배경으로 대체
                      e.currentTarget.src = toAbsoluteUrl('/media/app/mini-logo-primary.svg');
                    }}
                  />
                </div>
              </div>
            )}

            {/* 캠페인 헤더 정보 */}
            <div className="bg-background border-b px-5 py-3">
              <div className="flex items-center gap-4">
                <img
                  src={(() => {
                    // 로고가 없으면 기본 이미지 사용
                    if (!campaign.logo) {
                      return toAbsoluteUrl('/media/animal/svg/lion.svg');
                    }

                    // 로고에 경로가 이미 포함된 경우 그대로 사용
                    if (campaign.logo.startsWith('/media') || campaign.logo.startsWith('http')) {
                      return campaign.logo;
                    }

                    // 로고가 파일명(확장자 포함)인 경우 경로 추가
                    if (campaign.logo.includes('.svg') || campaign.logo.includes('.png')) {
                      return toAbsoluteUrl(`/media/${campaign.logo}`);
                    }

                    // 플라밍고-89740과 같은 형식인 경우 플라밍고만 추출 시도
                    const dashIndex = campaign.logo.indexOf('-');
                    if (dashIndex > 0) {
                      const animalName = campaign.logo.substring(0, dashIndex).toLowerCase().trim();
                      // 알려진 동물 이름인지 확인 (플라밍고, 라이언 등)
                      if (['플라밍고', 'flamingo'].includes(animalName)) {
                        return toAbsoluteUrl('/media/animal/svg/flamingo.svg');
                      }
                      if (['라이언', '사자', 'lion'].includes(animalName)) {
                        return toAbsoluteUrl('/media/animal/svg/lion.svg');
                      }
                      if (['고양이', 'cat'].includes(animalName)) {
                        return toAbsoluteUrl('/media/animal/svg/cat.svg');
                      }
                      // 다른 동물 이름 추가 필요시 확장
                    }

                    // 동물 이름으로 간주하고 SVG 경로 생성
                    return toAbsoluteUrl(`/media/animal/svg/${campaign.logo}.svg`);
                  })()}
                  className="rounded-full size-12 shrink-0 border border-gray-100 shadow-sm"
                  alt={campaign?.campaignName}
                  onError={(e) => {
                    // 이미지 로드 실패 시 조용히 기본 이미지 사용
                    (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/animal/svg/lion.svg');
                  }}
                />
                <div>
                  <h2 className="text-lg font-semibold text-foreground flex items-center">
                    {campaign?.campaignName}
                    <span className={`badge ${statusBadge} badge-outline rounded-[30px] h-auto py-0.5 text-xs ml-2`}>
                      <span className={`size-1.5 rounded-full bg-${statusDotColor} me-1.5`}></span>
                      {statusLabel}
                    </span>
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* 스크롤 가능한 콘텐츠 영역 */}
          <div className="flex-grow overflow-y-auto p-6">
            <div className="space-y-6">
              {/* 상단: 주요 정보 요약 카드 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <KeenIcon icon="wallet" className="text-primary size-5" />
                    <div className="text-sm text-muted-foreground">건당 단가</div>
                  </div>
                  <div className="text-xl font-bold text-primary">
                    {campaign?.unitPrice
                      ? `${formatPriceWithCommas(campaign.unitPrice)}원`
                      : '1,000원'}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <KeenIcon icon="rocket" className="text-green-500 size-5" />
                    <div className="text-sm text-muted-foreground">상승효율</div>
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    {campaign?.efficiency || '60%'}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <KeenIcon icon="timer" className="text-blue-500 size-5" />
                    <div className="text-sm text-muted-foreground">접수마감시간</div>
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {campaign?.deadline || '18:00'}
                  </div>
                </div>
              </div>

              {/* 중간: 캠페인 설명 */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3">캠페인 정보</h3>
                <div className="bg-white border border-border p-5 rounded-xl text-md text-foreground">
                  <div className="mb-4">
                    <h4 className="font-medium text-primary mb-2">소개</h4>
                    <p className="text-sm whitespace-pre-line text-gray-700 bg-blue-50/50 p-3 rounded-md border border-blue-100/50">
                      {campaign?.description || '설명이 없습니다.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-primary mb-2">상세 설명</h4>
                    <div className="max-h-[200px] overflow-y-auto pr-2 rounded-md p-3 bg-blue-50/30">
                      <p className="whitespace-pre-line text-gray-700">
                        {/* 가져온 상세 정보에서 상세 설명 표시 */}
                        {campaignDetail?.detailed_description ? 
                          campaignDetail.detailed_description.replace(/\\n/g, '\n') : 
                          (campaign?.originalData?.detailed_description ? 
                            campaign.originalData.detailed_description.replace(/\\n/g, '\n') :
                            (campaign?.detailedDescription && campaign.detailedDescription !== campaign.description ? 
                              campaign.detailedDescription : 
                              (campaign?.description || '상세 설명이 없습니다.')))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 가이드라인 */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3">캠페인 가이드라인</h3>
                <div className="bg-white p-5 rounded-xl text-md text-muted-foreground border border-border">
                  <ul className="list-disc list-inside space-y-1.5">
                    <li>해당 캠페인 건당 단가는 {campaign?.unitPrice
                      ? `${formatPriceWithCommas(campaign.unitPrice)}원`
                      : '1,000원'}입니다.</li>
                    <li>캠페인 접수 시간은 {campaign?.deadline || '18:00'}까지 입니다.</li>
                    {campaign?.additionalLogic && campaign.additionalLogic !== '0' && campaign.additionalLogic !== '없음' && (
                      <li>추가로직 필요 수량은 {campaign.additionalLogic}입니다.</li>
                    )}
                    <li>데이터는 24시간 내에 집계되며, 결과는 대시보드에서 확인할 수 있습니다.</li>
                  </ul>
                </div>
              </div>

              {/* 순위 변화 추이 섹션 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-foreground">순위 변화 추이</h3>
                  <div className="flex gap-2">
                    <Button
                      variant={activePeriod === 7 ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePeriodChange(7)}
                      className={`h-8 px-3 ${activePeriod === 7
                        ? 'bg-blue-600 hover:bg-blue-800 text-white'
                        : 'hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-600'}`}
                    >
                      7일
                    </Button>
                    <Button
                      variant={activePeriod === 14 ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePeriodChange(14)}
                      className={`h-8 px-3 ${activePeriod === 14
                        ? 'bg-blue-600 hover:bg-blue-800 text-white'
                        : 'hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-600'}`}
                    >
                      14일
                    </Button>
                    <Button
                      variant={activePeriod === 30 ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePeriodChange(30)}
                      className={`h-8 px-3 ${activePeriod === 30
                        ? 'bg-blue-600 hover:bg-blue-800 text-white'
                        : 'hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-600'}`}
                    >
                      30일
                    </Button>
                  </div>
                </div>

                <div className="h-[300px] w-full rounded-xl overflow-hidden bg-white p-3 pb-5 border border-border">
                  {hasRankingData ? (
                    <ReactApexChart
                      options={chartOptions}
                      series={chartSeries}
                      type="line"
                      height={280}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <KeenIcon icon="chart-line" className="mx-auto mb-3 size-12 text-gray-300" />
                        <h4 className="text-md font-medium">기간별 통계 데이터가 없습니다</h4>
                        <p className="text-sm text-gray-400 mt-1">아직 통계 데이터가 수집되지 않았습니다.</p>
                      </div>
                    </div>
                  )}
                </div>

                {hasRankingData && (
                  <>
                    <h3 className="text-lg font-medium text-foreground mb-2 mt-6">추가 분석</h3>
                    <div className="bg-white p-5 rounded-xl border border-border">
                      <p className="text-sm text-muted-foreground mb-2">
                        최근 {activePeriod}일간의 랭킹 변화 추이를 분석한 결과, 전체적으로 상승세를 보이고 있습니다.
                      </p>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
                            <li>30위 이상 평균 순위: <span className="text-foreground font-medium">{Math.round(stats.upperRank.avg)}등</span></li>
                            <li>30위 이하 평균 순위: <span className="text-foreground font-medium">{Math.round(stats.lowerRank.avg)}등</span></li>
                          </ul>
                        </div>
                        <div>
                          <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
                            <li>30등 이내 최고 상승폭: <span className="text-foreground font-medium text-blue-600">+{Math.round(stats.upperRank.bestImprovement)}등</span></li>
                            <li>30등 이하 최고 상승폭: <span className="text-foreground font-medium text-blue-600">+{Math.round(stats.lowerRank.bestImprovement)}등</span></li>
                            <li>추세 분석: <span className="text-foreground font-medium">{activePeriod === 7 ? '단기' : activePeriod === 14 ? '중기' : '장기'} 상승세 유지중</span></li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 하단 버튼 영역 */}
          <div className="flex-shrink-0 border-t p-4 flex justify-end">
            <Button
              onClick={onClose}
              className="px-6 bg-blue-600 hover:bg-blue-800 text-white"
            >
              확인
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { CampaignDetailViewModal };