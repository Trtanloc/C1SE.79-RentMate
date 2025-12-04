import { useEffect, useState } from 'react';
import PropertyCard from '../components/PropertyCard.jsx';
import { fetchFavorites } from '../api/favoritesApi.js';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchFavorites();
        setFavorites(data);
      } catch (err) {
        const message =
          err?.response?.data?.message || 'Unable to load favorites.';
        setError(Array.isArray(message) ? message.join(', ') : message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-gray-800">Danh sách yêu thích</h1>
      <p className="text-sm text-gray-500">
        Các bất động sản bạn đã lưu để xem lại.
      </p>
      {loading ? (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 text-gray-500">
          Đang tải...
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          {error}
        </div>
      ) : favorites.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 text-gray-500">
          Bạn chưa lưu bất động sản nào.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => (
            <PropertyCard key={fav.id} property={fav.property || fav} />
          ))}
        </div>
      )}
    </section>
  );
};

export default FavoritesPage;
