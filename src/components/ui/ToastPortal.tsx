import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ToastPortalProps {
  children: React.ReactNode;
}

// 토스트를 document.body에 직접 마운트하기 위한 포털 컴포넌트
export const ToastPortal: React.FC<ToastPortalProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    return () => setMounted(false);
  }, []);
  
  // 포털 엘리먼트가 없으면 생성
  if (!mounted) return null;
  
  // document.body에 직접 렌더링하여 z-index 문제 해결
  return createPortal(
    <div className="toast-portal-container" style={{ 
      position: 'fixed', 
      inset: 0, 
      pointerEvents: 'none',
      zIndex: 2000000 // 구매 확인 모달(1500000)보다 높게 설정
    }}>
      {children}
    </div>,
    document.body
  );
};