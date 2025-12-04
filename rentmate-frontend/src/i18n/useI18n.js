import { useLanguage } from '../context/LanguageContext.jsx';
import { translate } from './strings.js';

export const useI18n = () => {
  const { lang } = useLanguage();
  const t = (key, fallback) => translate(lang, key, fallback);
  return { t, lang };
};
