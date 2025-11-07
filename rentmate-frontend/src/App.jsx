import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HeroCarousel } from './components/HeroCarousel';
import { SearchBar } from './components/SearchBar';
import { CategoryTiles } from './components/CategoryTiles';
import { PropertyCard } from './components/PropertyCard';
import { PropertyDetail } from './components/PropertyDetail';
import { AuthPage } from './components/AuthPage';
import { LandlordDashboard } from './components/LandlordDashboard';
import { AIChat } from './components/AIChat';
import { Zap, TrendingUp, Users, Quote } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { UserRole } from './utils/constants';

const propertyImages = [
  'https://images.unsplash.com/photo-1594873604892-b599f847e859?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjIxNTY3OTd8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1579632151052-92f741fb9b79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwYmVkcm9vbSUyMGFwYXJ0bWVudHxlbnwxfHx8fDE3NjIyNDk2Mzl8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1610879485443-c472257793d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBhcGFydG1lbnQlMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc2MjI0MjA0Nnww&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1603072819161-e864800276cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBraXRjaGVuJTIwYXBhcnRtZW50fGVufDF8fHx8MTc2MjIwOTY2M3ww&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1676065701219-3c0c64a4eba5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcGFydG1lbnQlMjBidWlsZGluZyUyMGV4dGVyaW9yfGVufDF8fHx8MTc2MjI0ODM1NHww&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1702014861736-d62834317c5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkaW8lMjBhcGFydG1lbnQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjIxMzI0NDN8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1652553342751-1ca6abba2a28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWxjb255JTIwY2l0eSUyMHZpZXd8ZW58MXx8fHwxNzYyMTkxNjg5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1489769002049-ccd828976a6c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXJuaXNoZWQlMjBhcGFydG1lbnQlMjByb29tfGVufDF8fHx8MTc2MjEyNTg2M3ww&ixlib=rb-4.1.0&q=80&w=1080'
];

const properties = [
  {
    id: 1,
    image: propertyImages[0],
    title: 'Căn Hộ Cao Cấp Quận 1',
    location: 'Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1',
    price: '8.5 triệu',
    originalPrice: '10 triệu',
    bedrooms: 2,
    bathrooms: 2,
    area: 45,
    rating: 4.8,
    reviews: 24,
    badge: 'GIẢM 15%',
    featured: true,
    verified: true
  },
  {
    id: 2,
    image: propertyImages[1],
    title: 'Phòng Trọ Giá Tốt Bình Thạnh',
    location: 'Đường Phan Văn Trị, Phường 5, Bình Thạnh',
    price: '3.5 triệu',
    bedrooms: 1,
    bathrooms: 1,
    area: 25,
    rating: 4.5,
    reviews: 18,
    verified: true
  },
  {
    id: 3,
    image: propertyImages[2],
    title: 'Studio Cao Cấp Phú Nhuận',
    location: 'Đường Phan Xích Long, Phường 2, Phú Nhuận',
    price: '6.2 triệu',
    originalPrice: '7 triệu',
    bedrooms: 1,
    bathrooms: 1,
    area: 30,
    rating: 4.9,
    reviews: 32,
    badge: 'HOT',
    featured: true,
    verified: true
  },
  {
    id: 4,
    image: propertyImages[3],
    title: 'Chung Cư Mini Tân Bình',
    location: 'Đường Trường Chinh, Phường 12, Tân Bình',
    price: '5.2 triệu',
    bedrooms: 1,
    bathrooms: 1,
    area: 35,
    rating: 4.6,
    reviews: 15,
    verified: true
  },
  {
    id: 5,
    image: propertyImages[4],
    title: 'Nhà Nguyên Căn Quận 2',
    location: 'Đường Nguyễn Duy Trinh, Phường Bình Trưng Đông, Quận 2',
    price: '12 triệu',
    bedrooms: 3,
    bathrooms: 2,
    area: 80,
    rating: 4.7,
    reviews: 21,
    badge: 'MỚI',
    featured: true
  },
  {
    id: 6,
    image: propertyImages[5],
    title: 'Phòng Ở Ghép Quận 10',
    location: 'Đường 3 Tháng 2, Phường 11, Quận 10',
    price: '2.8 triệu',
    bedrooms: 1,
    bathrooms: 1,
    area: 20,
    rating: 4.3,
    reviews: 12
  },
  {
    id: 7,
    image: propertyImages[6],
    title: 'Căn Hộ View Đẹp Quận 7',
    location: 'Đường Nguyễn Lương Bằng, Phường Tân Phú, Quận 7',
    price: '9.5 triệu',
    bedrooms: 2,
    bathrooms: 2,
    area: 55,
    rating: 4.8,
    reviews: 28,
    badge: 'VIP',
    featured: true,
    verified: true
  },
  {
    id: 8,
    image: propertyImages[7],
    title: 'Studio Hiện Đại Quận 3',
    location: 'Đường Võ Văn Tần, Phường 6, Quận 3',
    price: '5.8 triệu',
    bedrooms: 1,
    bathrooms: 1,
    area: 28,
    rating: 4.7,
    reviews: 19,
    verified: true
  }
];

const testimonials = [
  {
    id: 1,
    name: 'Nguyễn Thị Mai',
    role: 'Sinh viên',
    avatar: 'https://ui-avatars.com/api/?name=Nguyen+Mai&background=0072BC&color=fff',
    content: 'RentMate giúp tôi tìm được phòng trọ ưng ý chỉ trong 2 ngày. Giao diện dễ dùng, thông tin đầy đủ.',
    rating: 5
  },
  {
    id: 2,
    name: 'Trần Văn Minh',
    role: 'Nhân viên văn phòng',
    avatar: 'https://ui-avatars.com/api/?name=Tran+Minh&background=7ED321&color=fff',
    content: 'Trợ lý AI rất thông minh, hiểu đúng nhu cầu của tôi. Đã giới thiệu cho nhiều đồng nghiệp.',
    rating: 5
  },
  {
    id: 3,
    name: 'Lê Thị Hương',
    role: 'Chủ nhà',
    avatar: 'https://ui-avatars.com/api/?name=Le+Huong&background=FFD400&color=001F3F',
    content: 'Đăng tin dễ dàng, quản lý thuận tiện. Tôi đã cho thuê được 5 phòng trong tháng đầu tiên.',
    rating: 5
  }
];

function AppContent() {
  const [currentPage, setCurrentPage] = React.useState('home');

  const handleNavigate = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleAuth = () => {
    setCurrentPage('home');
  };

  // Render different pages
  if (currentPage === 'detail') {
    return (
      <>
        <PropertyDetail onBack={() => handleNavigate('home')} />
        <AIChat />
        <Toaster />
      </>
    );
  }

  if (currentPage === 'auth') {
    return (
      <>
        <AuthPage onBack={() => handleNavigate('home')} onAuth={handleAuth} />
        <Toaster />
      </>
    );
  }

  if (currentPage === 'landlord') {
    return (
      <>
        <Navbar
          onNavigate={handleNavigate}
          currentPage={currentPage}
        />
        <ProtectedRoute 
          roles={[UserRole.Landlord]}
          fallback={<AuthPage onBack={() => handleNavigate('home')} onAuth={handleAuth} />}
        >
          <LandlordDashboard onBack={() => handleNavigate('home')} />
        </ProtectedRoute>
        <Footer />
        <AIChat />
        <Toaster />
      </>
    );
  }

  // Home Page
  return (
    <div className="min-h-screen">
      <Navbar
        onNavigate={handleNavigate}
        currentPage={currentPage}
      />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <HeroCarousel />
      </section>

      {/* Quick Stats */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#0072BC] to-[#001F3F] text-white rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">10,000+</div>
            <div className="text-sm text-white/80">Phòng Trọ</div>
          </div>
          <div className="bg-gradient-to-br from-[#7ED321] to-[#00B894] text-white rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">50,000+</div>
            <div className="text-sm text-white/80">Người Dùng</div>
          </div>
          <div className="bg-gradient-to-br from-[#FFD400] to-[#FF8C00] text-white rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">1,500+</div>
            <div className="text-sm text-white/80">Chủ Nhà</div>
          </div>
          <div className="bg-gradient-to-br from-[#FF3B30] to-[#E91E63] text-white rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">4.8⭐</div>
            <div className="text-sm text-white/80">Đánh Giá</div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <SearchBar />
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl mb-6">Danh Mục Phổ Biến</h2>
        <CategoryTiles />
      </section>

      {/* Hot Deals Banner */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-[#FFD400] via-[#FF8C00] to-[#FFD400] rounded-3xl p-8 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl text-white mb-1">Ưu Đãi Chớp Nhoáng</h3>
                <p className="text-white/90">Giảm ngay 1 tháng tiền nhà - Chỉ hôm nay!</p>
              </div>
            </div>
            <button className="px-8 py-4 bg-white text-[#FF8C00] rounded-full shadow-xl hover:scale-105 transition-transform">
              Xem Ngay
            </button>
          </div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl mb-2">Phòng Trọ Nổi Bật</h2>
            <p className="text-gray-600">Những lựa chọn tốt nhất dành cho bạn</p>
          </div>
          <button className="flex items-center gap-2 text-[#0072BC] hover:underline">
            <span>Xem tất cả</span>
            <TrendingUp className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {properties.slice(0, 8).map((property) => (
            <PropertyCard
              key={property.id}
              {...property}
              onClick={() => handleNavigate('detail')}
            />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl mb-3">Khách Hàng Nói Gì Về RentMate</h2>
          <p className="text-gray-600">Hơn 50,000 người đã tin tưởng và sử dụng</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow"
            >
              <Quote className="w-10 h-10 text-[#FFD400] mb-4" />
              <p className="text-gray-700 mb-4">{testimonial.content}</p>
              <div className="flex items-center gap-3 pt-4 border-t">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div>{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Landlord CTA */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-[#0072BC] to-[#001F3F] rounded-3xl p-12 text-white text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-4xl mb-4">Bạn Là Chủ Nhà?</h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Đăng tin miễn phí, quản lý thông minh, tiếp cận hàng ngàn khách thuê tiềm năng
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handleNavigate('landlord')}
                className="px-8 py-4 bg-[#FFD400] text-[#001F3F] rounded-full shadow-2xl hover:scale-105 transition-transform"
              >
                Đăng Tin Ngay
              </button>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-colors">
                Tìm Hiểu Thêm
              </button>
            </div>
          </div>
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 -translate-x-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-y-1/2 translate-x-1/2"></div>
          </div>
        </div>
      </section>

      <Footer />
      <AIChat />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
