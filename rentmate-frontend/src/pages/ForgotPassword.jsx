import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';

const ForgotPasswordPage = () => {
  const [params] = useSearchParams();
  const tokenFromUrl = params.get('token');
  const [step, setStep] = useState(tokenFromUrl ? 'reset' : 'request');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tokenFromUrl) {
      setStep('reset');
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
      setMessage('Đã gửi email đặt lại mật khẩu. Kiểm tra hộp thư của bạn.');
      setStep('reset');
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Không thể gửi yêu cầu. Thử lại sau.',
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
    try {
      await axiosClient.post('/auth/reset-password', {
        token: tokenFromUrl || form.token,
        password: form.password,
      });
      setMessage('Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.');
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Không thể đổi mật khẩu, thử lại sau.',
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
          Nhập email để nhận liên kết đặt lại hoặc dán token để đổi mật khẩu.
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
            {message && (
              <p className="text-sm text-emerald-600">{message}</p>
            )}
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
                  Token
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
            {message && (
              <p className="text-sm text-emerald-600">{message}</p>
            )}
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
