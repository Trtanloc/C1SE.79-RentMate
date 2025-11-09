import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
// Code này để gggiups khi phảu đăng nhập là người cho thuê nó mới hiện dashboard(test dashboard thì đặt role là landlord,  )
//const [user, setUser] = useState(null);
//const [token, setToken] = useState(null);
  const [user, setUser] = useState({ 
  fullName: 'phát', 
  role: 'landlord'          
});
const [token, setToken] = useState('fake-test-token');

  useEffect(() => {
    const storedUser = localStorage.getItem('rentmate_user');
    const storedToken = localStorage.getItem('rentmate_token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('rentmate_user');
        localStorage.removeItem('rentmate_token');
      }
    }
  }, []);

  const login = useCallback((nextUser, nextToken) => {
    localStorage.setItem('rentmate_user', JSON.stringify(nextUser));
    localStorage.setItem('rentmate_token', nextToken);
    setUser(nextUser);
    setToken(nextToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (error) {
      // logout endpoint is a stub; ignore errors
      console.log('Logout API call failed, continuing with local logout');
    } finally {
      localStorage.removeItem('rentmate_user');
      localStorage.removeItem('rentmate_token');
      setUser(null);
      setToken(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      login,
      logout,
    }),
    [user, token, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
