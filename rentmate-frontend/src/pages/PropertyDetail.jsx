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
        <div className="h-64 bg-gradient-to-br from-primary/20 via-primary/10 to-success/20">
          <div className="flex h-full flex-col items-start justify-end gap-3 p-6 text-white">
            <span className="rounded-full bg-primary/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              {statusLabels[property.status] || property.status}
            </span>
            <h1 className="text-3xl font-semibold">{property.title}</h1>
            <p className="text-sm opacity-90">{property.address}</p>
          </div>
        </div>
        <div className="grid gap-6 p-6 md:grid-cols-[2fr,1fr]">
          <article className="space-y-4 text-sm text-gray-600">
            <h2 className="text-xl font-semibold text-gray-800">Description</h2>
            <p>{property.description}</p>
            <div className="rounded-2xl bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Key details</h3>
              <ul className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                <li>Area: {property.area} m2</li>
                <li>Price: ${Number(property.price).toLocaleString()}</li>
                <li>Status: {statusLabels[property.status] || property.status}</li>
                {property.owner && <li>Owner: {property.owner.fullName}</li>}
              </ul>
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
