import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, Zap } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import { fetchOverviewStats, fetchCategoryHighlights } from '../api/statsApi.js';
import { fetchTestimonials } from '../api/testimonialsApi.js';
import HeroSection from '../components/home/HeroSection.jsx';
import SearchFilters from '../components/home/SearchFilters.jsx';
import CategoryHighlights from '../components/home/CategoryHighlights.jsx';
import PropertyShowcase from '../components/home/PropertyShowcase.jsx';
import Testimonials from '../components/home/Testimonials.jsx';
import NotificationSpotlight from '../components/home/NotificationSpotlight.jsx';
import AssistantPromo from '../components/home/AssistantPromo.jsx';
import { useMetadata } from '../context/MetadataContext.jsx';
import { useI18n } from '../i18n/useI18n.js';

const defaultMetrics = [
  { label: 'Active listings', value: '--' },
  { label: 'Verified landlords', value: '--' },
  { label: 'Contracts created', value: '--' },
];

const HotDealBanner = ({ onView }) => {
  const { t } = useI18n();
  return (
    <section className="mt-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FFD400] via-[#FF8C00] to-[#FFD400] p-8 text-brand shadow-floating-card">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute -left-12 top-0 h-40 w-40 rounded-full bg-white blur-3xl" />
          <div className="absolute right-0 bottom-0 h-52 w-52 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur">
              <Zap className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white">
                {t('home.deals.title', 'Time-sensitive offers')}
              </h3>
              <p className="text-white/90">
                {t(
                  'home.deals.subtitle',
                  'Email OTP only, discounts applied directly from backend-driven promotions.',
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onView}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#FF8C00] shadow-lg transition hover:scale-105"
          >
            {t('home.deals.cta', 'View listings')}
            <TrendingUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

const formatMetricValue = (value) => {
  if (value === null || value === undefined) {
    return '--';
  }
  if (value >= 1000) {
    const thousands = value / 1000;
    const rounded =
      thousands >= 10 ? Math.round(thousands) : Number(thousands.toFixed(1));
    return `${rounded}K+`;
  }
  return Number(value).toLocaleString('vi-VN');
};

const Home = () => {
  const { propertyTypes, cities, loading: metadataLoading } = useMetadata();
  const { t } = useI18n();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialError, setTestimonialError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axiosClient.get('/properties', {
          params: { limit: 6 },
        });
        setProperties(data.data || []);
      } catch (err) {
        const message = err.response?.data?.message || 'Unable to load the latest properties.';
        setError(Array.isArray(message) ? message.join(', ') : message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const overview = await fetchOverviewStats();
        setStats(overview);
        setStatsError(null);
      } catch (err) {
        setStats(null);
        setStatsError(err.response?.data?.message || 'Unable to load overview data.');
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategoryHighlights();
        setCategories(data);
        setCategoryError(null);
      } catch (err) {
        setCategories([]);
        setCategoryError(err.response?.data?.message || 'Unable to load highlighted categories.');
      }
    };

    const loadTestimonials = async () => {
      try {
        const data = await fetchTestimonials();
        setTestimonials(data);
        setTestimonialError(null);
      } catch (err) {
        setTestimonials([]);
        setTestimonialError(err.response?.data?.message || 'Unable to load testimonials.');
      }
    };

    loadCategories();
    loadTestimonials();
  }, []);

  const featuredProperty = useMemo(() => {
    if (!Array.isArray(properties) || properties.length === 0) {
      return undefined;
    }
    return properties.find((property) => property.isFeatured) ?? properties[0];
  }, [properties]);

  const handleSearchRedirect = (filters) => {
    const params = new URLSearchParams();
    if (filters.keyword) params.set('search', filters.keyword);
    if (filters.city) params.set('city', filters.city);
    if (filters.budget) params.set('maxPrice', filters.budget);
    if (filters.propertyType) params.set('type', filters.propertyType);

    const query = params.toString();
    navigate(query ? `/properties?${query}` : '/properties');
  };

  const heroMetrics = useMemo(() => {
    if (!stats) {
      return defaultMetrics;
    }
    return [
      {
        label: t('home.metrics.active', 'Active listings'),
        value: formatMetricValue(stats.activeListings),
      },
      {
        label: t('home.metrics.landlords', 'Verified landlords'),
        value: formatMetricValue(stats.landlordCount),
      },
      {
        label: t('home.metrics.contracts', 'Contracts created'),
        value: formatMetricValue(stats.contractsSigned),
      },
    ];
  }, [stats, t]);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 pb-12 pt-6">
      <HeroSection featuredProperty={featuredProperty} metrics={heroMetrics} />
      {statsError && (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {statsError}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {heroMetrics.map((metric, index) => {
          const Icon = [Zap, Sparkles, TrendingUp][index % 3];
          return (
            <div
              key={metric.label}
              className="soft-card flex items-center gap-3 rounded-2xl bg-white p-4 text-brand shadow-lg"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{metric.label}</p>
                <p className="text-xl font-semibold text-brand">{metric.value}</p>
              </div>
            </div>
          );
        })}
      </section>

      <SearchFilters onSearch={handleSearchRedirect} propertyTypes={propertyTypes} cities={cities} />

      <div className="grid gap-6 lg:grid-cols-2">
        <NotificationSpotlight />
        <AssistantPromo />
      </div>

      <HotDealBanner onView={() => navigate('/properties')} />

      <CategoryHighlights categories={categories} error={categoryError} />
      <PropertyShowcase properties={properties} loading={loading} error={error} />
      <Testimonials items={testimonials} error={testimonialError} />
      {metadataLoading && (
        <p className="mt-4 text-xs text-gray-400">{t('home.meta.loading', 'Syncing filter metadata...')}</p>
      )}
    </div>
  );
};

export default Home;
