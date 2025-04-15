import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';
import { deepMerge } from '@/utils';
import { ILayoutConfig, useLayout } from '@/providers';
import { authLayoutBrandedConfig } from './AuthBrandedLayoutConfig';

// Defining the interface for AuthLayoutProvider's props, which includes a layout of type ILayoutConfig
interface AuthLayoutProviderProps {
  layout: ILayoutConfig;
}

// Initial layout properties for the AuthBrandedLayoutProvider, using authLayoutBrandedConfig as the default layout
const initalLayoutProps: AuthLayoutProviderProps = {
  layout: authLayoutBrandedConfig
};

// Creating a context for the AuthBrandedLayout with the initial layout properties
const LayoutContext = createContext<AuthLayoutProviderProps>(initalLayoutProps);

// Custom hook to access the AuthBrandedLayout context, allowing other components to use the layout data
const useAuthBrandedLayout = () => useContext(LayoutContext);

// AuthBrandedLayoutProvider component that wraps its children with the layout context
const AuthBrandedLayoutProvider = ({ children }: PropsWithChildren) => {
  const { getLayout, setCurrentLayout } = useLayout(); // Access layout-related functions

  // Function to merge the current layout with the branded auth layout configuration
  const getLayoutConfig = () => {
    return deepMerge(authLayoutBrandedConfig, getLayout(authLayoutBrandedConfig.name));
  };

  // Setting the layout state with the merged layout configuration
  const [layout] = useState(getLayoutConfig);

  // Effect hook to set the current layout whenever the layout state changes
  useEffect(() => {
    setCurrentLayout(layout);
  }, []);

  // Providing the layout context to all child components wrapped by AuthBrandedLayoutProvider
  return (
    <LayoutContext.Provider
      value={{
        layout
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export { AuthBrandedLayoutProvider, useAuthBrandedLayout };
