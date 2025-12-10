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

<<<<<<< HEAD
export const statusLabels = {
  [PropertyStatus.Available]: 'Còn Trống',
  [PropertyStatus.Rented]: 'Đã Cho Thuê',
  [PropertyStatus.Pending]: 'Đang Chờ Duyệt',
};

export const BRAND_COLORS = {
  primary: '#0072BC',
  secondary: '#FFD400',
  dark: '#001F3F',
};

export const TOAST_MESSAGES = {
  LOGIN_SUCCESS: 'Đăng nhập thành công!',
  LOGIN_ERROR: 'Sai email hoặc mật khẩu',
  LOGOUT_SUCCESS: 'Đã đăng xuất',
  UNAUTHORIZED: 'Bạn cần đăng nhập để thực hiện thao tác này',
=======
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
>>>>>>> payment-feature
};
