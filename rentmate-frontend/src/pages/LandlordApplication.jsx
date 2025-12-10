import { useCallback, useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LandlordApplicationStatus,
  landlordApplicationStatusMeta as landlordStatusFallback,
} from '../utils/constants.js';
import { useMetadata } from '../context/MetadataContext.jsx';
import { useI18n } from '../i18n/useI18n.js';

const defaultForm = {
  companyName: '',
  portfolioUrl: '',
  experienceYears: 0,
  propertyCount: 1,
  motivation: '',
};

const LandlordApplicationPage = () => {
  const { user, refreshUser } = useAuth();
  const { landlordApplicationStatuses, landlordStatusMeta } = useMetadata();
  const { t } = useI18n();
  const statusMeta = landlordStatusMeta || landlordStatusFallback;
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const canSubmit = useMemo(() => {
    if (user.role === 'landlord') {
      return false;
    }
    if (!application) {
      return true;
    }
    return application.status === LandlordApplicationStatus.Rejected;
  }, [application, user.role]);

  const fetchApplication = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await axiosClient.get('/landlord-applications/me');
      setApplication(data.data);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        t('landlord.status.error', 'Unable to load your landlord application.');
      setLoadError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const validate = (values) => {
    const nextErrors = {};
    if (!values.companyName.trim()) {
      nextErrors.companyName = t('landlord.validation.company', 'Business name is required');
    }
    if (
      Number.isNaN(Number(values.experienceYears)) ||
      values.experienceYears < 0 ||
      values.experienceYears > 50
    ) {
      nextErrors.experienceYears = t(
        'landlord.validation.experience',
        'Experience must be between 0 and 50 years',
      );
    }
    if (
      Number.isNaN(Number(values.propertyCount)) ||
      values.propertyCount < 1 ||
      values.propertyCount > 200
    ) {
      nextErrors.propertyCount = t(
        'landlord.validation.count',
        'Portfolio size must be between 1 and 200 properties',
      );
    }
    if (!values.motivation.trim() || values.motivation.trim().length < 20) {
      nextErrors.motivation = t(
        'landlord.validation.goal',
        'Describe your portfolio and goals (at least 20 characters).',
      );
    }
    if (
      values.portfolioUrl &&
      !/^https?:\/\/\S+$/i.test(values.portfolioUrl.trim())
    ) {
      nextErrors.portfolioUrl = t(
        'landlord.validation.portfolio',
        'Portfolio URL must be valid',
      );
    }
    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) {
        return prev;
      }
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsSubmitting(true);
    try {
      const { data } = await axiosClient.post('/landlord-applications', {
        ...form,
        experienceYears: Number(form.experienceYears),
        propertyCount: Number(form.propertyCount),
      });
      setApplication(data.data);
      setSubmitSuccess(
        t('landlord.submit.success', 'Application submitted. Our team will review it soon.'),
      );
      setErrors({});
      setForm(defaultForm);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        t('landlord.submit.error', 'Unable to submit right now.');
      setSubmitError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusCard = () => {
    if (user.role === 'landlord') {
      return (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800">
          <p className="font-semibold">
            {t('landlord.status.approved', 'You already have landlord access.')}
          </p>
          <p>{t('landlord.status.approvedHint', 'Open the dashboard to create and manage listings.')}</p>
        </div>
      );
    }
    if (loading) {
      return (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          {t('landlord.status.loading', 'Loading your application status...')}
        </div>
      );
    }
    if (loadError) {
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
          {loadError}
        </div>
      );
    }
    if (!application) {
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800">
          <p className="font-semibold">
            {t('landlord.status.none', 'You have not submitted an application yet.')}
          </p>
          <p>
            {t('landlord.status.noneHint', 'Complete the form below to request landlord access.')}
          </p>
        </div>
      );
    }
    const meta =
      statusMeta[application.status] ||
      statusMeta[LandlordApplicationStatus.Pending];

    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Current status</p>
            <p className="text-lg font-semibold text-gray-800">
              {meta.label}
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}
          >
            {application.status}
          </span>
        </div>
        {application.adminNotes && (
          <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
            {application.adminNotes}
          </p>
        )}
        {application.status === LandlordApplicationStatus.Rejected && (
          <button
            type="button"
            onClick={() => setForm(defaultForm)}
            className="mt-4 rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"
          >
            {t('landlord.actions.update', 'Update details and reapply')}
          </button>
        )}
        <button
          type="button"
          onClick={refreshUser}
          className="mt-4 text-xs font-semibold text-primary underline"
        >
          {t('landlord.actions.refresh', 'Refresh account status')}
        </button>
      </div>
    );
  };

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          {t('landlord.title', 'Become a landlord')}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-800">
          {t('landlord.subtitle', 'Landlord application')}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {t(
            'landlord.lead',
            'Tell us about your portfolio so we can enable the landlord dashboard.',
          )}
        </p>
      </div>

      {statusCard()}

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="companyName" className="text-sm font-medium text-gray-700">
              {t('landlord.form.company', 'Business or personal brand')}
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              placeholder="e.g., GreenHome Rentals"
              value={form.companyName}
              onChange={handleChange}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                errors.companyName
                  ? 'border-danger focus:border-danger focus:ring-danger/30'
                  : 'border-gray-200 focus:border-primary focus:ring-primary/30'
              }`}
              disabled={!canSubmit}
            />
            {errors.companyName && (
              <p className="text-xs text-danger">{errors.companyName}</p>
            )}
          </div>
          <div className="grid gap-2">
            <label htmlFor="portfolioUrl" className="text-sm font-medium text-gray-700">
              {t('landlord.form.portfolio', 'Portfolio link (optional)')}
            </label>
            <input
              id="portfolioUrl"
              name="portfolioUrl"
              type="url"
              placeholder="https://"
              value={form.portfolioUrl}
              onChange={handleChange}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                errors.portfolioUrl
                  ? 'border-danger focus:border-danger focus:ring-danger/30'
                  : 'border-gray-200 focus:border-primary focus:ring-primary/30'
              }`}
              disabled={!canSubmit}
            />
            {errors.portfolioUrl && (
              <p className="text-xs text-danger">{errors.portfolioUrl}</p>
            )}
          </div>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <label
              htmlFor="experienceYears"
              className="text-sm font-medium text-gray-700"
            >
              {t('landlord.form.experience', 'Years of rental experience')}
            </label>
            <input
              id="experienceYears"
              name="experienceYears"
              type="number"
              min={0}
              max={50}
              value={form.experienceYears}
              onChange={handleChange}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                errors.experienceYears
                  ? 'border-danger focus:border-danger focus:ring-danger/30'
                  : 'border-gray-200 focus:border-primary focus:ring-primary/30'
              }`}
              disabled={!canSubmit}
            />
            {errors.experienceYears && (
              <p className="text-xs text-danger">{errors.experienceYears}</p>
            )}
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="propertyCount"
              className="text-sm font-medium text-gray-700"
            >
              {t('landlord.form.count', 'Properties you plan to list')}
            </label>
            <input
              id="propertyCount"
              name="propertyCount"
              type="number"
              min={1}
              max={200}
              value={form.propertyCount}
              onChange={handleChange}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                errors.propertyCount
                  ? 'border-danger focus:border-danger focus:ring-danger/30'
                  : 'border-gray-200 focus:border-primary focus:ring-primary/30'
              }`}
              disabled={!canSubmit}
            />
            {errors.propertyCount && (
              <p className="text-xs text-danger">{errors.propertyCount}</p>
            )}
          </div>
        </div>
        <div className="mt-5 grid gap-2">
          <label htmlFor="motivation" className="text-sm font-medium text-gray-700">
            {t('landlord.form.goal', 'Your goals')}
          </label>
          <textarea
            id="motivation"
            name="motivation"
            rows={4}
            placeholder="Describe your experience, target tenants, and what you expect from RentMate..."
            value={form.motivation}
            onChange={handleChange}
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
              errors.motivation
                ? 'border-danger focus:border-danger focus:ring-danger/30'
                : 'border-gray-200 focus:border-primary focus:ring-primary/30'
            }`}
            disabled={!canSubmit}
          />
          {errors.motivation && (
            <p className="text-xs text-danger">{errors.motivation}</p>
          )}
        </div>
        {submitError && <p className="mt-3 text-sm text-danger">{submitError}</p>}
        {submitSuccess && <p className="mt-3 text-sm text-success">{submitSuccess}</p>}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? t('landlord.submit.loading', 'Submitting...')
              : t('landlord.form.submit', 'Submit application')}
          </button>
          <button
            type="button"
            onClick={refreshUser}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
          >
            {t('landlord.actions.refresh', 'Refresh profile')}
          </button>
        </div>
      </form>
    </section>
  );
};

export default LandlordApplicationPage;
