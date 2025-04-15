import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';
import { deepMerge } from '@/utils';
import { ILayoutConfig, useLayout } from '@/providers';
import { errorsLayoutConfig } from './ErrorsLayoutConfig';

// Interface defining the properties for the AuthLayoutProvider
interface AuthLayoutProviderProps {
  layout: ILayoutConfig; // The layout configuration object
}

// Initial layout properties using the errors layout configuration
const initalLayoutProps: AuthLayoutProviderProps = {
  layout: errorsLayoutConfig // Initial layout is set to errorsLayoutConfig
};

// Creating a context for managing layout-related state and logic
const LayoutContext = createContext<AuthLayoutProviderProps>(initalLayoutProps);

// Custom hook to access the layout context, simplifying its use in other components
const useErrorsLayout = () => useContext(LayoutContext);

// Provider component that manages the state and context for the Errors layout
const ErrorsLayoutProvider = ({ children }: PropsWithChildren) => {
  const { getLayout, setCurrentLayout } = useLayout(); // Hook to get and set the layout configuration

  // Function to get and merge the layout configuration
  const getLayoutConfig = () => {
    return deepMerge(errorsLayoutConfig, getLayout(errorsLayoutConfig.name)); // Merge errors layout config with any layout changes from getLayout
  };

  // State that holds the current layout configuration
  const [layout] = useState(getLayoutConfig); // Initializing layout state with merged configuration

  // Effect to set the current layout whenever the layout state changes
  useEffect(() => {
    setCurrentLayout(layout); // Sets the layout context to the current layout configuration
  });

  return (
    <LayoutContext.Provider
      value={{
        layout // Providing the layout object to child components
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export { ErrorsLayoutProvider, useErrorsLayout };
