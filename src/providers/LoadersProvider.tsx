 
/* eslint-disable react-refresh/only-export-components */
import { createContext, type PropsWithChildren, useContext, useState } from 'react';

import { ContentLoader, ProgressBarLoader, ScreenLoader } from '@/components/loaders';

export interface ILoadersProvider {
  contentLoader: boolean;
  setContentLoader: (state: boolean) => void;
  progressBarLoader: boolean;
  setProgressBarLoader: (state: boolean) => void;
  screenLoader: boolean;
  setScreenLoader: (state: boolean) => void;
}

const initialProps: ILoadersProvider = {
  contentLoader: false,
  setContentLoader: (state: boolean) => { },
  progressBarLoader: false,
  setProgressBarLoader: (state: boolean) => { },
  screenLoader: false,
  setScreenLoader: (state: boolean) => { }
};

const LoadersContext = createContext<ILoadersProvider>(initialProps);
const useLoaders = () => useContext(LoadersContext);

const LoadersProvider = ({ children }: PropsWithChildren) => {
  const [contentLoader, setContentLoader] = useState(false);
  const [progressBarLoader, setProgressBarLoader] = useState(false);
  const [screenLoader, setScreenLoader] = useState(false);

  return (
    <LoadersContext.Provider
      value={{
        contentLoader,
        setContentLoader,
        progressBarLoader,
        setProgressBarLoader,
        screenLoader,
        setScreenLoader
      }}
    >
      {children}
      {progressBarLoader && <ProgressBarLoader />}
      {screenLoader && <ScreenLoader />}
      {/* ContentLoader는 이 컴포넌트에서 렌더링하지 않고 Main.tsx에서 직접 사용합니다 */}
    </LoadersContext.Provider>
  );
};

export { LoadersProvider, useLoaders };
