/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface IPathnameContextProps {
  pathname: string;
  prevPathname: string | undefined;
}

const PathnameContext = createContext<IPathnameContextProps | undefined>(undefined);

const PathnameProvider = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
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
