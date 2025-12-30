import { translate } from '../i18n/strings.js';

export const PROPERTY_TYPES = ['all', 'apartment', 'condo', 'house', 'studio', 'office'];

export const getPropertyTypeLabel = (type, t, fallback, lang = 'en') => {
  if (!type) return '';
  const key = `propertyType.${type}`;
  if (typeof t === 'function') {
    return t(key, fallback ?? type);
  }
  return translate(lang, key, fallback ?? type);
};

export const mapPropertyTypeOptions = (list = [], t, lang = 'en') =>
  (Array.isArray(list) ? list : [])
    .map((item) => {
      const value = typeof item === 'string' ? item : item?.value;
      if (!value) return null;
      const fallbackLabel =
        (typeof item === 'object' ? item?.label || item?.labelVi : undefined) || value;
      const label = getPropertyTypeLabel(value, t, fallbackLabel, lang);
      return { value, label };
    })
    .filter(Boolean);
