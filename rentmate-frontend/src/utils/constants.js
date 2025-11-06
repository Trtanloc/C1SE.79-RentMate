//  User roles
export const UserRole = {
  Tenant: 'tenant',
  Landlord: 'landlord',
  Manager: 'manager',
  Admin: 'admin',
};

//  Property status
export const PropertyStatus = {
  Available: 'available',
  Rented: 'rented',
  Pending: 'pending',
};

//  Labels cho trạng thái property
export const statusLabels = {
  [PropertyStatus.Available]: 'Còn Trống',
  [PropertyStatus.Rented]: 'Đã Cho Thuê',
  [PropertyStatus.Pending]: 'Đang Chờ Duyệt',
};
//  Màu thương hiệu
export const BRAND_COLORS = {
  primary: '#0072BC',
  secondary: '#FFD400',
  dark: '#001F3F',
};

//  Thông báo Toast
export const TOAST_MESSAGES = {
  LOGIN_SUCCESS: 'Đăng nhập thành công!',
  LOGIN_ERROR: 'Sai email hoặc mật khẩu',
  LOGOUT_SUCCESS: 'Đã đăng xuất',
  UNAUTHORIZED: 'Bạn cần đăng nhập để thực hiện thao tác này',
};
