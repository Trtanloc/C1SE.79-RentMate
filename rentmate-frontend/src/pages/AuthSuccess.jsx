import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/useI18n.js';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { t } = useI18n();
  const [status, setStatus] = useState('processing'); // processing | success | error
  const [message, setMessage] = useState(t('auth.processingMessage'));

  useEffect(() => {
    const token = searchParams.get('token');
    const expiresAt = searchParams.get('expiresAt') || undefined;
    const returnUrl = searchParams.get('returnUrl') || '/';

    if (!token) {
      setStatus('error');
      setMessage(t('auth.error.missingToken'));
      return;
    }

    const sync = async () => {
      try {
        sessionStorage.setItem('rentmate_token', token);
        const payload = JSON.parse(atob(token.split('.')[1] || ''));
        const userId = payload?.sub;
        if (!userId) {
          throw new Error(t('auth.error.invalidToken'));
        }
        const { data } = await axiosClient.get(`/users/${userId}`);
        login(data.data, token, { remember: true, expiresAt });
        setStatus('success');
        setMessage(t('auth.success.message'));
        setTimeout(() => navigate(returnUrl, { replace: true }), 800);
      } catch (error) {
        sessionStorage.removeItem('rentmate_token');
        localStorage.removeItem('rentmate_token');
        sessionStorage.removeItem('rentmate_user');
        localStorage.removeItem('rentmate_user');
        const fallback =
          error?.response?.data?.message || error?.message || t('auth.error.generic');
        setStatus('error');
        setMessage(Array.isArray(fallback) ? fallback.join(', ') : fallback);
      }
    };

    sync();
  }, [login, navigate, searchParams, t]);

  const isError = status === 'error';
  const isSuccess = status === 'success';

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-8 shadow-xl">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {isSuccess ? '✓' : isError ? '!' : '…'}
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-gray-800">
          {isSuccess
            ? t('auth.title.success')
            : isError
              ? t('auth.title.error')
              : t('auth.title.processing')}
        </h1>
        <p className="text-sm text-gray-600">{message}</p>
        {isError && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              {t('auth.action.backLogin')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              {t('auth.action.home')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthSuccess;
