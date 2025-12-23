// src/pages/PaymentPage.jsx - Phiên bản HOÀN HẢO cuối cùng
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { AlertCircle, CheckCircle, Clock, Shield, Info } from 'lucide-react';

const PaymentPage = () => {
  const { contractCode } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(1800);

  useEffect(() => {
    fetchContract();
  }, [contractCode]);

  useEffect(() => {
    if (!contract || contract.status !== 'pending') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setContract((c) => {
            if (!c || c.status !== 'pending') return c;
            return { ...c, status: 'expired' };
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [contract?.status]);

  useEffect(() => {
    if (!contract || (contract.status !== 'pending' && contract.status !== 'waiting_confirmation')) return;

    const poll = setInterval(() => {
      checkPaymentStatus();
    }, 5000);

    return () => clearInterval(poll);
  }, [contract?.status]);

  const fetchContract = async () => {
    try {
      const { data } = await axiosClient.get(`/deposit/contract/${contractCode}`);
      setContract(data);
      if (data.expires_at) {
        const diff = Math.floor((new Date(data.expires_at) - Date.now()) / 1000);
        setCountdown(Math.max(0, diff));
      }
    } catch (err) {
      setError('Không tìm thấy hợp đồng hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const { data } = await axiosClient.get(`/deposit/contract/${contractCode}`);
      if (data.status !== contract?.status) {
        setContract(data);
        if (data.status === 'paid') {
          setTimeout(() => navigate('/contracts'), 3000);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const formatCurrency = amount => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const handleNotify = async () => {
    if (!confirm('Bạn đã chuyển tiền đúng số tiền và thông tin chưa?\nBấm OK để gửi thông báo cho chủ nhà.')) return;

    try {
      await axiosClient.post(`/deposit/notify/${contract.contract_code}`);
      alert('ĐÃ GỬI THÔNG BÁO THÀNH CÔNG!\nChủ nhà sẽ sớm xác nhận cho bạn.');
      window.location.reload();
    } catch (err) {
      alert('Lỗi gửi thông báo. Vui lòng thử lại.');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-2xl">Đang tải...</p></div>;
if (error || !contract) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-2xl text-red-600">{error || 'Không tìm thấy hợp đồng'}</p></div>;

  if (contract.status === 'paid') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-8">
        <CheckCircle className="w-32 h-32 text-green-600 mb-6" />
        <h1 className="text-5xl font-bold text-green-600 mb-6">Thanh toán thành công!</h1>
        <p className="text-2xl text-gray-700">Mã hợp đồng: <strong className="text-purple-600">{contract.contract_code}</strong></p>
        <button onClick={() => navigate('/contracts')} className="mt-10 px-12 py-5 bg-green-600 text-white text-2xl rounded-3xl hover:bg-green-700 shadow-2xl transition">
          Xem hợp đồng
        </button>
      </div>
    );
  }

  const isMomo = contract.payment_method === 'momo';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">

      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Thanh toán đặt cọc - Mã hợp đồng:
            </h1>
            <span className="text-xl font-mono font-bold text-purple-700 bg-purple-100 px-5 py-2 rounded-xl">
              {contract.contract_code}
            </span>
          </div>

          {countdown > 0 && contract.status === 'pending' && (
            <div className="flex items-center gap-3 bg-red-50 px-6 py-4 rounded-xl border-2 border-red-400 shadow-md">
              <Clock className="w-9 h-9 text-red-600 animate-pulse" />
              <div>
                <div className="text-sm font-medium text-red-600">Thời gian còn lại</div>
                <div className="text-3xl font-bold text-red-600">{formatTime(countdown)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-10">

          {/* CỘT TRÁI: QR + Thông tin + Nút hành động */}
          <div className="space-y-8">

            {/* QR Code */}
            <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-200">
              <div className={`w-full flex items-center justify-center gap-4 px-8 py-5 rounded-full mb-10 shadow-xl font-bold text-xl tracking-wide transition-all ${
              isMomo 
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white'
: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
                }`}>
                {isMomo ? 'MoMo' : 'Ngân hàng'}
                <span className="ml-2">Quét mã QR để thanh toán</span>
              </div>

              <div className="flex justify-center mb-10">
                <div className="relative">
                  <img
                    src={isMomo ? "/qr/Momo.jpg" : "/qr/VNPAY.jpg"}
                    alt="QR Thanh toán"
                    className="w-80 h-80 rounded-3xl shadow-2xl border-8 border-white"
                  />
                  <div className="absolute inset-0 rounded-3xl border-8 border-dashed border-gray-300 opacity-30"></div>
                </div>
              </div>

              {/* Thông tin người nhận + số tiền */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-10 text-center border">
          <p className="text-gray-500 text-lg">Người nhận</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">HỒ TUẤN PHÁT</p>
          <p className="text-xl text-gray-600 mt-3 font-mono">0811 456 461</p>

          <div className="mt-8 pt-8 border-t">
          <p className="text-gray-500 text-lg">Số tiền cần chuyển</p>
          <p className="text-5xl font-bold text-black mt-3">
            {formatCurrency(contract.deposit_amount)}
          </p>

          </div>
        </div>

        {/*   Nút hành động dựa trên trạng thái hợp đồng */}
        {contract.status === 'pending' && (
          <button
            onClick={handleNotify}
            className="w-full py-6 bg-red-600 hover:bg-red-700 text-white text-2xl font-bold rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95"
          >
            XÁC NHẬN ĐÃ CHUYỂN TIỀN
          </button>
        )}

        {/* Đang chờ xác nhận */}
        {contract.status === 'waiting_confirmation' && (
          <div className="w-full py-6 bg-orange-500 text-white text-2xl font-bold rounded-full text-center shadow-xl">
            ĐANG CHỜ CHỦ NHÀ XÁC NHẬN...
          </div>
        )}
            </div>
          </div>

          {/*  Trạng thái + Điều khoản + Lưu ý */}
          <div className="space-y-8">

            

            {/* Điều khoản + Lưu ý - Đoạn bạn vừa gửi */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Điều khoản đặt cọc */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-6 h-6 text-amber-600" />
                  <h4 className="font-bold text-gray-900 text-lg">Điều khoản đặt cọc</h4>
                </div>
                <ul className="space-y-3 text-gray-700">
<li className="flex gap-3"><span className="text-amber-600 mt-1">•</span> Tiền cọc sẽ được hoàn trả khi kết thúc hợp đồng</li>
                  <li className="flex gap-3"><span className="text-amber-600 mt-1">•</span> Không hoàn cọc nếu hủy đặt chỗ sau 24 giờ</li>
                  <li className="flex gap-3"><span className="text-amber-600 mt-1">•</span> Thanh toán trong thời hạn để giữ chỗ</li>
                  <li className="flex gap-3"><span className="text-amber-600 mt-1">•</span> Hợp đồng có hiệu lực sau khi thanh toán</li>
                </ul>
              </div>

              {/* Lưu ý quan trọng */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-6 h-6 text-green-600" />
                  <h4 className="font-bold text-gray-900 text-lg">Lưu ý quan trọng</h4>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex gap-3"><span className="text-green-600 mt-1">•</span>(LƯU Ý) Ghi chính xác Mã hợp đồng khi chuyển tiền</li>
                  <li className="flex gap-3"><span className="text-green-600 mt-1">•</span> Kiểm tra kỹ số tiền trước khi xác nhận</li>
                  <li className="flex gap-3"><span className="text-green-600 mt-1">•</span> Giữ lại biên lai giao dịch</li>
                  <li className="flex gap-3"><span className="text-green-600 mt-1">•</span> Liên hệ hỗ trợ nếu có vấn đề</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
