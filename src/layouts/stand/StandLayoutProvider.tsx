 
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { useMenuChildren } from '@/components/menu';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { useMenus } from '@/providers';
import { ILayoutConfig, useLayout } from '@/providers';
import { deepMerge } from '@/utils';
import { getData, setData } from '@/utils/LocalStorage';
import { standLayoutConfig } from './';

// Interface defining the structure for layout provider properties
export interface IStandLayoutProviderProps {
  layout: ILayoutConfig; // Current layout configuration
  megaMenuEnabled: boolean; // Determines if the mega menu is enabled
  headerSticky: boolean; // Tracks if the header should be sticky based on scroll
  mobileSidebarOpen: boolean; // Indicates if the mobile sidebar is open
  mobileMegaMenuOpen: boolean; // Indicates if the mobile mega menu is open
  sidebarMouseLeave: boolean; // Tracks whether the mouse has left the sidebar
  setSidebarMouseLeave: (state: boolean) => void; // Function to update sidebar mouse leave state
  setMobileSidebarOpen: (open: boolean) => void; // Function to toggle mobile sidebar state
  setMobileMegaMenuOpen: (open: boolean) => void; // Function to toggle mobile mega menu state
  setMegaMenuEnabled: (enabled: boolean) => void; // Function to enable or disable the mega menu
  setSidebarCollapse: (collapse: boolean) => void; // Function to collapse or expand the sidebar
  setSidebarTheme: (mode: string) => void; // Function to set the sidebar theme
}

// Initial layout properties with default values
const initalLayoutProps: IStandLayoutProviderProps = {
  layout: standLayoutConfig, // Default layout configuration
  megaMenuEnabled: false, // Mega menu disabled by default
  headerSticky: false, // Header is not sticky by default
  mobileSidebarOpen: false, // Mobile sidebar is closed by default
  mobileMegaMenuOpen: false, // Mobile mega menu is closed by default
  sidebarMouseLeave: false, // Sidebar mouse leave is false initially
  setSidebarMouseLeave: (state: boolean) => {},
  setMobileMegaMenuOpen: (open: boolean) => {},
  setMobileSidebarOpen: (open: boolean) => {},
  setMegaMenuEnabled: (enabled: boolean) => {},
  setSidebarCollapse: (collapse: boolean) => {},
  setSidebarTheme: (mode: string) => {}
};

// Creating context for the layout provider with initial properties
const StandLayoutContext = createContext<IStandLayoutProviderProps>(initalLayoutProps);

// Custom hook to access the layout context
const useStandLayout = () => useContext(StandLayoutContext);

// Layout provider component that wraps the application
const StandLayoutProvider = ({ children }: PropsWithChildren) => {
  const { pathname } = useLocation(); // Gets the current path
  const { setMenuConfig } = useMenus(); // Accesses menu configuration methods
  const secondaryMenu = useMenuChildren(pathname, MENU_SIDEBAR, 0); // Retrieves the secondary menu

  // Sets the primary and secondary menu configurations
  setMenuConfig('primary', MENU_SIDEBAR);
  setMenuConfig('secondary', secondaryMenu);

  const { getLayout, updateLayout, setCurrentLayout } = useLayout(); // Layout management methods

  // Merges the default layout with the current one
  const getLayoutConfig = () => {
    return deepMerge(standLayoutConfig, getLayout(standLayoutConfig.name));
  };

  const [layout, setLayout] = useState(getLayoutConfig); // State for layout configuration

  // Updates the current layout when the layout state changes
  useEffect(() => {
    setCurrentLayout(layout);
  });
  
  // 사이드바 상태를 로컬 스토리지에서 불러와 초기화
  useEffect(() => {
    const savedSidebarState = getData('sidebar_collapsed');
    if (savedSidebarState !== undefined) {
      // 저장된 상태가 있으면 그 값으로 초기화
      const updatedLayout = {
        options: {
          sidebar: {
            collapse: savedSidebarState as boolean
          }
        }
      };
      updateLayout(standLayoutConfig.name, updatedLayout);
      setLayout(getLayoutConfig());
    } else {
      // 저장된 상태가 없으면 기본값(확장)으로 초기화
      const updatedLayout = {
        options: {
          sidebar: {
            collapse: false
          }
        }
      };
      updateLayout(standLayoutConfig.name, updatedLayout);
      setLayout(getLayoutConfig());
    }
  }, []);

  // 경로 변경 시 페이지 이동으로 인한 메뉴 상태 초기화 방지
  useEffect(() => {
    // 페이지 이동시 로컬스토리지에 저장된 메뉴 상태 강제 복원
    const savedMenuState = getData('menu_accordions');
    if (savedMenuState) {
      // 메뉴 상태 유지를 위해 localStorage를 통해 상태를 강제로 유지
      // 이렇게 하면 페이지 이동 시에도 이전 메뉴 상태가 보존됨
      localStorage.setItem('menu_accordions', JSON.stringify(savedMenuState));
    }
  }, [pathname]);

  const [megaMenuEnabled, setMegaMenuEnabled] = useState(false); // State for mega menu toggle

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false); // State for mobile sidebar

  const [mobileMegaMenuOpen, setMobileMegaMenuOpen] = useState(false); // State for mobile mega menu

  // PC 버전에서는 마우스 오버 이벤트 사용 안함, 항상 false로 설정
  const [sidebarMouseLeave, setSidebarMouseLeave] = useState(false);

  const scrollPosition = useScrollPosition(); // Tracks the scroll position

  const headerSticky: boolean = scrollPosition > 0; // Makes the header sticky based on scroll

  // Function to collapse or expand the sidebar
  const setSidebarCollapse = (collapse: boolean) => {
    const updatedLayout = {
      options: {
        sidebar: {
          collapse
        }
      }
    };

    // 로컬 스토리지에 사이드바 상태 저장
    setData('sidebar_collapsed', collapse);

    updateLayout(standLayoutConfig.name, updatedLayout); // Updates the layout with the collapsed state
    setLayout(getLayoutConfig()); // Refreshes the layout configuration
  };

  // Function to set the sidebar theme (e.g., light or dark)
  const setSidebarTheme = (mode: string) => {
    const updatedLayout = {
      options: {
        sidebar: {
          theme: mode
        }
      }
    };

    setLayout(deepMerge(layout, updatedLayout)); // Merges and sets the updated layout
  };

  return (
    // Provides the layout configuration and controls via context to the application
    <StandLayoutContext.Provider
      value={{
        layout,
        headerSticky,
        mobileSidebarOpen,
        mobileMegaMenuOpen,
        megaMenuEnabled,
        sidebarMouseLeave,
        setMobileSidebarOpen,
        setMegaMenuEnabled,
        setSidebarMouseLeave,
        setMobileMegaMenuOpen,
        setSidebarCollapse,
        setSidebarTheme
      }}
    >
      {children}
    </StandLayoutContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export { StandLayoutProvider, useStandLayout };