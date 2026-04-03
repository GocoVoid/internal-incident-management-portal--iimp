
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearSession,
} from '../utils/tokenUtils';
import { refreshAccessToken } from './authService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://iimp-backend.duckdns.org/api';
//const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1111/api';
//const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.62:1111/api';

let isRefreshing       = false;
let pendingQueue       = [];

const flushQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  pendingQueue = [];
};

// Parse response body safely
const parseBody = async (res) => {
  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) return res.json();
  return { message: await res.text() };
};

// Build AppError from a failed response
const buildError = (data, status) => {
  const message =
    data?.message || data?.error || `Request failed with status ${status}`;
  const err    = new Error(message);
  err.status   = status;
  err.data     = data;
  return err;
};

// Core request function
const request = async (endpoint, options = {}, _retry = false) => {
  const token = getAccessToken();

  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.ok) return parseBody(response);

  const data = await parseBody(response);

  // 401 → try refresh once
  if (response.status === 401 && !_retry) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearSession();
      window.location.replace('/login');
      throw buildError(data, 401);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((newToken) => {
        return request(endpoint, options, true);
      });
    }

    isRefreshing = true;
    try {
      const refreshed = await refreshAccessToken(refreshToken);
      saveTokens({
        accessToken:  refreshed.accessToken,
        refreshToken: refreshed.refreshToken ?? refreshToken,
      });
      flushQueue(null, refreshed.accessToken);
      isRefreshing = false;
      return request(endpoint, options, true);
    } catch (refreshErr) {
      flushQueue(refreshErr);
      isRefreshing = false;
      clearSession();
      window.location.replace('/login');
      throw refreshErr;
    }
  }

  throw buildError(data, response.status);
};

// Exported HTTP helpers
export const get  = (endpoint, params) => {
  const url = params
    ? `${endpoint}?${new URLSearchParams(params).toString()}`
    : endpoint;
  return request(url, { method: 'GET' });
};

export const post = (endpoint, body) =>
  request(endpoint, {
    method: 'POST',
    ...(body !== undefined && { body: body instanceof FormData ? body : JSON.stringify(body) }),
  });

export const put = (endpoint, body) =>
  request(endpoint, {
    method: 'PUT',
    ...(body !== undefined && { body: body instanceof FormData ? body : JSON.stringify(body) }),
  });

export const patch = (endpoint, body) =>
  request(endpoint, {
    method: 'PATCH',
    ...(body !== undefined && { body: body instanceof FormData ? body : JSON.stringify(body) }),
  });

export const del = (endpoint) =>
  request(endpoint, { method: 'DELETE' });

export default { get, post, put, patch, del };
