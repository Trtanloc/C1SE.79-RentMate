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
