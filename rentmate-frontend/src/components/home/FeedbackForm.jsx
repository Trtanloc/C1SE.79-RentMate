import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createReview } from '../../api/reviewsApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { UserRole } from '../../utils/constants.js';
import { useI18n } from '../../i18n/useI18n.js';

const FeedbackForm = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({
    rating: 5,
    content: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const canSubmit =
    isAuthenticated &&
    (user?.role === UserRole.Tenant || user?.role === UserRole.Landlord);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) {
      navigate('/login', { state: { from: { pathname: '/' } } });
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await createReview({
        rating: Number(form.rating),
        content: form.content,
        reviewerRole: user.role,
        reviewerName: user.fullName,
      });
      setMessage(
        t(
          'feedback.sent',
          'Thanks for sharing! Your testimonial is pending admin approval.',
        ),
      );
      setForm({ rating: 5, content: '' });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        'Unable to submit feedback right now.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-10 rounded-3xl border border-gray-100 bg-white/95 p-6 shadow-floating-card">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gray-400">
            {t('feedback.title', 'Share your RentMate story')}
          </p>
          <h3 className="text-2xl font-semibold text-brand">
            {t('feedback.subtitle', 'Tenants and landlords can add testimonials')}
          </h3>
          <p className="text-sm text-gray-500">
            {t(
              'feedback.desc',
              'Your note appears on the homepage once an admin approves it.',
            )}
          </p>
        </div>
        {!canSubmit && (
          <button
            type="button"
            onClick={() =>
              navigate('/login', { state: { from: { pathname: '/' } } })
            }
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            {t('feedback.login', 'Login to contribute')}
          </button>
        )}
      </div>

      {canSubmit && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              {t('feedback.rating', 'Rating')}
              <select
                value={form.rating}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    rating: Number(event.target.value),
                  }))
                }
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              >
                {[5, 4, 3, 2, 1].map((score) => (
                  <option key={score} value={score}>
                    {score}
                  </option>
                ))}
              </select>
            </label>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {user.role}
            </span>
          </div>
          <textarea
            value={form.content}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, content: event.target.value }))
            }
            rows={3}
            placeholder={t(
              'feedback.placeholder',
              'Share your experience using RentMate as a tenant or landlord...',
            )}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            required
          />
          {error && (
            <p className="text-sm text-danger">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-emerald-600">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-gradient-to-r from-primary to-[#001F3F] px-5 py-2.5 text-sm font-semibold text-white shadow-soft-glow transition hover:opacity-90 disabled:opacity-60"
          >
            {saving
              ? t('feedback.saving', 'Sending...')
              : t('feedback.submit', 'Submit feedback')}
          </button>
        </form>
      )}
    </section>
  );
};

export default FeedbackForm;
