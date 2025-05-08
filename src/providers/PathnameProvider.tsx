/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

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

  useEffect(() => {
    setPrevPathname(() => {
      return pathname;
    });
  }, [pathname]);

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
