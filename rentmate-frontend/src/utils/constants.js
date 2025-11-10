export const UserRole = {
  Tenant: 'tenant',
  Landlord: 'landlord',
  Manager: 'manager',
  Admin: 'admin',
};

export const PropertyStatus = {
  Available: 'available',
  Rented: 'rented',
  Pending: 'pending',
};

export const statusLabels = {
  [PropertyStatus.Available]: 'Available',
  [PropertyStatus.Rented]: 'Rented',
  [PropertyStatus.Pending]: 'Pending Approval',
};

export const NotificationType = {
  Transaction: 'transaction',
  Contract: 'contract',
  Reminder: 'reminder',
  System: 'system',
};

export const notificationTypeMeta = {
  [NotificationType.Transaction]: {
    label: 'Transaction',
    badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
    icon: '💰',
  },
  [NotificationType.Contract]: {
    label: 'Contract',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: '📄',
  },
  [NotificationType.Reminder]: {
    label: 'Reminder',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: '⏰',
  },
  [NotificationType.System]: {
    label: 'System',
    badgeClass: 'border-gray-200 bg-gray-50 text-gray-700',
    icon: '🛰️',
  },
};
