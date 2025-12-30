import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { fetchMetadataFilters } from '../api/metadataApi.js';
import {
  PropertyStatus,
  fallbackPropertyStatusMeta,
  landlordApplicationStatusMeta as landlordStatusFallback,
  notificationTypeMeta as notificationMetaFallback,
} from '../utils/constants.js';
import { fallbackCities } from '../utils/cities.js';
import { mapPropertyTypeOptions } from '../utils/propertyTypeLabels.js';
import { useI18n } from '../i18n/useI18n.js';

const MetadataContext = createContext({
  propertyTypes: [],
  propertyStatuses: [],
  notificationTypes: [],
  landlordApplicationStatuses: [],
  cities: [],
  districts: [],
  countries: [],
  loading: false,
  error: null,
  refresh: async () => {},
  propertyStatusMeta: {},
  notificationTypeMeta: {},
  landlordStatusMeta: {},
});

const normalizeArray = (value) => (Array.isArray(value) ? value : []);
const sanitizeStrings = (list) =>
  normalizeArray(list)
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && item.value) return item.value;
      return '';
    })
    .map((item) => String(item || '').trim())
    .filter(Boolean);

const stripAccentsLower = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();

const mergeCities = (fetched = []) => {
  const merged = [];
  const seen = new Set();
  [...fallbackCities, ...sanitizeStrings(fetched)].forEach((city) => {
    const key = stripAccentsLower(city);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(city);
    }
  });
  return merged;
};

export function MetadataProvider({ children }) {
  const { t, lang } = useI18n();
  const [state, setState] = useState({
    propertyTypes: [],
    propertyStatuses: [],
    notificationTypes: [],
    landlordApplicationStatuses: [],
    cities: [],
    districts: [],
    countries: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMetadataFilters();
      setState({
        // Apply a shared mapping so UI labels stay localized while values remain enum strings.
        propertyTypes: sanitizeStrings(data?.propertyTypes),
        propertyStatuses: normalizeArray(data?.propertyStatuses),
        notificationTypes: normalizeArray(data?.notificationTypes),
        landlordApplicationStatuses: normalizeArray(data?.landlordApplicationStatuses),
        cities: mergeCities(data?.cities),
        districts: sanitizeStrings(data?.districts),
        countries: sanitizeStrings(data?.countries),
      });
    } catch (err) {
      const message =
        err?.response?.data?.message || 'Unable to load metadata from backend.';
      setError(Array.isArray(message) ? message.join(', ') : message);
      setState((prev) => ({ ...prev }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const propertyStatusMeta = useMemo(() => {
    const base = { ...fallbackPropertyStatusMeta };
    state.propertyStatuses.forEach((item) => {
      base[item.value] = {
        ...(base[item.value] || {}),
        label: item.label || base[item.value]?.label || item.value,
      };
    });
    return base;
  }, [state.propertyStatuses]);

  const notificationTypeMeta = useMemo(() => {
    const base = { ...notificationMetaFallback };
    state.notificationTypes.forEach((item) => {
      base[item.value] = {
        ...(base[item.value] || {}),
        label: item.label || base[item.value]?.label || item.value,
      };
    });
    return base;
  }, [state.notificationTypes]);

  const landlordStatusMeta = useMemo(() => {
    const base = { ...landlordStatusFallback };
    state.landlordApplicationStatuses.forEach((item) => {
      base[item.value] = {
        ...(base[item.value] || {}),
        label: item.label || base[item.value]?.label || item.value,
      };
    });
    return base;
  }, [state.landlordApplicationStatuses]);

  const propertyTypes = useMemo(
    () => mapPropertyTypeOptions(state.propertyTypes, t, lang),
    [state.propertyTypes, t, lang],
  );

  const value = useMemo(
    () => ({
      ...state,
      propertyTypes,
      loading,
      error,
      refresh,
      propertyStatusMeta,
      notificationTypeMeta,
      landlordStatusMeta,
      defaultPropertyType: propertyTypes[0]?.value,
      defaultPropertyStatus: state.propertyStatuses[0]?.value || PropertyStatus.Available,
    }),
    [
      state,
      propertyTypes,
      loading,
      error,
      refresh,
      propertyStatusMeta,
      notificationTypeMeta,
      landlordStatusMeta,
    ],
  );

  return <MetadataContext.Provider value={value}>{children}</MetadataContext.Provider>;
}

export function useMetadata() {
  return useContext(MetadataContext);
}
