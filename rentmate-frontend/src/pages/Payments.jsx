import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';

const PaymentsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint =
        user && (user.role === 'admin' || user.role === 'manager')
          ? '/transactions'
          : '/transactions/my';
      const { data } = await axiosClient.get(endpoint);
      setTransactions(data?.data || []);
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể tải giao dịch.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const handlePay = async (tx) => {
    try {
      const { data } = await axiosClient.post('/transactions/checkout', {
        contractId: tx.contractId,
        amount: tx.amount,
        currency: tx.currency,
        paymentProvider: 'vnpay',
        method: 'online',
      });
      const url = data?.data?.paymentUrl;
      if (url) {
        window.open(url, '_blank');
        setTimeout(() => loadTransactions(), 2000);
      }
    } catch {
      alert('Không thể tạo phiên thanh toán online');
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-gray-800">Thanh toán hợp đồng</h1>
      <p className="text-sm text-gray-500">
        Xem và thanh toán các giao dịch (đang mở) gắn với hợp đồng thuê. Thanh toán online
        sử dụng liên kết bảo mật.
      </p>
      {loading ? (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 text-gray-500">
          Đang tải...
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          {error}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    HĐ #{tx.contractId} • {tx.currency} {tx.amount}
                  </p>
                  <p className="text-xs text-gray-500">
                    Trạng thái: {tx.status} • Phương thức: {tx.method}
                  </p>
                </div>
                {tx.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handlePay(tx)}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
                  >
                    Thanh toán
                  </button>
                )}
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-500">
              Chưa có giao dịch nào.
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default PaymentsPage;
