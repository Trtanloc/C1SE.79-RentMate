import { useEffect, useState } from 'react';
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
};

const PaymentsPage = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionId, setActionId] = useState(null);

  const isAdmin = user?.role === UserRole.Admin;

  useEffect(() => {
    if (isAdmin) {
      fetchPayments();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const isPaidStatus = (status) => ['paid', 'completed'].includes((status || '').toLowerCase());

  const fetchPayments = async (keyword = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = keyword ? { search: keyword.trim() } : {};
      const { data } = await axiosClient.get('/admin/payments', { params });
      setPayments(data?.data || []);
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể tải danh sách thanh toán.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchPayments(search);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Hủy khoản thanh toán này?')) return;
    setActionId(id);
    try {
      await axiosClient.patch(`/admin/payments/${id}/cancel`);
      await fetchPayments(search);
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể hủy thanh toán');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Đánh dấu xóa khoản thanh toán này?')) return;
    setActionId(id);
    try {
      await axiosClient.delete(`/admin/payments/${id}`);
      await fetchPayments(search);
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể xóa thanh toán');
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

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          Bạn không có quyền truy cập trang quản lý thanh toán.
        </div>
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
              onClick={() => fetchPayments(search)}
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
                        <span className="text-xs text-gray-500" title="Đã thanh toán – không thể xóa">
                          Đã thanh toán – không thể xóa
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
