import { type TKeenIconsStyle } from '../components/keenicons/types';

export type TSettingsThemeMode = 'light' | 'dark' | 'system';

export type TSettingsContainer = 'default' | 'fluid' | 'fixed';

export interface ISettings {
  themeMode: TSettingsThemeMode;
  container: TSettingsContainer;
  keeniconsStyle: TKeenIconsStyle;
}

// Default settings for the application
const defaultSettings: ISettings = {
  themeMode: 'light', // Default to light mode for the application
  keeniconsStyle: 'filled', // Default to using filled KeenIcons style
  container: 'fixed' // Default container layout is set to fixed
};

export { defaultSettings };
