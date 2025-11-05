import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { statusLabels } from '../utils/constants.js';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-gray-500">Loading property...</div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-danger">{error}</div>
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
    ? property.amenities.filter(Boolean)
    : typeof property.amenities === 'string'
      ? property.amenities
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const images = Array.isArray(property.images)
    ? property.images.filter(Boolean)
    : typeof property.images === 'string'
      ? property.images
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const formattedPrice =
    property.price !== undefined && property.price !== null
      ? Number(property.price).toLocaleString()
      : null;
  const heroImage = images[0];

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 text-sm font-medium text-primary hover:underline"
      >
        Back to list
      </button>
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div
          className={`h-64 ${heroImage ? 'bg-cover bg-center' : 'bg-gradient-to-br from-primary/20 via-primary/10 to-success/20'}`}
          style={heroImage ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.42), rgba(0,0,0,0.42)), url(${heroImage})` } : undefined}
        >
          <div className="flex h-full flex-col items-start justify-end gap-3 p-6 text-white">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-primary/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                {statusLabels[property.status] || property.status}
              </span>
              {formattedPrice && (
                <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-semibold">
                  ${formattedPrice} / month
                </span>
              )}
            </div>
            <h1 className="text-3xl font-semibold">{property.title}</h1>
            <p className="text-sm opacity-90">{property.address}</p>
          </div>
        </div>
        <div className="grid gap-6 p-6 md:grid-cols-[2fr,1fr]">
          <article className="space-y-4 text-sm text-gray-600">
            <h2 className="text-xl font-semibold text-gray-800">Description</h2>
            <p>{property.description}</p>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">Photo gallery</h2>
              {images.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {images.map((src) => (
                    <figure
                      key={src}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
                    >
                      <img
                        src={src}
                        alt={`${property.title} preview`}
                        className="h-40 w-full object-cover transition duration-200 hover:scale-105"
                      />
                    </figure>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Images are not available for this property yet.
                </p>
              )}
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Key details</h3>
              <ul className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                <li>Address: {property.address}</li>
                <li>Area: {property.area} m2</li>
                <li>Price: ${Number(property.price).toLocaleString()}</li>
                <li>Status: {statusLabels[property.status] || property.status}</li>
                {property.owner && <li>Owner: {property.owner.fullName}</li>}
              </ul>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">Amenities</h2>
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
                <p className="text-sm text-gray-500">No amenities provided for this listing.</p>
              )}
            </div>
          </article>
          <aside className="space-y-4 rounded-2xl border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-800">Interested?</h2>
            <p className="text-sm text-gray-600">
              Contact the landlord to schedule a viewing or request more information.
            </p>
            <button className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white transition hover:bg-primary/90">
              Contact Landlord
            </button>
            {property.owner && (
              <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                <p className="font-semibold text-gray-700">{property.owner.fullName}</p>
                <p>{property.owner.email}</p>
                {property.owner.phone && <p>{property.owner.phone}</p>}
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
};

export default PropertyDetail;
