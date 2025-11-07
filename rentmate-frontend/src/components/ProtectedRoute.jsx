import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, roles, fallback }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-heading text-[#001F3F] mb-4">
            Vui lòng đăng nhập
          </h2>
          <p className="text-gray-600">
            Bạn cần đăng nhập để truy cập trang này
          </p>
        </div>
      </div>
    );
  }

  if (roles && roles.length > 0 && user && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-heading text-[#001F3F] mb-4">
            Truy cập bị từ chối
          </h2>
          <p className="text-gray-600">
            Bạn không có quyền truy cập trang này
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
