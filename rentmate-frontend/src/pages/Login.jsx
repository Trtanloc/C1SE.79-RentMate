import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/useI18n.js';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { data } = await axiosClient.post('/auth/login', form);
      const { user, token, expiresAt } = data.data;
      login(user, token, { remember: form.remember, expiresAt });
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to login';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFacebookLogin = async () => {
    const token = window.prompt('Nhập Facebook access token để đăng nhập nhanh:');
    if (!token) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const { data } = await axiosClient.post('/auth/login/facebook', {
        accessToken: token,
      });
      const { user, token: jwt, expiresAt } = data.data;
      login(user, jwt, { remember: true, expiresAt });
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Không thể đăng nhập bằng Facebook. Kiểm tra access token.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold text-gray-800">
        {t('login.heading', 'Welcome back')}
      </h1>
      <p className="mb-8 text-sm text-gray-500">
        {t('login.subheading', 'Enter your credentials to access your RentMate dashboard.')}
      </p>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
            {t('login.email', 'Email')}
          </label>
          <input
            id="email"
            name="email"
            type="text"
            placeholder="Email or admin123@gmail.com"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
            {t('login.password', 'Password')}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex items-center gap-2 text-gray-600">
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, remember: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40"
            />
            Ghi nhớ đăng nhập
          </label>
          <Link to="/forgot-password" className="text-primary hover:underline">
            Quên mật khẩu?
          </Link>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t('login.submit', 'Signing in...') : t('login.submit', 'Login')}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleFacebookLogin}
          className="w-full rounded-xl border border-blue-600 px-4 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Đăng nhập với Facebook
        </button>
        <p className="text-center text-xs text-gray-500">
          {t('login.noAccount', 'New to RentMate?')}{' '}
          <Link to="/register" className="font-medium text-primary">
            {t('login.create', 'Create an account')}
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
