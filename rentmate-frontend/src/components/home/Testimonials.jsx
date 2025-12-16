import { Star } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n.js';
import { resolveAssetUrl } from '../../utils/assets.js';

const Testimonials = ({ items = [], error = null }) => {
  const { t } = useI18n();
  const list = items.length ? items : Array.from({ length: 3 });

  return (
    <section className="mt-14 rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-floating-card">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
          {t('testimonials.title', 'Voices from RentMate')}
        </p>
        <h2 className="text-3xl font-semibold text-brand">
          {t('testimonials.title', 'What tenants and landlords are saying')}
        </h2>
      </div>
      {error && (
        <div className="mt-4 rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {list.map((testimonial, index) => {
          const name =
            testimonial?.authorName ||
            testimonial?.reviewerName ||
            t('category.loading', 'Updating');
          const role = testimonial?.authorRole || testimonial?.reviewerRole || '';
          const content =
            testimonial?.message ||
            testimonial?.comment ||
            testimonial?.content ||
            t(
              'testimonials.subtitle',
              'Fresh feedback will appear here as soon as the backend returns it.',
            );

          return (
            <article
              key={testimonial?.id ?? index}
              className="rounded-3xl border border-gray-100 bg-white px-5 py-6 shadow-sm"
            >
              <p className="text-sm text-gray-600">
                &ldquo;{content}&rdquo;
              </p>
              {typeof testimonial?.rating === 'number' && (
                <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-amber-600">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {testimonial.rating}/5
                </div>
              )}
              <div className="mt-5 flex items-center gap-3">
                {testimonial?.avatarUrl && (
                  <img
                    src={resolveAssetUrl(testimonial.avatarUrl)}
                    alt={name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="text-base font-semibold text-brand">{name}</p>
                  <p className="text-sm text-gray-500">{role}</p>
                  {testimonial?.createdAt && (
                    <p className="text-xs text-gray-400">
                      {new Date(testimonial.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default Testimonials;
