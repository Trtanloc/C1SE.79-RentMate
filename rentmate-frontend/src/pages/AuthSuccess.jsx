import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState('processing'); // processing | success | error
  const [message, setMessage] = useState('Đang xác thực tài khoản của bạn...');

  useEffect(() => {
    const token = searchParams.get('token');
    const expiresAt = searchParams.get('expiresAt') || undefined;
    const returnUrl = searchParams.get('returnUrl') || '/';

    if (!token) {
      setStatus('error');
      setMessage('Thiếu mã đăng nhập từ Facebook.');
      return;
    }

    const sync = async () => {
      try {
        // Temporarily set token so axios attaches the Authorization header
        sessionStorage.setItem('rentmate_token', token);
        const payload = JSON.parse(atob(token.split('.')[1] || ''));
        const userId = payload?.sub;
        if (!userId) {
          throw new Error('Token không hợp lệ, vui lòng thử lại.');
        }
        const { data } = await axiosClient.get(`/users/${userId}`);
        login(data.data, token, { remember: true, expiresAt });
        setStatus('success');
        setMessage('Đăng nhập thành công! Đang chuyển hướng...');
        setTimeout(() => navigate(returnUrl, { replace: true }), 800);
      } catch (error) {
        sessionStorage.removeItem('rentmate_token');
        localStorage.removeItem('rentmate_token');
        sessionStorage.removeItem('rentmate_user');
        localStorage.removeItem('rentmate_user');
        const fallback =
          error?.response?.data?.message ||
          error?.message ||
          'Không thể hoàn tất đăng nhập Facebook.';
        setStatus('error');
        setMessage(Array.isArray(fallback) ? fallback.join(', ') : fallback);
      }
    };

    sync();
  }, [login, navigate, searchParams]);

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
            ? 'Đăng nhập Facebook thành công'
            : isError
              ? 'Không thể đăng nhập'
              : 'Đang xử lý đăng nhập Facebook'}
        </h1>
        <p className="text-sm text-gray-600">{message}</p>
        {isError && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              Quay lại trang đăng nhập
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              Về trang chủ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthSuccess;
