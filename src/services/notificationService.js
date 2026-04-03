import { get, patch } from './apiClient';

export const getNotifications = () =>
  get('/notifications/getAllUnreadNotifications');

export const getUnreadCount = () =>
  get('/notifications/count');

export const markAsRead = (id) =>
  patch(`/notifications/read/${id}`);

export const markAllAsRead = async () =>
  {
    console.log("In service layer");
    await patch('/notifications/read-all');
    console.log("Fetched successfully");
  }
