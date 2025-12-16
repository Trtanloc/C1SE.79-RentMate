import { Building2, Home, Sparkles, TrendingUp, Users, Warehouse } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n.js';

const palette = [
  { icon: Home, gradient: 'from-[#0072BC] to-[#001F3F]', surface: 'bg-blue-50' },
  { icon: Building2, gradient: 'from-[#FFD400] to-[#FF8C00]', surface: 'bg-yellow-50' },
  { icon: Warehouse, gradient: 'from-[#7ED321] to-[#00B894]', surface: 'bg-green-50' },
  { icon: Users, gradient: 'from-[#FF3B30] to-[#E91E63]', surface: 'bg-red-50' },
  { icon: Sparkles, gradient: 'from-[#9C27B0] to-[#673AB7]', surface: 'bg-purple-50' },
  { icon: TrendingUp, gradient: 'from-[#FF5722] to-[#FF9800]', surface: 'bg-orange-50' },
];

const formatCount = (value, t) => {
  if (value === null || value === undefined) {
    return t('category.count.missing', 'No listing data yet');
  }
  return `${value.toLocaleString('vi-VN')} ${t('category.count', 'live listings')}`;
};

const formatPrice = (value, t) => {
  if (value === null || value === undefined) {
    return t('category.noPrice', 'No pricing data yet');
  }
  return `${Number(value).toLocaleString('vi-VN')} VND`;
};

const CategoryHighlights = ({ categories = [], error = null, onSelect, canViewFinancial = false }) => {
  const { t } = useI18n();
  const list = categories.length ? categories : Array.from({ length: 6 }, () => null);

  return (
    <section className="mt-12 space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
          {t('category.title', 'Product mix')}
        </p>
        <h2 className="text-3xl font-semibold text-brand">
          {t('category.title', 'Categories backed by data')}
        </h2>
        <p className="text-sm text-gray-500">
          {t('category.subtitle', 'The stats below are aggregated from active listings in the backend.')}
        </p>
      </div>
      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((category, index) => {
          const theme = palette[index % palette.length];
          const Icon = theme.icon;
          const isClickable = Boolean(onSelect && category?.type);
          return (
            <article
              key={category?.type ?? index}
              role={isClickable ? 'button' : 'group'}
              tabIndex={isClickable ? 0 : -1}
              onClick={() => isClickable && onSelect(category.type)}
              onKeyDown={(event) => {
                if (!isClickable) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(category.type);
                }
              }}
              className={`${theme.surface} flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/90 p-5 shadow-floating-card transition hover:-translate-y-1 ${
                isClickable ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.gradient} text-white`}>
                  <Icon className="h-7 w-7" />
                </div>
                <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-600">
                  {category?.count ? t('category.live', 'Live') : t('category.loading', 'Updating')}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-brand">
                  {category?.label ?? t('category.loading', 'Fetching data...')}
                </h3>
                <p className="text-sm text-gray-600">
                  {category?.description ??
                    t('category.loading', 'We are aggregating live inventory to build this highlight.')}
                </p>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold text-brand">
                <span>{category ? formatCount(category.count, t) : '--'}</span>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs text-gray-600">
                  {category
                    ? canViewFinancial && category.averagePrice !== null && category.averagePrice !== undefined
                      ? formatPrice(category.averagePrice, t)
                      : t('category.protected', 'Visible to landlords/admin only')
                    : '--'}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryHighlights;
