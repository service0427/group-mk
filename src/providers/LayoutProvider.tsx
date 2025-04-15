/* eslint-disable no-unused-vars */
import { createContext, type PropsWithChildren, useContext, useState } from 'react';

import { getData, setData } from '../utils';

export interface ILayoutConfig {
  name: string;
  options: any;
}

export interface ILayoutProvider {
  layout: ILayoutConfig;
}

export interface ILayoutProps {
  getLayout: (name: string) => Partial<ILayoutConfig> | undefined;
  hasLayout: (name: string) => boolean;
  updateLayout: (name: string, config: Partial<ILayoutConfig>) => void;
  currentLayout: any;
  setCurrentLayout: (layoutProvider: any) => void;
}

const LAYOUTS_CONFIGS_KEY = 'layouts-configs';

const getLayouts = (): Map<string, Partial<ILayoutConfig>> => {
  const storedLayouts = (getData(LAYOUTS_CONFIGS_KEY) as object) || {};

  return new Map(Object.entries(storedLayouts));
};

const initialProps: ILayoutProps = {
  getLayout: (name: string): Partial<ILayoutConfig> | undefined => {
    return {};
  },
  hasLayout: (name: string): boolean => false,
  updateLayout: (name: string, config: Partial<ILayoutConfig>) => {},
  currentLayout: null,
  setCurrentLayout: (layoutProvider: any) => {}
};

const LayoutContext = createContext<ILayoutProps>(initialProps);
const useLayout = () => useContext(LayoutContext);

const LayoutProvider = ({ children }: PropsWithChildren) => {
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

  const [currentLayout, setCurrentLayout] = useState();

  return (
    <LayoutContext.Provider
      value={{ getLayout, hasLayout, updateLayout, currentLayout, setCurrentLayout }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export { LayoutContext, LayoutProvider, useLayout };
