import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/useI18n.js';

const DepositButton = ({ propertyId, landlordId, propertyTitle, landlordName }) => {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();

  const handleDeposit = async () => {
    if (!amount || amount < 100000) {
      alert(t('deposit.error.minAmount'));
      return;
    }
  
    const propertyIdNum = Number(propertyId);
    const landlordIdNum = Number(landlordId);
    const tenantIdNum = Number(user?.id);

    if (isNaN(propertyIdNum) || isNaN(landlordIdNum) || isNaN(tenantIdNum)) {
      alert(t('deposit.error.missingIds'));
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
        tenantName: user?.fullName || t('deposit.fallback.tenant'),
      });
  
      // Fixed: chỉ khai báo biến contractCode một lần
      const contractCode =
        response.data?.contract_code ||
        response.data?.data?.contract_code ||
        response.data?.data?.contractCode ||
        response.data?.contractCode;

      if (!contractCode) {
        throw new Error(t('deposit.error.noContract'));
      }
  
      navigate(`/payment/${contractCode}`);
  
    } catch (error) {
      console.error('Lỗi tạo đặt cọc:', error);
      alert(error.response?.data?.message || t('deposit.error.generic'));
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
        {t('deposit.open')}
      </button>

      {/* Modal nhập thông tin */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-xl font-bold">{t('deposit.title')}</h3>

            <div className="mb-4">
              <label className="mb-2 block">{t('deposit.amountLabel')}</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded border border-gray-200 px-3 py-2"
                placeholder={t('deposit.amountPlaceholder')}
                min="100000"
              />
              <p className="mt-1 text-sm text-gray-500">
                {t('deposit.amountHint')}
              </p>
            </div>

            <div className="mb-6">
              <label className="mb-2 block">{t('deposit.paymentMethod')}</label>
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
                    <span>{t('deposit.momo')}</span>
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
                    <span>{t('deposit.vnpay')}</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded px-4 py-2 border border-gray-200"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeposit}
                disabled={loading}
                className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {loading ? t('common.loading') : t('common.continue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DepositButton;
