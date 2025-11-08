import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { UserRole } from '../utils/constants.js';

const defaultForm = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  role: 'tenant',
};

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const inputClass = (field) =>
    `w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
      errors[field]
        ? 'border-danger focus:border-danger focus:ring-danger/30'
        : 'border-gray-200 focus:border-primary focus:ring-primary/30'
    }`;

  const validateForm = (values) => {
    const nextErrors = {};
    const trimmedName = values.fullName.trim();

    if (!trimmedName) {
      nextErrors.fullName = 'Full name is required';
    } else if (!/^[A-Za-z\s]+$/.test(trimmedName) || trimmedName.length < 2) {
      nextErrors.fullName = 'Full name must be alphabetic with at least 2 characters';
    }

    const phoneValue = values.phone.trim();
    if (!phoneValue) {
      nextErrors.phone = 'Phone number is required';
    } else {
      const hasOnlyValidChars = /^[+\d\s()-]+$/.test(phoneValue);
      const digitCount = phoneValue.replace(/\D/g, '').length;
      if (!hasOnlyValidChars || digitCount < 7 || digitCount > 15) {
        nextErrors.phone = 'Enter a valid phone number';
      }
    }

    if (!values.password) {
      nextErrors.password = 'Password is required';
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}/.test(values.password)
    ) {
      nextErrors.password =
        'Password must be 8+ chars with uppercase, lowercase, and a special symbol';
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      const { data } = await axiosClient.post('/auth/register', form);
      const { user, token } = data.data;
      login(user, token);
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to register';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold text-gray-800">Create your account</h1>
      <form onSubmit={handleSubmit} className="grid gap-5 rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid gap-2">
          <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Your full name"
            value={form.fullName}
            onChange={handleChange}
            required
            className={inputClass('fullName')}
          />
          {errors.fullName && <p className="text-xs text-danger">{errors.fullName}</p>}
        </div>
        <div className="grid gap-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
            className={inputClass('password')}
          />
          {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
        </div>
        <div className="grid gap-2">
          <label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Phone number"
            value={form.phone}
            onChange={handleChange}
            required
            className={inputClass('phone')}
          />
          {errors.phone && <p className="text-xs text-danger">{errors.phone}</p>}
        </div>
        <div className="grid gap-2">
          <label htmlFor="role" className="text-sm font-medium text-gray-700">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
            className={inputClass('role')}
          >
            <option value={UserRole.Tenant}>Tenant</option>
            <option value={UserRole.Landlord}>Landlord</option>
          </select>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-success px-4 py-3 text-sm font-medium text-white transition hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
          <Link
            to="/login"
            className="flex-1 rounded-xl bg-secondary px-4 py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-200"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Register;
