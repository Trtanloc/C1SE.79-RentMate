import { useCallback, useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient.js';
import { approveReview } from '../api/reviewsApi.js';
import {
  LandlordApplicationStatus,
  UserRole,
  UserStatus,
  landlordApplicationStatusMeta as landlordStatusFallback,
  userStatusMeta,
} from '../utils/constants.js';
import { useMetadata } from '../context/MetadataContext.jsx';
import { useI18n } from '../i18n/useI18n.js';

// Import component mới
const AdminDepositConfirmation = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    loadWaitingDeposits();
    const interval = setInterval(loadWaitingDeposits, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadWaitingDeposits = async () => {
    try {
      const { data } = await axiosClient.get('/deposit/admin/waiting-confirmation');
      setDeposits(data?.data || []);
    } catch (err) {
      console.error('Failed to load waiting deposits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (contractCode) => {
    if (!confirm('Xác nhận đã nhận được tiền đặt cọc từ người thuê?')) return;
    
    setConfirming(contractCode);
    try {
      await axiosClient.post(`/deposit/confirm/${contractCode}`);
      alert('✅ Đã xác nhận thanh toán thành công!');
      await loadWaitingDeposits();
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi khi xác nhận thanh toán');
    } finally {
      setConfirming(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          <span className="ml-3 text-gray-600">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            💰 Đặt cọc chờ xác nhận
            {deposits.length > 0 && (
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500 text-white text-sm font-bold animate-pulse">
                {deposits.length}
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Người thuê đã chuyển tiền, vui lòng kiểm tra và xác nhận
          </p>
        </div>
        <button
          type="button"
          onClick={loadWaitingDeposits}
          className="rounded-full bg-gray-100 p-2 hover:bg-gray-200 transition-colors"
          title="Làm mới"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {deposits.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-lg text-gray-600 font-medium">Không có đặt cọc nào chờ xác nhận</p>
          <p className="text-sm text-gray-500 mt-2">Tất cả giao dịch đã được xử lý</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deposits.map((deposit) => (
            <div
              key={deposit.id}
              className="border-2 border-orange-200 rounded-2xl p-5 bg-gradient-to-r from-orange-50 to-yellow-50 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Mã hợp đồng</p>
                    <p className="text-lg font-bold text-gray-800">{deposit.contract_code}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Người thuê</p>
                      <p className="font-semibold text-gray-800">
                        {deposit.tenant?.fullName || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {deposit.tenant?.phone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Bất động sản</p>
                      <p className="font-semibold text-gray-800">
                        {deposit.property?.title || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2 border-t border-orange-200">
                    <div className="bg-white rounded-xl px-4 py-2 border-2 border-orange-300">
                      <p className="text-xs text-gray-500">Số tiền đặt cọc</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(deposit.deposit_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Thời gian chuyển tiền</p>
                      <p className="text-sm font-medium text-gray-700">
                        {formatDate(deposit.paid_at || deposit.updated_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                      {deposit.payment_method === 'momo' ? '💳 MoMo' : '🏦 Chuyển khoản'}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-semibold animate-pulse">
                      ⏳ Chờ xác nhận
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <button
                    type="button"
                    onClick={() => handleConfirm(deposit.contract_code)}
                    disabled={confirming === deposit.contract_code}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    {confirming === deposit.contract_code ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Đang xử lý...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        ✅ Xác nhận đã nhận tiền
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.open(`/payment/${deposit.contract_code}`, '_blank');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Xem chi tiết →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
  const [userMeta, setUserMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [userPage, setUserPage] = useState(1);
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userHighlights, setUserHighlights] = useState({
    activeLandlords: [],
    featuredTenants: [],
  });
  const [loading, setLoading] = useState(true);
  const [userTableLoading, setUserTableLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(
    LandlordApplicationStatus.Pending,
  );
  const [actionTarget, setActionTarget] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewActionId, setReviewActionId] = useState(null);
  const [trafficStats, setTrafficStats] = useState(null);
  const [trafficLoading, setTrafficLoading] = useState(true);
  const [userActionId, setUserActionId] = useState(null);

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
        dashboardRes,
        highlightsRes,
        reviewsRes,
      ] = await Promise.all([
        axiosClient.get('/stats/overview'),
        axiosClient.get('/landlord-applications', {
          params: statusFilter === 'all' ? {} : { status: statusFilter },
        }),
        axiosClient.get('/stats/dashboard'),
        axiosClient.get('/users/highlights', {
          params: { limit: 6 },
        }),
        axiosClient.get('/reviews', { params: { includePending: true } }),
      ]);
      setOverview(overviewRes.data.data);
      setApplications(appsRes.data.data || []);
      setDashboardStats(dashboardRes.data.data);
      setUserHighlights(
        highlightsRes?.data?.data || {
          activeLandlords: [],
          featuredTenants: [],
        },
      );
      setReviews(reviewsRes?.data?.data || []);
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

  const loadUsersList = useCallback(async () => {
    setUserTableLoading(true);
    setError(null);
    try {
      const limit = userMeta.limit || 10;
      const params = { page: userPage, limit };
      if (userStatusFilter !== 'all') {
        params.status = userStatusFilter;
      }
      const { data } = await axiosClient.get('/admin/users', {
        params,
      });
      const payload = data?.data || {};
      setUsers(payload.items || []);
      setUserMeta({
        total: payload.total ?? payload.items?.length ?? 0,
        page: payload.page ?? userPage,
        limit: payload.limit ?? limit,
      });
    } catch (err) {
      const message =
        err.response?.data?.message || 'Unable to load user list.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setUserTableLoading(false);
    }
  }, [userMeta.limit, userPage, userStatusFilter]);

  const loadTrafficStats = useCallback(async () => {
    setTrafficLoading(true);
    setError(null);
    try {
      const { data } = await axiosClient.get('/admin/traffic-stats');
      setTrafficStats(data?.data || null);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Unable to load traffic stats.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setTrafficLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsersList();
  }, [loadUsersList]);

  useEffect(() => {
    loadTrafficStats();
  }, [loadTrafficStats]);

  useEffect(() => {
    setUserPage(1);
  }, [userStatusFilter]);

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

  const handleReviewApproval = async (id, approved) => {
    setReviewActionId(id);
    try {
      const data = await approveReview(id, approved);
      setReviews((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data } : item)),
      );
    } catch (err) {
      const message =
        err.response?.data?.message || 'Unable to update review status.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setReviewActionId(null);
    }
  };

  const toggleUserStatus = async (userId, nextStatus) => {
    const isDisable = nextStatus === UserStatus.Disabled;
    if (
      !window.confirm(
        isDisable
          ? 'Disable this account? They will be logged out and blocked from creating listings.'
          : 'Re-enable this account?',
      )
    ) {
      return;
    }
    setUserActionId(userId);
    try {
      const endpoint =
        nextStatus === UserStatus.Disabled
          ? `/admin/users/${userId}/disable`
          : `/admin/users/${userId}/enable`;
      const { data } = await axiosClient.patch(endpoint);
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? data.data : user)),
      );
    } catch (err) {
      const message =
        err.response?.data?.message || 'Unable to update user status.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setUserActionId(null);
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

  const trafficByDay = useMemo(() => {
    if (!trafficStats?.visitsByDay) return [];
    return [...trafficStats.visitsByDay].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
  }, [trafficStats]);

  const maxVisitsByDay = useMemo(() => {
    if (!trafficByDay.length) return 0;
    return trafficByDay.reduce(
      (max, item) => (item.count > max ? item.count : max),
      0,
    );
  }, [trafficByDay]);

  const userStatusOptions = useMemo(
    () => [
      { value: 'all', label: 'All statuses' },
      {
        value: UserStatus.Active,
        label: userStatusMeta[UserStatus.Active]?.label || 'Active',
      },
      {
        value: UserStatus.Disabled,
        label: userStatusMeta[UserStatus.Disabled]?.label || 'Disabled',
      },
    ],
    [],
  );

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
          {/* Overview Stats */}
          {overview && (
            <div className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4 mb-6">
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

          <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Traffic &amp; visits</h2>
                <p className="text-sm text-gray-500">
                  Last 14 days of tracked page views (auto-captured on navigation).
                </p>
              </div>
              <button
                type="button"
                onClick={loadTrafficStats}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                disabled={trafficLoading}
              >
                {trafficLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {trafficLoading ? (
              <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                Loading traffic stats...
              </div>
            ) : trafficStats ? (
              <>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Total visits</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-800">
                      {trafficStats.totalVisits ?? 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Tracked days</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-800">
                      {trafficByDay.length || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Top page</p>
                    <p className="mt-2 text-sm font-semibold text-gray-800 truncate">
                      {trafficStats.topPages?.[0]?.path || '—'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-800">Visits per day</h3>
                      <span className="text-xs text-gray-500">Last {trafficByDay.length || 0} days</span>
                    </div>
                    {trafficByDay.length === 0 ? (
                      <p className="mt-3 text-sm text-gray-500">No visits recorded yet.</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {trafficByDay.map((item) => {
                          const width =
                            maxVisitsByDay > 0
                              ? Math.max((item.count / maxVisitsByDay) * 100, 6)
                              : 0;
                          return (
                            <div key={item.date} className="flex items-center gap-3">
                              <span className="w-24 text-xs text-gray-500">
                                {new Date(item.date).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              <div className="h-2 flex-1 rounded-full bg-gray-100">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-primary to-amber-400"
                                  style={{ width: `${width}%` }}
                                ></div>
                              </div>
                              <span className="w-10 text-right text-xs font-semibold text-gray-700">
                                {item.count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-800">Most viewed pages</h3>
                      <span className="text-xs text-gray-500">Top 5</span>
                    </div>
                    {trafficStats.topPages?.length ? (
                      <div className="mt-3 overflow-hidden rounded-xl border border-gray-100">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
                            <tr>
                              <th className="px-4 py-2">Path</th>
                              <th className="px-4 py-2 text-right">Views</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trafficStats.topPages.map((page) => (
                              <tr key={page.path} className="border-t border-gray-100 text-gray-700">
                                <td className="px-4 py-2 font-medium">{page.path}</td>
                                <td className="px-4 py-2 text-right font-semibold">{page.count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-gray-500">No page views recorded yet.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-gray-500">No traffic data yet.</p>
            )}
          </section>

          <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">User management</h2>
                <p className="text-sm text-gray-500">
                  Tenant, landlord, and admin accounts with disable/enable controls.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 focus:border-primary focus:outline-none"
                >
                  {userStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={loadUsersList}
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                  disabled={userTableLoading}
                >
                  {userTableLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              {userTableLoading ? (
                <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  Loading users...
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Role</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Created</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                          No users found for this filter.
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => {
                        const statusBadge = userStatusMeta[user.status] || userStatusMeta[UserStatus.Active];
                        return (
                          <tr key={user.id} className="border-t border-gray-100 text-gray-700">
                            <td className="px-3 py-3">
                              <p className="font-semibold">{user.fullName}</p>
                              <p className="text-xs text-gray-400">{user.email}</p>
                            </td>
                            <td className="px-3 py-3 capitalize">{user.role}</td>
                            <td className="px-3 py-3">
                              <span
                                className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusBadge?.badgeClass}`}
                              >
                                {statusBadge?.label || user.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-600">
                              {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : '—'}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleUserStatus(
                                    user.id,
                                    user.status === UserStatus.Disabled
                                      ? UserStatus.Active
                                      : UserStatus.Disabled,
                                  )
                                }
                                disabled={userActionId === user.id || userTableLoading}
                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                  user.status === UserStatus.Disabled
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                } disabled:cursor-not-allowed disabled:opacity-60`}
                              >
                                {userActionId === user.id
                                  ? 'Saving...'
                                  : user.status === UserStatus.Disabled
                                  ? 'Enable'
                                  : 'Disable'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Page {userMeta.page || userPage} of{' '}
                {Math.max(1, Math.ceil((userMeta.total || 0) / (userMeta.limit || 10)))}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUserPage((prev) => Math.max(1, prev - 1))}
                  disabled={userPage <= 1 || userTableLoading}
                  className="rounded-full border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const totalPages = Math.max(
                      1,
                      Math.ceil((userMeta.total || 0) / (userMeta.limit || 10)),
                    );
                    setUserPage((prev) =>
                      prev >= totalPages ? totalPages : prev + 1,
                    );
                  }}
                  disabled={
                    userTableLoading ||
                    userPage >=
                      Math.max(
                        1,
                        Math.ceil((userMeta.total || 0) / (userMeta.limit || 10)),
                      )
                  }
                  className="rounded-full border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next
                </button>
              </div>
            </div>
          </section>

          {/* Deposit confirmations */}
          <div className="mb-8">
            <AdminDepositConfirmation />
          </div>


          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Customer reviews</h2>
                <p className="text-sm text-gray-500">
                  Testimonials submitted by tenants/landlords. Approve to publish to the homepage or hide them.
                </p>
              </div>
            </div>
            {reviews.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">No reviews submitted yet.</p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 text-sm text-gray-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-gray-900">
                          {review.reviewerName || 'N/A'}
                        </p>
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          {review.reviewerRole || 'customer'}
                        </p>
                        {typeof review.rating === 'number' && (
                          <p className="text-xs font-semibold text-amber-600">
                            {review.rating}/5
                          </p>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          review.isApproved
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {review.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <p className="mt-3 text-gray-600">
                      {review.comment || review.content || 'No content provided.'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {!review.isApproved && (
                        <button
                          type="button"
                          onClick={() => handleReviewApproval(review.id, true)}
                          disabled={reviewActionId === review.id}
                          className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {reviewActionId === review.id ? 'Saving...' : 'Approve'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleReviewApproval(review.id, false)}
                        disabled={reviewActionId === review.id}
                        className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {review.isApproved ? 'Hide' : 'Reject'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Landlord Applications */}
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
        </>
      )}
    </section>
  );
};

export default AdminPage;
