import { ReactNode, createContext, useContext, useState, useMemo } from 'react';
import { ContentLoader, ProgressBarLoader, ScreenLoader } from '@/components/loaders';
import { IMenuItemConfig, TMenuConfig } from '@/components/menu';
import { getData, setData } from '../utils';

export interface ILayoutConfig {
  name: string;
  options: any;
}

// 통합된 UI 컨텍스트 타입
interface UIContextType {
  // 로더 관련 상태 및 함수
  contentLoader: boolean;
  setContentLoader: (state: boolean) => void;
  progressBarLoader: boolean;
  setProgressBarLoader: (state: boolean) => void;
  screenLoader: boolean;
  setScreenLoader: (state: boolean) => void;
  
  // 레이아웃 관련 상태 및 함수
  getLayout: (name: string) => Partial<ILayoutConfig> | undefined;
  hasLayout: (name: string) => boolean;
  updateLayout: (name: string, config: Partial<ILayoutConfig>) => void;
  currentLayout: any;
  setCurrentLayout: (layoutProvider: any) => void;
  
  // 메뉴 관련 상태 및 함수
  menuConfigs: Map<string, TMenuConfig | null>;
  setMenuConfig: (name: string, config: TMenuConfig | null) => void;
  getMenuConfig: (name: string) => TMenuConfig | null;
  setCurrentMenuItem: (config: IMenuItemConfig | null) => void;
  getCurrentMenuItem: () => IMenuItemConfig | null;
}

// 레이아웃 설정 로컬 스토리지 키
const LAYOUTS_CONFIGS_KEY = 'layouts-configs';

// 레이아웃 설정 가져오기 유틸리티 함수
const getLayouts = (): Map<string, Partial<ILayoutConfig>> => {
  const storedLayouts = (getData(LAYOUTS_CONFIGS_KEY) as object) || {};
  return new Map(Object.entries(storedLayouts));
};

// 컨텍스트 생성
const UIContext = createContext<UIContextType | null>(null);

// UIProvider 컴포넌트
export const UIProvider = ({ children }: { children: ReactNode }) => {
  // 로더 상태
  const [contentLoader, setContentLoader] = useState(false);
  const [progressBarLoader, setProgressBarLoader] = useState(false);
  const [screenLoader, setScreenLoader] = useState(false);
  
  // 레이아웃 상태
  const [currentLayout, setCurrentLayout] = useState<any>(null);
  
  // 메뉴 상태
  const [currentMenuItem, setCurrentMenuItem] = useState<IMenuItemConfig | null>(null);
  const menuConfigs = new Map<string, TMenuConfig | null>();
  
  // 레이아웃 관련 함수
  const getLayout = (name: string): Partial<ILayoutConfig> | undefined => {
    const storedLayouts = getLayouts();
    return storedLayouts.get(name);
  };

  const hasLayout = (name: string): boolean => {
    const storedLayouts = getLayouts();
    return storedLayouts && storedLayouts.has(name);
  };

  const updateLayout = (name: string, config: Partial<ILayoutConfig>) => {
    const storedLayouts = getLayouts();

    if (storedLayouts.has(name)) {
      storedLayouts.delete(name);
    }

    storedLayouts.set(name, config);
    setData(LAYOUTS_CONFIGS_KEY, Object.fromEntries(storedLayouts));
  };
  
  // 메뉴 관련 함수
  const setMenuConfig = (name: string, config: TMenuConfig | null) => {
    menuConfigs.set(name, config);
  };

  const getMenuConfig = (name: string): TMenuConfig | null => {
    return menuConfigs.get(name) ?? null;
  };

  const getCurrentMenuItem = (): IMenuItemConfig | null => {
    return currentMenuItem;
  };

  // 메모이제이션된 컨텍스트 값
  const contextValue = useMemo(() => ({
    // 로더 관련
    contentLoader,
    setContentLoader,
    progressBarLoader,
    setProgressBarLoader,
    screenLoader,
    setScreenLoader,
    
    // 레이아웃 관련
    getLayout,
    hasLayout,
    updateLayout,
    currentLayout,
    setCurrentLayout,
    
    // 메뉴 관련
    menuConfigs,
    setMenuConfig,
    getMenuConfig,
    setCurrentMenuItem,
    getCurrentMenuItem
  }), [
    contentLoader, progressBarLoader, screenLoader,
    currentLayout, currentMenuItem
  ]);

  return (
    <UIContext.Provider value={contextValue}>
      {children}
      {progressBarLoader && <ProgressBarLoader />}
      {screenLoader && <ScreenLoader />}
    </UIContext.Provider>
  );
};

// 통합된 컨텍스트를 사용하는 훅
export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
};

// 선택적 사용을 위한 훅들
export const useLoaders = () => {
  const { 
    contentLoader, 
    progressBarLoader, 
    screenLoader, 
    setContentLoader, 
    setProgressBarLoader, 
    setScreenLoader 
  } = useUI();
  
  return { 
    contentLoader, 
    progressBarLoader, 
    screenLoader, 
    setContentLoader, 
    setProgressBarLoader, 
    setScreenLoader 
  };
};

export const useLayout = () => {
  const { 
    getLayout, 
    hasLayout, 
    updateLayout, 
    currentLayout, 
    setCurrentLayout 
  } = useUI();
  
  return { 
    getLayout, 
    hasLayout, 
    updateLayout, 
    currentLayout, 
    setCurrentLayout 
  };
};

export const useMenus = () => {
  const { 
    menuConfigs, 
    setMenuConfig, 
    getMenuConfig, 
    setCurrentMenuItem, 
    getCurrentMenuItem 
  } = useUI();
  
  return { 
    configs: menuConfigs, 
    setMenuConfig, 
    getMenuConfig, 
    setCurrentMenuItem, 
    getCurrentMenuItem 
  };
};
