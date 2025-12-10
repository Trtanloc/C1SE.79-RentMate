import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { resolveAssetUrl } from '../utils/assets.js';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    avatarUrl: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await axiosClient.get(`/users/${user.id}`);
        const profile = data?.data || {};
        setForm((prev) => ({
          ...prev,
          fullName: profile.fullName || '',
          email: profile.email || '',
          phone: profile.phone || '',
          bio: profile.bio || '',
          avatarUrl: profile.avatarUrl || '',
        }));
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            'Không thể tải thông tin tài khoản. Vui lòng thử lại.',
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        fullName: form.fullName,
        phone: form.phone,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
      };
      const { data } = await axiosClient.put(`/users/${user.id}`, payload);
      login(data.data, localStorage.getItem('rentmate_token'));
      setSuccess('Cập nhật hồ sơ thành công.');
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Không thể lưu thay đổi, thử lại sau.',
      );
    } finally {
      setSaving(false);
    }
  };

  const avatarPreview = useMemo(() => resolveAssetUrl(form.avatarUrl), [form.avatarUrl]);

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmNewPassword
    ) {
      setPasswordError('Vui lòng nhập đầy đủ thông tin.');
      setPasswordSaving(false);
      return;
    }

    if (passwordForm.newPassword === passwordForm.currentPassword) {
      setPasswordError('Mật khẩu mới phải khác mật khẩu cũ.');
      setPasswordSaving(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError('Xác nhận mật khẩu không khớp.');
      setPasswordSaving(false);
      return;
    }

    try {
      await axiosClient.put(`/users/${user.id}/password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmNewPassword,
      });
      setPasswordSuccess('Đổi mật khẩu thành công.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (err) {
      setPasswordError(
        err?.response?.data?.message ||
          'Không thể đổi mật khẩu lúc này. Vui lòng thử lại.',
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-500">
          Đang tải thông tin...
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-gray-800">Hồ sơ cá nhân</h1>
      <p className="text-sm text-gray-500">
        Quản lý thông tin tài khoản và cập nhật mật khẩu của bạn.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-800">
            Thông tin tài khoản
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Họ tên
              </label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                name="email"
                value={form.email}
                disabled
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Số điện thoại
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Ảnh đại diện URL
              </label>
              <input
                name="avatarUrl"
                value={form.avatarUrl}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
              {avatarPreview && (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="mt-2 h-16 w-16 rounded-full object-cover"
                />
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Giới thiệu
            </label>
            <textarea
              name="bio"
              rows={3}
              value={form.bio}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {success && <p className="text-sm text-emerald-600">{success}</p>}
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>

        <form
          onSubmit={handlePasswordSubmit}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-800">
            Đổi mật khẩu
          </h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mật khẩu cũ
            </label>
            <input
              name="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mật khẩu mới
            </label>
            <input
              name="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Xác nhận mật khẩu mới
            </label>
            <input
              name="confirmNewPassword"
              type="password"
              value={passwordForm.confirmNewPassword}
              onChange={handlePasswordChange}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>
          {passwordSuccess && (
            <p className="text-sm text-emerald-600">{passwordSuccess}</p>
          )}
          {passwordError && (
            <p className="text-sm text-rose-600">{passwordError}</p>
          )}
          <button
            type="submit"
            disabled={passwordSaving}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {passwordSaving ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ProfilePage;
