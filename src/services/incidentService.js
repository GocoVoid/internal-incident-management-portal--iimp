
import { get, post, patch, del, put } from './apiClient';

// Incidents

export const getIncidents = (params = {}) =>
  get('/incidents/getAllIncident', params);

export const getIncidentsByUser = (params = {}) =>
  get('/incidents/getIncidentByUser', params);

export const getIncidentByKey = (incidentKey) =>
  get(`/incidents/${incidentKey}`);

export const createIncident = (data) =>
  post('/incidents/createIncident', {
    title:       data.title,
    description: data.description,
    priority:    data.priority.toUpperCase(),
    category:    data.category,
  });

export const uploadFiles = (id, formData) => 
  post(`/incidents/${id}/uploadAttachments`, formData)

export const updateIncidentStatus = (incidentKey, newStatus) => {
  if (newStatus === 'In Progress') {
    newStatus = 'IN_PROGRESS';
  } else {
    newStatus = newStatus.toUpperCase();
  }
  return put(`/incidents/updateStatus/${incidentKey}`, { newStatus, note: null });
};

export const updateIncidentPriority = (incidentKey, priority) => {
  priority = priority.toUpperCase();
  return patch(`/incidents/updatePriority/${incidentKey}`, { priority });
};

export const assignIncident = (incidentKey, assignedToUserId, category) =>
  put(`/incidents/assign/${incidentKey}`, { assignedToUserId, category });

export const recategorizeIncident = (incidentKey, categoryId) =>
  put(`/incidents/${incidentKey}/recategorize`, { categoryId });

// Comments


export const getComments = (incidentKey) =>
  get(`/incidents/getComments/${incidentKey}`);

export const addComment = (incidentKey, commentText, internal=false) =>
  post(`/incidents/addComments/${incidentKey}`, { commentText, internal });

// Attachments

// export const uploadAttachment = (incidentKey, file) => {
//   const fd = new FormData();
//   fd.append('file', file);
//   return post(`/incidents/${incidentKey}/attachments`, fd);
// };

export const deleteAttachment = (incidentKey, attachmentId) =>
  del(`/incidents/${incidentKey}/attachments/${attachmentId}`);

// Audit Log

export const getAuditLog = (incidentKey) =>
  get(`/incidents/audit/${incidentKey}`);


// Resolution Note
 
export const getResolutionNote = (incidentKey) =>
  get(`/notes/getResolutionNote/${incidentKey}`);
 
export const saveResolutionNote = (incidentKey, note) =>
  post(`/notes/addResolutionNote`, { incidentKey, note });  

// Stats  (used by overview/dashboard pages)

export const getIncidentStats = () =>
  get('/incidents/stats');

export const getIncidentStatsByUser=()=>
  get('/incidents/userStats')

export const getPriority = (data) => 
  post('/predict', {description: data})