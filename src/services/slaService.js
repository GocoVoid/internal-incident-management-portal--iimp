
import { get, put } from './apiClient';

export const getSLAConfig = () =>
  get('/admin/getSLA');

export const updateSLAConfig = (id, resolutionTimeHours) =>
{ console.log(id+" "+resolutionTimeHours);
  put(`/admin/updateSLA`, { id, resolutionTimeHours });}
