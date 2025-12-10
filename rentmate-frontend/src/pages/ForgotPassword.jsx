import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';

const ForgotPasswordPage = () => {
  const [params] = useSearchParams();
  const tokenFromUrl = params.get('token') || '';

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
      setMessage(
        'If an account exists for that email, a reset link has been sent.',
      );
      setStep('reset');
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Unable to send reset link right now. Please try again.',
      );
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
      setError('Reset token is required.');
      setLoading(false);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Password confirmation does not match.');
      setLoading(false);
      return;
    }
    try {
      await axiosClient.post('/auth/reset-password', {
        token,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setMessage('Password updated successfully. You can sign in again now.');
      setForm((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
        token: tokenFromUrl ? prev.token : '',
      }));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Unable to reset password right now. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-800">
          Quên mật khẩu
        </h1>
        <p className="text-sm text-gray-500">
          Nhập email để nhận link đặt lại mật khẩu hoặc dán token nếu bạn đã có.
        </p>

        {step === 'request' && (
          <form onSubmit={handleRequest} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
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
              {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleReset} className="mt-4 space-y-4">
            {!tokenFromUrl && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Token đặt lại
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
                Mật khẩu mới
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
                Xác nhận mật khẩu mới
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
              {loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default ForgotPasswordPage;
