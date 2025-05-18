import React, { useEffect } from 'react';
import { useLogoutContext } from '@/contexts/LogoutContext';

/**
 * 로그아웃 시 화면 전환을 처리하는 컴포넌트
 * 로그아웃 중에 부드러운 전환 효과를 만들고 화면 깜박임을 방지합니다.
 */
export const LogoutTransition: React.FC = () => {
  const { isLoggingOut } = useLogoutContext();

  // 로그아웃 중일 때 body에 클래스 추가
  useEffect(() => {
    if (isLoggingOut) {
      // 로그아웃 중에는 스크롤을 방지하고 화면을 덮는 오버레이 스타일 활성화
      document.body.classList.add('logout-transition-active');
    } else {
      // 로그아웃이 완료되면 클래스 제거
      document.body.classList.remove('logout-transition-active');
    }

    // 컴포넌트 언마운트 시 클래스 제거
    return () => {
      document.body.classList.remove('logout-transition-active');
    };
  }, [isLoggingOut]);

  // 로그아웃 중일 때만 오버레이 요소 렌더링
  return isLoggingOut ? (
    <div className="logout-transition-overlay">
      {/* 필요한 경우 로딩 아이콘이나 텍스트 추가 가능 */}
    </div>
  ) : null;
};

export default LogoutTransition;