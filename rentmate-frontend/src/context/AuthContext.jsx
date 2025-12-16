import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import axiosClient from '../api/axiosClient.js';
import { UserStatus } from '../utils/constants.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {

    const storedUser =
      localStorage.getItem('rentmate_user') ||
      sessionStorage.getItem('rentmate_user');
    const storedToken =
      localStorage.getItem('rentmate_token') ||
      sessionStorage.getItem('rentmate_token');

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.status === UserStatus.Disabled) {
        localStorage.removeItem('rentmate_user');
        localStorage.removeItem('rentmate_token');
        sessionStorage.removeItem('rentmate_user');
        sessionStorage.removeItem('rentmate_token');
        return;
      }
      setUser(parsedUser);
      setToken(storedToken);
    }
  }, []);


  const persist = useCallback((key, value, remember = true) => {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(key, value);
  }, []);

  const clearStorage = useCallback(() => {
    localStorage.removeItem('rentmate_user');
    localStorage.removeItem('rentmate_token');
    localStorage.removeItem('rentmate_token_expires');
    sessionStorage.removeItem('rentmate_user');
    sessionStorage.removeItem('rentmate_token');
    sessionStorage.removeItem('rentmate_token_expires');
  }, []);

  const login = useCallback((nextUser, nextToken, options = {}) => {
    const remember = options.remember !== false;
    clearStorage();
    persist('rentmate_user', JSON.stringify(nextUser), remember);
    persist('rentmate_token', nextToken, remember);
    if (options.expiresAt) {
      persist('rentmate_token_expires', options.expiresAt, remember);
    }
    setUser(nextUser);
    setToken(nextToken);
  }, [clearStorage, persist]);


  const refreshUser = useCallback(async () => {
    if (!token || !user?.id) {
      return;
    }
    try {
      const { data } = await axiosClient.get(`/users/${user.id}`);
      const updatedUser = data.data;
      setUser(updatedUser);

      const remember = Boolean(localStorage.getItem('rentmate_token'));
      persist('rentmate_user', JSON.stringify(updatedUser), remember);
    } catch {
      // ignore refresh errors
    }
  }, [token, user?.id, persist]);


  const logout = useCallback(async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (error) {
      // logout endpoint is a stub; ignore errors
    } finally {

      clearStorage();
      setUser(null);
      setToken(null);
    }
  }, [clearStorage]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearStorage();
      setUser(null);
      setToken(null);
    };
    window.addEventListener('rentmate:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('rentmate:unauthorized', handleUnauthorized);
    };
  }, [clearStorage]);


  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated:
        Boolean(user && token) &&
        user?.status !== UserStatus.Disabled,
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
