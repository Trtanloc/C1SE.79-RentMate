import { useEffect, useState } from 'react';
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
      try {
        const endpoint =
          user && (user.role === 'admin' || user.role === 'manager')
            ? '/contracts'
            : '/contracts/my';
        const { data } = await axiosClient.get(endpoint);
        setContracts(data?.data || []);
      } catch (err) {
        const message = err?.response?.data?.message || 'Không thể tải hợp đồng.';
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
      alert(err?.response?.data?.message || 'Không thể tải PDF');
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-gray-800">Hợp đồng</h1>
      <p className="text-sm text-gray-500">Danh sách hợp đồng và tải file PDF.</p>
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
                <th className="px-4 py-3">Tenant</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-center text-gray-500" colSpan={6}>
                    Chưa có hợp đồng.
                  </td>
                </tr>
              )}
              {contracts.map((c) => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{c.contractNumber}</td>
                  <td className="px-4 py-3">{c.title}</td>
                  <td className="px-4 py-3">{c.property?.title || c.propertyId}</td>
                  <td className="px-4 py-3">{c.tenant?.fullName || c.tenantId}</td>
                  <td className="px-4 py-3">{c.status}</td>
                  <td className="px-4 py-3">
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
