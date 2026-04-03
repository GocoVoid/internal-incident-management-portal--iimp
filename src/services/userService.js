
import { get, post, patch, put } from './apiClient';

// User Listing & Detail  (ADMIN only)

export const getUsers = (params = {}) =>
  get('/admin/getAllUsers', params);

export const getUserById = (id) =>
  get(`/users/${id}`);

// User Creation & Update  (ADMIN only)

export const createUser = (data) =>
  post('/admin/createUser', data);

export const updateUser = (id, data) =>
  put(`/admin/updateUserById/${id}`, data);

// Status Toggles  (ADMIN only)

export const toggleUserStatus = (id, active) =>
  {
    if (!active) {
      patch(`/admin/users/${id}/deactivate`);
    } else {
      patch(`/admin/users/${id}/reactivate`);
    }
  }

export const unlockUser = (id) =>
  patch(`/users/${id}/unlock`);

// Support Staff list  (used by MANAGER/ADMIN for assignment dropdown)

export const getSupportStaff = () =>
  get('/admin/support-staff');

// Current user profile

export const getMyProfile = () =>
  get('/users/me');

