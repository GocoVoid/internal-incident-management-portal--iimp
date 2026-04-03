
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as api from '../services/incidentService';

import * as support_api from '../services/supportService';

export const useTickets = (_currentUserId, _role) => {
  const [tickets,  setTickets]  = useState([]);
  const [stats,    setStats]    = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, breached: 0 });
  const [filters,  setFilters]  = useState({ status: '', priority: '', category: '', search: '' });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const currentFetchMode = useRef('all');

  const silentRefreshAll = useCallback(async () => {
    try {
      const ticketRes = await api.getIncidents();
      const list = (ticketRes?.content ?? ticketRes ?? []).map(normalise);
      setTickets(list);
    } catch (_) {}
  }, []);

  const silentRefreshByUser = useCallback(async () => {
    try {
      const ticketRes = await api.getIncidentsByUser();
      const list = (ticketRes?.content ?? ticketRes ?? []).map(normalise);
      setTickets(list);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!pollingEnabled) return;
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      if (currentFetchMode.current === 'user') silentRefreshByUser();
      else silentRefreshAll();
    };
    const id = setInterval(tick, 30_000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [pollingEnabled, silentRefreshAll, silentRefreshByUser]);

  const normalise = (t) => ({
    id:              t.incidentKey,
    dbId:            t.id,
    title:           t.title,
    description:     t.description,
    category:   typeof t.category === 'string' ? t.category   : t.category?.categoryName  ?? '',
    categoryId: typeof t.category === 'string' ? null         : t.category?.id            ?? t.categoryId ?? null,
    department: typeof t.category === 'string' ? t.department : t.category?.departmentName ?? null,
    priority:        ({"LOW":"Low","MEDIUM":"Medium","HIGH":"High","CRITICAL":"Critical"})[t.priority] ?? t.priority ?? '',
    status:          ({"OPEN":"Open","CLOSED":"Closed","RESOLVED":"Resolved","IN_PROGRESS":"In Progress"})[t.status] ?? t.status,
    createdBy:       t.createdBy,
    createdByName:   t.createdByName  ?? t.createdBy?.name  ?? null,
    assignedTo:      t.assignedTo?.id ?? t.assignedTo       ?? null,
    assignedToName:  t.assignedToName ?? t.assignedTo?.name ?? null,
    slaDueAt:        t.slaDueAt,
    isSlaBreached:   t.slaBreached ?? t.isSlaBreached ?? false,
    slaRemainingBusinessHours: t.slaRemainingBusinessHours ?? null,
    createdAt:       t.createdAt,
    updatedAt:       t.updatedAt,
    resolvedAt:      t.resolvedAt,
    closedAt:        t.closedAt,
    comments: (t.comments ?? []).map(c => ({
      id:         c.id,
      author:     c.user?.name ?? c.author ?? 'Unknown',
      text:       c.commentText ?? c.text ?? '',
      internal: c.internal ?? c.isInternal ?? false,
      createdAt:  c.createdAt,
    })),
    attachments: (t.attachments ?? []).map(a => ({
      id:          a.id,
      fileName:    a.fileName,
      fileUrl:     a.fileUrl,
      fileSize:    a.fileSize,
      contentType: a.contentType,
    })),
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ticketRes = await api.getIncidents();
      const list = (ticketRes?.content ?? ticketRes ?? []).map(normalise);
      setTickets(list);
      const statsRes = await api.getIncidentStats();
      setStats({
        total:      statsRes.totalAll ?? 0,
        open:       statsRes.open ?? 0,
        inProgress: statsRes.inProgress ?? 0,
        resolved:   statsRes.resolved ?? 0,
        closed:     statsRes.closed ?? 0,
        breached:   statsRes.slaBreached ?? 0,
      });
      currentFetchMode.current = 'all';
      setPollingEnabled(true);
    } catch (err) {
      setError(err?.message ?? 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  
  const fetchAllByUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
    const [ticketRes, statsRes] = await Promise.all([
      api.getIncidentsByUser(),
      api.getIncidentStatsByUser(),
    ]);

    const list = (ticketRes?.content ?? ticketRes ?? []).map(normalise);
    setTickets(list);
    setStats({
      total:      statsRes.total      ?? statsRes.totalAll ?? list.length,
       open:       statsRes.open ?? 0,
       inProgress: statsRes.inProgress ?? 0,
      resolved:   statsRes.resolved ?? 0,
      closed: statsRes.closed ?? 0,
    });
    currentFetchMode.current = 'user';
    setPollingEnabled(true);
    } catch (err) {
      setError(err?.message ?? 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredTickets = useMemo(() => tickets.filter(t => {
    if (filters.status   && t.status   !== filters.status)   return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.category && t.category !== filters.category) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [tickets, filters]);

  const createTicket = useCallback(async (data) => {
    const res = await api.createIncident({
      title:       data.title,
      description: data.description,
      priority:    data.priority.toUpperCase(),
      category:    data.category,
    });
    const newTicket = normalise(res);
    const incidentKey = res.incidentKey || res.id || newTicket.id;
    if (data.attachments && data.attachments.length > 0) {
      await Promise.all(
        data.attachments.map(file =>
          api.uploadAttachment(incidentKey, file)
        )
      );
    }

    setTickets(prev => [newTicket, ...prev]);
    setStats(prev => ({ ...prev, total: prev.total + 1, open: prev.open + 1 }));
    fetchAll();
    return newTicket;
  }, [fetchAll]);

  const updateStatus = useCallback(async (incidentKey, newStatus) => {
    await api.updateIncidentStatus(incidentKey, newStatus);
    setTickets(prev => prev.map(t => {
      if (t.id !== incidentKey) return t;
      const now = new Date().toISOString();
      return {
        ...t, status: newStatus, updatedAt: now,
        resolvedAt: newStatus === 'Resolved' ? now : t.resolvedAt,
        closedAt:   newStatus === 'Closed'   ? now : t.closedAt,
      };
    }));
  }, []);

  const updateStatusWithNote = useCallback(async (incidentKey, newStatus, resolutionNote = '') => {
    await support_api.updateIncidentStatusWithNote(incidentKey, resolutionNote);
    setTickets(prev => prev.map(t => {
      if (t.id !== incidentKey) return t;
      const now = new Date().toISOString();
      return {
        ...t, status: newStatus, updatedAt: now,
        resolutionNote: resolutionNote || t.resolutionNote,
        resolvedAt: newStatus === 'Resolved' ? now : t.resolvedAt,
        closedAt:   newStatus === 'Closed'   ? now : t.closedAt,
      };
    }));
  }, []);

  const assignTicket = useCallback(async (incidentKey, assignedToUserId, category) => {
    await api.assignIncident(incidentKey, assignedToUserId, category);
    setTickets(prev => prev.map(t =>
      t.id === incidentKey
        ? { ...t, assignedTo: assignedToUserId, status: 'In Progress', updatedAt: new Date().toISOString() }
        : t
    ));
  }, []);

  const addComment = useCallback(async (incidentKey, text, _authorName, internal) => {
    console.log(internal);
    const res = await api.addComment(incidentKey, text, internal)
    console.log(res);
    const newComment = {
      id:         res.id,
      author:     res.authorName ?? 'You',
      text:       res.commentText ?? text,
      isInternal: res.internal,
      createdAt:  res.createdAt,
    };
    setTickets(prev => prev.map(t =>
      t.id === incidentKey
        ? { ...t, comments: [...t.comments, newComment], updatedAt: new Date().toISOString() }
        : t
    ));
  }, []);

  const recategorize = useCallback(async (incidentKey, categoryId) => {
    await api.recategorizeIncident(incidentKey, categoryId);
    await fetchAll();
  }, [fetchAll]);

  const getTicketById = useCallback((id) => tickets.find(t => t.id === id) ?? null, [tickets]);

  const updateFilter = useCallback((key, val) => setFilters(p => ({ ...p, [key]: val })), []);
  const clearFilters = useCallback(() => setFilters({ status: '', priority: '', category: '', search: '' }), []);

  return {
    tickets:       filteredTickets,
    allTickets:    tickets,
    stats,
    filters,
    loading,
    error,
    refetch:       fetchAll,
    fetchAllByUser,
    updateFilter,
    clearFilters,
    createTicket,
    assignTicket,
    updateStatus,
    addComment,
    recategorize,
    getTicketById,
  };
};