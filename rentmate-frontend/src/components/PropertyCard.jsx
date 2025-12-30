import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bath,
  BedDouble,
  Heart,
  MapPin,
  Shield,
  Sparkles,
  Square,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useMetadata } from '../context/MetadataContext.jsx';
import { fallbackPropertyStatusMeta } from '../utils/constants.js';
import { useI18n } from '../i18n/useI18n.js';
import { resolveAssetUrl } from '../utils/assets.js';
import { addFavorite, removeFavorite } from '../api/favoritesApi.js';
import { useAuth } from '../context/AuthContext.jsx';

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const gradientClasses = [
  'from-[#0072BC] via-[#5DE0E6] to-[#001F3F]',
  'from-[#FFD400] via-[#FF8C00] to-[#FF3B30]',
  'from-[#7ED321] via-[#00B894] to-[#0072BC]',
  'from-[#9C27B0] via-[#673AB7] to-[#1D2671]',
];

const getPrimaryPhoto = (property) => {
  if (!property) return null;
  const photo =
    property.coverImage ||
    property.thumbnail ||
    property.image ||
    property.imageUrl ||
    property.heroImage ||
    (Array.isArray(property.imageUrls) && property.imageUrls[0]) ||
    (Array.isArray(property.images) &&
      property.images
        .map((item) => (typeof item === 'string' ? item : item?.url || item?.path || item?.image))
        .filter(Boolean)[0]) ||
    (Array.isArray(property.photos) &&
      property.photos
        .map((item) => (typeof item === 'string' ? item : item?.url))
        .filter(Boolean)[0]);
  return resolveAssetUrl(photo);
};

const PropertyCard = ({ property }) => {
  const { t } = useI18n();
  const { propertyStatusMeta } = useMetadata();
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(Boolean(property?.isFavorite));

  const {
    id,
    title,
    address,
    city,
    price,
    status,
    area,
    bedrooms,
    bathrooms,
    isFeatured,
    rating,
    avgRating,
    reviewCount,
  } = property;

  const gradient = gradientClasses[(Number(id) || 0) % gradientClasses.length];
  const badgeMeta =
    propertyStatusMeta[status] ||
    fallbackPropertyStatusMeta[status] || {
      label: status || t('property.card.status.pending', 'Pending'),
      badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
    };

  const coverImage = useMemo(() => getPrimaryPhoto(property), [property]);
  const priceLabel = price !== undefined && price !== null ? formatCurrency(price) : '--';
  const resolvedRating = avgRating ?? rating;
  const showRating = resolvedRating !== undefined && resolvedRating !== null;
  const listingId = id !== undefined && id !== null ? String(id).padStart(3, '0') : '---';

  return (
    <Link
      to={`/properties/${id}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white/95 shadow-floating-card transition hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="relative h-52 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient} text-white`}
            aria-hidden
          >
            <Sparkles className="h-10 w-10" />
          </div>
        )}

        <div className="absolute left-3 right-3 top-3 flex flex-col gap-2">
          {isFeatured && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-gradient-to-r from-primary to-[#001F3F] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow">
              <TrendingUp className="h-3.5 w-3.5" />
              {t('property.card.featured', 'Featured')}
            </span>
          )}
          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${badgeMeta.badgeClass}`}
          >
            <Shield className="h-3.5 w-3.5" />
            {badgeMeta.label}
          </span>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            if (!isAuthenticated) {
              setLiked((prev) => !prev);
              return;
            }
            const nextState = !liked;
            setLiked(nextState);
            if (nextState) {
              addFavorite(property.id).catch(() => setLiked(false));
            } else {
              removeFavorite(property.id).catch(() => setLiked(true));
            }
          }}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm transition hover:scale-110 hover:text-danger"
          aria-label={t('property.card.favorite', 'Save listing')}
        >
          <Heart className={`h-5 w-5 ${liked ? 'fill-danger text-danger' : ''}`} />
        </button>

        {showRating && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-800 shadow">
            <Star className="h-4 w-4 fill-accent text-accent" />
            {typeof resolvedRating === 'number' && resolvedRating.toFixed
              ? resolvedRating.toFixed(1)
              : resolvedRating}
            {reviewCount ? ` (${reviewCount})` : ''}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-400">
              {t('property.card.listing', 'Listing')} #{listingId}
            </p>
            <h3 className="text-lg font-semibold text-brand transition group-hover:text-primary">
              {title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="line-clamp-1">{city || address || t('category.loading', 'Updating')}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
              {t('property.card.rent', 'Rent')}
            </p>
            <p className="text-xl font-semibold text-primary">{priceLabel}</p>
            <p className="text-[11px] text-gray-500">{t('property.card.perMonth', 'per month')}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs font-semibold text-gray-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100/80 px-3 py-1">
            <Square className="h-3.5 w-3.5 text-primary" />
            {area ?? '--'} m²
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100/80 px-3 py-1">
            <BedDouble className="h-3.5 w-3.5 text-primary" />
            {bedrooms ?? '--'} {t('property.card.br', 'BR')}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100/80 px-3 py-1">
            <Bath className="h-3.5 w-3.5 text-primary" />
            {bathrooms ?? '--'} {t('property.card.ba', 'BA')}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold text-brand">
              {t('property.card.view', 'View details')}
            </span>
          </div>
          <span className="text-xs text-gray-400">{t('property.card.status.label', 'Status')}</span>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
