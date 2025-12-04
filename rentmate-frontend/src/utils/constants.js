import { BellRing, MessageSquare, ReceiptText, ScrollText } from 'lucide-react';

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

export const fallbackPropertyStatusMeta = {
  [PropertyStatus.Available]: {
    label: 'Available',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  [PropertyStatus.Rented]: {
    label: 'Rented',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  [PropertyStatus.Pending]: {
    label: 'Pending Review',
    badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
  },
};

export const NotificationType = {
  Transaction: 'transaction',
  Contract: 'contract',
  Reminder: 'reminder',
  System: 'system',
};

export const notificationTypeMeta = {
  [NotificationType.Transaction]: {
    label: 'Payment',
    badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
    Icon: ReceiptText,
  },
  [NotificationType.Contract]: {
    label: 'Contract',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    Icon: ScrollText,
  },
  [NotificationType.Reminder]: {
    label: 'Reminder',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Icon: BellRing,
  },
  [NotificationType.System]: {
    label: 'System',
    badgeClass: 'border-gray-200 bg-gray-50 text-gray-700',
    Icon: MessageSquare,
  },
};

export const LandlordApplicationStatus = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
};

export const landlordApplicationStatusMeta = {
  [LandlordApplicationStatus.Pending]: {
    label: 'Pending review',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  [LandlordApplicationStatus.Approved]: {
    label: 'Approved',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  [LandlordApplicationStatus.Rejected]: {
    label: 'Rejected',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
  },
};
