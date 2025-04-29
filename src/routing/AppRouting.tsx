import { ReactElement, useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router';
import { useAuthContext } from '@/auth';
import { useLoaders } from '@/providers';
import { AppRoutingSetup } from '.';

const AppRouting = (): ReactElement => {
  const { setProgressBarLoader, setContentLoader } = useLoaders();
  const { verify, setLoading, logout } = useAuthContext();
  const [previousLocation, setPreviousLocation] = useState('');
  const [firstLoad, setFirstLoad] = useState(true);
  const [lastVerified, setLastVerified] = useState(0);
  const location = useLocation();
  const path = location.pathname.trim();
  
  // 토큰 검증이 필요한지 확인하는 함수 (15분마다 검증)
  const shouldVerifyToken = useCallback(() => {
    const currentTime = Date.now();
    const timeSinceLastVerify = currentTime - lastVerified;
    // 15분(900000ms)마다 검증
    return timeSinceLastVerify > 900000; 
  }, [lastVerified]);

  // 첫 로드 시 인증 검증
  useEffect(() => {
    if (firstLoad) {
      setFirstLoad(false);
      verify().finally(() => {
        setLoading(false);
        setFirstLoad(false);
        setLastVerified(Date.now());
      });
    }
  }, [firstLoad, verify, setLoading]);

  // 페이지 이동 시 필요할 때만 인증 검증
  useEffect(() => {
    if (!firstLoad) {
      // 이전 경로와 새 경로가 같으면 로딩 처리하지 않음
      if (previousLocation === path) {
        return;
      }
      
      // 전체 페이지에 대한 프로그레스바는 필요한 경우에만 표시
      if (shouldVerifyToken()) {
        setProgressBarLoader(true);
        verify()
          .then(() => {
            setLastVerified(Date.now());
          })
          .catch(() => {
            console.error('User verify request failed');
          })
          .finally(() => {
            setPreviousLocation(path);
            setProgressBarLoader(false);
          });
      } else {
        // 인증 검증이 필요없는 경우 즉시 처리
        setPreviousLocation(path);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);
  
  // 스크롤 복원
  useEffect(() => {
    if (!CSS.escape(window.location.hash)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [previousLocation]);

  return <AppRoutingSetup />;
};

export { AppRouting };