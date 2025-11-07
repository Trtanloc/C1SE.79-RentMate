import React from 'react';
import {
  Home, TrendingUp, Eye, MessageCircle, DollarSign, Plus, Edit, Trash2,
  MoreVertical, ArrowUp, ArrowDown, BarChart3, Calendar, Users
} from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const stats = [
  {
    id: 1,
    label: 'Tổng Tin Đăng',
    value: '24',
    change: '+2',
    trend: 'up',
    icon: Home,
    color: 'from-[#0072BC] to-[#001F3F]'
  },
  {
    id: 2,
    label: 'Lượt Xem Tuần Này',
    value: '1,234',
    change: '+15.3%',
    trend: 'up',
    icon: Eye,
    color: 'from-[#7ED321] to-[#00B894]'
  },
  {
    id: 3,
    label: 'Tin Nhắn Mới',
    value: '47',
    change: '+8',
    trend: 'up',
    icon: MessageCircle,
    color: 'from-[#FFD400] to-[#FF8C00]'
  },
  {
    id: 4,
    label: 'Doanh Thu Tháng',
    value: '185tr',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'from-[#FF3B30] to-[#E91E63]'
  }
];

const viewsData = [
  { name: 'T2', views: 234, messages: 12 },
  { name: 'T3', views: 456, messages: 18 },
  { name: 'T4', views: 389, messages: 15 },
  { name: 'T5', views: 567, messages: 24 },
  { name: 'T6', views: 678, messages: 28 },
  { name: 'T7', views: 890, messages: 35 },
  { name: 'CN', views: 745, messages: 30 }
];

const revenueData = [
  { month: 'T1', revenue: 145 },
  { month: 'T2', revenue: 152 },
  { month: 'T3', revenue: 168 },
  { month: 'T4', revenue: 172 },
  { month: 'T5', revenue: 178 },
  { month: 'T6', revenue: 185 }
];

const listings = [
  {
    id: 1,
    title: 'Căn hộ cao cấp Quận 1',
    price: '8.5tr',
    status: 'active',
    views: 234,
    messages: 12,
    image: 'https://images.unsplash.com/photo-1594873604892-b599f847e859?w=100&h=100&fit=crop'
  },
  {
    id: 2,
    title: 'Phòng trọ Bình Thạnh',
    price: '3.5tr',
    status: 'active',
    views: 189,
    messages: 8,
    image: 'https://images.unsplash.com/photo-1579632151052-92f741fb9b79?w=100&h=100&fit=crop'
  },
  {
    id: 3,
    title: 'Chung cư mini Tân Bình',
    price: '5.2tr',
    status: 'pending',
    views: 156,
    messages: 5,
    image: 'https://images.unsplash.com/photo-1610879485443-c472257793d1?w=100&h=100&fit=crop'
  }
];

export function LandlordDashboard({ onBack }) {
  const [showAddPropertyModal, setShowAddPropertyModal] = React.useState(false);
  const [step, setStep] = React.useState(1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl mb-1">Dashboard Chủ Nhà</h1>
              <p className="text-gray-600">Quản lý tin đăng và theo dõi hiệu suất</p>
            </div>
            <Dialog open={showAddPropertyModal} onOpenChange={setShowAddPropertyModal}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-[#0072BC] to-[#001F3F] text-white rounded-full px-6">
                  <Plus className="w-5 h-5 mr-2" />
                  Đăng Tin Mới
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Đăng Tin Cho Thuê</DialogTitle>
                </DialogHeader>
                <PropertyForm step={step} setStep={setStep} onClose={() => {
                  setShowAddPropertyModal(false);
                  setStep(1);
                }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.id} className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div className="text-3xl mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Views & Messages Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl mb-1">Lượt Xem & Tin Nhắn</h3>
                <p className="text-sm text-gray-600">7 ngày qua</p>
              </div>
              <BarChart3 className="w-6 h-6 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={viewsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#0072BC" radius={[8, 8, 0, 0]} />
                <Bar dataKey="messages" fill="#FFD400" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#0072BC] rounded-full"></div>
                <span className="text-sm text-gray-600">Lượt xem</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#FFD400] rounded-full"></div>
                <span className="text-sm text-gray-600">Tin nhắn</span>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl mb-1">Doanh Thu</h3>
                <p className="text-sm text-gray-600">6 tháng qua</p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7ED321"
                  strokeWidth={3}
                  dot={{ fill: '#7ED321', r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-xl">Danh Sách Tin Đăng</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tin Đăng</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead>Lượt Xem</TableHead>
                <TableHead>Tin Nhắn</TableHead>
                <TableHead className="text-right">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={listing.image}
                        alt={listing.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <span>{listing.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>{listing.price}</TableCell>
                  <TableCell>
                    <Badge
                      variant={listing.status === 'active' ? 'default' : 'secondary'}
                      className={listing.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                    >
                      {listing.status === 'active' ? 'Đang hoạt động' : 'Chờ duyệt'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span>{listing.views}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      <span>{listing.messages}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="rounded-full">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-full text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-full">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function PropertyForm({ step, setStep, onClose }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-3 ${s <= step ? 'text-[#0072BC]' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                s <= step ? 'bg-[#0072BC] text-white' : 'bg-gray-200'
              }`}>
                {s}
              </div>
              <span className="hidden sm:inline">
                {s === 1 && 'Thông tin cơ bản'}
                {s === 2 && 'Chi tiết'}
                {s === 3 && 'Hình ảnh'}
              </span>
            </div>
            {s < 3 && <div className={`flex-1 h-1 mx-4 ${s < step ? 'bg-[#0072BC]' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Tiêu đề tin đăng</label>
            <input
              type="text"
              placeholder="VD: Căn hộ cao cấp Quận 1"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#0072BC] outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Loại hình</label>
              <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#0072BC] outline-none" required>
                <option value="">Chọn loại hình</option>
                <option>Phòng trọ</option>
                <option>Chung cư mini</option>
                <option>Nhà nguyên căn</option>
                <option>Studio</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">Giá thuê (VNĐ/tháng)</label>
              <input
                type="number"
                placeholder="3000000"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#0072BC] outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2">Địa chỉ</label>
            <input
              type="text"
              placeholder="Số nhà, đường, phường, quận"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#0072BC] outline-none"
              required
            />
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2">Diện tích (m²)</label>
              <input
                type="number"
                placeholder="45"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#0072BC] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Phòng ngủ</label>
              <input
                type="number"
                placeholder="2"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#0072BC] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Phòng tắm</label>
              <input
                type="number"
                placeholder="1"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#0072BC] outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2">Mô tả chi tiết</label>
            <textarea
              rows={5}
              placeholder="Mô tả về phòng trọ, tiện ích xung quanh..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#0072BC] outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Tiện nghi</label>
            <div className="grid grid-cols-2 gap-3">
              {['Wifi', 'Điều hòa', 'Tủ lạnh', 'Máy giặt', 'Bếp', 'Ban công'].map((amenity) => (
                <label key={amenity} className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">{amenity}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Images */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Hình ảnh</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#0072BC] transition-colors cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-gray-600">Kéo thả hoặc click để chọn ảnh</p>
                  <p className="text-sm text-gray-400 mt-1">Tối đa 10 ảnh, mỗi ảnh không quá 5MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-6 border-t">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(step - 1)}
            className="rounded-full"
          >
            Quay lại
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-full"
          >
            Hủy
          </Button>
        )}
        <Button
          type="submit"
          className="bg-gradient-to-r from-[#0072BC] to-[#001F3F] text-white rounded-full px-8"
        >
          {step < 3 ? 'Tiếp theo' : 'Đăng tin'}
        </Button>
      </div>
    </form>
  );
}