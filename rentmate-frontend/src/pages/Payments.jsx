import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { UserRole } from '../utils/constants.js';

const statusBadges = {
  pending: 'bg-amber-100 text-amber-800',
  unpaid: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-700',
  paid: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
  failed: 'bg-rose-100 text-rose-700',
  waiting_confirmation: 'bg-sky-100 text-sky-700',
  expired: 'bg-gray-100 text-gray-700',
};

const PaymentsPage = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionId, setActionId] = useState(null);

  const isAdmin = user?.role === UserRole.Admin;
  const isTenant = user?.role === UserRole.Tenant;
  const isLandlord = user?.role === UserRole.Landlord;

  const normalizeContractCode = (payment) =>
    payment?.contract?.contract_code ||
    payment?.contractCode ||
    payment?.gateway_response?.contractCode ||
    payment?.paymentCode ||
    payment?.payment_code ||
    payment?.contract?.code ||
    null;

  const statusWeight = (status) => {
    const value = (status || '').toLowerCase();
    if (value === 'paid' || value === 'completed') return 3;
    if (value === 'waiting_confirmation') return 2;
    if (value === 'pending' || value === 'unpaid') return 1;
    return 0;
  };

  const dedupePayments = (list = []) => {
    const map = new Map();
    [...list]
      .sort(
        (a, b) =>
          new Date(b.updated_at || b.updatedAt || b.created_at || b.createdAt || 0) -
          new Date(a.updated_at || a.updatedAt || a.created_at || a.createdAt || 0),
      )
      .forEach((item) => {
        const code = normalizeContractCode(item) || item.id;
        const existing = map.get(code);
        if (!existing) {
          map.set(code, item);
          return;
        }
        if (statusWeight(item.status) > statusWeight(existing.status)) {
          map.set(code, item);
        }
      });
    return Array.from(map.values());
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminPayments();
    } else if (isTenant || isLandlord) {
      fetchMyPayments(isLandlord ? 'landlord' : 'tenant');
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isTenant, isLandlord]);

  const isPaidStatus = (status) => ['paid', 'completed'].includes((status || '').toLowerCase());

  const fetchAdminPayments = async (keyword = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = keyword ? { search: keyword.trim() } : {};
      const { data } = await axiosClient.get('/admin/payments', { params });
      setPayments(dedupePayments(data?.data || []));
    } catch (err) {
      const message = err?.response?.data?.message || 'Không tải được danh sách thanh toán.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPayments = async (role = 'tenant') => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosClient.get('/deposit/my-payments', {
        params: { role },
      });
      setPayments(dedupePayments(data?.data || []));
    } catch (err) {
      const message = err?.response?.data?.message || 'Không tải được lịch sử thanh toán.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchAdminPayments(search);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Hủy khoản thanh toán này?')) return;
    setActionId(id);
    try {
      await axiosClient.patch(`/admin/payments/${id}/cancel`);
      await fetchAdminPayments(search);
    } catch (err) {
      alert(err?.response?.data?.message || 'Không hủy được thanh toán');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Đánh dấu xóa khoản thanh toán này?')) return;
    setActionId(id);
    try {
      await axiosClient.delete(`/admin/payments/${id}`);
      await fetchAdminPayments(search);
    } catch (err) {
      alert(err?.response?.data?.message || 'Không xóa được thanh toán');
    } finally {
      setActionId(null);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatMethod = (method) => {
    const value = (method || '').toLowerCase();
    if (value.includes('momo')) return 'MoMo';
    if (value.includes('vnpay')) return 'VNPay';
    if (value.includes('bank')) return 'Chuyển khoản';
    return method || 'N/A';
  };

  const formatDate = (value) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString('vi-VN');
    } catch {
      return value;
    }
  };

  if (!isAdmin) {
    const roleLabel = isLandlord ? 'chủ nhà' : 'khách thuê';
    return (
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Payments</p>
          <h1 className="text-3xl font-semibold text-gray-800">Lịch sử thanh toán</h1>
          <p className="text-sm text-gray-500">
            {`Bạn đang xem các khoản thanh toán với vai trò ${roleLabel}.`}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-500">Đang tải...</div>
        ) : payments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
            Chưa có thanh toán nào.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {payments.map((payment) => {
              const contract = payment.contract || {};
              const property = contract.property || {};
              const tenantName = contract.tenant?.fullName;
              const badgeClass =
                statusBadges[(payment.status || '').toLowerCase()] || 'bg-gray-100 text-gray-700';

              return (
                <div key={payment.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Mã hợp đồng</p>
                      <p className="text-lg font-semibold text-gray-900">{contract.contract_code || '—'}</p>
                      <p className="text-sm text-gray-600">{property.title || 'Không rõ tên tài sản'}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                      {payment.status || 'N/A'}
                    </span>
                  </div>

                  {isLandlord && (
                    <p className="mt-2 text-sm text-gray-600">
                      Khách thuê:{' '}
                      <span className="font-semibold text-gray-800">{tenantName || '—'}</span>
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-[0.15em] text-gray-500">Số tiền</span>
                      <span className="text-base font-semibold text-gray-900">{formatCurrency(payment.amount)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-[0.15em] text-gray-500">Phương thức</span>
                      <span className="text-base font-semibold text-gray-900">
                        {formatMethod(payment.payment_method)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-[0.15em] text-gray-500">Ngày tạo</span>
                      <span className="text-base font-semibold text-gray-900">{formatDate(payment.created_at)}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to={`/payment/${contract.contract_code}`}
                      className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                    >
                      Xem chi tiết
                    </Link>
                    {payment.gateway_response?.contractCode && (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                        {payment.gateway_response.contractCode}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Payment control</p>
          <h1 className="text-3xl font-semibold text-gray-800">Quản lý thanh toán hợp đồng</h1>
          <p className="text-sm text-gray-500">
            Chỉ admin mới được xem, tìm kiếm, hủy hoặc đánh dấu xóa các thanh toán chưa hoàn tất.
          </p>
        </div>
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã thanh toán hoặc mã hợp đồng"
            className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none sm:w-72"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90"
            >
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={() => fetchAdminPayments(search)}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary"
            >
              Làm mới
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-500">Đang tải...</div>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
          Không có khoản thanh toán nào phù hợp.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Mã thanh toán</th>
                <th className="px-4 py-3">Mã hợp đồng</th>
                <th className="px-4 py-3">Khách thuê</th>
                <th className="px-4 py-3">Số tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const paid = isPaidStatus(payment.status);
                const badgeClass = statusBadges[(payment.status || '').toLowerCase()] || 'bg-gray-100 text-gray-700';
                return (
                  <tr key={payment.id} className="border-t border-gray-100 text-gray-800">
                    <td className="px-4 py-3 font-semibold">{payment.paymentCode || `PAY-${payment.id}`}</td>
                    <td className="px-4 py-3">{payment.contractCode || '—'}</td>
                    <td className="px-4 py-3">{payment.tenantName || '—'}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeClass}`}>
                        {payment.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {payment.createdAt ? new Date(payment.createdAt).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {paid ? (
                        <span className="text-xs text-gray-500" title="Đã thanh toán nên không thể xóa">
                          Đã thanh toán
                        </span>
                      ) : (
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleCancel(payment.id)}
                            disabled={actionId === payment.id}
                            className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {actionId === payment.id ? 'Đang xử lý...' : 'Hủy'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(payment.id)}
                            disabled={actionId === payment.id}
                            className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {actionId === payment.id ? 'Đang xử lý...' : 'Xóa'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default PaymentsPage;
