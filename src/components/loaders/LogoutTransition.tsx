import React, { useEffect, useRef } from 'react';
import { useLogoutContext } from '@/contexts/LogoutContext';

/**
 * 로그아웃 시 화면 전환을 처리하는 컴포넌트
 * 로그아웃 중에 즉시 화면을 가리고 모든 컨텐츠를 숨겨 깜박임을 방지합니다.
 */
export const LogoutTransition: React.FC = () => {
  const { isLoggingOut } = useLogoutContext();
  const overlayRef = useRef<HTMLDivElement>(null);
  const initialRender = useRef(true);

  // 즉시 DOM에 클래스 추가 (React 렌더링 사이클을 기다리지 않음)
  if (isLoggingOut && typeof document !== 'undefined') {
    document.body.classList.add('logout-transition-active');
  }

  // 로그아웃 상태 변경 감지 및 클래스 관리
  useEffect(() => {
    // 초기 렌더링 시에도 로그아웃 중이라면 즉시 클래스 추가
    if (initialRender.current && isLoggingOut) {
      document.body.classList.add('logout-transition-active');
      initialRender.current = false;
    }

    // 로그아웃 상태에 따라 클래스 추가/제거
    if (isLoggingOut) {
      document.body.classList.add('logout-transition-active');
    } else {
      document.body.classList.remove('logout-transition-active');
    }

    // 컴포넌트 언마운트 시 클래스 제거를 위한 클린업 함수
    return () => {
      document.body.classList.remove('logout-transition-active');
    };
  }, [isLoggingOut]);

  // 로그아웃 중일 때만 오버레이 요소 렌더링
  return isLoggingOut ? (
    <div ref={overlayRef} className="logout-transition-overlay">
      {/* 선택적으로 로딩 아이콘 추가 가능 */}
    </div>
  ) : null;
};

export default LogoutTransition;