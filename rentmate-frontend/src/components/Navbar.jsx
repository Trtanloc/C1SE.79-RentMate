import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  Globe2,
  Home,
  LayoutDashboard,
  MessageSquare,
  Menu,
  Shield,
  Sparkles,
  UserCircle,
  X,
  ScrollText,
} from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useI18n } from '../i18n/useI18n.js';
import { UserRole } from '../utils/constants.js';

const desktopLinkClasses =
  'flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-all whitespace-nowrap';
const mobileLinkClasses =
  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { lang, toggle } = useLanguage();
  const { t } = useI18n();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const tickerMessages = useMemo(
    () => [
      t('nav.ticker.default1', 'Email-only OTP across the entire platform.'),
      t('nav.ticker.default2', 'All stats, notices, and listings are pulled from live data.'),
    ],
    [t],
  );

  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setUnreadCount(0);
      return;
    }
    try {
      const { data } = await axiosClient.get('/notifications/unread-count', {
        params: { userId: user.id },
      });
      setUnreadCount(data.data?.count ?? 0);
    } catch {
      setUnreadCount(0);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setUnreadCount(0);
      return undefined;
    }
    loadUnreadCount();
    const intervalId = setInterval(loadUnreadCount, 15000);
    const handleRefresh = () => loadUnreadCount();
    window.addEventListener('rentmate:notifications-updated', handleRefresh);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('rentmate:notifications-updated', handleRefresh);
    };
  }, [isAuthenticated, user?.id, loadUnreadCount]);

  const navItems = useMemo(() => {
    const items = [
      { key: 'nav.home', fallback: 'Home', to: '/', icon: Home },
      { key: 'nav.browse', fallback: 'Browse', to: '/properties', icon: Sparkles },
    ];
    if (isAuthenticated) {
      items.push({
        key: 'nav.messages',
        fallback: 'Messages',
        to: '/messages',
        icon: MessageSquare,
      });
      items.push({
        key: 'nav.favorites',
        fallback: 'Favorites',
        to: '/favorites',
        icon: Sparkles,
      });
      items.push({
        key: 'nav.payments',
        fallback: 'Payments',
        to: '/payments',
        icon: BarChart3,
      });
      items.push({
        key: 'nav.contracts',
        fallback: 'Contracts',
        to: '/contracts',
        icon: ScrollText,
      });
      items.push({
        key: 'nav.dashboard',
        fallback: 'Dashboard',
        to: '/dashboard',
        icon: LayoutDashboard,
      });
      if (user?.role === UserRole.Tenant) {
        items.push({
          key: 'nav.applyLandlord',
          fallback: 'Apply landlord',
          to: '/apply-landlord',
          icon: Shield,
        });
      }
      if (user?.role === UserRole.Admin) {
        items.push({
          key: 'nav.admin',
          fallback: 'Admin',
          to: '/admin',
          icon: BarChart3,
        });
      }
    } else {
      items.push({
        key: 'nav.forLandlords',
        fallback: 'For landlords',
        to: '/dashboard',
        icon: LayoutDashboard,
      });
    }
    return items;
  }, [isAuthenticated, user?.role]);

  const renderNavLink = (item, variant = 'desktop') => {
    const Icon = item.icon;
    const baseClass = variant === 'desktop' ? desktopLinkClasses : mobileLinkClasses;
    const activeClass =
      variant === 'desktop'
        ? 'bg-primary text-white shadow-soft-glow'
        : 'bg-gray-100 text-brand';
    const idleClass =
      variant === 'desktop'
        ? 'text-gray-600 hover:bg-gray-100 hover:text-brand'
        : 'text-gray-600 hover:bg-gray-50';

    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          `${baseClass} ${isActive ? activeClass : idleClass} ${variant === 'desktop' ? '' : 'w-full'}`
        }
        onClick={() => setMobileOpen(false)}
      >
        {Icon && <Icon className="h-4 w-4" />}
        <span>{t(item.key, item.fallback)}</span>
      </NavLink>
    );
  };

  const renderAuthButtons = (variant = 'desktop') =>
    isAuthenticated ? (
      <>
        <div
          className={`${
            variant === 'desktop'
              ? 'hidden md:flex'
              : 'flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-3'
          } items-center gap-2 rounded-full bg-gray-50 text-xs font-medium text-gray-600`}
        >
          <UserCircle className="h-4 w-4 text-primary" />
          <span className="truncate">
            {user?.fullName || t('nav.signedInAs', 'Signed in as')}
            {user?.role ? ` | ${user.role}` : ''}
          </span>
        </div>
        <Link
          to="/notifications"
          className={`relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:text-primary ${
            variant === 'desktop' ? '' : 'w-full justify-start px-4'
          }`}
          aria-label="Notifications"
          onClick={() => setMobileOpen(false)}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 min-w-[24px] rounded-full bg-danger px-1 text-center text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {variant !== 'desktop' && (
            <span className="ml-3 text-sm font-semibold">{t('nav.notification', 'Notifications')}</span>
          )}
        </Link>
        <Link
          to="/profile"
          className={`rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary ${
            variant === 'desktop' ? 'hidden sm:inline-flex' : 'w-full text-center'
          }`}
          onClick={() => setMobileOpen(false)}
        >
          {t('nav.profile', 'Profile')}
        </Link>
        <button
          type="button"
          onClick={() => {
            logout();
            setMobileOpen(false);
          }}
          className={`rounded-full bg-gradient-to-r from-danger to-[#FF6B6B] px-4 py-2 text-sm font-semibold text-white shadow transition hover:opacity-95 ${
            variant === 'desktop' ? '' : 'w-full text-center'
          }`}
        >
          Log out
        </button>
      </>
    ) : (
      <>
        <Link
          to="/login"
          className={`rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary ${
            variant === 'desktop' ? 'hidden sm:inline-flex' : 'w-full text-center'
          }`}
          onClick={() => setMobileOpen(false)}
        >
          {t('nav.signIn', 'Sign in')}
        </Link>
        <Link
          to="/register"
          className={`rounded-full bg-gradient-to-r from-primary to-[#FFD400] px-4 py-2 text-sm font-semibold text-white shadow-soft-glow transition hover:opacity-90 ${
            variant === 'desktop' ? '' : 'w-full text-center'
          }`}
          onClick={() => setMobileOpen(false)}
        >
          {t('nav.createAccount', 'Create account')}
        </Link>
      </>
    );

  return (
    <header className="sticky top-0 z-50">
      <div className="ticker-gradient text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-hidden px-4 py-2 sm:px-6 lg:px-8">
          <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em]">
            {t('nav.ticker.label', 'RentMate update')}
          </span>
          <div className="relative flex-1 overflow-hidden">
            <div className="animate-marquee">
              {tickerMessages.map((message, index) => (
                <span key={index} className="flex items-center gap-2 pr-8 text-sm text-white/90">
                  <Sparkles className="h-4 w-4" />
                  {message}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <nav className="bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-3 lg:py-4">
            <Link
              to="/"
              className="flex items-center gap-3 rounded-2xl px-3 py-2 text-lg font-semibold text-brand transition hover:opacity-90"
              onClick={() => setMobileOpen(false)}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-soft-glow">
                <Home className="h-5 w-5" />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-base font-bold">RentMate</span>
                <span className="text-xs text-gray-500">
                  {t('hero.heading', 'Rent smarter with live data and verified email OTP.')}
                </span>
              </div>
            </Link>

            <div className="ml-auto hidden items-center gap-3 md:flex">{renderAuthButtons('desktop')}</div>

            <button
              type="button"
              className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-gray-700 md:hidden"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          <div className="hidden flex-col gap-3 border-t border-gray-100/80 pb-4 pt-3 md:flex">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 overflow-x-auto">
                {navItems.map((item) => renderNavLink(item, 'desktop'))}
              </div>
              <button
                type="button"
                onClick={toggle}
                className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
              >
                <Globe2 className="h-4 w-4" />
                {lang === 'en' ? 'EN' : 'VI'}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="space-y-3 border-t border-gray-100 bg-white px-4 py-3 md:hidden">
            {navItems.map((item) => renderNavLink(item, 'mobile'))}
            <button
              type="button"
              onClick={() => {
                toggle();
                setMobileOpen(false);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              <Globe2 className="h-4 w-4" />
              {lang === 'en' ? 'English' : 'Vietnamese'}
            </button>
            <div className="flex flex-col gap-2 pt-2">{renderAuthButtons('mobile')}</div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
