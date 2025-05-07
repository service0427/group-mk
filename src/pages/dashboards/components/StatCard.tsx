import React, { useState, useEffect, useRef } from 'react';
import { KeenIcon } from '@/components';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  icon?: string;
  keenIcon?: string;
  iconColor?: string;
  bgColor?: string;
  duration?: number; // 애니메이션 지속 시간(ms)
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit = '',
  trend = 0,
  icon = '',
  keenIcon = 'abstract-24',
  iconColor = 'primary',
  bgColor = '',
  duration = 1000, // 기본 1초
}) => {
  const trendColor = trend > 0 ? 'success' : trend < 0 ? 'danger' : 'gray-600';
  const [displayValue, setDisplayValue] = useState(0);
  const targetValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0;
  const startTime = useRef<number | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const valueIsNumber = !isNaN(targetValue);

  // 숫자 포맷팅 함수
  const formatValue = (val: number): string => {
    // 소수점이 있는 경우 1자리까지 표시, 없는 경우 정수로 표시
    let formattedVal: string;
    if (String(value).includes('.')) {
      formattedVal = val.toFixed(1);
    } else {
      formattedVal = val.toFixed(0);
    }
    
    // 3자리 콤마 추가
    return formattedVal.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 애니메이션 효과
  useEffect(() => {
    if (!valueIsNumber) {
      setDisplayValue(0);
      return;
    }

    startTime.current = null;
    
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = timestamp - startTime.current;
      const percentage = Math.min(progress / duration, 1);
      
      // easeOutQuart 이징 함수 사용
      const easeValue = 1 - Math.pow(1 - percentage, 4);
      const currentValue = easeValue * targetValue;
      
      setDisplayValue(currentValue);
      
      if (percentage < 1) {
        animationFrameId.current = requestAnimationFrame(animate);
      }
    };
    
    animationFrameId.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [targetValue, duration, valueIsNumber]);

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border dark:border-gray-700 p-5 overflow-hidden">
      <div className="flex items-start">
        {keenIcon && (
          <div className="w-10 h-10 rounded-lg bg-primary-lighter dark:bg-primary-dark flex items-center justify-center mr-3">
            <KeenIcon icon={keenIcon} className="text-primary dark:text-white text-xl" />
          </div>
        )}
        <div className="flex-1">
          {/* 제목 */}
          <h3 className="text-sm font-medium text-muted-foreground mb-2 truncate" title={title}>
            {title}
          </h3>
          
          {/* 값과 단위 */}
          <div className="flex flex-col">
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-card-foreground" title={`${value} ${unit}`}>
                {valueIsNumber ? formatValue(displayValue) : value}
              </span>
              {unit && (
                <span className="ml-1 text-xs font-medium text-muted-foreground">
                  {unit}
                </span>
              )}
            </div>
            
            {/* 증감률 */}
            {trend !== 0 && (
              <div className="flex items-center mt-2 w-fit px-2 py-1 rounded-md text-xs font-semibold" 
                style={{ 
                  backgroundColor: trend > 0 ? 'rgb(232, 255, 243)' : 'rgb(255, 245, 248)',
                  color: trend > 0 ? 'rgb(80, 205, 137)' : 'rgb(241, 65, 108)'
                }}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};