import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';

const formatCurrency = (value) =>
  value !== undefined && value !== null
    ? new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(Number(value))
    : '—';

const ContractPreviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axiosClient.get(`/contracts/${id}`);
        setContract(data.data);
      } catch (err) {
        const message = err?.response?.data?.message || 'Không tải được hợp đồng.';
        setError(Array.isArray(message) ? message.join(', ') : message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const downloadPdf = async () => {
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
      const message = err?.response?.data?.message || 'Không thể xuất PDF ngay lúc này.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-gray-600">
        Đang tải hợp đồng...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-danger">
          {error}
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-gray-700"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (!contract) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-primary/70">
            Hợp đồng #{contract.contractNumber || contract.id}
          </p>
          <h1 className="text-2xl font-semibold text-gray-800">
            {contract.title || 'Xem trước hợp đồng'}
          </h1>
          <p className="text-sm text-gray-500">
            Cập nhật lần cuối: {new Date(contract.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/contracts')}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            Hợp đồng của tôi
          </button>
          <button
            type="button"
            onClick={downloadPdf}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Xuất PDF
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <iframe
            title="Contract preview"
            srcDoc={contract.contractHtml || '<p>Không có nội dung hợp đồng.</p>'}
            className="h-[75vh] w-full border-0"
          />
        </div>

        <aside className="space-y-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Thông tin</p>
            <h2 className="text-lg font-semibold text-gray-800">Tóm tắt hợp đồng</h2>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
            <p className="font-semibold text-gray-800">Bên cho thuê</p>
            <p>{contract.owner?.fullName}</p>
            <p className="text-gray-500">{contract.owner?.email}</p>
            {contract.owner?.phone && <p className="text-gray-500">{contract.owner.phone}</p>}
          </div>
          <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
            <p className="font-semibold text-gray-800">Bên thuê</p>
            <p>{contract.tenant?.fullName}</p>
            <p className="text-gray-500">{contract.tenant?.email}</p>
            {contract.tenant?.phone && <p className="text-gray-500">{contract.tenant.phone}</p>}
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-700 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-800">
                {contract.property?.title || 'Bất động sản'}
              </span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {contract.status}
              </span>
            </div>
            <p className="mt-1 text-gray-500">{contract.property?.address}</p>
            <ul className="mt-3 space-y-1 text-sm text-gray-700">
              <li>Diện tích: {contract.property?.area} m²</li>
              <li>Phòng ngủ: {contract.property?.bedrooms}</li>
              <li>Phòng tắm: {contract.property?.bathrooms}</li>
              <li>Tiền cọc: {formatCurrency(contract.depositAmount)}</li>
              <li>Tiền thuê: {formatCurrency(contract.monthlyRent)} / tháng</li>
              <li>
                Thời hạn: {contract.startDate} → {contract.endDate}
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default ContractPreviewPage;
