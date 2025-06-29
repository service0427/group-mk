import React from 'react';
import { Badge } from '@/components/ui/badge';
import { KeenIcon } from '@/components';

interface RankingFieldMapping {
  keyword_field?: string;
  product_id_field?: string;
  title_field?: string;
  link_field?: string;
  rank_field?: string;
}

interface RankingData {
  keyword: string;
  product_id: string;
  title: string;
  link: string;
  rank: number;
  prev_rank?: number;
  [key: string]: any; // 추가 필드
}

interface RankingDataDisplayProps {
  rankingData: RankingData[];
  fieldMapping?: RankingFieldMapping;
  showPrevRank?: boolean;
}

export const RankingDataDisplay: React.FC<RankingDataDisplayProps> = ({
  rankingData,
  fieldMapping,
  showPrevRank = true
}) => {
  // 필드 매핑이 없으면 기본 필드명 사용
  const getFieldLabel = (field: keyof RankingFieldMapping): string => {
    if (!fieldMapping) {
      // 기본 레이블
      const defaultLabels = {
        keyword_field: '키워드',
        product_id_field: '상품코드',
        title_field: '상품명',
        link_field: 'URL',
        rank_field: '순위'
      };
      return defaultLabels[field];
    }
    
    // 매핑된 필드명 사용
    return fieldMapping[field] || '';
  };

  // 순위 변동 계산
  const getRankChange = (rank: number, prevRank?: number) => {
    if (!prevRank) return null;
    return prevRank - rank;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {getFieldLabel('rank_field')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {getFieldLabel('keyword_field')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {getFieldLabel('product_id_field')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {getFieldLabel('title_field')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {getFieldLabel('link_field')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {rankingData.map((item, idx) => {
            const rankChange = getRankChange(item.rank, item.prev_rank);
            const isTop10 = item.rank <= 10;
            
            return (
              <tr key={idx} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${isTop10 ? 'bg-blue-50/30' : ''}`}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        rankChange && rankChange > 0 ? "secondary" : 
                        rankChange && rankChange < 0 ? "destructive" : 
                        "outline"
                      }
                    >
                      {item.rank}위
                    </Badge>
                    {showPrevRank && rankChange !== null && rankChange !== 0 && (
                      <div className={`text-xs font-bold ${
                        rankChange > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {rankChange > 0 ? '↑' : '↓'}{Math.abs(rankChange)}
                      </div>
                    )}
                    {showPrevRank && !item.prev_rank && (
                      <Badge variant="secondary" className="text-xs">신규</Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {item.keyword}
                </td>
                <td className="px-4 py-3 text-sm">
                  {item.product_id}
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-md">
                    <span className="text-sm line-clamp-2">{item.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span className="truncate max-w-xs">링크</span>
                    <KeenIcon icon="exit-up" className="size-3" />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// 사용 예시:
// const campaign = { ranking_field_mapping: { keyword_field: "검색키워드", ... } };
// const rankingData = [...]; // 실제 순위 데이터
// 
// <RankingDataDisplay 
//   rankingData={rankingData}
//   fieldMapping={campaign.ranking_field_mapping}
//   showPrevRank={true}
// />