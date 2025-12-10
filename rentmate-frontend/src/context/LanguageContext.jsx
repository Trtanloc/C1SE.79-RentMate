import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LanguageContext = createContext({
  lang: 'vi',
  setLang: () => {},
  toggle: () => {},
  supported: ['en', 'vi'],
});

const SUPPORTED_LANGS = ['en', 'vi'];
const STORAGE_KEY = 'rentmate_lang';

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    if (typeof localStorage === 'undefined') {
      return 'vi';
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_LANGS.includes(stored) ? stored : 'vi';
  });

  useEffect(() => {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const toggle = () => {
    setLang((prev) => (prev === 'en' ? 'vi' : 'en'));
  };

  const value = useMemo(
    () => ({ lang, setLang, toggle, supported: SUPPORTED_LANGS }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
