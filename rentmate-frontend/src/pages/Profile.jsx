import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    avatarUrl: '',
    password: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
          err?.response?.data?.message || 'Không thể tải thông tin tài khoản.',
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = { ...form };
      if (!payload.password) {
        delete payload.password;
      }
      const { data } = await axiosClient.put(`/users/${user.id}`, payload);
      login(data.data, localStorage.getItem('rentmate_token'));
      setSuccess('Cập nhật hồ sơ thành công.');
      setForm((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Không thể lưu thay đổi, thử lại sau.',
      );
    } finally {
      setSaving(false);
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
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-gray-800">Hồ sơ cá nhân</h1>
      <p className="text-sm text-gray-500">
        Xem và chỉnh sửa thông tin tài khoản của bạn.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Họ tên</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              value={form.email}
              disabled
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Số điện thoại</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Ảnh đại diện URL</label>
            <input
              name="avatarUrl"
              value={form.avatarUrl}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Giới thiệu</label>
          <textarea
            name="bio"
            rows={3}
            value={form.bio}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu mới (tuỳ chọn)</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30"
            placeholder="Để trống nếu không đổi"
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
    </section>
  );
};

export default ProfilePage;
