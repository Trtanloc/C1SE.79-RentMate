import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Clock, Info, Shield } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import { useI18n } from '../i18n/useI18n.js';

const PaymentPage = () => {
  const { contractCode } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(1800);
  const [redirecting, setRedirecting] = useState(false);

  const isPaidStatus = (status) => ['paid', 'completed'].includes((status || '').toLowerCase());
  const isPending = (status) =>
    status === 'pending' || status === 'waiting_confirmation' || status === 'waiting';

  const getContractId = (value) => value?.contractId || value?.contract_id || value?.id;
  const redirectToContract = (payload, replace = true) => {
    const contractId = getContractId(payload);
    const destination = contractId ? `/contracts/${contractId}` : '/contracts';
    setRedirecting(true);
    navigate(destination, { replace, state: { fromPayment: true } });
  };

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
    if (!contract || !isPending(contract.status)) return;

    const poll = setInterval(() => {
      checkPaymentStatus();
    }, 5000);

    return () => clearInterval(poll);
  }, [contract?.status]);

  useEffect(() => {
    if (!contract) return undefined;
    if (isPaidStatus(contract.status)) {
      const timer = setTimeout(() => redirectToContract(contract, true), 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [contract, contract?.status]);

  const fetchContract = async () => {
    try {
      const { data } = await axiosClient.get(`/deposit/contract/${contractCode}`);
      const payload = data?.data || data;
      setContract(payload);
      if (payload?.expires_at) {
        const diff = Math.floor((new Date(payload.expires_at) - Date.now()) / 1000);
        setCountdown(Math.max(0, diff));
      }
      if (isPaidStatus(payload?.status)) {
        redirectToContract(payload, true);
      }
    } catch (err) {
      setError(t('payment.error.notFound'));
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const { data } = await axiosClient.get(`/deposit/contract/${contractCode}`);
      const payload = data?.data || data;
      if (payload.status !== contract?.status) {
        setContract(payload);
      }
      if (isPaidStatus(payload.status)) {
        redirectToContract(payload, true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const handleNotify = async () => {
    if (!confirm(t('payment.notify.confirm'))) return;

    try {
      await axiosClient.post(`/deposit/notify/${contract.contract_code}`);
      alert(t('payment.notify.success'));
      window.location.reload();
    } catch (err) {
      alert(t('payment.notify.error'));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-2xl">{t('payment.loading')}</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-2xl text-red-600">{error || t('payment.error.notFound')}</p>
      </div>
    );
  }

  if (contract && isPaidStatus(contract.status)) {
    const contractId = getContractId(contract);
    const contractPath = contractId ? `/contracts/${contractId}` : '/contracts';
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-8">
        <CheckCircle className="mb-6 h-32 w-32 text-green-600" />
        <h1 className="mb-4 text-4xl font-bold text-green-700">{t('payment.success.title')}</h1>
        <p className="text-lg text-gray-700">
          {t('payment.success.contractCode')}:{' '}
          <strong className="text-purple-600">{contract.contract_code}</strong>
        </p>
        <p className="mt-3 text-base text-gray-600">{t('payment.success.redirecting')}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate(contractPath, { replace: true, state: { fromPayment: true } })}
            className="rounded-2xl border border-green-200 px-5 py-3 text-base font-semibold text-green-700 transition hover:border-green-400"
          >
            {redirecting ? t('payment.success.loading') : t('payment.success.gotoContract')}
          </button>
          <button
            onClick={() => navigate('/contracts', { replace: true })}
            className="rounded-2xl border border-gray-200 px-5 py-3 text-base font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            {t('payment.success.list')}
          </button>
        </div>
      </div>
    );
  }

  const isMomo = (contract?.payment_method || '').toLowerCase() === 'momo';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="sticky top-0 z-50 border-b bg-white/95 shadow-lg backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-brand">
              {t('payment.header')} #{contract.contract_code}
            </div>
          </div>

          {countdown > 0 && contract.status === 'pending' && (
            <div className="flex items-center gap-3 rounded-xl border-2 border-red-400 bg-red-50 px-5 py-3 shadow-md">
              <Clock className="h-7 w-7 text-red-600 animate-pulse" />
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-red-600">
                  {t('payment.countdown.label')}
                </div>
                <div className="text-2xl font-bold text-red-600">{formatTime(countdown)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div
              className={`mb-6 flex items-center justify-center gap-3 rounded-2xl px-6 py-4 text-lg font-semibold text-white shadow-lg ${
                isMomo
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-600'
              }`}
            >
              <span>{isMomo ? 'MoMo' : t('payment.method.bank')}</span>
              <span className="text-sm text-white/80">{t('payment.method.scan')}</span>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl">
              <div className="flex justify-center">
                <img
                  src={isMomo ? '/qr/Momo.jpg' : '/qr/VNPAY.jpg'}
                  alt={t('payment.qrAlt')}
                  className="h-80 w-80 rounded-2xl border-8 border-white shadow-2xl"
                />
              </div>

              <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
                <p className="text-sm font-semibold text-gray-500">{t('payment.receiver.label')}</p>
                <p className="mt-2 text-2xl font-bold text-gray-800">
                  {contract.payee_name || 'HỒ TUẤN PHÁT'}
                </p>
                <p className="mt-1 font-mono text-lg text-gray-600">
                  {contract.payee_phone || '0811 456 461'}
                </p>

                <div className="mt-6 border-t pt-6">
                  <p className="text-sm font-semibold text-gray-500">
                    {t('payment.amount.label')}
                  </p>
                  <p className="mt-2 text-4xl font-bold text-brand">
                    {formatCurrency(contract.deposit_amount)}
                  </p>
                </div>
              </div>

              {contract.status === 'pending' && (
                <button
                  onClick={handleNotify}
                  className="mt-6 w-full rounded-full bg-red-600 py-4 text-lg font-bold text-white shadow-xl transition hover:bg-red-700"
                >
                  {t('payment.notify.cta')}
                </button>
              )}

              {contract.status === 'waiting_confirmation' && (
                <div className="mt-6 w-full rounded-full bg-orange-500 py-4 text-center text-lg font-bold text-white shadow-xl">
                  {t('payment.status.waiting')}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-800">
                  {t('payment.terms.title')}
                </h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                <li className="flex gap-3">
                  <span className="mt-1 text-primary">•</span>
                  <span>{t('payment.terms.item1')}</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 text-primary">•</span>
                  <span>{t('payment.terms.item2')}</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 text-primary">•</span>
                  <span>{t('payment.terms.item3')}</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 text-primary">•</span>
                  <span>{t('payment.terms.item4')}</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-800">
                  {t('payment.notes.title')}
                </h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                <li className="flex gap-3">
                  <span className="mt-1 text-primary">•</span>
                  <span>{t('payment.notes.item1')}</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 text-primary">•</span>
                  <span>{t('payment.notes.item2')}</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 text-primary">•</span>
                  <span>{t('payment.notes.item3')}</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 text-primary">•</span>
                  <span>{t('payment.notes.item4')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
