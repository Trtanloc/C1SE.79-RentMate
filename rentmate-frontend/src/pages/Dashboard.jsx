import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axiosClient from '../api/axiosClient.js';
import PropertyCard from '../components/PropertyCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useMetadata } from '../context/MetadataContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { PropertyStatus, UserRole } from '../utils/constants.js';
import { useI18n } from '../i18n/useI18n.js';
import { fallbackCities, getCityLabel } from '../utils/cities.js';
import { fetchProvinces, fetchDistricts, fetchWards } from '../api/locationApi.js';

const createEmptyForm = (defaults) => ({
  title: '',
  description: '',
  address: '',
  city: defaults.city || '',
  district: '',
  ward: '',
  country: defaults.country || '',
  mapEmbedUrl: '',
  virtualTourUrl: '',
  type: defaults.type || '',
  price: '',
  area: '',
  bedrooms: 2,
  bathrooms: 1,
  amenities: '',
  photos: '',
  status: defaults.status || PropertyStatus.Available,
});

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const { lang } = useLanguage();
  const {
    propertyTypes,
    propertyStatuses,
    propertyStatusMeta,
    cities,
    countries,
    defaultPropertyType,
    defaultPropertyStatus,
    loading: metadataLoading,
  } = useMetadata();

  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState(
    createEmptyForm({
      type: defaultPropertyType,
      status: defaultPropertyStatus,
      city: cities[0],
      country: countries[0] || 'Vietnam',
    }),
  );
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [photoFiles, setPhotoFiles] = useState([]);
  const photoInputRef = useRef(null);
  const [provinceOptions, setProvinceOptions] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [districtOptions, setDistrictOptions] = useState([]);
  const [wardOptions, setWardOptions] = useState([]);
  const [locationError, setLocationError] = useState(null);

  const statusOptions = useMemo(() => {
    if (propertyStatuses.length > 0) {
      return propertyStatuses;
    }
    return Object.entries(propertyStatusMeta).map(([value, meta]) => ({
      value,
      label: meta.label || value,
    }));
  }, [propertyStatuses, propertyStatusMeta]);

  const normalizeToken = (value = '') =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]/g, '');

  const allowedCityMap = useMemo(() => {
    const map = new Map();
    fallbackCities.forEach((city) => {
      map.set(normalizeToken(city), city);
    });
    return map;
  }, []);

  const ensureAllowedCity = useCallback(
    (value) => {
      const normalized = normalizeToken(value || '');
      return allowedCityMap.get(normalized) || allowedCityMap.values().next().value || '';
    },
    [allowedCityMap],
  );

  const mapProvinceNameToAllowedCity = useCallback(
    (provinceName) => {
      const normalized = normalizeToken(provinceName);
      // Strip common prefixes like "tinh" or "thanhpho"
      const stripped = normalized
        .replace(/^tinh/, '')
        .replace(/^thanhpho/, '')
        .replace(/^tp/, '');
      return allowedCityMap.get(normalized) || allowedCityMap.get(stripped) || provinceName;
    },
    [allowedCityMap],
  );

  const canManageProperties = useMemo(
    () => user.role === UserRole.Landlord || user.role === UserRole.Admin,
    [user.role],
  );

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLocationError(null);
        const provinces = await fetchProvinces();
        setProvinceOptions(provinces);
        if (!selectedProvinceCode && provinces.length) {
          setSelectedProvinceCode(provinces[0].code);
          setForm((prev) => ({
            ...prev,
            city: mapProvinceNameToAllowedCity(provinces[0].name),
            district: '',
            ward: '',
          }));
        }
      } catch (err) {
        const message =
          err?.response?.data?.message || 'Unable to load provinces.';
        setLocationError(Array.isArray(message) ? message.join(', ') : message);
      }
    };
    loadProvinces();
  }, []);

  useEffect(() => {
    setForm((prev) =>
      createEmptyForm({
        ...prev,
        type: prev.type || defaultPropertyType || '',
        status: prev.status || defaultPropertyStatus || PropertyStatus.Available,
        city: ensureAllowedCity(
          prev.city || mapProvinceNameToAllowedCity(provinceOptions[0]?.name || cities[0] || ''),
        ),
        country: prev.country || countries[0] || 'Vietnam',
      }),
    );
  }, [
    defaultPropertyStatus,
    defaultPropertyType,
    cities,
    countries,
    ensureAllowedCity,
    mapProvinceNameToAllowedCity,
    provinceOptions,
  ]);

  useEffect(() => {
    if (!canManageProperties) {
      return;
    }

    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint =
          user.role === UserRole.Landlord ? '/properties/me/owned' : '/properties';
        const { data } = await axiosClient.get(endpoint);
        const list = data.data || [];
        setProperties(list);
      } catch (err) {
        const message =
          err.response?.data?.message || 'Unable to load your property list.';
        setError(Array.isArray(message) ? message.join(', ') : message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [canManageProperties, user]);

  useEffect(() => {
    const province =
      provinceOptions.find((item) => item.code === selectedProvinceCode) ||
      provinceOptions.find(
        (item) => mapProvinceNameToAllowedCity(item.name) === form.city,
      );
    if (!province) {
      const fallbackDistricts = form.district
        ? [{ code: 'CUSTOM_DISTRICT', name: form.district }]
        : [];
      setDistrictOptions(fallbackDistricts);
      if (form.ward) {
        setWardOptions([{ code: 'CUSTOM_WARD', name: form.ward }]);
      } else {
        setWardOptions([]);
      }
      return;
    }
    let canceled = false;
    const loadDistricts = async () => {
      try {
        setLocationError(null);
        const districts = await fetchDistricts(province.code);
        if (canceled) return;
        setDistrictOptions(districts);
        setForm((prev) => {
          const hasCurrent = districts.some((d) => d.name === prev.district);
          if (hasCurrent) {
            return prev;
          }
          return {
            ...prev,
            district: districts[0]?.name || '',
            ward: '',
          };
        });
      } catch (err) {
        if (canceled) return;
        const message =
          err?.response?.data?.message || 'Unable to load districts.';
        setLocationError(Array.isArray(message) ? message.join(', ') : message);
        setDistrictOptions([]);
      }
    };
    loadDistricts();
    return () => {
      canceled = true;
    };
  }, [form.city, mapProvinceNameToAllowedCity, provinceOptions, selectedProvinceCode]);

  useEffect(() => {
    const district = districtOptions.find((item) => item.name === form.district);
    if (!district) {
      const fallback = form.ward ? [{ code: 'CUSTOM_WARD', name: form.ward }] : [];
      setWardOptions(fallback);
      if (!fallback.length) {
        setForm((prev) => ({ ...prev, ward: '' }));
      }
      return;
    }
    let canceled = false;
    const loadWards = async () => {
      try {
        setLocationError(null);
        const wards = await fetchWards(district.code);
        if (canceled) return;
        setWardOptions(wards);
        setForm((prev) => {
          const hasCurrent = wards.some((w) => w.name === prev.ward);
          if (hasCurrent) {
            return prev;
          }
          return { ...prev, ward: wards[0]?.name || '' };
        });
      } catch (err) {
        if (canceled) return;
        const message =
          err?.response?.data?.message || 'Unable to load wards.';
        setLocationError(Array.isArray(message) ? message.join(', ') : message);
        setWardOptions([]);
      }
    };
    loadWards();
    return () => {
      canceled = true;
    };
  }, [form.district, districtOptions]);

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

  const handlePhotoFilesChange = (event) => {
    const files = Array.from(event.target.files || []);
    setPhotoFiles(files);
    setFormErrors((prev) => {
      if (!prev.photos) {
        return prev;
      }
      const next = { ...prev };
      delete next.photos;
      return next;
    });
  };

  const startEdit = (property) => {
    const matchedProvince =
      provinceOptions.find(
        (item) => mapProvinceNameToAllowedCity(item.name) === property.city,
      ) || provinceOptions[0];
    if (matchedProvince) {
      setSelectedProvinceCode(matchedProvince.code);
    }
    setEditingId(property.id);
    setForm({
      title: property.title || '',
      description: property.description || '',
      address: property.address || '',
      city: ensureAllowedCity(
        property.city ||
          mapProvinceNameToAllowedCity(matchedProvince?.name) ||
          matchedProvince?.name ||
          '',
      ),
      district: property.district || '',
      ward: property.ward || '',
      country: property.country || '',
      mapEmbedUrl: property.mapEmbedUrl || '',
      virtualTourUrl: property.virtualTourUrl || '',
      type: property.type || defaultPropertyType || '',
      price: property.price || '',
      area: property.area || '',
      bedrooms: property.bedrooms || 1,
      bathrooms: property.bathrooms || 1,
      amenities: Array.isArray(property.amenities)
        ? property.amenities
            .map((a) => (typeof a === 'string' ? a : a.label))
            .filter(Boolean)
            .join(', ')
        : '',
      photos: Array.isArray(property.photos)
        ? property.photos
            .map((p) => (typeof p === 'string' ? p : p.url))
            .filter(Boolean)
            .join(', ')
        : '',
      status: property.status || defaultPropertyStatus || PropertyStatus.Available,
    });
    setPhotoFiles([]);
    setSuccess(null);
    setError(null);
  };

  const fieldClass = (field) =>
    `w-full rounded-xl border px-4 py-2 text-sm outline-none transition focus:ring-2 ${
      formErrors[field]
        ? 'border-danger focus:border-danger focus:ring-danger/30'
        : 'border-gray-200 focus:border-primary focus:ring-primary/30'
    }`;

  const validatePropertyForm = (values, selectedFiles) => {
    const nextErrors = {};
    if (!values.title.trim()) {
      nextErrors.title = 'Title is required';
    }
    if (!values.address.trim()) {
      nextErrors.address = 'Address is required';
    }
    if (!values.city.trim()) {
      nextErrors.city = 'City is required';
    }
    if (!values.district.trim()) {
      nextErrors.district = 'District is required';
    }
    if (!values.ward.trim()) {
      nextErrors.ward = 'Ward is required';
    }
    if (!values.country.trim()) {
      nextErrors.country = 'Country is required';
    }
    const priceValue = Number(values.price);
    if (values.price === '' || Number.isNaN(priceValue) || priceValue <= 0) {
      nextErrors.price = 'Enter a valid price greater than 0';
    }
    const areaValue = Number(values.area);
    if (values.area === '' || Number.isNaN(areaValue) || areaValue <= 0) {
      nextErrors.area = 'Enter a valid area greater than 0';
    }
    const bedroomValue = Number(values.bedrooms);
    if (Number.isNaN(bedroomValue) || bedroomValue < 0) {
      nextErrors.bedrooms = 'Enter a valid bedroom count';
    }
    const bathroomValue = Number(values.bathrooms);
    if (Number.isNaN(bathroomValue) || bathroomValue <= 0) {
      nextErrors.bathrooms = 'Enter a valid bathroom count';
    }
    if (!values.description.trim()) {
      nextErrors.description = 'Description is required';
    }
    const amenitiesList = values.amenities
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (amenitiesList.length > 12) {
      nextErrors.amenities = 'Limit amenities to 12 items max';
    }
    const photosList = values.photos
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const totalPhotos = photosList.length + (selectedFiles?.length || 0);
    if (totalPhotos === 0) {
      nextErrors.photos = 'Add at least one photo (upload or URL)';
    }
    if (totalPhotos > 12) {
      nextErrors.photos = 'Add at most 12 photos total';
    }
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const validationErrors = validatePropertyForm(form, photoFiles);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }
    setFormErrors({});
    const amenitiesList = form.amenities
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);
    const photoUrlList = (form.photos || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);

    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('address', form.address.trim());
      const cityValue = ensureAllowedCity(form.city.trim());
      formData.append('city', cityValue);
      formData.append('district', form.district.trim());
      if (form.ward) {
        formData.append('ward', form.ward.trim());
      }
      formData.append('country', form.country.trim());
      if (form.mapEmbedUrl) {
        formData.append('mapEmbedUrl', form.mapEmbedUrl.trim());
      }
      if (form.virtualTourUrl) {
        formData.append('virtualTourUrl', form.virtualTourUrl.trim());
      }
      formData.append('type', form.type || defaultPropertyType || '');
      formData.append('status', form.status || defaultPropertyStatus || PropertyStatus.Available);
      formData.append('price', String(Number(form.price)));
      formData.append('area', String(Number(form.area)));
      formData.append('bedrooms', String(Number(form.bedrooms)));
      formData.append('bathrooms', String(Number(form.bathrooms)));
      if (amenitiesList.length > 0) {
        amenitiesList.forEach((amenity) => formData.append('amenities', amenity));
      }
      if (photoUrlList.length > 0) {
        photoUrlList.forEach((url) => formData.append('photos', url));
      }
      const remainingSlots = Math.max(12 - photoUrlList.length, 0);
      photoFiles.slice(0, remainingSlots).forEach((file) => formData.append('photoFiles', file));

      const endpoint = editingId ? `/properties/${editingId}` : '/properties';
      const method = editingId ? 'put' : 'post';
      const { data } = await axiosClient[method](endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (editingId) {
        setProperties((prev) =>
          prev.map((item) => (item.id === editingId ? data.data : item)),
        );
      } else {
        setProperties((prev) => [data.data, ...prev]);
      }
      setForm(
        createEmptyForm({
          type: defaultPropertyType,
          status: defaultPropertyStatus,
          city: cities[0],
          country: countries[0] || 'Vietnam',
        }),
      );
      setEditingId(null);
      setPhotoFiles([]);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
      setSuccess('Property saved successfully');
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to save property';
      setError(Array.isArray(message) ? message.join(', ') : message);
    }
  };

  if (!canManageProperties) {
    return (
      <section className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
        <div className="rounded-3xl border border-primary/20 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            {t('dashboard.notApproved.title', 'Tenant view')}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-800">
            {t('dashboard.notApproved.title', 'You have not been approved as a landlord yet')}
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            {t(
              'dashboard.notApproved.body',
              'Keep browsing listings or submit a landlord application to publish your own rentals.',
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/apply-landlord"
              className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-soft-glow transition hover:bg-primary/90"
            >
              {t('dashboard.applyLandlord', 'Submit landlord application')}
            </Link>
            <Link
              to="/properties"
              className="rounded-2xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              {t('dashboard.browse', 'Browse listings')}
            </Link>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            {t('dashboard.why.title', 'Why become a landlord?')}
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-gray-600 list-disc pl-4">
            <li>{t('dashboard.why.item1', 'Manage listings, availability, and pricing in one place.')}</li>
            <li>{t('dashboard.why.item2', 'Create contracts and send invoices directly inside RentMate.')}</li>
            <li>{t('dashboard.why.item3', 'Reach vetted tenants with transparent verification.')}</li>
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">
            {t('dashboard.title', 'Property manager')}
          </h1>
          <p className="text-sm text-gray-500">
            {t('dashboard.subtitle', 'Create and manage your rental listings in one place.')}
          </p>
        </div>
        <div className="rounded-xl bg-white px-4 py-2 text-sm text-gray-600 shadow-sm">
          {t('nav.signedInAs', 'Signed in as')}{' '}
          <span className="font-semibold text-gray-800">{user.fullName}</span> | {user.role}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {t('dashboard.yourListings', 'Your listings')}
          </h2>
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500">
              Loading properties...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-danger">
              {error}
            </div>
          ) : properties.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500">
              {t('showcase.empty', 'No properties match the current filters.')}
            </div>
          ) : (
            <div className="grid gap-4">
              {properties.map((property) => (
                <div key={property.id} className="relative">
                  <PropertyCard property={property} />
                  <div className="absolute right-3 top-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(property)}
                      className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700 shadow hover:bg-white"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-xl font-semibold text-gray-800">
            {t('dashboard.addNew', 'Add new property')}
          </h2>
          {metadataLoading && (
            <p className="text-xs text-gray-400">{t('property.list.loading', 'Loading...')}</p>
          )}
          {locationError && (
            <p className="text-xs text-danger">{locationError}</p>
          )}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.form.title', 'Title')}
              </label>
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Modern riverside apartment"
                required
                className={fieldClass('title')}
              />
              {formErrors.title && <p className="mt-1 text-xs text-danger">{formErrors.title}</p>}
            </div>
            <div>
              <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.form.address', 'Address')}
              </label>
              <input
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="123 Nguyen Hue, District 1"
                required
                className={fieldClass('address')}
              />
              {formErrors.address && (
                <p className="mt-1 text-xs text-danger">{formErrors.address}</p>
              )}
            </div>
            <div>
              <label htmlFor="city" className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.form.city', 'Province / City')}
              </label>
              <select
                id="city"
                name="city"
                value={selectedProvinceCode}
                onChange={(event) => {
                  const code = event.target.value;
                  setSelectedProvinceCode(code);
                  const province = provinceOptions.find((p) => p.code === code);
                  const mappedCity = province ? mapProvinceNameToAllowedCity(province.name) : '';
                  setForm((prev) => ({
                    ...prev,
                    city: mappedCity,
                    district: '',
                    ward: '',
                  }));
                }}
                className={fieldClass('city')}
              >
                <option value="">{t('search.allCities', 'All cities')}</option>
                {provinceOptions.map((province) => (
                  <option key={province.code} value={province.code}>
                    {getCityLabel(province.name, lang)}
                  </option>
                ))}
              </select>
              {formErrors.city && <p className="mt-1 text-xs text-danger">{formErrors.city}</p>}
            </div>
            <div>
              <label htmlFor="district" className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.form.district', 'District')}
              </label>
              <select
                id="district"
                name="district"
                value={form.district}
                onChange={handleChange}
                className={fieldClass('district')}
              >
                <option value="">{t('dashboard.form.district', 'District')}</option>
                {districtOptions.map((district) => (
                  <option key={district.code} value={district.name}>
                    {district.name}
                  </option>
                ))}
              </select>
              {formErrors.district && (
                <p className="mt-1 text-xs text-danger">{formErrors.district}</p>
              )}
            </div>
            <div>
              <label htmlFor="ward" className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.form.ward', 'Ward')}
              </label>
              <select
                id="ward"
                name="ward"
                value={form.ward}
                onChange={handleChange}
                className={fieldClass('ward')}
              >
                <option value="">{t('dashboard.form.ward', 'Ward')}</option>
                {wardOptions.map((ward) => (
                  <option key={ward.code} value={ward.name}>
                    {ward.name}
                  </option>
                ))}
              </select>
              {formErrors.ward && <p className="mt-1 text-xs text-danger">{formErrors.ward}</p>}
            </div>
            <div>
              <label htmlFor="country" className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.form.country', 'Country')}
              </label>
              <input
                id="country"
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="Vietnam"
                className={fieldClass('country')}
              />
              {formErrors.country && (
                <p className="mt-1 text-xs text-danger">{formErrors.country}</p>
              )}
            </div>
            <div>
              <label htmlFor="mapEmbedUrl" className="mb-1 block text-sm font-medium text-gray-700">
                Map / Embed URL (tùy chọn)
              </label>
              <input
                id="mapEmbedUrl"
                name="mapEmbedUrl"
                value={form.mapEmbedUrl}
                onChange={handleChange}
                placeholder="https://maps.google.com/..."
                className={fieldClass('mapEmbedUrl')}
              />
            </div>
            <div>
              <label htmlFor="virtualTourUrl" className="mb-1 block text-sm font-medium text-gray-700">
                Tour 360 URL (tùy chọn)
              </label>
              <input
                id="virtualTourUrl"
                name="virtualTourUrl"
                value={form.virtualTourUrl}
                onChange={handleChange}
                placeholder="https://your-tour-link"
                className={fieldClass('virtualTourUrl')}
              />
            </div>
            <div>
              <label htmlFor="price" className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.form.price', 'Monthly rent (VND)')}
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="15000000"
                required
                className={fieldClass('price')}
              />
              {formErrors.price && <p className="mt-1 text-xs text-danger">{formErrors.price}</p>}
            </div>
            <div>
              <label htmlFor="area" className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.form.area', 'Area (m2)')}
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
              <label htmlFor="bedrooms" className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.form.bedrooms', 'Bedrooms')}
              </label>
              <input
                id="bedrooms"
                name="bedrooms"
                type="number"
                min="0"
                value={form.bedrooms}
                onChange={handleChange}
                className={fieldClass('bedrooms')}
              />
              {formErrors.bedrooms && (
                <p className="mt-1 text-xs text-danger">{formErrors.bedrooms}</p>
              )}
            </div>
            <div>
              <label htmlFor="bathrooms" className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.form.bathrooms', 'Bathrooms')}
              </label>
              <input
                id="bathrooms"
                name="bathrooms"
                type="number"
                min="1"
                value={form.bathrooms}
                onChange={handleChange}
                className={fieldClass('bathrooms')}
              />
              {formErrors.bathrooms && (
                <p className="mt-1 text-xs text-danger">{formErrors.bathrooms}</p>
              )}
            </div>
            <div>
              <label htmlFor="type" className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.form.type', 'Property type')}
              </label>
              <select
                id="type"
                name="type"
                value={form.type}
                onChange={handleChange}
                className={fieldClass('type')}
              >
                <option value="">{t('search.anyType', 'Any type')}</option>
                {propertyTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.form.status', 'Status')}
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className={fieldClass('status')}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.form.description', 'Description')}
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Call out what makes this property special..."
                rows={4}
                className={fieldClass('description')}
              />
              {formErrors.description && (
                <p className="mt-1 text-xs text-danger">{formErrors.description}</p>
              )}
            </div>
            <div>
              <label htmlFor="amenities" className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.form.amenities', 'Amenities (comma separated)')}
              </label>
              <textarea
                id="amenities"
                name="amenities"
                value={form.amenities}
                onChange={handleChange}
                placeholder="Pool, Gym, 24/7 security"
                rows={2}
                className={fieldClass('amenities')}
              />
            </div>
            <div>
              <label htmlFor="photoFiles" className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.form.upload', 'Upload photos')}
              </label>
              <input
                id="photoFiles"
                ref={photoInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoFilesChange}
                className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
              {photoFiles.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-gray-500">
                  {photoFiles.map((file) => (
                    <li key={file.name}>{file.name}</li>
                  ))}
                </ul>
              )}
              {formErrors.photos && (
                <p className="mt-1 text-xs text-danger">{formErrors.photos}</p>
              )}
            </div>
            <div>
              <label htmlFor="photos" className="mb-1 block text-sm font-medium text-gray-700">
                {t('dashboard.form.photoUrls', 'Photo URLs (optional, comma separated)')}
              </label>
              <textarea
                id="photos"
                name="photos"
                value={form.photos}
                onChange={handleChange}
                placeholder="https://example.com/photo-1.jpg, https://example.com/photo-2.jpg"
                rows={2}
                className={fieldClass('photos')}
              />
            </div>
            {success && <p className="text-sm text-success">{success}</p>}
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
              >
                {editingId
                  ? 'Update property'
                  : t('dashboard.form.save', 'Save property')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(
                    createEmptyForm({
                      type: defaultPropertyType,
                      status: defaultPropertyStatus,
                      city: cities[0],
                      country: countries[0] || 'Vietnam',
                    }),
                  );
                  setEditingId(null);
                  setFormErrors({});
                  setError(null);
                  setSuccess(null);
                  setPhotoFiles([]);
                  if (photoInputRef.current) {
                    photoInputRef.current.value = '';
                  }
                }}
                className="flex-1 rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                {t('dashboard.form.reset', 'Reset form')}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </section>
  );
};

export default Dashboard;
