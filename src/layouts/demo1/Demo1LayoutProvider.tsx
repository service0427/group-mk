/* eslint-disable no-unused-vars */
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { useMenuChildren } from '@/components/menu';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { useMenus } from '@/providers';
import { ILayoutConfig, useLayout } from '@/providers';
import { deepMerge } from '@/utils';
import { demo1LayoutConfig } from './';

// Interface defining the structure for layout provider properties
export interface IDemo1LayoutProviderProps {
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
const initalLayoutProps: IDemo1LayoutProviderProps = {
  layout: demo1LayoutConfig, // Default layout configuration
  megaMenuEnabled: false, // Mega menu disabled by default
  headerSticky: false, // Header is not sticky by default
  mobileSidebarOpen: false, // Mobile sidebar is closed by default
  mobileMegaMenuOpen: false, // Mobile mega menu is closed by default
  sidebarMouseLeave: false, // Sidebar mouse leave is false initially
  setSidebarMouseLeave: (state: boolean) => {
    console.log(`${state}`);
  },
  setMobileMegaMenuOpen: (open: boolean) => {
    console.log(`${open}`);
  },
  setMobileSidebarOpen: (open: boolean) => {
    console.log(`${open}`);
  },
  setMegaMenuEnabled: (enabled: boolean) => {
    console.log(`${enabled}`);
  },
  setSidebarCollapse: (collapse: boolean) => {
    console.log(`${collapse}`);
  },
  setSidebarTheme: (mode: string) => {
    console.log(`${mode}`);
  }
};

// Creating context for the layout provider with initial properties
const Demo1LayoutContext = createContext<IDemo1LayoutProviderProps>(initalLayoutProps);

// Custom hook to access the layout context
const useDemo1Layout = () => useContext(Demo1LayoutContext);

// Layout provider component that wraps the application
const Demo1LayoutProvider = ({ children }: PropsWithChildren) => {
  const { pathname } = useLocation(); // Gets the current path
  const { setMenuConfig } = useMenus(); // Accesses menu configuration methods
  const secondaryMenu = useMenuChildren(pathname, MENU_SIDEBAR, 0); // Retrieves the secondary menu

  // Sets the primary and secondary menu configurations
  setMenuConfig('primary', MENU_SIDEBAR);
  setMenuConfig('secondary', secondaryMenu);

  const { getLayout, updateLayout, setCurrentLayout } = useLayout(); // Layout management methods

  // Merges the default layout with the current one
  const getLayoutConfig = () => {
    return deepMerge(demo1LayoutConfig, getLayout(demo1LayoutConfig.name));
  };

  const [layout, setLayout] = useState(getLayoutConfig); // State for layout configuration

  // Updates the current layout when the layout state changes
  useEffect(() => {
    setCurrentLayout(layout);
  });

  const [megaMenuEnabled, setMegaMenuEnabled] = useState(false); // State for mega menu toggle

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false); // State for mobile sidebar

  const [mobileMegaMenuOpen, setMobileMegaMenuOpen] = useState(false); // State for mobile mega menu

  const [sidebarMouseLeave, setSidebarMouseLeave] = useState(false); // State for sidebar mouse leave

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

    updateLayout(demo1LayoutConfig.name, updatedLayout); // Updates the layout with the collapsed state
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
    <Demo1LayoutContext.Provider
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
    </Demo1LayoutContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export { Demo1LayoutProvider, useDemo1Layout };
