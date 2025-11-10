import { useCallback, useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient.js';
import NotificationList from '../components/NotificationList.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  NotificationType,
  notificationTypeMeta,
} from '../utils/constants.js';

const POLLING_INTERVAL = 15000;

const typeOptions = [
  { label: 'All', value: 'all', icon: '🔔' },
  ...Object.values(NotificationType).map((value) => ({
    label: notificationTypeMeta[value]?.label ?? value,
    value,
    icon: notificationTypeMeta[value]?.icon,
  })),
];

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);

  const emitNavbarRefresh = useCallback(() => {
    window.dispatchEvent(new Event('rentmate:notifications-updated'));
  }, []);

  const fetchNotifications = useCallback(
    async (withLoader = false) => {
      if (!user?.id) {
        return;
      }
      if (withLoader) {
        setLoading(true);
      }
      setError(null);
      try {
        const { data } = await axiosClient.get('/notifications', {
          params: { userId: user.id },
        });
        const list = Array.isArray(data.data) ? data.data : [];
        setNotifications(list);
        setLastSynced(new Date());
        emitNavbarRefresh();
      } catch (err) {
        const message =
          err.response?.data?.message || 'Unable to load notifications';
        setError(Array.isArray(message) ? message.join(', ') : message);
      } finally {
        if (withLoader) {
          setLoading(false);
        }
      }
    },
    [user?.id, emitNavbarRefresh],
  );

  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    fetchNotifications(true);
    const intervalId = setInterval(
      () => fetchNotifications(false),
      POLLING_INTERVAL,
    );
    return () => {
      clearInterval(intervalId);
    };
  }, [user?.id, fetchNotifications]);

  const handleMarkRead = async (notificationId) => {
    setError(null);
    try {
      await axiosClient.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
      emitNavbarRefresh();
    } catch (err) {
      const message =
        err.response?.data?.message || 'Unable to mark notification as read';
      setError(Array.isArray(message) ? message.join(', ') : message);
    }
  };

  const handleDelete = async (notificationId) => {
    setError(null);
    try {
      await axiosClient.delete(`/notifications/${notificationId}`);
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId),
      );
      emitNavbarRefresh();
    } catch (err) {
      const message =
        err.response?.data?.message || 'Unable to delete notification';
      setError(Array.isArray(message) ? message.join(', ') : message);
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (typeFilter !== 'all' && notification.type !== typeFilter) {
        return false;
      }
      if (showUnreadOnly && notification.isRead) {
        return false;
      }
      return true;
    });
  }, [notifications, typeFilter, showUnreadOnly]);

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Notifications
          </h1>
          <p className="text-sm text-gray-500">
            Deposit, contract, and system updates arrive here automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchNotifications(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary hover:text-primary"
        >
          <span role="img" aria-hidden="true">
            🔄
          </span>
          Refresh
        </button>
      </div>

      <div className="mb-6 grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <div>
          <p className="text-sm text-gray-500">Unread</p>
          <p className="text-3xl font-semibold text-gray-900">{unreadCount}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-3xl font-semibold text-gray-900">
            {notifications.length}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Last synced</p>
          <p className="text-base font-medium text-gray-800">
            {lastSynced ? lastSynced.toLocaleTimeString() : '—'}
          </p>
          {loading && (
            <p className="text-xs text-primary">Syncing latest activity…</p>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTypeFilter(option.value)}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                typeFilter === option.value
                  ? 'bg-primary text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.icon && (
                <span aria-hidden="true" className="text-base">
                  {option.icon}
                </span>
              )}
              {option.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/50"
            checked={showUnreadOnly}
            onChange={(event) => setShowUnreadOnly(event.target.checked)}
          />
          Show unread only
        </label>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <NotificationList
        items={filteredNotifications}
        onMarkRead={handleMarkRead}
        onDelete={handleDelete}
      />
    </section>
  );
};

export default NotificationsPage;

