
import { get } from './apiClient';

export const getReportSummary = () =>
  get('/reports/summary');

export const getTicketVolume = (params = { range: 'week' }) =>
  get('/reports/ticket-volume', params);

export const getCategoryBreakdown = () =>
  get('/reports/category-breakdown');

export const getSLACompliance = () =>
  get('/reports/sla-compliance');

export const buildExportUrl = (params = {}) => {
  const base   = 'http://localhost:1111/api';
  const query  = new URLSearchParams({ format: 'csv' }).toString();
  return `${base}/reports/export`;
};
