import { BellRing } from 'lucide-react';
import { useMetadata } from '../context/MetadataContext.jsx';
import { notificationTypeMeta as notificationMetaFallback } from '../utils/constants.js';

const defaultMeta = {
  label: 'Update',
  badgeClass: 'border-gray-200 bg-gray-50 text-gray-700',
  Icon: BellRing,
};

export const NotificationItem = ({ notification, onMarkRead, onDelete }) => {
  const { notificationTypeMeta } = useMetadata();
  const meta = notificationTypeMeta[notification.type] ?? notificationMetaFallback[notification.type] ?? defaultMeta;
  const Icon = meta.Icon ?? BellRing;

  const formattedDate = notification.createdAt
    ? new Date(notification.createdAt).toLocaleString('vi-VN')
    : '';

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${meta.badgeClass}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </span>
          {!notification.isRead && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              Unread
            </span>
          )}
        </div>
        <h3 className="mt-2 text-lg font-semibold text-gray-900">
          {notification.title}
        </h3>
        <p className="text-sm text-gray-600">{notification.message}</p>
        <p className="mt-3 text-xs text-gray-400">{formattedDate}</p>
      </div>
      <div className="flex flex-nowrap gap-2">
        {!notification.isRead && (
          <button
            type="button"
            onClick={() => onMarkRead?.(notification.id)}
            className="rounded-xl border border-primary/40 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
          >
            Mark as read
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete?.(notification.id)}
          className="rounded-xl border border-danger/40 px-4 py-2 text-xs font-semibold text-danger transition hover:bg-danger/10"
        >
          Delete
        </button>
      </div>
    </li>
  );
};

const NotificationList = ({ items, onMarkRead, onDelete }) => {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
        <p className="text-base font-medium text-gray-700">
          You are all caught up
        </p>
        <p className="text-sm text-gray-500">
          Payment, contract, and system updates will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkRead={onMarkRead}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
};

export default NotificationList;
