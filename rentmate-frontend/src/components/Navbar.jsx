import React from "react";

import {
  Home,
  Building2,
  User,
  Heart,
  Menu,
  ChevronDown,
  Phone,
  MapPin,
  LogOut,
} from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Home, Building2, MapPin, ChevronDown, Heart, Search } from 'lucide-react';


export function Navbar({ onNavigate, currentPage }) {
  const { isAuthenticated, user, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Đã đăng xuất thành công!");
      onNavigate("home");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      {/* Promo Ticker */}
      <div className="bg-gradient-to-r from-[#0072BC] to-[#001F3F] text-white overflow-hidden">
        <div className="animate-marquee whitespace-nowrap py-2">
          <span className="inline-block px-8">
            🎉 <strong>KHUYẾN MÃI ĐẶC BIỆT:</strong> Giảm ngay 1 tháng tiền nhà
            khi ký hợp đồng 12 tháng!
          </span>
          <span className="inline-block px-8">
            ⚡ Hỗ trợ 24/7 - Xem nhà miễn phí
          </span>
          <span className="inline-block px-8">
            🏠 Hơn 10,000+ căn hộ chất lượng đang chờ bạn
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => onNavigate("home")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#0072BC] to-[#FFD400] rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-heading text-xl text-[#001F3F]">
                  RentMate
                </span>
                <span className="text-xs text-[#0072BC]">
                  Nhà Trọ Thông Minh
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => onNavigate("home")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  currentPage === "home"
                    ? "bg-[#0072BC] text-white"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Trang Chủ</span>
              </button>

              {/* THÊM NÚT CHO THUÊ Ở ĐÂY */}
              <button
                onClick={() => onNavigate("rentals")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  currentPage === "rentals"
                    ? "bg-[#0072BC] text-white"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <Search className="w-4 h-4" /> {/* Hoặc icon khác phù hợp */}
                <span>CHO THUÊ</span>
              </button>

              <button
                onClick={() => onNavigate("landlord")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  currentPage === "landlord"
                    ? "bg-[#0072BC] text-white"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Cho Thuê Nhà</span> {/* Đổi tên cho rõ nghĩa */}
              </button>

              <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 text-gray-700 transition-all">
                <MapPin className="w-4 h-4" />
                <span>Khu Vực</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 text-gray-700 transition-all">
                <Heart className="w-4 h-4" />
                <span>Yêu Thích</span>
              </button>
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[#0072BC] text-[#0072BC] hover:bg-[#0072BC] hover:text-white transition-all">
                <Phone className="w-4 h-4" />
                <span>Hotline: 1900-1234</span>
              </button>

              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#0072BC] to-[#001F3F] text-white hover:shadow-lg transition-all"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span>{user.fullName}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user.fullName}
                        </p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                      {user.role === "landlord" && (
                        <button
                          onClick={() => {
                            onNavigate("landlord");
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Building2 className="w-4 h-4" />
                          Dashboard
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng Xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onNavigate("auth")}
                  className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#0072BC] to-[#001F3F] text-white hover:shadow-lg transition-all"
                >
                  <User className="w-4 h-4" />
                  <span>Đăng Nhập</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    onNavigate("home");
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100"
                >
                  <Home className="w-5 h-5" />
                  <span>Trang Chủ</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate("landlord");
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100"
                >
                  <Building2 className="w-5 h-5" />
                  <span>Cho Thuê</span>
                </button>
                <button className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100">
                  <Heart className="w-5 h-5" />
                  <span>Yêu Thích</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate("auth");
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#0072BC] text-white mt-2"
                >
                  <User className="w-5 h-5" />
                  <span>Đăng Nhập</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
