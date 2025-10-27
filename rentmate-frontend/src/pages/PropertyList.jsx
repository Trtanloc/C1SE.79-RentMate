import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient.js';
import PropertyCard from '../components/PropertyCard.jsx';

const PropertyList = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axiosClient.get('/properties');
        setProperties(data.data || []);
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load properties';
        setError(Array.isArray(message) ? message.join(', ') : message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const filteredProperties = properties.filter((property) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      property.title.toLowerCase().includes(term) ||
      property.address.toLowerCase().includes(term) ||
      property.status.toLowerCase().includes(term)
    );
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">Discover properties</h1>
          <p className="text-sm text-gray-500">
            Browse available rentals curated for tenants and landlords.
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title, address, or status"
          className="w-full max-w-sm rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </div>
      {loading ? (
        <div className="mt-10 text-center text-gray-500">Loading properties...</div>
      ) : error ? (
        <div className="mt-10 rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger">
          {error}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="mt-10 text-center text-gray-500">No properties match your search right now.</div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </section>
  );
};

export default PropertyList;
