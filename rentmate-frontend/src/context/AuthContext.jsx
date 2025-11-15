import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import axiosClient from '../api/axiosClient.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('rentmate_user');
    const storedToken = localStorage.getItem('rentmate_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  const login = useCallback((nextUser, nextToken) => {
    localStorage.setItem('rentmate_user', JSON.stringify(nextUser));
    localStorage.setItem('rentmate_token', nextToken);
    setUser(nextUser);
    setToken(nextToken);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token || !user?.id) {
      return;
    }
    try {
      const { data } = await axiosClient.get(`/users/${user.id}`);
      const updatedUser = data.data;
      setUser(updatedUser);
      localStorage.setItem('rentmate_user', JSON.stringify(updatedUser));
    } catch {
      // ignore refresh errors
    }
  }, [token, user?.id]);

  const logout = useCallback(async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (error) {
      // logout endpoint is a stub; ignore errors
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
      refreshUser,
    }),
    [user, token, login, logout, refreshUser],
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
