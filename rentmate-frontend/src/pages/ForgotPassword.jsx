import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { useI18n } from '../i18n/useI18n.js';

const ForgotPasswordPage = () => {
  const [params] = useSearchParams();
  const tokenFromUrl = params.get('token') || '';
  const { t } = useI18n();

  const [step, setStep] = useState(tokenFromUrl ? 'reset' : 'request');
  const [form, setForm] = useState({
    email: '',
    token: tokenFromUrl,
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tokenFromUrl) {
      setStep('reset');
      setForm((prev) => ({ ...prev, token: tokenFromUrl }));
    }
  }, [tokenFromUrl]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setMessage(null);
  };

  const handleRequest = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await axiosClient.post('/auth/forgot-password', { email: form.email });
      setMessage(t('forgot.request.success'));
      setStep('reset');
    } catch (err) {
      setError(err?.response?.data?.message || t('forgot.request.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const token = tokenFromUrl || form.token;
    if (!token) {
      setError(t('forgot.error.token'));
      setLoading(false);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t('forgot.error.mismatch'));
      setLoading(false);
      return;
    }
    try {
      await axiosClient.post('/auth/reset-password', {
        token,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setMessage(t('forgot.reset.success'));
      setForm((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
      setStep('request');
    } catch (err) {
      setError(err?.response?.data?.message || t('forgot.reset.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-lg px-4 py-10">
      <div className="rounded-3xl bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-semibold text-gray-800">{t('forgot.heading')}</h1>
        <p className="mt-2 text-sm text-gray-500">{t('forgot.description')}</p>

        {step === 'request' && (
          <form onSubmit={handleRequest} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('forgot.email')}
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>
            {message && <p className="text-sm text-emerald-600">{message}</p>}
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? t('forgot.request.loading') : t('forgot.request.submit')}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleReset} className="mt-4 space-y-4">
            {!tokenFromUrl && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('forgot.token')}
                </label>
                <input
                  name="token"
                  value={form.token || ''}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('forgot.newPassword')}
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('forgot.confirmPassword')}
              </label>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>
            {message && <p className="text-sm text-emerald-600">{message}</p>}
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? t('forgot.reset.loading') : t('forgot.reset.submit')}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default ForgotPasswordPage;
