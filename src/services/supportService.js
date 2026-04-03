import { get, put } from './apiClient';

export const getAssignedTickets = () =>
  get('/support/getAssignedTickets');

export const getSupportStats = () =>
  get('/support/supportStats');

export const getUnreadNotifications = () =>
  get('/support/getUnreadNotifications');

export const updateIncidentStatusWithNote = (incidentKey, resolutionNote = '') =>
  put(`/incidents/updateStatus/${incidentKey}`, { newStatus: 'RESOLVED', note: resolutionNote });