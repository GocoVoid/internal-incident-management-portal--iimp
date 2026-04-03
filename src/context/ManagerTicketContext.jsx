import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getManagerIncidents, getManagerStats,
  createManagerIncident, updateManagerIncidentStatus,
  updateManagerIncidentPriority, assignManagerIncident,
  recategorizeManagerIncident, addManagerComment,
  getManagerReportSummary, getManagerTicketVolume, getManagerCategoryBreakdown,
} from '../services/managerService';

const ManagerTicketContext = createContext(null);

const STATUS_MAP = { OPEN:'Open', CLOSED:'Closed', RESOLVED:'Resolved', IN_PROGRESS:'In Progress' };

const normalise = (t) => ({
  id:             t.incidentKey,
  dbId:           t.id,
  title:          t.title,
  description:    t.description,
  category:       t.category?.categoryName ?? t.category ?? '',
  categoryId:     t.category?.id           ?? t.categoryId ?? null,
  department:     t.category?.departmentName ?? null,
  priority:       t.priority
    ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1).toLowerCase()
    : '',
  status:         STATUS_MAP[t.status] ?? t.status,
  createdBy:      t.createdBy,
  createdByName:  t.createdByName ?? t.createdBy?.name ?? null,
  assignedTo:     t.assignedTo?.id ?? t.assignedTo ?? null,
  assignedToName: t.assignedToName ?? t.assignedTo?.name ?? null,
  slaDueAt:       t.slaDueAt,
  isSlaBreached:  t.isSlaBreached ?? t.slaBreached ?? false,
  createdAt:      t.createdAt,
  updatedAt:      t.updatedAt,
  resolvedAt:     t.resolvedAt,
  closedAt:       t.closedAt,
  comments: (t.comments ?? []).map(c => ({
    id: c.id, author: c.user?.name ?? c.author ?? 'Unknown',
    text: c.commentText ?? c.text ?? '', isInternal: c.isInternal ?? false, createdAt: c.createdAt,
  })),
  attachments: (t.attachments ?? []).map(a => ({
    id: a.id, fileName: a.fileName, fileUrl: a.fileUrl,
    fileSize: a.fileSize, contentType: a.contentType,
  })),
});

export const ManagerTicketProvider = ({ children }) => {
  const [allTickets, setAllTickets] = useState([]);
  const [stats,      setStats]      = useState({ total:0, open:0, inProgress:0, resolved:0, closed:0, breached:0 });
  const [filters,    setFilters]    = useState({ status:'', priority:'', category:'', department:'', search:'' });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [reportSummary,  setReportSummary]  = useState(null);
  const [ticketVolume,   setTicketVolume]   = useState([]);
  const [catBreakdown,   setCatBreakdown]   = useState([]);
  const [reportPeriod,   setReportPeriod]   = useState('week');
  const [reportLoading,  setReportLoading]  = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [ticketRes, statsRes] = await Promise.all([
        getManagerIncidents(),
        getManagerStats().catch(() => null),
      ]);
      const list = (ticketRes?.content ?? ticketRes ?? []).map(normalise);
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAllTickets(list);

      if (statsRes) {
        setStats({
          total:      statsRes.totalAll     ?? statsRes.total           ?? list.length,
          open:       statsRes.open         ?? statsRes.openCount       ?? 0,
          inProgress: statsRes.inProgress   ?? statsRes.inProgressCount ?? 0,
          resolved:   statsRes.resolved     ?? statsRes.resolvedCount   ?? 0,
          closed:     statsRes.closed       ?? statsRes.closedCount     ?? 0,
          breached:   statsRes.slaBreached  ?? statsRes.breachedCount   ?? 0,
        });
      }
    } catch (err) {
      setError(err?.message ?? 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
    setPollingEnabled(true);
  }, []);

  const silentRefresh = useCallback(async () => {
    try {
      const [ticketRes, statsRes] = await Promise.all([
        getManagerIncidents(),
        getManagerStats().catch(() => null),
      ]);
      const list = (ticketRes?.content ?? ticketRes ?? []).map(normalise);
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAllTickets(list);
      if (statsRes) {
        setStats({
          total:      statsRes.totalAll     ?? statsRes.total           ?? list.length,
          open:       statsRes.open         ?? statsRes.openCount       ?? 0,
          inProgress: statsRes.inProgress   ?? statsRes.inProgressCount ?? 0,
          resolved:   statsRes.resolved     ?? statsRes.resolvedCount   ?? 0,
          closed:     statsRes.closed       ?? statsRes.closedCount     ?? 0,
          breached:   statsRes.slaBreached  ?? statsRes.breachedCount   ?? 0,
        });
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!pollingEnabled) return;
    const tick = () => { if (document.visibilityState === 'visible') silentRefresh(); };
    const id = setInterval(tick, 30_000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [pollingEnabled, silentRefresh]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchReports = useCallback(async (period = reportPeriod) => {
    setReportLoading(true);
    try {
      const [summary, volume, breakdown] = await Promise.all([
        getManagerReportSummary().catch(() => null),
        getManagerTicketVolume(period).catch(() => []),
        getManagerCategoryBreakdown().catch(() => []),
      ]);
      setReportSummary(summary);
      setTicketVolume(volume ?? []);
      setCatBreakdown(breakdown ?? []);
    } finally {
      setReportLoading(false);
    }
  }, [reportPeriod]);

  useEffect(() => { fetchReports(reportPeriod); }, [reportPeriod]);

  const changeReportPeriod = useCallback((p) => setReportPeriod(p), []);

  const filteredTickets = useMemo(() => {
    let list = allTickets;
    if (filters.status)     list = list.filter(t => t.status     === filters.status);
    if (filters.priority)   list = list.filter(t => t.priority   === filters.priority);
    if (filters.category)   list = list.filter(t => t.category   === filters.category);
    if (filters.department) list = list.filter(t => t.department === filters.department);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allTickets, filters]);

  const updateFilter = useCallback((key, val) => setFilters(p => ({ ...p, [key]: val })), []);
  const clearFilters = useCallback(() => setFilters({ status:'', priority:'', category:'', department:'', search:'' }), []);

  const createTicket = useCallback(async (data) => {
    const res = await createManagerIncident({
      title: data.title, description: data.description,
      priority: data.priority, category: data.category,
    });
    const t = normalise(res);
    setAllTickets(p => [t, ...p]);
    setStats(p => ({ ...p, total: p.total + 1, open: p.open + 1 }));
    fetchAll();
    fetchReports(reportPeriod);
    return t;
  }, [fetchAll, fetchReports, reportPeriod]);

  const updateStatus = useCallback(async (incidentKey, newStatus) => {
    await updateManagerIncidentStatus(incidentKey, newStatus);
    const now = new Date().toISOString();
    setAllTickets(p => p.map(t => t.id !== incidentKey ? t : {
      ...t, status: newStatus, updatedAt: now,
      resolvedAt: newStatus === 'Resolved' ? now : t.resolvedAt,
      closedAt:   newStatus === 'Closed'   ? now : t.closedAt,
    }));
  }, []);

  const assignTicket = useCallback(async (incidentKey, assignedToUserId, category, staffName) => {
    await assignManagerIncident(incidentKey, assignedToUserId, category);
    setAllTickets(p => p.map(t => t.id !== incidentKey ? t : {
      ...t, assignedTo: assignedToUserId,
      assignedToName: staffName ?? t.assignedToName,
      status: 'In Progress',
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const addComment = useCallback(async (incidentKey, text, authorName, isInternal = false) => {
    console.log(incidentKey);
    console.log(text);
    console.log(authorName);
    console.log(isInternal);
    const res = await addManagerComment(incidentKey, text, isInternal);
    const comment = {
      id: res.id, author: res.user?.name ?? authorName ?? 'You',
      text: res.commentText ?? text, isInternal: res.isInternal ?? isInternal,
      createdAt: res.createdAt,
    };
    setAllTickets(p => p.map(t => t.id !== incidentKey ? t : {
      ...t, comments: [...t.comments, comment], updatedAt: new Date().toISOString(),
    }));
  }, []);

  const recategorize = useCallback(async (incidentKey, categoryId) => {
    await recategorizeManagerIncident(incidentKey, categoryId);
    await fetchAll();
  }, [fetchAll]);

  const updatePriority = useCallback(async (incidentKey, newPriority) => {
    await updateManagerIncidentPriority(incidentKey, newPriority);
    setAllTickets(p => p.map(t => t.id !== incidentKey ? t : {
      ...t, priority: newPriority, updatedAt: new Date().toISOString(),
    }));
  }, []);

  const getTicketById = useCallback((id) => allTickets.find(t => t.id === id) ?? null, [allTickets]);

  return (
    <ManagerTicketContext.Provider value={{
      tickets: filteredTickets, allTickets,
      stats, filters, loading, error,
      refetch: fetchAll, updateFilter, clearFilters,
      createTicket, updateStatus, assignTicket,
      addComment, recategorize, updatePriority, getTicketById,
      reportSummary, ticketVolume, catBreakdown,
      reportPeriod, reportLoading, changeReportPeriod,
    }}>
      {children}
    </ManagerTicketContext.Provider>
  );
};

export const useManagerTickets = () => {
  const ctx = useContext(ManagerTicketContext);
  if (!ctx) throw new Error('useManagerTickets must be used within <ManagerTicketProvider>');
  return ctx;
};