import { useMemo, useState } from 'react';
import { DollarSign, MapPin, Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { getCityLabel } from '../../utils/cities.js';

const SearchFilters = ({ onSearch, propertyTypes = [], cities = [] }) => {
  const { t } = useI18n();
  const { lang } = useLanguage();
  const [form, setForm] = useState({
    keyword: '',
    city: '',
    budget: '',
    propertyType: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const safeTypes = Array.isArray(propertyTypes) ? propertyTypes : [];
  const safeCities = Array.isArray(cities) ? cities : [];

  const quickFilters = useMemo(
    () => safeTypes.filter((item) => item?.value).slice(0, 4),
    [safeTypes],
  );

  const activeFilters = useMemo(
    () =>
      Object.entries(form)
        .filter(([, value]) => Boolean(value))
        .map(([key, value]) => ({ key, value })),
    [form],
  );

  const handleSubmit = (event) => {
    event?.preventDefault?.();
    onSearch?.(form);
    setShowAdvanced(false);
  };

  const handleReset = () => {
    const empty = { keyword: '', city: '', budget: '', propertyType: '' };
    setForm(empty);
    onSearch?.(empty);
  };

  const handleChipRemove = (key) => {
    setForm((prev) => ({ ...prev, [key]: '' }));
  };

  return (
    <section className="mt-10 space-y-4 rounded-3xl border border-gray-100 bg-white/95 p-6 shadow-floating-card">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-gray-400">
          {t('search.title', 'Smart filters')}
        </p>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-3xl font-semibold text-brand">
            {t('search.subtitle', 'Find the next place faster')}
          </h2>
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t('search.filters', 'Filters')}
            {activeFilters.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>
        <p className="text-sm text-gray-500">
          {t('search.quick.subtitle', 'Live metadata drives the options below. Nothing is hardcoded.')}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-2xl bg-gray-50/70 p-4 shadow-inner sm:flex-row sm:items-center"
      >
        <label className="flex flex-1 items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-gray-600 shadow-inner shadow-gray-100">
          <SearchIcon className="h-4 w-4 text-primary" />
          <input
            type="text"
            value={form.keyword}
            onChange={(event) => setForm((prev) => ({ ...prev, keyword: event.target.value }))}
            placeholder={t('search.placeholder', 'Search by street, project, or keyword')}
            className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
        </label>

        <label className="flex min-w-[180px] flex-1 items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-gray-600 shadow-inner shadow-gray-100">
          <MapPin className="h-4 w-4 text-primary" />
          <select
            value={form.city}
            onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
            className="w-full appearance-none bg-transparent text-sm text-gray-700 outline-none"
          >
            <option value="">{t('search.allCities', 'All cities')}</option>
            {safeCities.map((city) => (
              <option key={city} value={city}>
                {getCityLabel(city, lang)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-[180px] flex-1 items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-gray-600 shadow-inner shadow-gray-100">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <select
            value={form.propertyType}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, propertyType: event.target.value }))
            }
            className="w-full appearance-none bg-transparent text-sm text-gray-700 outline-none"
          >
            <option value="">{t('search.anyType', 'Any type')}</option>
            {safeTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-[#001F3F] px-6 py-3 text-sm font-semibold text-white shadow-soft-glow transition hover:opacity-90"
        >
          {t('search.apply', 'Apply filters')}
          <SearchIcon className="h-4 w-4" />
        </button>
      </form>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => {
            const icon =
              filter.key === 'city'
                ? MapPin
                : filter.key === 'budget'
                  ? DollarSign
                  : SearchIcon;
            const Icon = icon;
            return (
              <span
                key={filter.key}
                className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-2 text-xs font-semibold text-primary"
              >
                <Icon className="h-3.5 w-3.5" />
                <span>
                  {filter.key === 'city' ? getCityLabel(filter.value, lang) : filter.value}
                </span>
                <button
                  type="button"
                  onClick={() => handleChipRemove(filter.key)}
                  className="rounded-full bg-white/70 p-0.5 text-primary transition hover:bg-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-gray-500 underline decoration-dotted underline-offset-4 hover:text-primary"
          >
            {t('search.reset', 'Reset')}
          </button>
        </div>
      )}

      {showAdvanced && (
        <div className="rounded-2xl border border-gray-100 bg-white/90 p-4 shadow-soft-glow">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-semibold text-gray-600">
              {t('search.maxBudget', 'Max budget (VND)')}
              <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <input
                  type="number"
                  value={form.budget}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, budget: event.target.value }))
                  }
                  placeholder={t('search.budget.placeholder', 'e.g. 15000000')}
                  className="w-full bg-transparent text-sm text-gray-700 outline-none"
                />
              </div>
            </label>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="text-sm font-semibold text-gray-600 underline decoration-dotted underline-offset-4 hover:text-primary"
            >
              {t('search.reset', 'Reset')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              {t('search.apply', 'Apply filters')}
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs font-semibold text-gray-600">
        {quickFilters.length === 0 ? (
          <p className="text-sm text-gray-400">
            {t('search.quick.loading', 'We are collecting property types from live listings...')}
          </p>
        ) : (
          quickFilters.map((filter) => {
            const isActive = form.propertyType === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    propertyType: prev.propertyType === filter.value ? '' : filter.value,
                  }))
                }
                className={`rounded-full border px-4 py-2 transition ${
                  isActive
                    ? 'border-primary bg-primary/10 text-primary shadow-soft-glow'
                    : 'border-gray-200 hover:border-primary/40 hover:text-primary'
                }`}
              >
                {filter.label}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
};

export default SearchFilters;
