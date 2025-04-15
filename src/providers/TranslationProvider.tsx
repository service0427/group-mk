/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
import '@formatjs/intl-relativetimeformat/polyfill';
import '@formatjs/intl-relativetimeformat/locale-data/en';
import '@formatjs/intl-relativetimeformat/locale-data/de';
import '@formatjs/intl-relativetimeformat/locale-data/es';
import '@formatjs/intl-relativetimeformat/locale-data/fr';
import '@formatjs/intl-relativetimeformat/locale-data/ja';
import '@formatjs/intl-relativetimeformat/locale-data/zh';

import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';

import { I18N_LANGUAGES, I18N_CONFIG_KEY, I18N_DEFAULT_LANGUAGE } from '@/i18n';
import { type TLanguage, type ITranslationProviderProps } from '@/i18n';
import { getData, setData } from '@/utils';

const getInitialLanguage = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang');

  // Check if langParam matches a supported language in I18N_LANGUAGES
  if (langParam) {
    const matchedLanguage = I18N_LANGUAGES.find((lang) => lang.code === langParam);
    if (matchedLanguage) {
      setData(I18N_CONFIG_KEY, matchedLanguage);
      return matchedLanguage;
    }
  }

  const currentLanguage = getData(I18N_CONFIG_KEY) as TLanguage | undefined;
  return currentLanguage ?? I18N_DEFAULT_LANGUAGE;
};

const initialProps: ITranslationProviderProps = {
  currentLanguage: getInitialLanguage(),
  changeLanguage: (_: TLanguage) => {},
  isRTL: () => false
};

const TranslationsContext = createContext<ITranslationProviderProps>(initialProps);
const useLanguage = () => useContext(TranslationsContext);

const I18NProvider = ({ children }: PropsWithChildren) => {
  const { currentLanguage } = useLanguage();

  return (
    <IntlProvider
      messages={currentLanguage.messages}
      locale={currentLanguage.code}
      defaultLocale={getInitialLanguage().code}
    >
      {children}
    </IntlProvider>
  );
};

const TranslationProvider = ({ children }: PropsWithChildren) => {
  const [currentLanguage, setCurrentLanguage] = useState(initialProps.currentLanguage);

  const changeLanguage = (language: TLanguage) => {
    setData(I18N_CONFIG_KEY, language);
    setCurrentLanguage(language);
  };

  const isRTL = () => {
    return currentLanguage.direction === 'rtl';
  };

  useEffect(() => {
    document.documentElement.setAttribute('dir', currentLanguage.direction);
  }, [currentLanguage]);

  return (
    <TranslationsContext.Provider
      value={{
        isRTL,
        currentLanguage,
        changeLanguage
      }}
    >
      <I18NProvider>{children}</I18NProvider>
    </TranslationsContext.Provider>
  );
};

export { TranslationProvider, useLanguage };
