import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const linkBaseClass =
  'px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150';

const linkVariants = {
  default: 'text-gray-600 hover:text-primary hover:bg-primary/10',
  active: 'text-white bg-primary shadow-sm',
};

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();

  const renderNavLink = (path, label) => (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `${linkBaseClass} ${isActive ? linkVariants.active : linkVariants.default}`
      }
    >
      {label}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-primary">
          <span className="rounded-xl bg-primary/10 px-2 py-1 text-sm font-bold text-primary">
            RentMate
          </span>
          <span className="hidden text-gray-800 sm:block">Smart Rentals</span>
        </Link>
        <div className="flex items-center gap-2">
          {renderNavLink('/', 'Home')}
          {renderNavLink('/properties', 'Properties')}
          {isAuthenticated && renderNavLink('/dashboard', 'Dashboard')}
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-gray-600 sm:block">
                {user?.fullName} | {user?.role}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-xl bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger/90"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success/90"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
