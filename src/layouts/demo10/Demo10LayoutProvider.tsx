import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';
import { MENU_SIDEBAR } from '@/config';
import { useMenus } from '@/providers';
import { ILayoutConfig, useLayout } from '@/providers';
import { deepMerge } from '@/utils';
import { Demo10LayoutConfig } from '.';

// Interface defining the properties of the layout provider context
export interface IDemo10LayoutProviderProps {
  layout: ILayoutConfig; // The layout configuration object
  mobileSidebarOpen: boolean; // Whether the mobile sidebar is open
  setMobileSidebarOpen: (open: boolean) => void; // Function to toggle the mobile sidebar
}

// Initial layout provider properties, using demo10 layout configuration as the default
const initalLayoutProps: IDemo10LayoutProviderProps = {
  layout: Demo10LayoutConfig, // Default layout configuration
  mobileSidebarOpen: false, // Mobile sidebar is closed by default
  setMobileSidebarOpen: (open: boolean) => {
    console.log(`${open}`);
  }
};

// Create a context to manage the layout-related state and logic for demo10 layout
const Demo10LayoutContext = createContext<IDemo10LayoutProviderProps>(initalLayoutProps);

// Custom hook to access the layout context in other components
const useDemo10Layout = () => useContext(Demo10LayoutContext);

// Provider component that sets up the layout state and context for demo10 layout
const Demo10LayoutProvider = ({ children }: PropsWithChildren) => {
  const { setMenuConfig } = useMenus(); // Hook to manage menu configurations
  const { getLayout, setCurrentLayout } = useLayout(); // Hook to get and set layout configuration

  // Merge the demo10 layout configuration with the current layout configuration fetched via getLayout
  const layoutConfig = deepMerge(Demo10LayoutConfig, getLayout(Demo10LayoutConfig.name));

  // Set the initial state for layout and mobile sidebar
  const [layout] = useState(layoutConfig); // Layout configuration is stored in state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false); // Manage state for mobile sidebar

  // Set the menu configuration for the primary menu using the provided MENU_SIDEBAR configuration
  setMenuConfig('primary', MENU_SIDEBAR);

  // When the layout state changes, set the current layout configuration in the layout provider
  useEffect(() => {
    setCurrentLayout(layout); // Update the current layout in the global layout state
  }, [layout, setCurrentLayout]); // Re-run this effect if layout or setCurrentLayout changes

  // Provide the layout state, sticky header state, and sidebar state to children components via context
  return (
    <Demo10LayoutContext.Provider
      value={{
        layout, // The current layout configuration
        mobileSidebarOpen, // Whether the mobile sidebar is currently open
        setMobileSidebarOpen // Function to toggle the mobile sidebar state
      }}
    >
      {children} {/* Render child components that consume this context */}
    </Demo10LayoutContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export { Demo10LayoutProvider, useDemo10Layout };
