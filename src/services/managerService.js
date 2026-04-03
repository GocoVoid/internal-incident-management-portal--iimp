
import { get, post, put, patch } from './apiClient';

// Incidents

export const getManagerIncidents = () =>
  get('/manager/getAllIncidentForManager');

export const getManagerStats = () =>
  get('/manager/getStats');

export const createManagerIncident = (data) =>
  post('/manager/createIncident', {
    title:       data.title,
    description: data.description,
    priority:    data.priority.toUpperCase(),
    category:    data.category,
  });

export const updateManagerIncidentStatus = (incidentKey, status) => {
  const newStatus = status === 'In Progress' ? 'IN_PROGRESS' : status.toUpperCase();
  return put(`/manager/updateStatus/${incidentKey}`, { newStatus, note: null });
};

export const updateManagerIncidentPriority = (incidentKey, priority) =>
  patch(`/manager/updatePriority/${incidentKey}`, { priority: priority.toUpperCase() });

export const assignManagerIncident = (incidentKey, assignedToUserId, category) =>
  put(`/manager/assign/${incidentKey}`, { assignedToUserId, category });

export const recategorizeManagerIncident = (incidentKey, categoryId) =>
  put(`/manager/recategorize/${incidentKey}`, { categoryId });

export const addManagerComment = (incidentKey, commentText, isInternal = false) =>
  post(`/manager/addComment/${incidentKey}`, { commentText, isInternal });

// Reports

export const getManagerReportSummary = () =>
  get('/manager/reports/summary');

export const getManagerTicketVolume = (range = 'week') =>
  get('/manager/reports/ticket-volume', { range });

export const getManagerCategoryBreakdown = () =>
  get('/manager/reports/category-breakdown');

// Support Staff

export const getManagerSupportStaff = () =>
  get('/manager/support-staff');