import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';

const DepositButton = ({ propertyId, landlordId, propertyTitle, landlordName }) => {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleDeposit = async () => {
    if (!amount || amount < 100000) {
      alert('Số tiền đặt cọc phải từ 100.000 VND trở lên');
      return;
    }
  
    const propertyIdNum = Number(propertyId);
    const landlordIdNum = Number(landlordId);
    const tenantIdNum = Number(user?.id);
  
    if (isNaN(propertyIdNum) || isNaN(landlordIdNum) || isNaN(tenantIdNum)) {
      alert('Lỗi hệ thống: Thiếu thông tin người dùng/bất động sản');
      return;
    }
  
    setLoading(true);
  
    try {
      const response = await axiosClient.post('/deposit/create', {
        propertyId: propertyIdNum,
        tenantId: tenantIdNum,
        landlordId: landlordIdNum,
        amount: parseFloat(amount),
        paymentMethod,
        propertyTitle,
        landlordName,
        tenantName: user?.fullName || 'Người thuê',
      });
  
      // Fixed: chỉ khai báo biến contractCode một lần
      const contractCode =
        response.data?.contract_code ||
        response.data?.data?.contract_code ||
        response.data?.data?.contractCode ||
        response.data?.contractCode;
  
      if (!contractCode) {
        throw new Error('Không nhận được mã hợp đồng từ server');
      }
  
      navigate(`/payment/${contractCode}`);
  
    } catch (error) {
      console.error('Lỗi tạo đặt cọc:', error);
      alert(error.response?.data?.message || 'Không thể tạo đặt cọc. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };
  
  return (
    <>
      {/* Deposit Button */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-green-600 hover:to-green-700"
        type="button"
      >
        📝 Đặt cọc ngay
      </button>

      {/* Modal nhập thông tin */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-xl font-bold">Đặt cọc thuê nhà</h3>

            <div className="mb-4">
              <label className="mb-2 block">Số tiền đặt cọc (VND)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded border border-gray-200 px-3 py-2"
                placeholder="Nhập số tiền"
                min="100000"
              />
              <p className="mt-1 text-sm text-gray-500">
                Thông thường: 1-3 tháng tiền nhà
              </p>
            </div>

            <div className="mb-6">
              <label className="mb-2 block">Phương thức thanh toán</label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setPaymentMethod('momo')}
                  className={`flex-1 rounded-lg border p-3 ${
                    paymentMethod === 'momo'
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <img
                      src="/momo-logo.png"
                      alt="MoMo"
                      className="mr-2 h-8 w-8"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <span>Ví MoMo</span>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('vnpay')}
                  className={`flex-1 rounded-lg border p-3 ${
                    paymentMethod === 'vnpay'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <img
                      src="/vnpay-logo.png"
                      alt="VNPay"
                      className="mr-2 h-8 w-8"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <span>VNPay</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded px-4 py-2 border border-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleDeposit}
                disabled={loading}
                className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Tiếp tục'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DepositButton;
