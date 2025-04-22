import React from 'react';
import { KeenIcon } from '@/components/keenicons';

interface StatItem {
  label: string;
  value: number;
}

interface NotificationStatsCardProps {
  title: string;
  value?: number;
  data?: StatItem[];
  icon?: string;
}

const NotificationStatsCard: React.FC<NotificationStatsCardProps> = ({
  title,
  value,
  data,
  icon = 'notification'
}) => {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary-lighter dark:bg-primary-dark flex items-center justify-center mr-3">
          <KeenIcon icon={icon} className="text-primary dark:text-primary-light text-xl" />
        </div>
        <h3 className="text-base font-medium text-card-foreground">{title}</h3>
      </div>
      
      {value !== undefined ? (
        <div className="text-3xl font-bold text-card-foreground text-right">{value.toLocaleString('ko-KR')}</div>
      ) : data && data.length > 0 ? (
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      item.label === '전체' ? 'bg-primary dark:bg-primary' :
                      item.label === '읽지 않음' ? 'bg-blue-500 dark:bg-blue-600' :
                      item.label === '읽음' ? 'bg-gray-400 dark:bg-gray-500' :
                      item.label === '보관됨' ? 'bg-purple-500 dark:bg-purple-600' :
                      item.label === '시스템' ? 'bg-blue-500 dark:bg-blue-600' :
                      item.label === '결제/캐시' ? 'bg-green-500 dark:bg-green-600' :
                      item.label === '서비스' ? 'bg-purple-500 dark:bg-purple-600' :
                      item.label === '슬롯' ? 'bg-orange-500 dark:bg-orange-600' :
                      item.label === '마케팅' ? 'bg-yellow-500 dark:bg-yellow-600' :
                      item.label === '개발자' ? 'bg-yellow-500 dark:bg-yellow-600' :
                      item.label === '운영자' ? 'bg-blue-500 dark:bg-blue-600' :
                      item.label === '총판' ? 'bg-green-500 dark:bg-green-600' :
                      item.label === '대행사' ? 'bg-purple-500 dark:bg-purple-600' :
                      item.label === '광고주' ? 'bg-gray-400 dark:bg-gray-500' :
                      'bg-primary-light dark:bg-primary'
                    } rounded-full`}
                    style={{ 
                      width: `${Math.min(100, (item.value / Math.max(...data.map(d => d.value), 1)) * 100)}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-card-foreground">{item.value.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">데이터 없음</div>
      )}
    </div>
  );
};

export default NotificationStatsCard;