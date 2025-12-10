import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';

const PaymentsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [deposits, setDeposits] = useState([]); // Deposit chờ xác nhận
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const { user } = useAuth();

  const isAdminOrManager = user && (user.role === 'admin' || user.role === 'manager');
  const isLandlord = user && user.role === 'landlord';

  useEffect(() => {
    loadData();
    // Auto refresh every 10 seconds if admin/manager
    if (isAdminOrManager) {
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [user, isAdminOrManager]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint =
        user && (user.role === 'admin' || user.role === 'manager')
          ? '/transactions'
          : '/transactions/my';
      
      // Load transactions
      const { data: txData } = await axiosClient.get(endpoint);
      const transactions = txData?.data || txData || [];
      
      // Load deposit contracts
      try {
        const { data: depositData } = await axiosClient.get('/deposit/my-contracts');
        const deposits = (depositData?.data || depositData || []).map(d => ({
          id: `deposit-${d.id}`,
          contractId: d.contract_code,
          amount: parseFloat(d.deposit_amount),
          currency: 'VND',
          status: d.status === 'waiting_confirmation' ? 'waiting_confirm' : d.status,
          method: d.payment_method || 'bank-transfer',
          createdAt: d.created_at,
          type: 'deposit',
          property: d.property,
          tenant: d.tenant,
          landlord: d.landlord,
          paid_at: d.paid_at,
          payment_method: d.payment_method,
        }));
        
        setTransactions([...deposits, ...transactions]);
      } catch (err) {
        console.log('No deposits found');
        setTransactions(transactions);
      }

      // Load waiting confirmation deposits for admin/landlord
      if (isAdminOrManager || isLandlord) {
        try {
          const { data: waitingData } = await axiosClient.get('/deposit/admin/waiting-confirmation');
          setDeposits(waitingData?.data || []);
        } catch (err) {
          console.log('No waiting deposits');
          setDeposits([]);
        }
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể tải giao dịch.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeposit = async (contractCode) => {
    if (!confirm('Xác nhận đã nhận được tiền đặt cọc từ người thuê?')) return;
    
    setConfirming(contractCode);
    try {
      await axiosClient.post(`/deposit/confirm/${contractCode}`);
      alert('✅ Đã xác nhận thanh toán thành công!');
      await loadData(); // Reload
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi khi xác nhận thanh toán');
    } finally {
      setConfirming(null);
    }
  };

  const handleConfirm = async (txId) => {
    if (!confirm('Xác nhận đã nhận được tiền từ người thuê?')) return;
    
    try {
      await axiosClient.patch(`/transactions/${txId}/confirm`);
      alert('Đã xác nhận thanh toán thành công!');
      loadData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi xác nhận thanh toán');
    }
  };

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
        setTimeout(() => loadData(), 2000);
      }
    } catch {
      alert('Không thể tạo phiên thanh toán online');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      waiting_confirm: 'bg-orange-100 text-orange-800',
      waiting_confirmation: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Chờ thanh toán',
      waiting_confirm: 'Chờ xác nhận',
      waiting_confirmation: 'Chờ xác nhận',
      completed: 'Đã hoàn thành',
      paid: 'Đã thanh toán',
      failed: 'Thất bại',
    };
    return texts[status] || status;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };
 //  HÀM FORMAT PHƯƠNG THỨC THANH TOÁN
  const getPaymentMethodText = (method) => {
    const methodMap = {
      'momo': 'MoMo',
      'vnpay': 'VN Pay',
      'bank-transfer': 'Chuyển khoản ngân hàng',
      'cash': 'Tiền mặt',
      'online': 'Thanh toán online',
      
    };
    return methodMap[method] || method;
  };

  // HÀM CHUNG ĐỂ LẤY PHƯƠNG THỨC HIỂN THỊ (TỐI ƯU HƠN)
  const getPaymentMethodDisplay = (transaction) => {
    // Ưu tiên lấy từ payment_method, nếu không có thì dùng method
    const method = transaction.payment_method || transaction.method;
    return getPaymentMethodText(method);
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

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-gray-800">Thanh toán hợp đồng</h1>
      <p className="text-sm text-gray-500 mt-2">
        Xem và thanh toán các giao dịch (đang mở) gắn với hợp đồng thuê. Thanh toán online
        sử dụng liên kết bảo mật.
      </p>

      {/*SECTION DEPOSIT CHỜ XÁC NHẬN (CHỈ HIỆN CHO ADMIN/LANDLORD) */}
      {(isAdminOrManager || isLandlord) && deposits.length > 0 && (
        <div className="mt-6 rounded-2xl bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-orange-800 flex items-center gap-2">
                💰 Đặt cọc chờ xác nhận
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white text-sm font-bold animate-pulse">
                  {deposits.length}
                </span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Người thuê đã chuyển tiền. Vui lòng kiểm tra và xác nhận.
              </p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="rounded-full bg-white p-2 hover:bg-gray-100 shadow-md transition-colors"
              title="Làm mới"
            >
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            {deposits.map((deposit) => (
              <div
                key={deposit.id}
                className="bg-white rounded-xl p-4 shadow-md border-2 border-orange-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Mã hợp đồng</p>
                        <p className="text-lg font-bold text-gray-800">{deposit.contract_code}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold animate-pulse">
                        ⏳ Chờ xác nhận
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Người thuê</p>
                        <p className="font-semibold text-gray-800">{deposit.tenant?.fullName || 'N/A'}</p>
                        <p className="text-xs text-gray-600">{deposit.tenant?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Bất động sản</p>
                        <p className="font-semibold text-gray-800">{deposit.property?.title || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Số tiền</p>
                        <p className="text-xl font-bold text-orange-600">
                          {formatCurrency(deposit.deposit_amount)}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Thời gian: {formatDate(deposit.paid_at || deposit.updated_at)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleConfirmDeposit(deposit.contract_code)}
                    disabled={confirming === deposit.contract_code}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 shadow-lg transition-all transform hover:scale-105"
                  >
                    {confirming === deposit.contract_code ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Đang xử lý...
                      </span>
                    ) : (
                      '✅ Xác nhận đã nhận tiền'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== DANH SÁCH GIAO DỊCH THÔNG THƯỜNG ===== */}
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
                    HĐ #{tx.contractId} • {tx.currency} {tx.amount?.toLocaleString('vi-VN')}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(tx.status)}`}>
                      {getStatusText(tx.status)}
                    </span>
                    <span className="text-xs text-gray-500">
                      Phương thức: {getPaymentMethodDisplay(tx)}
                    </span>
                    {tx.type === 'deposit' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                        Đặt cọc
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {/* Nút thanh toán cho tenant */}
                  {tx.status === 'pending' && user?.role === 'tenant' && (
                    <button
                      type="button"
                      onClick={() => handlePay(tx)}
                      className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
                    >
                      Thanh toán
                    </button>
                  )}
                  
                  {/* Nút xác nhận cho landlord/admin */}
                  {tx.status === 'waiting_confirm' && (user?.role === 'landlord' || user?.role === 'admin') && (
                    <button
                      type="button"
                      onClick={() => handleConfirm(tx.id)}
                      className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      Xác nhận đã nhận tiền
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {transactions.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-500 text-center">
              Chưa có giao dịch nào.
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default PaymentsPage;