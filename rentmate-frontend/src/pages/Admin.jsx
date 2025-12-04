import { useCallback, useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient.js';
import {
  LandlordApplicationStatus,
  UserRole,
  landlordApplicationStatusMeta as landlordStatusFallback,
} from '../utils/constants.js';
import { useMetadata } from '../context/MetadataContext.jsx';
import { useI18n } from '../i18n/useI18n.js';

const AdminPage = () => {
  const {
    landlordApplicationStatuses,
    landlordStatusMeta: landlordStatusMetaFromContext,
  } = useMetadata();
  const { t } = useI18n();
  const landlordStatusMeta = landlordStatusMetaFromContext || landlordStatusFallback;

  const [overview, setOverview] = useState(null);
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [userHighlights, setUserHighlights] = useState({
    activeLandlords: [],
    featuredTenants: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(
    LandlordApplicationStatus.Pending,
  );
  const [actionTarget, setActionTarget] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);

  const statusFilters = useMemo(() => {
    const metaOptions =
      landlordApplicationStatuses.length > 0
        ? landlordApplicationStatuses
        : Object.entries(landlordStatusMeta).map(([value, meta]) => ({
            value,
            label: meta.label || value,
          }));
    return [
      ...metaOptions,
      { label: 'All', value: 'all' },
    ];
  }, [landlordApplicationStatuses, landlordStatusMeta]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        overviewRes,
        appsRes,
        usersRes,
        dashboardRes,
        highlightsRes,
      ] = await Promise.all([
        axiosClient.get('/stats/overview'),
        axiosClient.get('/landlord-applications', {
          params: statusFilter === 'all' ? {} : { status: statusFilter },
        }),
        axiosClient.get('/users'),
        axiosClient.get('/stats/dashboard'),
        axiosClient.get('/users/highlights', {
          params: { limit: 6 },
        }),
      ]);
      setOverview(overviewRes.data.data);
      setApplications(appsRes.data.data || []);
      setUsers(usersRes.data.data || []);
      setDashboardStats(dashboardRes.data.data);
      setUserHighlights(
        highlightsRes?.data?.data || {
          activeLandlords: [],
          featuredTenants: [],
        },
      );
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Unable to load admin data.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const approveOrReject = async (id, nextStatus) => {
    let adminNotes;
    if (nextStatus === LandlordApplicationStatus.Rejected) {
      adminNotes = window.prompt('Add rejection notes (optional):', '') || '';
    }
    setActionTarget({ id, status: nextStatus });
    try {
      const { data } = await axiosClient.patch(
        `/landlord-applications/${id}/status`,
        { status: nextStatus, adminNotes },
      );
      setApplications((prev) =>
        prev.map((item) => (item.id === id ? data.data : item)),
      );
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Unable to update application status.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setActionTarget(null);
    }
  };

  const tenantUsers = useMemo(() => {
    if (userHighlights?.featuredTenants?.length) {
      return userHighlights.featuredTenants;
    }
    return users
      .filter((user) => user.role === UserRole.Tenant)
      .slice(0, 5);
  }, [userHighlights, users]);

  const landlordUsers = useMemo(() => {
    if (userHighlights?.activeLandlords?.length) {
      return userHighlights.activeLandlords;
    }
    return users
      .filter((user) => user.role === UserRole.Landlord)
      .slice(0, 5);
  }, [userHighlights, users]);

  const applicationBreakdown = useMemo(() => {
    if (!applications.length) {
      return [];
    }
    const counts = applications.reduce((acc, app) => {
      const key = app.status || LandlordApplicationStatus.Pending;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const total = applications.length;
    const colorFromMeta = (meta = {}) => {
      const badge = meta.badgeClass || '';
      if (badge.includes('emerald')) return '#10B981';
      if (badge.includes('amber')) return '#F59E0B';
      if (badge.includes('rose')) return '#EF4444';
      return '#0072BC';
    };
    return Object.keys(counts).map((status) => {
      const meta = landlordStatusMeta[status] || {};
      return {
        status,
        label: meta.label || status,
        count: counts[status],
        percent: total ? Math.round((counts[status] / total) * 100) : 0,
        color: colorFromMeta(meta),
      };
    });
  }, [applications, landlordStatusMeta]);

  const listingProgress = useMemo(() => {
    if (!overview) return null;
    const total = Number(overview.totalListings) || 0;
    const active = Number(overview.activeListings) || 0;
    const percent = total ? Math.round((active / total) * 100) : 0;
    return { total, active, percent };
  }, [overview]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            {t('admin.console', 'Admin console')}
          </p>
          <h1 className="text-3xl font-semibold text-gray-800">
            {t('admin.heading', 'RentMate operations')}
          </h1>
          <p className="text-sm text-gray-500">
            {t('admin.subheading', 'Monitor listings, users, and landlord onboarding powered by backend data.')}
          </p>
        </div>
        <div className="rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-500">
          {t('admin.ticker', 'Email OTP only — SMS is disabled globally')}
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-gray-500">
          Loading admin data...
        </div>
      ) : (
        <>
          {overview && (
            <div className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: t('admin.overview.totalListings', 'Total listings'),
                  value: overview.totalListings,
                },
                {
                  label: t('admin.overview.activeListings', 'Active listings'),
                  value: overview.activeListings,
                },
                {
                  label: t('admin.overview.landlords', 'Landlords'),
                  value: overview.landlordCount,
                },
                {
                  label: t('admin.overview.occupancy', 'Occupancy'),
                  value: `${overview.occupancyRate}%`,
                },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-800">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {t('admin.charts.title', 'Operational charts')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t('admin.charts.subtitle', 'Live breakdown from landlord applications.')}
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {t('admin.charts.apps', 'Applications')}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {applicationBreakdown.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {t('admin.charts.noData', 'No application data yet.')}
                  </p>
                ) : (
                  applicationBreakdown.map((item) => (
                    <div key={item.status} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                        <span>{item.label}</span>
                        <span className="text-xs text-gray-500">
                          {item.count} • {item.percent}%
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.percent}%`,
                            background: `linear-gradient(90deg, ${item.color}, ${item.color}CC)`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {t('admin.charts.listings', 'Listings health')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t('admin.charts.occupancy', 'Active vs total plus occupancy.')}
                  </p>
                </div>
              </div>
              {listingProgress ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                        {t('admin.overview.activeListings', 'Active listings')}
                      </p>
                      <p className="text-2xl font-semibold text-gray-800">
                        {listingProgress.active} / {listingProgress.total}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {listingProgress.percent}%
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-[#00A8E8]"
                      style={{ width: `${Math.min(listingProgress.percent, 100)}%` }}
                    />
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">
                    {t('admin.overview.occupancy', 'Occupancy')}:{' '}
                    <span className="font-semibold text-brand">
                      {overview?.occupancyRate ?? '--'}%
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  {t('admin.charts.noData', 'No application data yet.')}
                </p>
              )}
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800">
                Doanh thu theo tháng
              </h3>
              <p className="text-sm text-gray-500">
                Dữ liệu từ giao dịch hoàn tất.
              </p>
              <div className="mt-4 space-y-2">
                {dashboardStats?.revenueByMonth?.length ? (
                  dashboardStats.revenueByMonth.map((row) => (
                    <div key={row.month} className="flex items-center justify-between text-sm">
                      <span>{row.month}</span>
                      <span className="font-semibold text-gray-800">
                        {Number(row.total).toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Chưa có dữ liệu thanh toán.</p>
                )}
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {t('admin.users.activeLandlords', 'Active landlords')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t('admin.users.activeLandlordsHint', 'Landlords with live or recently updated listings.')}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {landlordUsers.length}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {landlordUsers.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {t('admin.users.noLandlords', 'No active landlords yet.')}
                  </p>
                ) : (
                  landlordUsers.map((landlord) => (
                    <div
                      key={landlord.id}
                      className="rounded-xl border border-gray-100 p-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {landlord.fullName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {landlord.email}
                          </p>
                        </div>
                        <div className="text-right text-xs text-gray-600">
                          <p className="font-semibold text-emerald-700">
                            {landlord.activeListingCount ?? 0} active
                          </p>
                          <p>
                            {t('admin.users.totalListings', 'Total listings')}: {landlord.propertyCount ?? 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {t('admin.users.featuredTenants', 'Featured tenants')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t('admin.users.featuredTenantsHint', 'Tenants with the most completed or active contracts.')}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">
                  {tenantUsers.length}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {tenantUsers.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {t('admin.users.noTenants', 'No standout tenants yet.')}
                  </p>
                ) : (
                  tenantUsers.map((tenant) => (
                    <div
                      key={tenant.id}
                      className="rounded-xl border border-gray-100 p-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {tenant.fullName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {tenant.email}
                          </p>
                        </div>
                        <div className="text-right text-xs text-gray-600">
                          <p className="font-semibold text-primary">
                            {tenant.completedContracts ?? 0} contracts
                          </p>
                          <p className="text-gray-500">
                            {t('admin.users.role', 'Tenant')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {t('admin.apps.title', 'Landlord applications')}
                </h2>
                <p className="text-sm text-gray-500">
                  {t('admin.apps.subtitle', 'Approve or reject requests to become a landlord.')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                      statusFilter === filter.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-3 py-2">Applicant</th>
                    <th className="px-3 py-2">Company</th>
                    <th className="px-3 py-2">Experience</th>
                    <th className="px-3 py-2">Portfolio</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-6 text-center text-gray-500"
                      >
                        No applications match this filter.
                      </td>
                    </tr>
                  )}
                  {applications.map((application) => {
                    const meta =
                      landlordStatusMeta[application.status] ||
                      landlordStatusMeta[LandlordApplicationStatus.Pending];
                    return (
                      <tr
                        key={application.id}
                        className="border-t border-gray-100 text-gray-700"
                      >
                        <td className="px-3 py-3">
                          <p className="font-semibold">
                            {application.user?.fullName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {application.user?.email}
                          </p>
                        </td>
                      <td className="px-3 py-3">{application.companyName}</td>
                      <td className="px-3 py-3">
                          {application.experienceYears} years
                      </td>
                      <td className="px-3 py-3">{application.propertyCount}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-semibold ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                approveOrReject(
                                  application.id,
                                  LandlordApplicationStatus.Approved,
                                )
                              }
                              disabled={
                                actionTarget?.id === application.id &&
                                actionTarget?.status ===
                                  LandlordApplicationStatus.Approved
                              }
                              className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {actionTarget?.id === application.id &&
                              actionTarget?.status ===
                                LandlordApplicationStatus.Approved
                                ? 'Saving...'
                                : t('admin.apps.approve', 'Approve')}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                approveOrReject(
                                  application.id,
                                  LandlordApplicationStatus.Rejected,
                                )
                              }
                              disabled={
                                actionTarget?.id === application.id &&
                                actionTarget?.status ===
                                  LandlordApplicationStatus.Rejected
                              }
                              className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {actionTarget?.id === application.id &&
                              actionTarget?.status ===
                                LandlordApplicationStatus.Rejected
                                ? 'Saving...'
                                : t('admin.apps.reject', 'Reject')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800">
                {t('admin.tenants', 'Recent tenants')}
              </h2>
              <ul className="mt-4 space-y-3">
                {tenantUsers.map((tenant) => (
                  <li
                    key={tenant.id}
                    className="rounded-xl border border-gray-100 px-3 py-2 text-sm"
                  >
                    <p className="font-semibold">{tenant.fullName}</p>
                    <p className="text-xs text-gray-500">{tenant.email}</p>
                  </li>
                ))}
                {tenantUsers.length === 0 && (
                  <p className="text-sm text-gray-500">No tenants yet.</p>
                )}
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800">
                {t('admin.landlords', 'Active landlords')}
              </h2>
              <ul className="mt-4 space-y-3">
                {landlordUsers.map((landlord) => (
                  <li
                    key={landlord.id}
                    className="rounded-xl border border-gray-100 px-3 py-2 text-sm"
                  >
                    <p className="font-semibold">{landlord.fullName}</p>
                    <p className="text-xs text-gray-500">{landlord.email}</p>
                  </li>
                ))}
                {landlordUsers.length === 0 && (
                  <p className="text-sm text-gray-500">No landlords yet.</p>
                )}
              </ul>
            </div>
          </section>
        </>
      )}
    </section>
  );
};

export default AdminPage;
