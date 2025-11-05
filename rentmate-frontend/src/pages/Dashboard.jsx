import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient.js';
import PropertyCard from '../components/PropertyCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { PropertyStatus, statusLabels, UserRole } from '../utils/constants.js';

const emptyForm = {
  title: '',
  description: '',
  address: '',
  price: '',
  area: '',
  status: PropertyStatus.Available,
};

const Dashboard = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const canManageProperties = useMemo(
    () => user.role === UserRole.Landlord || user.role === UserRole.Admin,
    [user.role],
  );

  useEffect(() => {
    if (!canManageProperties) {
      return;
    }

    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axiosClient.get('/properties');
        const list = data.data || [];
        const owned =
          user.role === UserRole.Landlord
            ? list.filter((property) => property.ownerId === user.id)
            : list;
        setProperties(owned);
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load properties';
        setError(Array.isArray(message) ? message.join(', ') : message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [canManageProperties, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => {
      if (!prev[name]) {
        return prev;
      }
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const fieldClass = (field) =>
    `w-full rounded-xl border px-4 py-2 text-sm outline-none transition focus:ring-2 ${
      formErrors[field]
        ? 'border-danger focus:border-danger focus:ring-danger/30'
        : 'border-gray-200 focus:border-primary focus:ring-primary/30'
    }`;

  const validatePropertyForm = (values) => {
    const nextErrors = {};
    if (!values.title.trim()) {
      nextErrors.title = 'Title is required';
    }
    if (!values.address.trim()) {
      nextErrors.address = 'Address is required';
    }
    const priceValue = Number(values.price);
    if (values.price === '' || Number.isNaN(priceValue) || priceValue <= 0) {
      nextErrors.price = 'Enter a valid positive price';
    }
    const areaValue = Number(values.area);
    if (values.area === '' || Number.isNaN(areaValue) || areaValue <= 0) {
      nextErrors.area = 'Enter a valid positive area';
    }
    if (!values.description.trim()) {
      nextErrors.description = 'Description is required';
    }
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const validationErrors = validatePropertyForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }
    setFormErrors({});
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        area: Number(form.area),
      };
      const { data } = await axiosClient.post('/properties', payload);
      setProperties((prev) => [data.data, ...prev]);
      setForm(emptyForm);
      setSuccess('Property saved successfully');
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to save property';
      setError(Array.isArray(message) ? message.join(', ') : message);
    }
  };

  if (!canManageProperties) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-semibold text-gray-800">Tenant dashboard</h1>
        <p className="mt-4 text-sm text-gray-600">
          Welcome back, {user.fullName}. Browse the latest properties and reach out to landlords to begin your rental journey.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">Property manager</h1>
          <p className="text-sm text-gray-500">
            Create and manage your rental listings in one place.
          </p>
        </div>
        <div className="rounded-xl bg-white px-4 py-2 text-sm text-gray-600 shadow-sm">
          Signed in as <span className="font-semibold text-gray-800">{user.fullName}</span> | {user.role}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Your listings</h2>
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500">
              Loading properties...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-danger">{error}</div>
          ) : properties.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500">
              You have not listed any properties yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Add new property</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Modern apartment"
                required
                className={fieldClass('title')}
              />
              {formErrors.title && <p className="mt-1 text-xs text-danger">{formErrors.title}</p>}
            </div>
            <div>
              <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="123 Main Street, City"
                required
                className={fieldClass('address')}
              />
              {formErrors.address && (
                <p className="mt-1 text-xs text-danger">{formErrors.address}</p>
              )}
            </div>
            <div>
              <label htmlFor="price" className="mb-1 block text-sm font-medium text-gray-700">
                Monthly price ($)
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="1500"
                required
                className={fieldClass('price')}
              />
              {formErrors.price && <p className="mt-1 text-xs text-danger">{formErrors.price}</p>}
            </div>
            <div>
              <label htmlFor="area" className="mb-1 block text-sm font-medium text-gray-700">
                Area (m2)
              </label>
              <input
                id="area"
                name="area"
                type="number"
                min="0"
                value={form.area}
                onChange={handleChange}
                placeholder="80"
                required
                className={fieldClass('area')}
              />
              {formErrors.area && <p className="mt-1 text-xs text-danger">{formErrors.area}</p>}
            </div>
            <div>
              <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className={fieldClass('status')}
              >
                {Object.values(PropertyStatus).map((value) => (
                  <option key={value} value={value}>
                    {statusLabels[value] || value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Highlight property features and nearby amenities"
                rows={4}
                className={fieldClass('description')}
              />
              {formErrors.description && (
                <p className="mt-1 text-xs text-danger">{formErrors.description}</p>
              )}
            </div>
            {success && <p className="text-sm text-success">{success}</p>}
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
              >
                Save property
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm);
                  setFormErrors({});
                  setError(null);
                  setSuccess(null);
                }}
                className="flex-1 rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Reset
              </button>
            </div>
          </form>
        </aside>
      </div>
    </section>
  );
};

export default Dashboard;
