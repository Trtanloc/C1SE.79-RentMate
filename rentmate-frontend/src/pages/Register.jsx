import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/useI18n.js';

const defaultForm = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
};

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [verificationId, setVerificationId] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('idle'); // idle | sent | verified
  const [verificationError, setVerificationError] = useState(null);
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  useEffect(() => {
    if (!cooldown) {
      return undefined;
    }
    const interval = setInterval(
      () => setCooldown((prev) => Math.max(prev - 1, 0)),
      1000,
    );
    return () => clearInterval(interval);
  }, [cooldown]);

  const inputClass = (field) =>
    `w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
      errors[field]
        ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
        : 'border-gray-200 focus:border-primary focus:ring-primary/20'
    }`;

  const isGmail = (email) => email.trim().toLowerCase().endsWith('@gmail.com');

  const validateForm = (values) => {
    const nextErrors = {};
    const trimmedName = values.fullName.trim();

    if (!trimmedName) {
      nextErrors.fullName = 'Full name is required';
    } else if (!/^[A-Za-z\\s]+$/.test(trimmedName) || trimmedName.length < 2) {
      nextErrors.fullName = 'Use at least 2 alphabetic characters';
    }

    const emailValue = values.email.trim();
    if (!emailValue) {
      nextErrors.email = 'Email is required';
    } else if (!isGmail(emailValue)) {
      nextErrors.email = 'Only gmail.com addresses are allowed for verification';
    }

    const phoneValue = values.phone.trim();
    if (!phoneValue) {
      nextErrors.phone = 'Phone number is required';
    } else {
      const hasOnlyValidChars = /^[+\\d\\s()-]+$/.test(phoneValue);
      const digitCount = phoneValue.replace(/\\D/g, '').length;
      if (!hasOnlyValidChars || digitCount < 7 || digitCount > 15) {
        nextErrors.phone = 'Enter a valid phone number';
      }
    }

    if (!values.password) {
      nextErrors.password = 'Password is required';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}/.test(values.password)) {
      nextErrors.password =
        'Use 8+ chars with upper, lower and special characters';
    }

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) {
        return prev;
      }
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const canSubmit = useMemo(
    () => verificationStatus === 'verified' && Boolean(verificationId),
    [verificationStatus, verificationId],
  );

  const handleSendCode = async () => {
    setVerificationError(null);
    const validationErrors = validateForm(form);
    if (validationErrors.email || validationErrors.phone) {
      setErrors(validationErrors);
      return;
    }
    if (cooldown > 0) {
      return;
    }
    setIsSendingCode(true);
    try {
      const { data } = await axiosClient.post('/auth/register/request-code', {
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      setVerificationId(data.data.verificationId);
      setVerificationStatus('sent');
      setCooldown(60);
      setVerificationError(null);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Unable to send the email verification code right now.';
      setVerificationError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationId) {
      setVerificationError('Request a code before verifying.');
      return;
    }
    if (!code || code.trim().length !== 6) {
      setVerificationError('Enter the 6-digit code we emailed you.');
      return;
    }
    setIsVerifyingCode(true);
    try {
      await axiosClient.post('/auth/register/verify-code', {
        verificationId,
        code: code.trim(),
      });
      setVerificationStatus('verified');
      setVerificationError(null);
    } catch (error) {
      const message = error.response?.data?.message || 'The verification code is invalid.';
      setVerificationError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const beginFacebookOAuth = () => {
    const apiBase =
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      '/api';
    const state = btoa(
      JSON.stringify({
        intent: 'register',
        ts: Date.now(),
      }),
    );
    const url = `${apiBase}/auth/facebook?state=${encodeURIComponent(state)}&returnUrl=${encodeURIComponent('/dashboard')}`;
    window.location.href = url;
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (!canSubmit) {
      setSubmitError('Please verify the email code before continuing.');
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        verificationId,
      };
      const { data } = await axiosClient.post('/auth/register', payload);
      const { user, token } = data.data;
      login(user, token);
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to create your account';
      setSubmitError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-10">
      <div className="absolute inset-x-4 top-10 h-56 rounded-3xl bg-gradient-to-r from-primary via-[#5DE0E6] to-[#FFD400] blur-3xl opacity-40" />
      <div className="relative grid gap-8 rounded-3xl border border-gray-100 bg-white/95 p-8 shadow-xl lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-primary/80">
            RentMate onboarding
          </p>
          <h1 className="text-3xl font-semibold text-brand">{t('register.heading', 'Create your account')}</h1>
          <p className="text-sm text-gray-600">
            {t(
              'register.subheading',
              'We verify every new profile with a Gmail-based OTP to keep landlords and tenants safe. No SMS codes are required.',
            )}
          </p>
          <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 text-sm text-gray-700">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-semibold">
                1
              </span>
              <div>
                <p className="font-semibold text-brand">{t('register.step1', 'Request code')}</p>
                <p className="text-gray-600">{t('register.step1.desc', 'Send a one-time code to your Gmail address.')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-semibold">
                2
              </span>
              <div>
                <p className="font-semibold text-brand">{t('register.step2', 'Verify')}</p>
                <p className="text-gray-600">{t('register.step2.desc', 'Confirm the 6 digits within 10 minutes.')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-semibold">
                3
              </span>
              <div>
                <p className="font-semibold text-brand">{t('register.step3', 'Complete profile')}</p>
                <p className="text-gray-600">
                  {t('register.step3.desc', 'Finish your details and jump into the dashboard.')}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-r from-[#0A2458] to-[#001F3F] p-5 text-sm text-white shadow-lg">
            <p className="font-semibold">{t('register.emailOnly', 'Email OTP is the only verification channel')}</p>
            <p className="text-white/80">
              {t(
                'register.emailOnly.desc',
                'SMS gateways are disabled across the stack. All verification happens over email to keep the flow consistent and auditable.',
              )}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="lg:col-span-3 space-y-5 rounded-2xl border border-gray-100 bg-white/90 p-6 shadow-lg"
        >
          <div className="grid gap-2">
            <label htmlFor="fullName" className="text-sm font-semibold text-gray-800">
              {t('register.fullName', 'Full name')}
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Jane Doe"
              value={form.fullName}
              onChange={handleChange}
              required
              className={inputClass('fullName')}
            />
            {errors.fullName && <p className="text-xs text-danger">{errors.fullName}</p>}
          </div>
          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-semibold text-gray-800">
              Gmail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="your.name@gmail.com"
              value={form.email}
              onChange={handleChange}
              required
              className={inputClass('email')}
            />
            {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 sm:items-end sm:gap-4">
            <div className="grid gap-2">
              <label htmlFor="phone" className="text-sm font-semibold text-gray-800">
                {t('register.phone', 'Phone number')}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+84 912 345 678"
                value={form.phone}
                onChange={handleChange}
                required
                className={inputClass('phone')}
              />
              {errors.phone && <p className="text-xs text-danger">{errors.phone}</p>}
            </div>
          </div>
          <div className="grid gap-2">
            <label htmlFor="password" className="text-sm font-semibold text-gray-800">
              {t('register.password', 'Password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Choose a strong password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              className={inputClass('password')}
            />
            {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
          </div>
          <div className="grid gap-3 rounded-xl border border-dashed border-gray-200 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="code" className="text-sm font-semibold text-gray-800">
                  {t('register.code', 'Email code')}
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6 digits"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSendingCode || cooldown > 0}
                  className="w-full rounded-xl border border-primary px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSendingCode
                    ? t('register.sendCode', 'Sending...')
                    : cooldown > 0
                      ? `${t('register.sendCode', 'Send code')} (${cooldown}s)`
                      : t('register.sendCode', 'Send code')}
                </button>
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={isVerifyingCode || !verificationId}
                  className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isVerifyingCode ? t('register.verifyCode', 'Verifying...') : t('register.verifyCode', 'Verify code')}
                </button>
              </div>
            </div>
            {verificationStatus === 'verified' && (
              <p className="text-sm font-semibold text-emerald-700">
                {t('register.codeVerified', 'Email confirmed. You can finish creating your account.')}
              </p>
            )}
            {verificationError && <p className="text-sm text-danger">{verificationError}</p>}
          </div>
          {submitError && <p className="text-sm text-danger">{submitError}</p>}
          <button
            type="button"
            onClick={beginFacebookOAuth}
            className="w-full rounded-xl border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Đăng ký nhanh với Facebook
          </button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="flex-1 rounded-xl bg-[#FFD400] px-4 py-3 text-sm font-semibold text-[#001F3F] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? t('register.submit', 'Creating account...') : t('register.submit', 'Create account')}
            </button>
            <Link
              to="/login"
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              {t('register.backLogin', 'Back to login')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
