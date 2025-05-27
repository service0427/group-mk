import { useEffect } from 'react';
import { useAuthContext } from '@/auth';
import { USER_ROLES } from '@/config/roles.config';

/**
 * 사용자 역할에 따라 자주 방문하는 페이지를 미리 로드합니다.
 * 초기 로드 후 백그라운드에서 실행됩니다.
 */
export function usePreloadPages() {
  const { userRole } = useAuthContext();

  useEffect(() => {
    // 초기 로드 후 3초 뒤에 preload 시작
    const timer = setTimeout(() => {
      preloadByRole(userRole);
    }, 3000);

    return () => clearTimeout(timer);
  }, [userRole]);
}

async function preloadByRole(role: string) {
  try {
    // 공통 페이지 preload
    const commonPreloads = [
      import('@/pages/notice'),
      import('@/pages/myinfo'),
    ];

    // 역할별 주요 페이지 preload
    switch (role) {
      case USER_ROLES.BEGINNER:
        await Promise.all([
          ...commonPreloads,
          import('@/pages/cash'),
          import('@/pages/faq'),
        ]);
        break;

      case USER_ROLES.ADVERTISER:
        await Promise.all([
          ...commonPreloads,
          import('@/pages/advertise'),
          import('@/pages/keyword'),
        ]);
        break;

      case USER_ROLES.AGENCY:
      case USER_ROLES.DISTRIBUTOR:
        await Promise.all([
          ...commonPreloads,
          import('@/pages/advertise'),
          import('@/pages/withdraw'),
        ]);
        break;

      case USER_ROLES.OPERATOR:
      case USER_ROLES.DEVELOPER:
        await Promise.all([
          ...commonPreloads,
          import('@/pages/admin'),
        ]);
        break;
    }
  } catch (error) {
    // Preload 실패는 무시 - 실제 사용 시 다시 로드됨
    console.debug('Preload failed:', error);
  }
}