import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import PropertyCard from '../components/PropertyCard.jsx';
import { useMetadata } from '../context/MetadataContext.jsx';
import { useI18n } from '../i18n/useI18n.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getCityLabel } from '../utils/cities.js';

const stripAccents = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const useQueryFilters = (searchString) =>
  useMemo(() => {
    const params = new URLSearchParams(searchString);
    return {
      search: params.get('search') || '',
      city: params.get('city') || '',
      budget: params.get('maxPrice') || '',
      type: params.get('type') || '',
    };
  }, [searchString]);

const PropertyList = () => {
  const location = useLocation();
  const initialFilters = useQueryFilters(location.search);
  const {
    cities = [],
    propertyTypes = [],
    loading: metadataLoading,
    error: metadataError,
  } = useMetadata();
  const { t } = useI18n();
  const { lang } = useLanguage();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(initialFilters.search);
  const [cityFilter, setCityFilter] = useState(initialFilters.city);
  const [budgetFilter, setBudgetFilter] = useState(initialFilters.budget);
  const [typeFilter, setTypeFilter] = useState(initialFilters.type);

  useEffect(() => {
    setSearch(initialFilters.search);
    setCityFilter(initialFilters.city);
    setBudgetFilter(initialFilters.budget);
    setTypeFilter(initialFilters.type);
  }, [location.search, initialFilters]);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      try {
        const normalizedSearch = (search || '').trim().replace(/\s+/g, ' ');
        const { data } = await axiosClient.get('/properties', {
          params: {
            search: normalizedSearch || undefined,
            city: cityFilter || undefined,
            maxPrice: budgetFilter || undefined,
            type: typeFilter || undefined,
          },
        });
        setProperties(data.data || []);
      } catch (err) {
        const message = err.response?.data?.message || 'Unable to load listings.';
        setError(Array.isArray(message) ? message.join(', ') : message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [search, cityFilter, budgetFilter, typeFilter]);

  const typeLabel = useMemo(() => {
    const safeTypes = Array.isArray(propertyTypes) ? propertyTypes : [];
    const displayLabel = (item) =>
      lang === 'vi'
        ? item?.labelVi || item?.label || item?.value
        : stripAccents(item?.label || item?.value || '');
    const map = new Map(
      safeTypes.map((item) => [item?.value, displayLabel(item)]),
    );
    return (value) => map.get(value) || value || '';
  }, [propertyTypes, lang]);
  const cityDisplay = (city) => getCityLabel(city, lang);

  const activeFilters = [
    search && { label: `${t('search.keyword', 'Keyword')}: ${search}`, onClear: () => setSearch('') },
    cityFilter && {
      label: `${t('search.city', 'City')}: ${cityDisplay(cityFilter)}`,
      onClear: () => setCityFilter(''),
    },
    budgetFilter && {
      label: `${t('search.maxBudget', 'Max budget (VND)')}: ${Number(budgetFilter).toLocaleString('vi-VN')} VND`,
      onClear: () => setBudgetFilter(''),
    },
    typeFilter && {
      label: `${t('search.type', 'Property type')}: ${typeLabel(typeFilter)}`,
      onClear: () => setTypeFilter(''),
    },
  ].filter(Boolean);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="rounded-3xl border border-gray-100 bg-white/95 p-6 shadow-floating-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-400">
              {t('property.list.title', 'Live marketplace')}
            </p>
            <h1 className="text-3xl font-semibold text-brand">{t('property.list.heading', 'Properties for rent')}</h1>
            <p className="text-sm text-gray-500">
              {t('property.list.sub', 'Filters, layout, and counts are wired to backend data only.')}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('property.list.searchPlaceholder', 'Search by title, address or status')}
              className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:min-w-[320px]"
            />
            <div className="flex flex-wrap gap-2 text-xs">
              <select
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                className="rounded-full border border-gray-200 px-3 py-1 text-sm outline-none focus:border-primary"
              >
                <option value="">{t('search.allCities', 'All cities')}</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {cityDisplay(city)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={budgetFilter}
                onChange={(event) => setBudgetFilter(event.target.value)}
                placeholder={t('search.maxBudget', 'Max budget (VND)')}
                className="rounded-full border border-gray-200 px-3 py-1 outline-none focus:border-primary"
              />
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="rounded-full border border-gray-200 px-3 py-1 outline-none focus:border-primary"
              >
                <option value="">{t('search.anyType', 'Any type')}</option>
                {(Array.isArray(propertyTypes) ? propertyTypes : []).map((type) => (
                  <option key={type.value} value={type.value}>
                    {lang === 'vi'
                      ? type.labelVi || type.label || type.value
                      : stripAccents(type.label || type.value)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {activeFilters.map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={filter.onClear}
                className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-gray-600 hover:bg-gray-200"
              >
                {filter.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCityFilter('');
                setBudgetFilter('');
                setTypeFilter('');
              }}
              className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
            >
              {t('search.reset', 'Reset')}
            </button>
          </div>
        )}
      </div>

          {metadataError && (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {metadataError}
        </div>
      )}

      {loading ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`loading-${index}`}
              className="h-80 animate-pulse rounded-3xl bg-gray-100"
            />
          ))}
        </div>
      ) : error ? (
        <div className="mt-10 rounded-3xl border border-danger/30 bg-danger/5 p-6 text-danger">
          {error}
        </div>
      ) : properties.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-gray-200 bg-white/80 p-6 text-center text-gray-500">
          {t('property.list.noResults', 'No listings match the filters you selected.')}
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}

      {metadataLoading && (
        <p className="mt-4 text-xs text-gray-400">Loading filter metadata...</p>
      )}
    </section>
  );
};

export default PropertyList;
