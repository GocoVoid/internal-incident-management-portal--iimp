const ACCESS_TOKEN_KEY  = 'iimp_access_token';
const REFRESH_TOKEN_KEY = 'iimp_refresh_token';
const USER_KEY          = 'iimp_user';

// Storage
export const saveTokens = ({ accessToken, refreshToken }) => {
  sessionStorage.setItem(ACCESS_TOKEN_KEY,  accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const saveUser = (user) => {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getAccessToken = () => sessionStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = () => sessionStorage.getItem(REFRESH_TOKEN_KEY);

export const getUser = () => {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearSession = () => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};

export const isAuthenticated = () => !!getAccessToken();

// Role → dashboard route mapping
export const getDashboardRoute = (role) => {
  const routes = {
    EMPLOYEE:      '/dashboard/employee',
    SUPPORT_STAFF: '/dashboard/support',
    MANAGER:       '/dashboard/manager',
    ADMIN:         '/dashboard/admin',
  };
  return routes[role] ?? '/dashboard/employee';
};
