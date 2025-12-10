import { useCallback, useEffect, useMemo, useState } from 'react';
import { BellRing, Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { notificationTypeMeta } from '../../utils/constants.js';
import { useI18n } from '../../i18n/useI18n.js';

const formatTimestamp = (value) => {
  if (!value) {
    return 'Just now';
  }
  const date = new Date(value);
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(date);
};

const NotificationSpotlight = () => {
  const { t } = useI18n();
  const { isAuthenticated, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canFetch = isAuthenticated && Boolean(user?.id);

  const fetchLatest = useCallback(async () => {
    if (!canFetch) {
      setItems([]);
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await axiosClient.get('/notifications', {
        params: { userId: user.id },
      });
      const list = Array.isArray(data.data) ? data.data : [];
      setItems(list.slice(0, 3));
    } catch (err) {
      const message = err?.response?.data?.message || 'Unable to load notifications.';
      setItems([]);
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  }, [canFetch, user?.id]);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  const content = useMemo(() => {
    if (!canFetch) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/90 p-6 text-sm text-gray-600">
          <p className="text-base font-semibold text-brand">
            {t('notification.signin.title', 'Sign in to see your feed')}
          </p>
          <p className="mt-2">
            {t(
              'notification.signin.body',
              'Payment reminders, contracts, and tasks will appear here as soon as you log in.',
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-primary hover:text-primary"
            >
              {t('notification.signin.login', 'Sign in')}
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-soft-glow transition hover:opacity-90"
            >
              {t('notification.signin.register', 'Create account')}
            </Link>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`notification-skeleton-${index}`}
              className="h-20 animate-pulse rounded-2xl bg-gray-100"
            />
          ))}
        </div>
      );
    }

    if (!items.length) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/90 p-6 text-center text-sm text-gray-500">
          {t('notification.empty', 'You are up to date. We will ping you as soon as something changes.')}
        </div>
      );
    }

    return (
      <ul className="space-y-3">
        {items.map((notification) => {
          const meta = notificationTypeMeta[notification.type];
          const badgeClass = meta?.badgeClass ?? 'border-gray-200 text-gray-600';
          const Icon = meta?.Icon ?? BellRing;
          const label = meta?.label ?? 'Update';

          return (
            <li
              key={notification.id}
              className="rounded-2xl border border-gray-100 bg-white/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClass}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </span>
            {!notification.isRead && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {t('notifications.unread', 'Unread')}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {formatTimestamp(notification.createdAt)}
            </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-brand">
                {notification.title}
              </p>
              <p className="text-sm text-gray-600">{notification.message}</p>
            </li>
          );
        })}
      </ul>
    );
  }, [canFetch, items, loading]);

  return (
    <section className="mt-12 space-y-5 rounded-3xl border border-gray-100 bg-white/95 p-6 shadow-floating-card">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
          {t('notification.hub.title', 'Notification hub')}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <h2 className="text-3xl font-semibold text-brand">
            {t('notification.hub.subtitle', 'Fresh updates')}
          </h2>
          {canFetch && !loading && (
            <span className="text-xs text-gray-400">
              Auto-refresh every 15s
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">
          Track payments, contracts, and tasks directly on the homepage.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {content}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Link
          to="/notifications"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft-glow transition hover:opacity-90"
        >
          {t('notification.viewAll', 'View all notifications')}
          <BellRing className="h-4 w-4" />
        </Link>
        {canFetch && (
          <button
            type="button"
            onClick={fetchLatest}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-primary hover:text-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('notification.refresh', 'Loading')}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                {t('notification.refresh', 'Refresh')}
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
};

export default NotificationSpotlight;
