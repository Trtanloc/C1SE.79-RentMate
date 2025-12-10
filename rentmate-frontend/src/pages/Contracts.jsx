import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';

const ContractsPage = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const endpoint =
          user && (user.role === 'admin' || user.role === 'manager')
            ? '/contracts'
            : `/contracts/user/${user?.id}`;
        const { data } = await axiosClient.get(endpoint);
        setContracts(data?.data || []);
      } catch (err) {
        const message = err?.response?.data?.message || 'Không tải được danh sách hợp đồng.';
        setError(Array.isArray(message) ? message.join(', ') : message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const downloadPdf = async (id) => {
    try {
      const response = await axiosClient.get(`/contracts/${id}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contract-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể tải PDF.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">Hợp đồng của tôi</h1>
          <p className="text-sm text-gray-500">
            Danh sách hợp đồng đã tạo và liên kết với tài khoản của bạn.
          </p>
        </div>
        <Link
          to="/properties"
          className="rounded-xl border border-primary/30 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
        >
          Tạo hợp đồng mới
        </Link>
      </div>
      {loading ? (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 text-gray-500">
          Đang tải...
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          {error}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">BĐS</th>
                <th className="px-4 py-3">Bên thuê</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-center text-gray-500" colSpan={7}>
                    Chưa có hợp đồng nào.
                  </td>
                </tr>
              )}
              {contracts.map((c) => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {c.contractNumber || `#${c.id}`}
                  </td>
                  <td className="px-4 py-3">{c.title}</td>
                  <td className="px-4 py-3">{c.property?.title || c.propertyId}</td>
                  <td className="px-4 py-3">{c.tenant?.fullName || c.tenantId}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase text-primary">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : '--'}
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <Link
                      to={`/contracts/${c.id}/preview`}
                      className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      Xem
                    </Link>
                    <button
                      type="button"
                      onClick={() => downloadPdf(c.id)}
                      className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
                    >
                      Tải PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ContractsPage;
