

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://iimp-backend.duckdns.org/api'
//const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1111/api';
//const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.62:1111/api';

const rawPost = async (endpoint, body) => {
  const res  = await fetch(`${BASE_URL}${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const ct   = res.headers.get('content-type') ?? '';
  const data = ct.includes('application/json')
    ? await res.json()
    : { message: await res.text() };

  if (!res.ok) {
    const err  = new Error(data?.message || data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data   = data;
    throw err;
  }
  return data;
};

export const login = (email, password) =>
  rawPost('/auth/login', { email, password });

export const logout = (refreshToken) =>
  rawPost('/auth/logout', { refreshToken });

export const refreshAccessToken = (refreshToken) =>
  rawPost('/auth/refresh', { refreshToken });

export const changePassword = (email,oldPassword, newPassword, otpCode, token, purpose) =>
  rawPost('/auth/change-password', { email, oldPassword, newPassword, otpCode, token, purpose });

export const forgotPassword = (email, newPassword, otpCode, token, purpose) =>
  rawPost('/auth/forgot-password', { email, newPassword, otpCode, token, purpose });

export const sendOtp = (email, purpose) =>
  rawPost('/auth/send-otp', { email, purpose });

export const verifyOtp = (email, purpose, otpCode) =>
  rawPost('/auth/verify-otp', { email, purpose, otpCode });
