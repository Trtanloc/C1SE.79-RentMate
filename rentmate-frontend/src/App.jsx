import { useEffect, useRef } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import PropertyList from './pages/PropertyList.jsx';
import PropertyDetail from './pages/PropertyDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ChatBox from './components/ChatBox.jsx';
import LandlordApplicationPage from './pages/LandlordApplication.jsx';
import AdminPage from './pages/Admin.jsx';
import FavoritesPage from './pages/Favorites.jsx';
import ProfilePage from './pages/Profile.jsx';
import ForgotPasswordPage from './pages/ForgotPassword.jsx';
import PaymentsPage from './pages/Payments.jsx';
import MessagesPage from './pages/Messages.jsx';
import ContractsPage from './pages/Contracts.jsx';
import ContractPreviewPage from './pages/ContractPreview.jsx';
import AuthSuccess from './pages/AuthSuccess.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import { UserRole } from './utils/constants.js';
import axiosClient from './api/axiosClient.js';

const App = () => {
  const location = useLocation();
  const lastTrackedPathRef = useRef(null);

  useEffect(() => {
    const path = location.pathname;
    const prevPath = lastTrackedPathRef.current;
    let lastTrackedPath = null;

    try {
      lastTrackedPath = sessionStorage.getItem('rentmate:lastTrackedPath');
    } catch {
      lastTrackedPath = null;
    }

    const pathChanged = prevPath !== path;
    const alreadyTrackedThisSession = lastTrackedPath === path;
    lastTrackedPathRef.current = path;
    if (!pathChanged || alreadyTrackedThisSession) return;

    const track = async () => {
      try {
        await axiosClient.post('/stats/track-visit', {
          path,
          referrer: document.referrer || undefined,
        });
      } catch {
        // ignore tracking errors
      }
    };
    try {
      sessionStorage.setItem('rentmate:lastTrackedPath', path);
    } catch {
      // ignore storage errors
    }

    track();
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<PropertyList />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/payment/:contractCode" element={<PaymentPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
      <Route
        path="/payments"
        element={
          <ProtectedRoute roles={[UserRole.Admin, UserRole.Manager, UserRole.Landlord, UserRole.Tenant]}>
            <PaymentsPage />
          </ProtectedRoute>
        }
      />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contracts"
            element={
              <ProtectedRoute roles={[UserRole.Admin, UserRole.Manager, UserRole.Landlord, UserRole.Tenant]}>
                <ContractsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contracts/:id"
            element={
              <ProtectedRoute roles={[UserRole.Admin, UserRole.Manager, UserRole.Landlord, UserRole.Tenant]}>
                <ContractPreviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contracts/:id/preview"
            element={
              <ProtectedRoute roles={[UserRole.Admin, UserRole.Manager, UserRole.Landlord, UserRole.Tenant]}>
                <ContractPreviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/apply-landlord"
            element={
              <ProtectedRoute roles={[UserRole.Tenant]}>
                <LandlordApplicationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={[UserRole.Admin]}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <ChatBox />
    </div>
  );
};

export default App;
