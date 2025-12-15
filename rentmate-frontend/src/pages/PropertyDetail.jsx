import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { fallbackPropertyStatusMeta } from '../utils/constants.js';
import { useMetadata } from '../context/MetadataContext.jsx';
import { useI18n } from '../i18n/useI18n.js';
import { resolveAssetUrl } from '../utils/assets.js';
import { fetchReviewsByProperty, createReview } from '../api/reviewsApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import DepositButton from '../components/DepositButton.jsx';
import { toGoogleMapsEmbedUrl } from '../utils/maps.js';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewError, setReviewError] = useState(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [creatingContract, setCreatingContract] = useState(false);
  const [contractError, setContractError] = useState(null);
  const { propertyStatusMeta } = useMetadata();
  const { t } = useI18n();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axiosClient.get(`/properties/${id}`);
        setProperty(data.data);
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load property';
        setError(Array.isArray(message) ? message.join(', ') : message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchReviewsByProperty(Number(id))
      .then((data) => setReviews(data))
      .catch(() => setReviews([]));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-gray-500">
        Loading property...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-danger">
          {error}
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-gray-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  const amenities = Array.isArray(property.amenities)
    ? property.amenities
        .map((item) => (typeof item === 'string' ? item : item.label))
        .filter(Boolean)
    : [];

  const galleryImages = Array.isArray(property.photos)
    ? property.photos
        .map((photo) => {
          const raw = typeof photo === 'string' ? photo : photo.url;
          return {
            raw,
            resolved: resolveAssetUrl(raw),
          };
        })
        .filter((item) => Boolean(item.resolved))
    : [];

  const heroImage = galleryImages[0]?.resolved;
  const statusLabel =
    propertyStatusMeta[property.status]?.label ||
    fallbackPropertyStatusMeta[property.status]?.label ||
    property.status;
  const mapEmbedSrc = toGoogleMapsEmbedUrl(
    property.mapEmbedUrl,
    property.address || property.title,
  );

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setReviewError(null);
    setReviewSaving(true);
    try {
      const data = await createReview({
        propertyId: property.id,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });
      setReviews((prev) => [data, ...prev]);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      setReviewError(
        err?.response?.data?.message ||
          'Không gửi được đánh giá, vui lòng thử lại.',
      );
    } finally {
      setReviewSaving(false);
    }
  };

  const handleCreateContract = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/properties/${id}` } } });
      return;
    }
    setCreatingContract(true);
    setContractError(null);
    const startDate =
      property.availableFrom || new Date().toISOString().slice(0, 10);
    const endDate = (() => {
      const end = new Date(startDate);
      end.setFullYear(end.getFullYear() + 1);
      return end.toISOString().slice(0, 10);
    })();

    try {
      const payload = {
        listingId: property.id,
        startDate,
        endDate,
        monthlyRent: property.price ? Number(property.price) : undefined,
        depositAmount: property.price ? Number(property.price) * 2 : undefined,
        notes: `Hợp đồng tạo tự động cho ${property.title}`,
      };
      const { data } = await axiosClient.post('/contracts/create', payload);
      navigate(`/contracts/${data.data.id}/preview`);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        'Không thể tạo hợp đồng cho bất động sản này.';
      setContractError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setCreatingContract(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 text-sm font-medium text-primary hover:underline"
      >
        {t('property.detail.back', 'Back to list')}
      </button>
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div
          className={`h-64 ${heroImage ? 'bg-cover bg-center' : 'bg-gradient-to-br from-primary/20 via-primary/10 to-success/20'}`}
          style={
            heroImage
              ? {
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.42), rgba(0,0,0,0.42)), url(${heroImage})`,
                }
              : undefined
          }
        >
          <div className="flex h-full flex-col items-start justify-end gap-3 p-6 text-white">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-primary/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                {statusLabel}
              </span>
              {property.price !== undefined && property.price !== null && (
                <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-semibold">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    maximumFractionDigits: 0,
                  }).format(Number(property.price))}{' '}
                  / month
                </span>
              )}
            </div>
            <h1 className="text-3xl font-semibold">{property.title}</h1>
            <p className="text-sm opacity-90">{property.address}</p>
          </div>
        </div>
        <div className="grid gap-6 p-6 md:grid-cols-[2fr,1fr]">
          <article className="space-y-4 text-sm text-gray-600">
            <h2 className="text-xl font-semibold text-gray-800">
              {t('property.detail.description', 'Description')}
            </h2>
            <p>{property.description}</p>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">
                {t('property.detail.gallery', 'Photo gallery')}
              </h2>
              {galleryImages.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {galleryImages.map(({ raw, resolved }) => (
                    <figure
                      key={raw || resolved}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
                    >
                      <img
                        src={resolved}
                        alt={`${property.title} preview`}
                        className="h-40 w-full object-cover transition duration-200 hover:scale-105"
                      />
                    </figure>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  {t(
                    'property.detail.gallery.empty',
                    'Images are not available for this property yet.',
                  )}
                </p>
              )}
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                {t('property.detail.keyDetails', 'Key details')}
              </h3>
              <ul className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                <li>Address: {property.address}</li>
                <li>City: {property.city || 'Updating'}</li>
                <li>Area: {property.area} m2</li>
                <li>Bedrooms: {property.bedrooms}</li>
                <li>Bathrooms: {property.bathrooms}</li>
                <li>
                  Price:{' '}
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    maximumFractionDigits: 0,
                  }).format(Number(property.price))}
                </li>
                <li>Status: {statusLabel}</li>
                {property.owner && (
                  <li>
                    Owner: {property.owner.fullName}
                    {property.owner.phone ? `  ${property.owner.phone}` : ''}
                  </li>
                )}
              </ul>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">
                {t('property.detail.amenities', 'Amenities')}
              </h2>
              {amenities.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {amenity}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">
                  {t(
                    'property.detail.amenities.empty',
                    'No amenities provided for this listing.',
                  )}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">
                Đánh giá & Nhận xét
              </h2>
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Chưa có đánh giá cho bất động sản này.
                </p>
              ) : (
                <ul className="space-y-3">
                  {reviews.map((review) => (
                    <li
                      key={review.id}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm"
                    >
                      <p className="font-semibold text-gray-800">
                        ⭐ {review.rating}/5
                      </p>
                      <p className="text-gray-600">{review.comment}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              {isAuthenticated && user?.role === 'tenant' && (
                <form
                  onSubmit={handleReviewSubmit}
                  className="mt-3 space-y-2 rounded-xl border border-gray-200 p-3"
                >
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">
                      Điểm
                    </label>
                    <select
                      value={reviewForm.rating}
                      onChange={(e) =>
                        setReviewForm((prev) => ({
                          ...prev,
                          rating: Number(e.target.value),
                        }))
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                      {[5, 4, 3, 2, 1].map((score) => (
                        <option key={score} value={score}>
                          {score}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm((prev) => ({
                        ...prev,
                        comment: e.target.value,
                      }))
                    }
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                  {reviewError && (
                    <p className="text-xs text-rose-600">{reviewError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={reviewSaving}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
                  >
                    {reviewSaving ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                </form>
              )}
            </div>
          </article>
          <aside className="space-y-4 rounded-2xl border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {t('property.detail.interested', 'Interested?')}
            </h2>
            <p className="text-sm text-gray-600">
              {t(
                'property.detail.interested.desc',
                'Contact the landlord to schedule a viewing or request more information.',
              )}
            </p>
            {isAuthenticated && user?.role === 'tenant' && (
              <DepositButton
                propertyId={property.id}
                landlordId={property.ownerId}
                propertyTitle={property.title}
                landlordName={property.owner?.fullName || 'Chủ nhà'}
              />
            )}
            <button
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white transition hover:bg-primary/90"
              type="button"
              onClick={() =>
                navigate(
                  `/messages?propertyId=${property.id}${
                    property.ownerId ? `&landlordId=${property.ownerId}` : ''
                  }`,
                )
              }
            >
              {t('property.detail.contact', 'Contact Landlord')}
            </button>
            <button
              type="button"
              onClick={handleCreateContract}
              disabled={creatingContract}
              className="w-full rounded-xl border border-primary px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingContract ? 'Đang tạo hợp đồng...' : 'Tạo hợp đồng'}
            </button>
            {contractError && (
              <p className="text-sm text-danger">
                {contractError}
              </p>
            )}
            {property.owner && (
              <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                <p className="font-semibold text-gray-700">
                  {property.owner.fullName}
                </p>
                <p>{property.owner.email}</p>
                {property.owner.phone && <p>{property.owner.phone}</p>}
              </div>
            )}
            {mapEmbedSrc && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-gray-700">
                  Bản đồ / Tour 360
                </p>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <iframe
                    src={mapEmbedSrc}
                    title="Map preview"
                    className="h-52 w-full border-0"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
            {property.virtualTourUrl && (
              <a
                href={property.virtualTourUrl}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-primary/20"
              >
                Mở tour 360°
              </a>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
};

export default PropertyDetail;
