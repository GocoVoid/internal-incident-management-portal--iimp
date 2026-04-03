
import { get, post, put, del } from './apiClient';

export const getCategories = () =>
  get('/admin/categories');

export const createCategory = (data) =>
  post('/admin/categories', data);

export const updateCategory = (id, data) =>
  put(`/admin/categories/${id}`, data);

export const deleteCategory = (id) =>
  del(`/admin/categories/${id}`);
