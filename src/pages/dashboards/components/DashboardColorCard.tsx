import React, { useState, useEffect, useRef } from 'react';
import { KeenIcon } from '@/components';
import { cn } from '@/lib/utils';

interface DashboardColorCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  icon?: string;
  iconColor?: string;
  cardColor?: string;
  className?: string;
  duration?: number; // 애니메이션 지속 시간(ms)
  animate?: boolean; // 애니메이션 활성화 여부
}

/**
 * 디자인 이미지와 유사한 색상 카드 컴포넌트
 * - 상단에 아이콘과 색상 바를 표시
 * - 값, 단위, 증감률 등을 표시
 * - 다양한 색상과 아이콘 지원
 * - 숫자 애니메이션 효과 지원
 */
export const DashboardColorCard: React.FC<DashboardColorCardProps> = ({
  title,
  value,
  unit = '',
  trend = 0,
  icon = 'abstract-26',
  iconColor = 'bg-indigo-600',
  cardColor = 'bg-white',
  className,
  duration = 1500, // 기본 1.5초
  animate = true, // 기본적으로 애니메이션 활성화
}) => {
  // 숫자 애니메이션을 위한 상태와 ref
  const [displayValue, setDisplayValue] = useState(0);
  const targetValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0;
  const startTime = useRef<number | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const valueIsNumber = !isNaN(targetValue);

  // 숫자 포맷팅 (천 단위 콤마)
  const formatNumber = (num: number | string): string => {
    if (typeof num === 'string') {
      const numericValue = parseFloat(num.replace(/[^\d.-]/g, ''));
      if (isNaN(numericValue)) return num;
      num = numericValue;
    }

    // 소수점이 있는 경우 1자리까지 표시, 없는 경우 정수로 표시
    let formattedVal: string;
    if (String(value).includes('.')) {
      formattedVal = num.toFixed(1);
    } else {
      formattedVal = num.toFixed(0);
    }

    return formattedVal.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 트렌드에 따른 색상 (다크모드 지원)
  const trendColor = trend > 0 
    ? 'text-green-500 bg-green-50 dark:text-green-300 dark:bg-coal-400 dark:border dark:border-green-700' 
    : trend < 0 
    ? 'text-red-500 bg-red-50 dark:text-red-300 dark:bg-coal-400 dark:border dark:border-red-700' 
    : '';
  const trendIcon = trend > 0 ? '↑' : '↓';

  // 애니메이션 효과
  useEffect(() => {
    if (!animate || !valueIsNumber) {
      setDisplayValue(targetValue);
      return;
    }

    startTime.current = null;

    const animateValue = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = timestamp - startTime.current;
      const percentage = Math.min(progress / duration, 1);

      // easeOutQuart 이징 함수 사용
      const easeValue = 1 - Math.pow(1 - percentage, 4);
      const currentValue = easeValue * targetValue;

      setDisplayValue(currentValue);

      if (percentage < 1) {
        animationFrameId.current = requestAnimationFrame(animateValue);
      }
    };

    animationFrameId.current = requestAnimationFrame(animateValue);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [targetValue, duration, valueIsNumber, animate]);

  // 다크모드에서 카드 배경색 처리
  const darkCardColor = cardColor === 'bg-white' ? 'dark:bg-coal-300' : '';

  return (
    <div className={cn('rounded-lg overflow-hidden shadow-md border border-gray-100 dark:border-coal-100', cardColor, darkCardColor, className)}>
      <div className="relative min-h-[140px]">
        {/* 아이콘 영역 (상단 색상 바 포함) */}
        <div className={`absolute top-0 left-0 w-full h-1 ${iconColor}`}></div>
        
        {/* 대형 배경 아이콘 */}
        <div className="absolute right-0 bottom-0 w-32 h-32 overflow-hidden opacity-20">
          <div className="text-gray-500 dark:text-gray-600 transform translate-x-4 translate-y-4">
            {icon === 'abstract-26' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <rect x="2" y="2" width="20" height="20" rx="2" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            )}
            {icon === 'element-11' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M8 8h.01M12 8h.01M16 8h.01" />
              </svg>
            )}
            {icon === 'basket' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <path d="M2 3h2l3.5 11h11L22 8.5H9" />
                <circle cx="10" cy="18" r="2" />
                <circle cx="18" cy="18" r="2" />
              </svg>
            )}
            {icon === 'dollar' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            )}
            {icon === 'bank' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <path d="M3 22V8l9-6 9 6v14" />
                <path d="M4 22h16" />
                <path d="M3 10h18" />
                <path d="M8 14v4" />
                <path d="M16 14v4" />
                <path d="M12 14v4" />
              </svg>
            )}
            {icon === 'rocket' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
              </svg>
            )}
            {icon === 'eye' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
            {icon === 'mouse-click' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <path d="M9 9h6v6H9z" />
                <path d="m21 11-6-6" />
                <path d="M3 13V8h5" />
                <path d="M5 21 3 13l8-2" />
              </svg>
            )}
            {icon === 'tag' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                <path d="M7 7h.01" />
              </svg>
            )}
            {icon === 'arrow-turn-up' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <path d="M9 14 4 9l5-5" />
                <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v6" />
              </svg>
            )}
            {icon === 'chart-line' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            )}
            {icon === 'profile-user' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
            {icon === 'calendar-8' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            )}
            {icon === 'code' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <path d="m8 3 4 18" />
                <path d="m16 7-4 4 4 4" />
                <path d="m8 15 4-4-4-4" />
              </svg>
            )}
            {icon === 'shield-check' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <path d="M20 9c0 7-8 10-8 10s-8-3-8-10a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            )}
            {icon === 'check-circle' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="m9 11 3 3L22 4" />
              </svg>
            )}
            {!['abstract-26', 'element-11', 'basket', 'dollar', 'bank', 'rocket', 'eye', 'mouse-click', 'tag', 'arrow-turn-up', 'chart-line', 'profile-user', 'calendar-8', 'code', 'shield-check', 'check-circle'].includes(icon) && (
              <KeenIcon icon={icon} className="text-[8rem]" />
            )}
          </div>
        </div>

        <div className="p-6 relative z-10 h-full">
          {/* 텍스트 영역 */}
          <div className="flex-1 flex flex-col">
            {/* 제목 */}
            <div className="text-gray-500 dark:text-gray-300 text-sm mb-1">{title}</div>
            
            {/* 값과 단위 */}
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-800 dark:text-white">
                {valueIsNumber ? formatNumber(displayValue) : value}
              </span>
              {unit && (
                <span className="ml-1 text-sm text-gray-600 dark:text-gray-300">{unit}</span>
              )}
            </div>
            
            {/* 트렌드 영역 - 높이를 일정하게 유지 */}
            <div className="mt-2 min-h-[22px]">
              {trend !== 0 && (
                <div className={`py-0.5 px-2 rounded-md text-xs font-medium ${trendColor} inline-flex items-center`}>
                  {trendIcon} {Math.abs(trend)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardColorCard;