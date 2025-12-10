// src/pages/PaymentPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';

const PaymentPage = () => {
  const { contractCode } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(1800);

  useEffect(() => {
    fetchContract();

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setContract(c => ({ ...c, status: 'expired' }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const poll = setInterval(() => {
      if (contract?.status === 'pending') checkPaymentStatus();
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(poll);
    };
  }, [contractCode]);

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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50"><p className="text-2xl">Đang tải...</p></div>;
  if (error || !contract) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50"><p className="text-2xl text-red-600">{error || 'Không tìm thấy hợp đồng'}</p></div>;

  if (contract.status === 'paid') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 p-8">
        <p className="text-8xl mb-6">Thành công</p>
        <h1 className="text-5xl font-bold text-green-600">Thanh toán thành công!</h1>
        <p className="text-2xl mt-6 text-gray-700">Mã hợp đồng: <strong className="text-pink-600">{contract.contract_code}</strong></p>
        <button onClick={() => navigate('/contracts')} className="mt-10 px-12 py-5 bg-green-600 text-white text-2xl rounded-3xl hover:bg-green-700 shadow-2xl">
          Xem hợp đồng
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800">Thanh toán đặt cọc</h1>
          <p className="text-2xl text-gray-700 mt-4">
            Mã hợp đồng: <span className="font-bold text-pink-600">{contract.contract_code}</span>
          </p>
          {countdown > 0 && contract.status === 'pending' && (
            <p className="text-2xl text-red-600 font-bold mt-6">
              Thời gian còn lại: {formatTime(countdown)}
            </p>
          )}
        </div>

        {/* QR + Thông tin */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 md:p-16 text-center mb-10">

          {contract.payment_method === 'momo' ? (
            <>
              <h2 className="text-3xl font-bold text-pink-700 mb-12">Quét QR bằng MoMo</h2>
              <img
                src="/qr/Momo.jpg"
                alt="QR MoMo"
                className="mx-auto w-96 h-96 md:w-[520px] md:h-[520px] object-contain rounded-3xl shadow-2xl border-12 border-pink-300"
              />
              <div className="mt-12">
                <p className="text-5xl font-bold text-gray-800">HỒ TUẤN PHÁT</p>
                <p className="text-3xl text-gray-600 mt-4">0811 456 461</p>
                <p className="text-3xl font-bold text-red-600 mt-10">
                  Dat coc {contract.contract_code}
                </p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-blue-700 mb-12">Quét QR bằng app ngân hàng</h2>
              <img
                src="/qr/VNPAY.jpg"
                alt="QR Ngân hàng"
                className="mx-auto w-96 h-96 md:w-[520px] md:h-[520px] object-contain rounded-3xl shadow-2xl border-12 border-blue-300"
              />
              <div className="mt-12">
                <p className="text-5xl font-bold text-gray-800">HỒ TUẤN PHÁT</p>
                <p className="text-3xl text-gray-600 mt-4">0811 456 461</p>
                <p className="text-3xl font-bold text-red-600 mt-10">
                  Dat coc {contract.contract_code}
                </p>
              </div>
            </>
          )}

          {/* Số tiền */}
          <div className="mt-16 p-10 bg-gradient-to-r from-pink-100 to-purple-100 rounded-3xl border-4 border-pink-300">
            <p className="text-3xl text-gray-700">Số tiền đặt cọc</p>
            <p className="text-6xl font-bold text-pink-600 mt-4">
              {formatCurrency(contract.deposit_amount)}
            </p>
          </div>
        </div>

        {contract.status === 'waiting_confirmation' && (
        <div className="my-16 text-center">
          <div className="inline-block bg-gradient-to-r from-yellow-100 to-orange-100 rounded-3xl p-12 border-8 border-yellow-500 shadow-2xl max-w-4xl">
            <div className="text-8xl mb-6 animate-pulse">Giờ đồng hồ</div>
            <h2 className="text-5xl font-bold text-orange-800 mb-6">
              ĐANG CHỜ CHỦ NHÀ XÁC NHẬN THANH TOÁN
            </h2>
            <p className="text-3xl text-gray-700 leading-relaxed">
              Bạn đã bấm <strong>“ĐÃ CHUYỂN TIỀN”</strong> thành công!<br />
              Chủ nhà đang kiểm tra giao dịch của bạn.<br />
              Thông thường sẽ được xác nhận trong vòng <strong className="text-red-600">5 phút - 24 giờ</strong>.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <div className="animate-spin rounded-full h-16 w-16 border-8 border-orange-600 border-t-transparent"></div>
            </div>
            <p className="text-2xl text-gray-600 mt-8">
              Vui lòng không thoát trang. Hệ thống sẽ tự động cập nhật khi chủ nhà xác nhận.
            </p>
          </div>
        </div>
      )}

                {/* Trạng thái giao dịch – ĐÃ ĐƯỢC NÂNG CẤP CHO 3 TRẠNG THÁI */}
                <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">Trạng thái giao dịch</h3>
          
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Bước 1: Đã tạo hợp đồng */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                Checkmark
              </div>
              <p className="mt-4 text-lg font-semibold text-green-600">Đã tạo hợp đồng</p>
            </div>

            {/* Thanh tiến trình */}
            <div className="flex-1 h-3 bg-gray-300 rounded-full mx-6 relative overflow-hidden">
              <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-in-out ${
                contract.status === 'paid'
                  ? 'bg-green-500 w-full'
                  : contract.status === 'waiting_confirmation'
                  ? 'bg-orange-500 w-full'
                  : 'bg-gray-400 w-1/2'
              }`}></div>
            </div>

            {/* Bước 2: Thanh toán */}
            <div className="text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-2xl transition-all duration-500 ${
                contract.status === 'paid'
                  ? 'bg-green-500'
                  : contract.status === 'waiting_confirmation'
                  ? 'bg-orange-500 animate-pulse'
                  : 'bg-gray-400'
              }`}>
                {contract.status === 'paid' ? 'Checkmark' : contract.status === 'waiting_confirmation' ? 'Giờ đồng hồ' : 'Giờ đồng hồ'}
              </div>
              <p className={`mt-4 text-lg font-semibold transition-all ${
                contract.status === 'paid'
                  ? 'text-green-600'
                  : contract.status === 'waiting_confirmation'
                  ? 'text-orange-600'
                  : 'text-gray-500'
              }`}>
                {contract.status === 'paid'
                  ? 'Đã thanh toán'
                  : contract.status === 'waiting_confirmation'
                  ? 'Đang chờ xác nhận'
                  : 'Đang chờ thanh toán'}
              </p>
            </div>
          </div>
        </div>

        {/* Điều khoản đặt cọc */}
        <div className="bg-yellow-50 rounded-3xl p-8 mb-8 border-4 border-yellow-300">
          <h4 className="font-bold text-2xl text-yellow-800 mb-6 text-center">Điều khoản đặt cọc:</h4>
          <ul className="list-disc pl-10 text-lg text-gray-700 space-y-4 max-w-3xl mx-auto">
            <li>Tiền cọc sẽ được hoàn trả khi kết thúc hợp đồng thuê</li>
            <li>Không hoàn cọc nếu hủy đặt chỗ sau 24 giờ</li>
            <li>Thanh toán trong thời hạn để giữ chỗ thuê nhà</li>
            <li>Hợp đồng có hiệu lực sau khi thanh toán thành công</li>
          </ul>
        </div>

        {/* Hướng dẫn thanh toán */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-10 border-4 border-blue-300">
          <h4 className="font-bold text-3xl text-blue-800 mb-8 text-center">Hướng dẫn thanh toán:</h4>
          <ol className="list-decimal pl-10 text-xl text-gray-700 space-y-5 max-w-3xl mx-auto">
            <li>Mở ứng dụng <strong>{contract.payment_method === 'momo' ? 'MoMo' : 'ngân hàng'}</strong></li>
            <li>Chọn tính năng <strong>Quét mã QR</strong></li>
            <li>Quét mã QR bên trên</li>
            <li> <strong>(LƯU Ý)</strong>Ghi đúng mã hợp đồng đã gợi ý bên trên, nếu sai sẽ không nhận được tiền</li>
            <li>Kiểm tra kỹ thông tin và nhấn <strong>Xác nhận thanh toán</strong></li>
            <li>Hệ thống sẽ tự động xác nhận sau <strong>1-2 phút</strong></li>
          </ol>
        </div>

        {/* Nút test */}
        {/* XÓA TOÀN BỘ NÚT TEST CŨ ĐI – KHÔNG DÙNG NỮA!!! */}


<div className="text-center mt-20">
  <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-3xl p-12 border-8 border-yellow-400 shadow-2xl max-w-5xl mx-auto">
    <h3 className="text-5xl font-bold text-orange-800 mb-8">
      BẠN ĐÃ CHUYỂN TIỀN THÀNH CÔNG?
    </h3>
    <p className="text-2xl text-gray-700 mb-12 leading-relaxed">
      Vui lòng bấm nút bên dưới để <strong>thông báo cho chủ nhà</strong> biết bạn đã chuyển tiền.<br />
      Sau khi chủ nhà xác nhận, bạn sẽ nhận được hợp đồng chính thức ngay lập tức.
    </p>

    <button
      onClick={async () => {
        if (!confirm('Bạn đã chuyển tiền đúng nội dung chưa?\nBấm OK để gửi thông báo cho chủ nhà.')) return;

        try {
          // CHỈ GỬI THÔNG BÁO – KHÔNG TỰ ĐỘNG XÁC NHẬN!!!
          await axiosClient.post(`/deposit/notify/${contract.contract_code}`);
          
          alert('ĐÃ GỬI THÔNG BÁO THÀNH CÔNG!\nChủ nhà sẽ sớm xác nhận cho bạn.');
          window.location.reload();
        } catch (err) {
          alert('Lỗi gửi thông báo');
        }
      }}
      className="px-32 py-16 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-5xl font-bold rounded-3xl shadow-2xl transition transform hover:scale-110"
    >
      ĐÃ CHUYỂN TIỀN 
    </button>

    <p className="text-2xl text-gray-600 mt-12">
      Trạng thái sẽ chuyển thành <strong className="text-green-600">“ĐÃ THANH TOÁN”</strong> sau khi chủ nhà xác nhận.
    </p>
  </div>
</div>
        
      </div>
    </div>
  );
};

export default PaymentPage;