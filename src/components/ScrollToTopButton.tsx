import React, { useState, useEffect } from 'react';
import { KeenIcon } from '@/components';
import { cn } from '@/lib/utils';

interface ScrollToTopButtonProps {
  showAfter?: number; // 스크롤 위치가 이 값을 넘으면 버튼 표시
  className?: string;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ 
  showAfter = 300,
  className 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > showAfter) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [showAfter]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button
      className={cn(
        'fixed bottom-8 right-8 z-50 p-3 rounded-full bg-primary text-white shadow-lg transition-all duration-300 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none',
        className
      )}
      onClick={scrollToTop}
      aria-label="맨 위로 이동"
    >
      <KeenIcon icon="arrow-up" className="size-5" />
    </button>
  );
};