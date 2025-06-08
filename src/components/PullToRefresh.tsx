import React from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { KeenIcon } from '@/components';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => void | Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
  className
}) => {
  const { isPulling, pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh,
    disabled
  });

  // 회전 각도 계산 (0 ~ 360도)
  const rotation = Math.min(pullDistance * 3, 360);
  // 투명도 계산 (0 ~ 1)
  const opacity = Math.min(pullDistance / 80, 1);

  return (
    <div className={cn("relative", className)}>
      {/* Pull to Refresh 인디케이터 */}
      {(isPulling || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 w-full flex justify-center items-center pointer-events-none z-50"
          style={{
            transform: `translateY(${pullDistance}px)`,
            transition: isRefreshing ? 'transform 0.2s ease-out' : 'none',
          }}
        >
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-full px-4 py-3 shadow-lg">
            <div 
              className={cn(
                "h-8 w-8 border-3 border-primary border-t-transparent rounded-full mr-3",
                isRefreshing && "animate-spin"
              )}
              style={{
                opacity,
                transform: !isRefreshing ? `rotate(${rotation}deg)` : undefined
              }}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isRefreshing ? '새로고침 중...' : '당겨서 새로고침'}
            </span>
          </div>
        </div>
      )}
      
      {/* 컨텐츠 영역 */}
      <div 
        style={{
          transform: (isPulling || isRefreshing) ? `translateY(${Math.min(pullDistance, 60)}px)` : 'none',
          transition: isRefreshing ? 'transform 0.2s ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
};