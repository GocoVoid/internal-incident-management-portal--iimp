import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  saveTokens,
  saveUser,
  clearSession,
  getUser,
  getAccessToken,
  getRefreshToken,
  getDashboardRoute,
} from '../utils/tokenUtils';
import { logout as apiLogout } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,         setUser]         = useState(() => getUser());
  const [accessToken,  setAccessToken]  = useState(() => getAccessToken());
  const [isFirstLogin, setIsFirstLogin] = useState(() => getUser()?.isFirstLogin ?? false);

  const handleLoginSuccess = useCallback((response) => {
    const { accessToken, refreshToken } = response;
    const src = response.user ?? response;
    const user = {
      id:         src.id         ?? null,
      email:      src.email      ?? null,
      fullName:   src.name ?? src.fullName ?? null,
      role:       src.role       ?? null,
      department: src.department ?? null,
    };
    saveTokens({ accessToken, refreshToken });
    saveUser(user);
    setAccessToken(accessToken);
    setUser(user);
    return getDashboardRoute(user.role);
  }, []);

  const handlePasswordChanged = useCallback(() => {
    setIsFirstLogin(false);
    const updated = { ...getUser(), isFirstLogin: false };
    saveUser(updated);
    setUser(updated);
  }, []);

  const handleLogout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) await apiLogout(refreshToken);
    } catch {
    } finally {
      clearSession();
      setUser(null);
      setAccessToken(null);
      setIsFirstLogin(false);
    }
  }, []);

  const value = {
    user,
    accessToken,
    isFirstLogin,
    isAuthenticated:      !!accessToken,
    handleLoginSuccess,
    handlePasswordChanged,
    handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within <AuthProvider>');
  return ctx;
};
