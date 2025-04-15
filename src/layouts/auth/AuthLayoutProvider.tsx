import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';
import { deepMerge } from '@/utils';
import { ILayoutConfig, useLayout } from '@/providers';
import { authLayoutConfig } from './AuthLayoutConfig';

// Defining the structure for the AuthLayoutProvider's props, which contains a layout of type ILayoutConfig
interface AuthLayoutProviderProps {
  layout: ILayoutConfig;
}

// Initial layout properties for the AuthLayoutProvider, using authLayoutConfig as the default configuration
const initalLayoutProps: AuthLayoutProviderProps = {
  layout: authLayoutConfig
};

// Creating a context for the AuthLayout with the initial layout properties
const LayoutContext = createContext<AuthLayoutProviderProps>(initalLayoutProps);

// Custom hook to access the AuthLayout context, allowing other components to use the layout data
const useAuthLayout = () => useContext(LayoutContext);

// AuthLayoutProvider component that wraps its children with the layout context
const AuthLayoutProvider = ({ children }: PropsWithChildren) => {
  const { getLayout, setCurrentLayout } = useLayout(); // Access layout-related functions

  // Function to merge the current layout with the auth layout configuration
  const getLayoutConfig = () => {
    return deepMerge(authLayoutConfig, getLayout(authLayoutConfig.name));
  };

  // Setting the layout state with the merged layout configuration
  const [layout] = useState(getLayoutConfig);

  // Effect hook to set the current layout whenever the layout state changes
  useEffect(() => {
    setCurrentLayout(layout);
  });

  // Providing the layout context to all child components wrapped by AuthLayoutProvider
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
export { AuthLayoutProvider, useAuthLayout };
