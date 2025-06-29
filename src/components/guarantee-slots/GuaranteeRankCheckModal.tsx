import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { getGuaranteeSlotRankingData } from '@/services/rankingService';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface GuaranteeRankCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotId: string;
  campaignName?: string;
  campaignId?: number;
  targetRank: number;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

interface GuaranteeRankingData {
  date: string;
  rank: number;
  isAchieved: boolean;
}

interface GuaranteeRankingStats {
  targetRank: number;
  currentRank: number | null;
  firstRank: number | null;
  bestRank: number | null;
  averageRank: number | null;
  achievedDays: number;
  totalDays: number;
  achievementRate: number;
  dailyRankings: GuaranteeRankingData[];
}

const GuaranteeRankCheckModal: React.FC<GuaranteeRankCheckModalProps> = ({
  isOpen,
  onClose,
  slotId,
  campaignName,
  campaignId,
  targetRank,
  keyword,
  startDate,
  endDate
}) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<GuaranteeRankingStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && slotId && campaignId && startDate && endDate) {
      loadRankingData();
    }
  }, [isOpen, slotId, campaignId, targetRank, startDate, endDate]);

  const loadRankingData = async () => {
    if (!campaignId || !startDate || !endDate) {
      setError('필수 정보가 부족합니다.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await getGuaranteeSlotRankingData(
        slotId,
        campaignId,
        targetRank,
        startDate,
        endDate
      );
      
      if (result) {
        setStats(result);
      } else {
        setError('순위 데이터를 조회할 수 없습니다.');
      }
    } catch (err) {
      console.error('순위 데이터 조회 오류:', err);
      setError('순위 데이터 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 차트 데이터 생성
  const chartData = stats ? {
    labels: stats.dailyRankings.map(item => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        label: '실제 순위',
        data: stats.dailyRankings.map(item => item.rank),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: stats.dailyRankings.map(item => 
          item.isAchieved ? '#10b981' : '#ef4444'
        ),
        pointBorderColor: stats.dailyRankings.map(item => 
          item.isAchieved ? '#059669' : '#dc2626'
        ),
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.2,
        fill: false,
      },
      {
        label: '목표 순위',
        data: new Array(stats.dailyRankings.length).fill(targetRank),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
      }
    ]
  } : null;


  // 차트 옵션
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
      title: {
        display: true,
        text: '일자별 순위 변화',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const dataIndex = context.dataIndex;
            const isAchieved = stats?.dailyRankings[dataIndex]?.isAchieved;
            const label = context.dataset.label;
            const value = context.parsed.y;
            
            if (label === '실제 순위') {
              return `${label}: ${value}위 ${isAchieved ? '✅ 달성' : '❌ 미달성'}`;
            }
            return `${label}: ${value}위`;
          }
        }
      }
    },
    scales: {
      y: {
        reverse: true, // 1위가 위쪽에 오도록
        beginAtZero: false,
        title: {
          display: true,
          text: '순위',
          font: {
            size: 14,
            weight: 'bold' as const,
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            return `${value}위`;
          }
        }
      },
      x: {
        title: {
          display: true,
          text: '날짜',
          font: {
            size: 14,
            weight: 'bold' as const,
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl max-h-[85vh] flex flex-col"
        aria-describedby={undefined}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon="chart-line" className="size-5 text-primary" />
            📊 순위 확인 - {keyword || '키워드'}
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3">
              {/* 캠페인 정보 */}
              <div className="card">
                <div className="card-body">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-gray-500 block">캠페인</span>
                      <span className="text-sm font-medium mt-0.5 block truncate">
                        {campaignName || '캠페인'}
                      </span>
                    </div>
                    {keyword && (
                      <div>
                        <span className="text-xs text-slate-500 dark:text-gray-500 block">키워드</span>
                        <span className="text-sm font-medium mt-0.5 block truncate">
                          {keyword}
                        </span>
                      </div>
                    )}
                    <div className="col-span-2 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-gray-700">
                      <span className="text-sm font-medium">목표 순위</span>
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary-light dark:bg-primary-dark">
                        <span className="text-base font-bold text-primary">{targetRank}위</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 로딩/에러/차트 영역 */}
              <div className="card">
                <div className="card-body">
                  {loading ? (
                    <div className="flex justify-center items-center py-16">
                      <div className="text-center">
                        <div className="loading loading-spinner loading-lg mb-3"></div>
                        <p className="text-sm text-slate-500 dark:text-gray-500">
                          순위 데이터를 조회하고 있습니다...
                        </p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="flex justify-center items-center py-16">
                      <div className="text-center">
                        <KeenIcon icon="warning" className="text-3xl text-red-500 mb-3" />
                        <p className="text-sm text-red-600 mb-3">{error}</p>
                        <Button
                          variant="light"
                          size="sm"
                          onClick={loadRankingData}
                        >
                          다시 시도
                        </Button>
                      </div>
                    </div>
                  ) : stats && stats.dailyRankings.length > 0 ? (
                    <div className="space-y-4">
                      {/* 상단 통계 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-center">
                          <div className="text-xs text-slate-500 dark:text-gray-400 mb-1">현재순위</div>
                          <div className="text-lg font-bold text-primary">
                            {stats.currentRank ? `${stats.currentRank}위` : '-'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-slate-500 dark:text-gray-400 mb-1">최고순위</div>
                          <div className="text-lg font-bold text-success">
                            {stats.bestRank ? `${stats.bestRank}위` : '-'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-slate-500 dark:text-gray-400 mb-1">평균순위</div>
                          <div className="text-lg font-bold">
                            {stats.averageRank ? `${stats.averageRank}위` : '-'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-slate-500 dark:text-gray-400 mb-1">달성률</div>
                          <div className="text-lg font-bold text-warning">
                            {stats.achievementRate}%
                          </div>
                        </div>
                      </div>

                      {/* 차트 영역 */}
                      <div className="h-64">
                        {chartData && (
                          <Line data={chartData} options={chartOptions} />
                        )}
                      </div>

                      {/* 하단 상세 정보 */}
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-gray-700">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-gray-400 block">작업 기간</span>
                          <span className="text-sm font-medium mt-0.5 block">
                            {startDate && endDate ? `${formatDate(startDate)} ~ ${formatDate(endDate)}` : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 dark:text-gray-400 block">달성 현황</span>
                          <span className="text-sm font-medium mt-0.5 block">
                            {stats.achievedDays}일 / {stats.totalDays}일
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-16">
                      <div className="text-center">
                        <KeenIcon icon="chart-line" className="text-3xl text-slate-300 dark:text-gray-600 mb-3" />
                        <p className="text-sm text-slate-500 dark:text-gray-500">
                          순위 데이터가 없습니다
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogBody>

        <div className="flex-shrink-0 flex justify-end p-4 border-t border-slate-200 dark:border-gray-700">
          <Button
            variant="light"
            size="sm"
            onClick={handleClose}
          >
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuaranteeRankCheckModal;