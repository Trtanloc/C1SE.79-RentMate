import React from 'react';
import {
  ArrowLeft, Heart, Share2, MapPin, Bed, Bath, Maximize, Wifi, 
  Tv, AirVent, Car, Shield, Phone, Mail, Star, Check, X,
  MessageCircle, AlertCircle, Home
} from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';

const propertyImages = [
  'https://images.unsplash.com/photo-1594873604892-b599f847e859?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjIxNTY3OTd8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1610879485443-c472257793d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBhcGFydG1lbnQlMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc2MjI0MjA0Nnww&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1579632151052-92f741fb9b79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwYmVkcm9vbSUyMGFwYXJ0bWVudHxlbnwxfHx8fDE3NjIyNDk2Mzl8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1603072819161-e864800276cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBraXRjaGVuJTIwYXBhcnRtZW50fGVufDF8fHx8MTc2MjIwOTY2M3ww&ixlib=rb-4.1.0&q=80&w=1080'
];

const amenities = [
  { icon: Wifi, label: 'Wifi miễn phí', available: true },
  { icon: AirVent, label: 'Điều hòa', available: true },
  { icon: Tv, label: 'TV', available: true },
  { icon: Car, label: 'Chỗ đậu xe', available: true },
  { icon: Home, label: 'Nội thất đầy đủ', available: true },
  { icon: Shield, label: 'An ninh 24/7', available: true }
];

const reviews = [
  {
    id: 1,
    user: 'Nguyễn Thị Mai',
    rating: 5,
    date: '2 tuần trước',
    comment: 'Phòng rất đẹp, chủ nhà thân thiện. Vị trí thuận tiện đi lại.',
    avatar: 'https://ui-avatars.com/api/?name=Nguyen+Mai&background=0072BC&color=fff'
  },
  {
    id: 2,
    user: 'Trần Văn Minh',
    rating: 4,
    date: '1 tháng trước',
    comment: 'Giá hợp lý, phòng sạch sẽ. Chỉ thiếu chỗ phơi đồ.',
    avatar: 'https://ui-avatars.com/api/?name=Tran+Minh&background=7ED321&color=fff'
  }
];

export function PropertyDetail({ onBack }) {
  const [selectedImage, setSelectedImage] = React.useState(0);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [showContactSticky, setShowContactSticky] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowContactSticky(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-[#0072BC] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Quay lại</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="w-10 h-10 rounded-full border-2 border-gray-200 hover:border-[#0072BC] flex items-center justify-center transition-all"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
              </button>
              <button className="w-10 h-10 rounded-full border-2 border-gray-200 hover:border-[#0072BC] flex items-center justify-center transition-all">
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-md">
              <div className="relative h-96">
                <ImageWithFallback
                  src={propertyImages[selectedImage]}
                  alt="Property"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <div className="px-4 py-2 bg-gradient-to-r from-[#FFD400] to-[#FF8C00] text-[#001F3F] rounded-full">
                    <span className="flex items-center gap-1 text-sm">
                      KHUYẾN MÃI
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 p-4">
                {propertyImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative h-24 rounded-lg overflow-hidden ${
                      selectedImage === index ? 'ring-4 ring-[#0072BC]' : ''
                    }`}
                  >
                    <ImageWithFallback
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Property Info */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl mb-2">Căn Hộ Cao Cấp Quận 1</h1>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-5 h-5" />
                    <span>123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 py-4 border-y border-gray-200">
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5 text-gray-600" />
                  <span>2 Phòng ngủ</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="w-5 h-5 text-gray-600" />
                  <span>2 WC</span>
                </div>
                <div className="flex items-center gap-2">
                  <Maximize className="w-5 h-5 text-gray-600" />
                  <span>45m²</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-[#FFD400] text-[#FFD400]" />
                  <span>4.8 (24 đánh giá)</span>
                </div>
              </div>

              {/* Price */}
              <div className="mt-6">
                <div className="flex items-end gap-3">
                  <div className="text-4xl text-[#0072BC]">8.5 triệu</div>
                  <div className="text-gray-500 pb-1">/tháng</div>
                  <div className="text-gray-400 line-through text-lg pb-1">10 triệu</div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Giá đã bao gồm: Điện, nước, internet, phí quản lý
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="description" className="bg-white rounded-2xl shadow-md">
              <TabsList className="w-full grid grid-cols-4 p-4">
                <TabsTrigger value="description">Mô Tả</TabsTrigger>
                <TabsTrigger value="amenities">Tiện Nghi</TabsTrigger>
                <TabsTrigger value="pricing">Giá Cả</TabsTrigger>
                <TabsTrigger value="reviews">Đánh Giá</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="p-6">
                <h3 className="text-xl mb-4">Mô Tả Chi Tiết</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Căn hộ cao cấp nằm tại vị trí đắc địa ở trung tâm Quận 1, gần các trung tâm thương mại, 
                  trường học và bệnh viện. Phòng được thiết kế hiện đại, đầy đủ nội thất cao cấp.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Khu vực an ninh 24/7, có thang máy, chỗ để xe miễn phí. Phù hợp cho cặp đôi, gia đình nhỏ 
                  hoặc người đi làm.
                </p>
                <div className="bg-blue-50 border-l-4 border-[#0072BC] p-4 rounded-r-lg mt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-[#0072BC] flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <strong>Lưu ý:</strong> Không nuôi thú cưng, không hút thuốc trong nhà. 
                      Cọc 2 tháng tiền thuê.
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="amenities" className="p-6">
                <h3 className="text-xl mb-4">Tiện Nghi & Dịch Vụ</h3>
                <div className="grid grid-cols-2 gap-4">
                  {amenities.map((amenity, index) => {
                    const Icon = amenity.icon;
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-4 rounded-xl ${
                          amenity.available ? 'bg-green-50' : 'bg-gray-50'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${amenity.available ? 'text-[#7ED321]' : 'text-gray-400'}`} />
                        <span className={amenity.available ? 'text-gray-800' : 'text-gray-400'}>
                          {amenity.label}
                        </span>
                        {amenity.available ? (
                          <Check className="w-5 h-5 text-[#7ED321] ml-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-400 ml-auto" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="p-6">
                <h3 className="text-xl mb-4">Chi Tiết Giá Cả</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-600">Giá thuê hàng tháng</span>
                    <span>8.500.000 VNĐ</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-600">Tiền điện (bao gồm)</span>
                    <span className="text-green-600">Miễn phí</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-600">Tiền nước (bao gồm)</span>
                    <span className="text-green-600">Miễn phí</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-600">Internet (bao gồm)</span>
                    <span className="text-green-600">Miễn phí</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-600">Phí quản lý</span>
                    <span className="text-green-600">Đã bao gồm</span>
                  </div>
                  <div className="flex justify-between py-4 text-lg bg-blue-50 -mx-6 px-6 rounded-lg">
                    <span>Tiền cọc (2 tháng)</span>
                    <span className="text-[#0072BC]">17.000.000 VNĐ</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl">Đánh Giá Từ Khách Thuê</h3>
                  <div className="flex items-center gap-2">
                    <Star className="w-6 h-6 fill-[#FFD400] text-[#FFD400]" />
                    <span className="text-2xl">4.8</span>
                    <span className="text-gray-500">(24 đánh giá)</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-start gap-3">
                        <ImageWithFallback
                          src={review.avatar}
                          alt={review.user}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span>{review.user}</span>
                            <span className="text-sm text-gray-500">{review.date}</span>
                          </div>
                          <div className="flex gap-1 mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'fill-[#FFD400] text-[#FFD400]'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Safety Tips */}
            <div className="bg-yellow-50 border-l-4 border-[#FFD400] p-6 rounded-r-2xl">
              <h4 className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-[#FFD400]" />
                <span>Mẹo An Toàn</span>
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Luôn xem phòng trực tiếp trước khi đặt cọc</li>
                <li>• Kiểm tra giấy tờ pháp lý của chủ nhà</li>
                <li>• Đọc kỹ hợp đồng trước khi ký</li>
                <li>• Không chuyển tiền trước khi ký hợp đồng</li>
              </ul>
            </div>
          </div>

          {/* Sidebar - Landlord Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-md sticky top-24">
              <div className="text-center mb-6">
                <ImageWithFallback
                  src="https://ui-avatars.com/api/?name=Nguyen+Van+A&size=80&background=0072BC&color=fff"
                  alt="Landlord"
                  className="w-20 h-20 rounded-full mx-auto mb-3"
                />
                <h3 className="text-xl mb-1">Nguyễn Văn A</h3>
                <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                  <Shield className="w-4 h-4 text-[#7ED321]" />
                  <span>Đã xác minh</span>
                </div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Star className="w-4 h-4 fill-[#FFD400] text-[#FFD400]" />
                  <span className="text-sm">4.9 (156 đánh giá)</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <Button className="w-full bg-gradient-to-r from-[#0072BC] to-[#001F3F] text-white rounded-full py-6">
                  <Phone className="w-5 h-5 mr-2" />
                  Gọi Điện
                </Button>
                <Button variant="outline" className="w-full rounded-full py-6">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Nhắn Tin
                </Button>
                <Button variant="outline" className="w-full rounded-full py-6">
                  <Mail className="w-5 h-5 mr-2" />
                  Email
                </Button>
              </div>

              <div className="pt-6 border-t space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tỷ lệ phản hồi</span>
                  <span>98%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Thời gian phản hồi</span>
                  <span>Trong 2 giờ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số tin đăng</span>
                  <span>24 tin</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Contact Bar (Mobile) */}
      {showContactSticky && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl p-4 z-30 lg:hidden">
          <div className="flex gap-3">
            <Button className="flex-1 bg-gradient-to-r from-[#0072BC] to-[#001F3F] text-white rounded-full">
              <Phone className="w-5 h-5 mr-2" />
              Gọi Ngay
            </Button>
            <Button variant="outline" className="flex-1 rounded-full">
              <MessageCircle className="w-5 h-5 mr-2" />
              Nhắn Tin
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
