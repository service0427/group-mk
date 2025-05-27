import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { PreloadableComponent } from '@/utils/lazyWithPreload';

interface PreloadLinkProps extends LinkProps {
  preload?: PreloadableComponent<any> | PreloadableComponent<any>[];
  preloadDelay?: number; // hover 후 preload 시작까지 딜레이 (ms)
}

/**
 * 마우스 hover 시 자동으로 컴포넌트를 preload하는 Link
 */
export const PreloadLink: React.FC<PreloadLinkProps> = ({ 
  preload, 
  preloadDelay = 100,
  onMouseEnter,
  ...props 
}) => {
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (preload) {
      // 짧은 hover는 무시하기 위해 딜레이 추가
      timeoutRef.current = setTimeout(() => {
        if (Array.isArray(preload)) {
          preload.forEach(component => {
            component.preload().catch(() => {
              // Preload 실패는 무시
            });
          });
        } else {
          preload.preload().catch(() => {
            // Preload 실패는 무시
          });
        }
      }, preloadDelay);
    }
    
    // 기존 onMouseEnter 핸들러 실행
    onMouseEnter?.(e);
  };

  const handleMouseLeave = () => {
    // hover를 떠나면 preload 취소
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return (
    <Link
      {...props}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  );
};