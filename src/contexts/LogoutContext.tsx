import React, { createContext, useContext, useState } from 'react';

interface LogoutContextType {
  isLoggingOut: boolean;
  setIsLoggingOut: (isLoggingOut: boolean) => void;
}

const LogoutContext = createContext<LogoutContextType>({
  isLoggingOut: false,
  setIsLoggingOut: () => {}
});

export const useLogoutContext = () => useContext(LogoutContext);

export const LogoutProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  return (
    <LogoutContext.Provider value={{ isLoggingOut, setIsLoggingOut }}>
      {children}
    </LogoutContext.Provider>
  );
};