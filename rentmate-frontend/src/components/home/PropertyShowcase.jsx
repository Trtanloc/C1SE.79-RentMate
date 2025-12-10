import PropertyCard from '../PropertyCard.jsx';
import { useI18n } from '../../i18n/useI18n.js';

const PropertyShowcase = ({ properties, loading, error }) => {
  const { t } = useI18n();
  if (loading) {
    return (
      <section className="mt-12 rounded-3xl border border-gray-100 bg-white/70 p-6">
        <div className="h-6 w-32 animate-pulse rounded-full bg-gray-200" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="h-72 animate-pulse rounded-3xl bg-gray-100"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-12 rounded-3xl border border-danger/20 bg-danger/5 p-6 text-danger">
        {error}
      </section>
    );
  }

  if (!properties?.length) {
    return (
      <section className="mt-12 rounded-3xl border border-dashed border-gray-200 bg-white/80 p-6 text-center text-gray-500">
        {t('showcase.empty', 'No properties match the current filters.')}
      </section>
    );
  }

  return (
    <section className="mt-12 space-y-5">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
          {t('showcase.title', 'Supply from the backend')}
        </p>
        <h2 className="text-3xl font-semibold text-brand">{t('showcase.title', 'Highlights this week')}</h2>
        <p className="text-sm text-gray-500">
          {t('showcase.subtitle', 'Fresh data rendered with the new UI system inspired by the reference template.')}
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </section>
  );
};

export default PropertyShowcase;
