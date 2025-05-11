/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { getData, setData } from '@/utils/LocalStorage';

interface IPathnameContextProps {
  pathname: string;
  prevPathname: string | undefined;
}

const PathnameContext = createContext<IPathnameContextProps | undefined>(undefined);

const PathnameProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  // HashRouter에서는 location.pathname이 해시 뒤의 경로를 나타냅니다.
  // 따라서 기존 코드를 그대로 사용할 수 있으며, 
  // HashRouter가 자동으로 '#/' 이후의 경로를 location.pathname으로 제공합니다.
  const { pathname } = location;
  const [prevPathname, setPrevPathname] = useState<string | undefined>(undefined);

  // 경로 변경 시 이전 경로 저장 및 메뉴 상태 유지
  useEffect(() => {
    // 경로가 변경된 경우에만 이전 경로 업데이트
    if (pathname !== prevPathname) {
      setPrevPathname(prevPathname === undefined ? pathname : prevPathname);

      // 메뉴 상태 강제 유지를 위한 추가 코드
      try {
        // 로컬 스토리지에서 현재 메뉴 상태 가져오기
        const menuState = getData('menu_accordions');
        if (menuState) {
          // 메뉴 상태 다시 저장 (페이지 이동 시 상태 유지)
          setData('menu_accordions', menuState);
        }
      } catch (e) {
        
      }
    }
  }, [pathname]);

  // 경로 변경 시 새로운 이전 경로 설정 (지연 처리로 상태 충돌 방지)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (prevPathname !== pathname) {
        setPrevPathname(pathname);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [pathname, prevPathname]);

  return (
    <PathnameContext.Provider value={{ pathname, prevPathname }}>
      {children}
    </PathnameContext.Provider>
  );
};

const usePathname = (): IPathnameContextProps => {
  const context = useContext(PathnameContext);
  if (!context) {
    throw new Error('usePathname must be used within a PathnameProvider');
  }
  return context;
};

export { PathnameProvider, usePathname };
