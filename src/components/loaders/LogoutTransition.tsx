import React, { useEffect, useState } from 'react';
import { useLogoutContext } from '@/contexts/LogoutContext';
import '@/styles/logout-transition.css';

/**
 * 로그아웃 시 화면 전환을 부드럽게 처리하는 컴포넌트
 * - 로그아웃 중에는 오버레이를 표시하여 화면 깜박임 방지
 * - body에 클래스를 추가하여 스타일 적용
 */
export const LogoutTransition: React.FC = () => {
  const { isLoggingOut } = useLogoutContext();
  // 로그아웃 초기 로딩 화면 표시를 위한 상태
  const [showOverlay, setShowOverlay] = useState(false);
  
  useEffect(() => {
    if (isLoggingOut) {
      // 로그아웃 시작시 즉시 오버레이 표시
      setShowOverlay(true);
      
      // 모든 애니메이션 차단 및 즉시 표시
      document.body.classList.add('is-logging-out');
      
      // 페이지 전환 중 스크롤 비활성화
      document.body.style.overflow = 'hidden';
      
      // 현재 테마에 맞는 배경색 설정 (dark/light)
      const isDarkMode = document.documentElement.classList.contains('dark');
      const bgColor = isDarkMode ? '#191919' : '#ffffff';
      
      // 배경색을 미리 설정하여 로그인 페이지와 반슧한 색상 유지
      document.documentElement.style.backgroundColor = bgColor;
      document.body.style.backgroundColor = bgColor;
      
      // 키프레임 및 트랜지션 완전 차단
      const styleElement = document.createElement('style');
      styleElement.id = 'logout-transition-blocker';
      styleElement.textContent = `
        * {
          animation: none !important;
          transition: none !important;
        }
        #root, body, html {
          background-color: ${bgColor} !important;
        }
      `;
      document.head.appendChild(styleElement);
      
      // 기존 테마 유지를 위한 클래스 설정
      if (isDarkMode) {
        document.documentElement.classList.add('dark-logout');
      } else {
        document.documentElement.classList.add('light-logout');
      }
      
      return () => {
        // 컴포넌트 언마운트 시 사용한 리소스 정리
        document.body.style.overflow = '';
        document.body.classList.remove('is-logging-out');
        
        const styleElement = document.getElementById('logout-transition-blocker');
        if (styleElement) {
          styleElement.remove();
        }
        
        document.documentElement.classList.remove('dark-logout', 'light-logout');
      };
    } else {
      // 로그아웃 상태가 아닐 때는 오버레이 비활성화
      setShowOverlay(false);
      document.body.classList.remove('is-logging-out');
      document.body.style.overflow = '';
      
      // 스타일 요소 제거
      const styleElement = document.getElementById('logout-transition-blocker');
      if (styleElement) {
        styleElement.remove();
      }
    }
  }, [isLoggingOut]);
  
  // 로그아웃 중이 아니면 렌더링하지 않음
  if (!showOverlay) {
    return null;
  }
  
  // 배경색 감지
  const isDarkMode = document.documentElement.classList.contains('dark');
  const overlayStyle = {
    backgroundColor: isDarkMode ? '#191919' : '#ffffff',
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  };
  
  return (
    <div style={overlayStyle} aria-hidden="true">
      {/* 아무것도 표시하지 않음 - 순수한 배경 오버레이 */}
    </div>
  );
};

export default LogoutTransition;