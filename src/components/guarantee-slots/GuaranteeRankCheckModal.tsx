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
  rankingFieldMapping?: Record<string, string>;
  inputData?: any;
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
  endDate,
  rankingFieldMapping,
  inputData
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
  const chartData = stats ? (() => {
    // 차트에 표시할 데이터 준비
    let chartRankings = [...stats.dailyRankings];
    let labels: string[] = [];
    let rankData: number[] = [];
    let pointColors: string[] = [];
    let borderColors: string[] = [];
    
    // dailyRankings가 없거나 오늘 데이터가 없는 경우 현재 순위 추가
    if (stats.currentRank && (chartRankings.length === 0 || 
        (chartRankings.length > 0 && new Date(chartRankings[chartRankings.length - 1].date).toDateString() !== new Date().toDateString()))) {
      const todayData = {
        date: new Date().toISOString(),
        rank: stats.currentRank,
        isAchieved: stats.currentRank <= targetRank
      };
      chartRankings.push(todayData);
    }
    
    // 라벨과 데이터 생성
    chartRankings.forEach((item) => {
      const date = new Date(item.date);
      const isToday = date.toDateString() === new Date().toDateString();
      labels.push(isToday ? `${date.getMonth() + 1}/${date.getDate()} (오늘)` : `${date.getMonth() + 1}/${date.getDate()}`);
      rankData.push(item.rank);
      pointColors.push(item.isAchieved ? '#10b981' : '#ef4444');
      borderColors.push(item.isAchieved ? '#059669' : '#dc2626');
    });
    
    return {
      labels: labels,
      datasets: [
        {
          label: '실제 순위',
          data: rankData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: pointColors,
          pointBorderColor: borderColors,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.2,
          fill: false,
        },
        {
          label: '목표 순위',
          data: new Array(labels.length).fill(targetRank),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: false,
        }
      ]
    };
  })() : null;


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
                  <div className="space-y-4">
                    {/* 캠페인 정보 테이블 형태로 표시 */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-tl-lg">
                              캠페인
                            </th>
                            {rankingFieldMapping && Object.entries(rankingFieldMapping)
                              .filter(([key]) => key === 'keyword' || key === 'product_id')
                              .map(([key, fieldName]) => {
                                const actualData = inputData?.keywords?.[0]?.input_data || inputData;
                                const value = actualData?.[fieldName as string];
                                if (!value) return null;
                                
                                return (
                                  <th key={key} className="text-left px-3 py-2 text-xs font-medium text-slate-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-800">
                                    {key === 'keyword' ? '키워드' : key === 'product_id' ? '상품ID' : fieldName}
                                  </th>
                                );
                              })}
                            <th className="bg-gray-50 dark:bg-gray-800 rounded-tr-lg"></th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-3 py-2 font-medium text-sm">
                              {campaignName || '캠페인'}
                            </td>
                            {rankingFieldMapping && Object.entries(rankingFieldMapping)
                              .filter(([key]) => key === 'keyword' || key === 'product_id')
                              .map(([key, fieldName]) => {
                                const actualData = inputData?.keywords?.[0]?.input_data || inputData;
                                const value = actualData?.[fieldName as string];
                                if (!value) return null;
                                
                                return (
                                  <td key={key} className="px-3 py-2 text-sm truncate" title={value}>
                                    {value}
                                  </td>
                                );
                              })}
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    {/* 목표 순위 */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-gray-700">
                      <span className="text-sm font-medium">목표 순위</span>
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-light dark:bg-primary-dark">
                        <span className="text-lg font-bold text-primary">{targetRank}위</span>
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
                  ) : stats ? (
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

                      {/* 일별 순위 가로 스크롤 박스 */}
                      <div className="card">
                        <div className="card-body">
                          <h4 className="text-sm font-medium mb-3">일별 순위</h4>
                          <div className="overflow-x-auto pb-2">
                            <div className="flex gap-3 min-w-max">
                              {/* 일별 순위 데이터 또는 오늘 현재 순위 */}
                              {(() => {
                                const allRankings = [...stats.dailyRankings];
                                
                                // 오늘 데이터가 없으면 현재 순위 추가
                                if (stats.currentRank && (allRankings.length === 0 || 
                                    new Date(allRankings[allRankings.length - 1].date).toDateString() !== new Date().toDateString())) {
                                  allRankings.push({
                                    date: new Date().toISOString(),
                                    rank: stats.currentRank,
                                    isAchieved: stats.currentRank <= targetRank
                                  });
                                }
                                
                                return allRankings.map((ranking, index) => {
                                  const date = new Date(ranking.date);
                                  const isToday = date.toDateString() === new Date().toDateString();
                                  const prevRank = index > 0 ? allRankings[index - 1].rank : null;
                                  const rankChange = prevRank ? prevRank - ranking.rank : null;
                                  
                                  return (
                                    <div
                                      key={ranking.date}
                                      className="flex-shrink-0 w-32 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                                    >
                                      {/* 날짜 */}
                                      <div className="text-center mb-2">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {date.getMonth() + 1}월 {date.getDate()}일
                                        </div>
                                        {isToday && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 mt-1">
                                            오늘
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* 순위 */}
                                      <div className="text-center mb-2">
                                        <span className={`inline-flex items-center justify-center min-w-[50px] px-3 py-1.5 text-lg font-bold rounded-full ${
                                          ranking.isAchieved 
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                            : ranking.rank <= targetRank + 3
                                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                        }`}>
                                          {ranking.rank}위
                                        </span>
                                      </div>
                                      
                                      {/* 변동 */}
                                      <div className="text-center">
                                        {rankChange !== null ? (
                                          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                                            rankChange > 0 ? 'text-green-600 dark:text-green-400' : 
                                            rankChange < 0 ? 'text-red-600 dark:text-red-400' : 
                                            'text-gray-500 dark:text-gray-400'
                                          }`}>
                                            {rankChange > 0 ? (
                                              <>
                                                <KeenIcon icon="arrow-up" className="text-xs" />
                                                {rankChange}
                                              </>
                                            ) : rankChange < 0 ? (
                                              <>
                                                <KeenIcon icon="arrow-down" className="text-xs" />
                                                {Math.abs(rankChange)}
                                              </>
                                            ) : (
                                              '-'
                                            )}
                                          </span>
                                        ) : (
                                          <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
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