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
      // 컨텐츠 영역만 로딩 효과 표시
      setContentLoader(true);
      
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
            setContentLoader(false);
          });
      } else {
        // 인증 검증이 필요없는 경우 빠르게 로딩 종료
        setTimeout(() => {
          setPreviousLocation(path);
          setContentLoader(false);
        }, 100); // 최소한의 시각적 피드백을 위한 짧은 지연
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
