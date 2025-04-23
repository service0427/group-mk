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
  keenIcon,
  iconColor = 'primary',
  bgColor = 'bg-body',
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
    <div className={`card ${bgColor}`}>
      <div className="card-body p-4 overflow-hidden">
        <div>
          {/* 제목: 작은 글씨 */}
          <div style={{ fontSize: '12px', marginBottom: '8px' }} className="text-truncate text-gray-600" title={title}>
            {title}
          </div>
          
          {/* 값과 단위 */}
          <div className="flex flex-col">
            <div className="d-flex justify-content-between">
              <div className="d-flex align-items-end">
                <span className="text-gray-800" style={{ fontSize: '30px', fontWeight: 'bold' }} title={`${value} ${unit}`}>
                  {valueIsNumber ? formatValue(displayValue) : value}
                </span>
                {unit && (
                  <span className="ms-1 mb-1 text-gray-600" style={{ fontSize: '12px', fontWeight: '600' }}>
                    {unit}
                  </span>
                )}
              </div>
            </div>
            
            {/* 증감률 */}
            {trend !== 0 && (
              <div className="flex flex-shrink-0 mt-2 w-fit" style={{ 
                alignItems: 'center',
                backgroundColor: trend > 0 ? '#e8fff3' : '#fff5f8',
                color: trend > 0 ? '#50cd89' : '#f1416c',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
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