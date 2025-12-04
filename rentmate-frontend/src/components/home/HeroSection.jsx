import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Sparkles, Zap } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n.js';

const defaultMetrics = [
  { label: 'Active listings', value: '--' },
  { label: 'Verified landlords', value: '--' },
  { label: 'Contracts created', value: '--' },
];

const buildSlides = (t) => [
  {
    id: 'browse',
    title: t('hero.slide.search.title', 'Find verified rentals faster'),
    subtitle: t(
      'hero.slide.search.subtitle',
      'Every listing and notification comes from live backend data, never hardcoded.',
    ),
  },
  {
    id: 'otp',
    title: t('hero.slide.otp.title', 'Email OTP, no SMS surprises'),
    subtitle: t(
      'hero.slide.otp.subtitle',
      'One-time verification keeps tenants and landlords safe across the flow.',
    ),
  },
  {
    id: 'ai',
    title: t('hero.slide.ai.title', 'AI assistant, backed by real data'),
    subtitle: t(
      'hero.slide.ai.subtitle',
      'Chat replies are grounded in contracts, payments, and listings from the backend.',
    ),
  },
];

const HeroSection = ({ featuredProperty, metrics = defaultMetrics }) => {
  const { t } = useI18n();
  const slides = useMemo(() => buildSlides(t), [t]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setCurrentSlide((prev) => (prev + 1) % slides.length),
      6000,
    );
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentSlide];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-[#022e63] to-[#001126] px-6 py-10 text-white shadow-soft-glow sm:px-10 lg:px-14">
      <div className="absolute inset-0 opacity-35">
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-primary blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-accent blur-3xl" />
      </div>
      <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
            <Sparkles className="h-4 w-4" />
            {t('hero.badge', 'Live data + OTP email')}
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              {slide.title}
            </h1>
            <p className="text-base text-white/80 sm:text-lg">{slide.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/properties"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[#FFD400] px-6 py-3 text-sm font-semibold text-white shadow-soft-glow transition hover:opacity-90"
            >
              {t('hero.browse', 'Browse homes')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              {t('hero.post', 'Post a listing')}
              <Shield className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {slides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === index ? 'w-10 bg-white' : 'w-2 bg-white/50'
                }`}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="flex w-full justify-end lg:mr-6 lg:self-center">
          {featuredProperty ? (
            <div className="w-full max-w-md space-y-5 rounded-2xl border border-white/20 bg-white/95 p-6 text-brand shadow-xl shadow-slate-900/15 sm:p-8">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
                <Zap className="h-4 w-4 text-primary" />
                {t('hero.featured.title', 'Featured now')}
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold text-brand">{featuredProperty.title}</h2>
                <p className="text-sm text-gray-500">{featuredProperty.address}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                <p>
                  {featuredProperty.description ||
                    t(
                      'hero.featured.fallback',
                      'Automatically picked from live inventory - not a hardcoded sample.',
                    )}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                    {t('property.card.rent', 'Rent')}
                  </p>
                  <p className="text-xl font-semibold text-brand">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                      maximumFractionDigits: 0,
                    }).format(Number(featuredProperty.price || 0))}
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                    {t('dashboard.form.address', 'Address')}
                  </p>
                  <p className="text-lg font-semibold text-brand">
                    {featuredProperty.area ?? '--'} m²
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex w-full max-w-md min-h-[20rem] items-center justify-center rounded-2xl border border-white/25 bg-white/10 p-6 text-center text-white/80 shadow-xl shadow-slate-900/15 sm:p-8">
              {t('hero.featured.loading', 'Loading featured property...')}
            </div>
          )}
        </div>
      </div>

      <dl className="relative mt-10 grid gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="soft-card flex items-center justify-between rounded-2xl bg-white/95 px-4 py-3 text-brand shadow-lg"
          >
            <dt className="text-xs uppercase tracking-[0.3em] text-gray-500">{metric.label}</dt>
            <dd className="text-xl font-semibold text-primary">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default HeroSection;
