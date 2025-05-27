import { createContext, type PropsWithChildren, useContext, useState, useMemo, useCallback } from 'react';

import { defaultSettings, ISettings, type TSettingsThemeMode } from '@/config/settings.config';

import { getData, setData } from '@/utils';

export interface ISettingsProps {
  settings: ISettings;
  storeSettings: (settings: Partial<ISettings>) => void;
  updateSettings: (settings: Partial<ISettings>) => void;
  getThemeMode: () => TSettingsThemeMode;
}

const SETTINGS_CONFIGS_KEY = 'settings-configs';

const getStoredSettings = (): Partial<ISettings> => {
  return (getData(SETTINGS_CONFIGS_KEY) as Partial<ISettings>) || {};
};

const initialProps: ISettingsProps = {
  settings: { ...defaultSettings, ...getStoredSettings() },
  updateSettings: (settings: Partial<ISettings>) => { },
  storeSettings: (settings: Partial<ISettings>) => { },
  getThemeMode: () => 'light'
};

const LayoutsContext = createContext<ISettingsProps>(initialProps);
const useSettings = () => useContext(LayoutsContext);

const SettingsProvider = ({ children }: PropsWithChildren) => {
  const [settings, setSettings] = useState(initialProps.settings);

  const updateSettings = useCallback((newSettings: Partial<ISettings>) => {
    setSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
  }, []);

  const storeSettings = useCallback((newSettings: Partial<ISettings>) => {
    setData(SETTINGS_CONFIGS_KEY, { ...getStoredSettings(), ...newSettings });
    updateSettings(newSettings);
  }, [updateSettings]);

  const getThemeMode = useCallback((): TSettingsThemeMode => {
    const { themeMode } = settings;

    if (themeMode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else if (themeMode === 'dark') {
      return 'dark';
    } else {
      return 'light';
    }
  }, [settings.themeMode]);

  const contextValue = useMemo(() => ({
    settings,
    updateSettings,
    storeSettings,
    getThemeMode
  }), [settings, updateSettings, storeSettings, getThemeMode]);

  return (
    <LayoutsContext.Provider value={contextValue}>
      {children}
    </LayoutsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export { SettingsProvider, useSettings };
