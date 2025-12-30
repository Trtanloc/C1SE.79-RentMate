import en from './en.json';
import vi from './vi.json';

export const translations = { en, vi };

export const translate = (lang, key, fallback) => {
  if (translations[lang]?.[key]) {
    return translations[lang][key];
  }
  if (translations.en?.[key]) {
    return translations.en[key];
  }
  return fallback ?? key;
};
