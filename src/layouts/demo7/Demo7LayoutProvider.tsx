/* eslint-disable no-unused-vars */
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';
import { MENU_SIDEBAR } from '@/config';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { useMenus } from '@/providers';
import { ILayoutConfig, useLayout } from '@/providers';
import { deepMerge } from '@/utils';
import { Demo7LayoutConfig } from './';
import { useMenuChildren } from '@/components';
import { useLocation } from 'react-router';

// Interface defining the properties of the layout provider context
export interface IDemo7LayoutProviderProps {
  layout: ILayoutConfig; // The layout configuration object
  headerSticky: boolean; // Whether the header should stick to the top on scroll
  mobileMegaMenuOpen: boolean; // Whether the mobile sidebar is open
  setMobileMegaMenuOpen: (open: boolean) => void; // Function to toggle the mobile sidebar
}

// Initial layout provider properties, using Demo2 layout configuration as the default
const initalLayoutProps: IDemo7LayoutProviderProps = {
  layout: Demo7LayoutConfig, // Default layout configuration
  headerSticky: false, // Header is not sticky by default
  mobileMegaMenuOpen: false, // Mobile sidebar is closed by default
  setMobileMegaMenuOpen: (open: boolean) => {}
};

// Create a context to manage the layout-related state and logic for Demo2 layout
const Demo7LayoutContext = createContext<IDemo7LayoutProviderProps>(initalLayoutProps);

// Custom hook to access the layout context in other components
const useDemo7Layout = () => useContext(Demo7LayoutContext);

// Provider component that sets up the layout state and context for Demo2 layout
const Demo7LayoutProvider = ({ children }: PropsWithChildren) => {
  const { pathname } = useLocation(); // Gets the current path
  const { getLayout, setCurrentLayout } = useLayout(); // Hook to get and set layout configuration
  const { setMenuConfig } = useMenus(); // Accesses menu configuration methods
  const secondaryMenu = useMenuChildren(pathname, MENU_SIDEBAR, 0); // Retrieves the secondary menu

  // Sets the primary and secondary menu configurations
  setMenuConfig('primary', MENU_SIDEBAR);
  setMenuConfig('secondary', secondaryMenu);

  // Merge the Demo 9 layout configuration with the current layout configuration fetched via getLayout
  const layoutConfig = deepMerge(Demo7LayoutConfig, getLayout(Demo7LayoutConfig.name));

  // Set the initial state for layout and mobile sidebar
  const [layout] = useState(layoutConfig); // Layout configuration is stored in state
  const [mobileMegaMenuOpen, setMobileMegaMenuOpen] = useState(false); // Manage state for mobile sidebar

  // Get the current scroll position using a custom hook
  const scrollPosition = useScrollPosition();

  // Calculate whether the header should be sticky based on the scroll position and the layout's sticky offset
  const headerSticky: boolean = scrollPosition > layout.options.header.stickyOffset;

  // When the layout state changes, set the current layout configuration in the layout provider
  useEffect(() => {
    setCurrentLayout(layout); // Update the current layout in the global layout state
  }, [layout, setCurrentLayout]); // Re-run this effect if layout or setCurrentLayout changes

  // Provide the layout state, sticky header state, and sidebar state to children components via context
  return (
    <Demo7LayoutContext.Provider
      value={{
        layout, // The current layout configuration
        headerSticky, // Whether the header should be sticky based on the scroll position
        mobileMegaMenuOpen, // Whether the mobile sidebar is currently open
        setMobileMegaMenuOpen // Function to toggle the mobile sidebar state
      }}
    >
      {children} {/* Render child components that consume this context */}
    </Demo7LayoutContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export { Demo7LayoutProvider, useDemo7Layout };
