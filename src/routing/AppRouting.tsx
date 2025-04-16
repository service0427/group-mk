import { ReactElement, useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router';
import { useLoaders } from '@/providers';
import { AppRoutingSetup } from '.';
import { useAuthContext } from '@/auth';

const AppRouting = (): ReactElement => {
  const { setProgressBarLoader } = useLoaders();
  // useAuthContext의 반환값을 안전하게 처리
  const authContext = useAuthContext();
  const isAuthorized = authContext?.isAuthorized || false;
  
  const [previousLocation, setPreviousLocation] = useState('');
  const [firstLoad, setFirstLoad] = useState(true);
  const location = useLocation();
  const path = location.pathname.trim();
  
  // 무한 루프 방지 참조
  const routingLogCount = useRef(0);

  // 디버깅 로그 (제한된 횟수만 출력)
  useEffect(() => {
    if (routingLogCount.current < 5) {
      console.log('App routing path:', path, 'Auth state:', isAuthorized);
      routingLogCount.current += 1;
    }
  }, [path, isAuthorized]);

  // 첫 로드 시 처리
  useEffect(() => {
    if (firstLoad) {
      console.log('First load initialization');
      setFirstLoad(false);
    }
  }, [firstLoad]);

  // 경로 변경 시 처리
  useEffect(() => {
    if (!firstLoad) {
      try {
        setProgressBarLoader(true);
        
        // 경로 변경 후 처리 완료
        setPreviousLocation(path);
        setProgressBarLoader(false);
        if (path === previousLocation) {
          setPreviousLocation('');
        }
      } catch (error) {
        console.error('Error in routing path change:', error);
        setProgressBarLoader(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, firstLoad]);

  // 스크롤 복원 (안전하게 처리)
  useEffect(() => {
    try {
      if (window.location.hash && typeof CSS.escape === 'function') {
        // hash가 있으면 아무것도 하지 않음
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.warn('Error in scroll restoration:', error);
      // 예외 발생 시 기본 스크롤 방식 사용
      window.scrollTo(0, 0);
    }
  }, [previousLocation]);

  return <AppRoutingSetup />;
};

export { AppRouting };
