import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../services/incidentService';
import { getSLAConfig } from '../services/slaService';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';

export const AdminTicketContext = createContext(null);

const STATUS_MAP = { OPEN:'Open', CLOSED:'Closed', RESOLVED:'Resolved', IN_PROGRESS:'In Progress' };
const PAGE_SIZE  = 10;

const normalise = (t) => ({
  id:             t.incidentKey,
  dbId:           t.id,
  title:          t.title,
  description:    t.description,
  category:       t.category?.categoryName ?? (typeof t.category === 'string' ? t.category : '') ,
  categoryId:     t.categoryId ?? t.category?.id ?? null,
  department:     t.category?.departmentName ?? t.department ?? null,
  priority:       t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1).toLowerCase() : '',
  status:         STATUS_MAP[t.status] ?? t.status,
  createdBy:      t.createdBy,
  createdByName:  t.createdByName ?? null,
  assignedTo:     t.assignedTo?.id ?? t.assignedTo ?? null,
  assignedToName: t.assignedToName ?? null,
  slaDueAt:       t.slaDueAt,
  isSlaBreached:  t.isSlaBreached ?? t.slaBreached ?? t.is_sla_breached ?? false,
  createdAt:      t.createdAt,
  updatedAt:      t.updatedAt,
  resolvedAt:     t.resolvedAt,
  closedAt:       t.closedAt,
  comments: (t.comments ?? []).map(c => ({
    id: c.id, author: c.user?.name ?? c.author ?? 'Unknown',
    text: c.commentText ?? c.text ?? '', isInternal: c.internal ?? false, createdAt: c.createdAt,
  })),
  attachments: (t.attachments ?? []).map(a => ({
    id: a.id, fileName: a.fileName, fileUrl: a.fileUrl, fileSize: a.fileSize, contentType: a.contentType,
  })),
});

export const AdminTicketProvider = ({ children }) => {
  const [allTickets,  setAllTickets]  = useState([]);
  const [stats,       setStats]       = useState({ total:0, open:0, inProgress:0, resolved:0, closed:0, breached:0 });
  const [filters,     setFilters]     = useState({ status:'', priority:'', category:'', department:'', search:'' });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [slaConfig,   setSlaConfig]   = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [page,        setPage]        = useState(0);

  const [pollingEnabled, setPollingEnabled] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketRes, statsRes, slaRes, catRes] = await Promise.all([
        api.getIncidents({ sort: 'createdAt,desc', size: 1000, page: 0 }),
        api.getIncidentStats().catch(() => null),
        getSLAConfig().catch(() => []),
        getCategories().catch(() => []),
      ]);
      setSlaConfig(slaRes ?? []);
      setCategories(catRes ?? []);

      const list = (ticketRes?.content ?? ticketRes ?? []).map(normalise);
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAllTickets(list);
      // console.log(list);

      if (statsRes) {
        setStats({
          total:      statsRes.totalAll      ?? statsRes.total            ?? list.length,
          open:       statsRes.open          ?? statsRes.openCount        ?? 0,
          inProgress: statsRes.inProgress    ?? statsRes.inProgressCount  ?? 0,
          resolved:   statsRes.resolved      ?? statsRes.resolvedCount    ?? 0,
          closed:     statsRes.closed        ?? statsRes.closedCount      ?? 0,
          breached:   statsRes.slaBreached   ?? statsRes.breachedCount    ?? 0,
        });
      } else {
        setStats({
          total:      list.length,
          open:       list.filter(t => t.status === 'Open').length,
          inProgress: list.filter(t => t.status === 'In Progress').length,
          resolved:   list.filter(t => t.status === 'Resolved').length,
          closed:     list.filter(t => t.status === 'Closed').length,
          breached:   list.filter(t => t.isSlaBreached).length,
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
      const [ticketRes, catRes] = await Promise.all([
        api.getIncidents({ sort: 'createdAt,desc', size: 1000, page: 0 }),
        getCategories().catch(() => []),
      ]);
      setCategories(catRes ?? []);
      const list = (ticketRes?.content ?? ticketRes ?? []).map(normalise);
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAllTickets(list);
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

  const filteredTickets = useMemo(() => {
    let list = allTickets;
    if (filters.status)   list = list.filter(t => t.status   === filters.status);
    if (filters.priority) list = list.filter(t => t.priority === filters.priority);
    if (filters.category) list = list.filter(t => t.category === filters.category);
    if (filters.department) list = list.filter(t => t.department === filters.department);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allTickets, filters]);

  const totalItems  = filteredTickets.length;
  const totalPages  = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage    = Math.min(page, totalPages - 1);
  const tickets     = filteredTickets.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const updateFilter = useCallback((key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
    setPage(0);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ status:'', priority:'', category:'', department:'', search:'' });
    setPage(0);
  }, []);

  const goToPage = useCallback((pageNum) => setPage(pageNum), []);

  const refetch = fetchAll;

  const createTicket = useCallback(async (data) => {
    const res = await api.createIncident({
      title: data.title, description: data.description,
      priority: data.priority, category: data.category,
    });
    const t = normalise(res);
    setAllTickets(p => [t, ...p]);
    setStats(p => ({ ...p, total: p.total + 1, open: p.open + 1 }));
    setPage(0);
    return t;
  }, []);

  const updateStatus = useCallback(async (incidentKey, newStatus) => {
    await api.updateIncidentStatus(incidentKey, newStatus);
    const now = new Date().toISOString();
    setAllTickets(p => p.map(t => t.id !== incidentKey ? t : {
      ...t, status: newStatus, updatedAt: now,
      resolvedAt: newStatus === 'Resolved' ? now : t.resolvedAt,
      closedAt:   newStatus === 'Closed'   ? now : t.closedAt,
    }));
    api.getIncidentStats().then(s => s && setStats({
      total:      s.totalAll    ?? s.total           ?? 0,
      open:       s.open        ?? s.openCount        ?? 0,
      inProgress: s.inProgress  ?? s.inProgressCount  ?? 0,
      resolved:   s.resolved    ?? s.resolvedCount    ?? 0,
      closed:     s.closed      ?? s.closedCount      ?? 0,
      breached:   s.slaBreached ?? s.breachedCount    ?? 0,
    })).catch(() => {});
  }, []);

  const assignTicket = useCallback(async (incidentKey, assignedToUserId, category) => {
    await api.assignIncident(incidentKey, assignedToUserId, category);
    setAllTickets(p => p.map(t => t.id !== incidentKey ? t : {
      ...t, assignedTo: assignedToUserId, status: 'In Progress', updatedAt: new Date().toISOString(),
    }));
  }, []);

  const addComment = useCallback(async (incidentKey, text, authorName, isInternal = false) => {
    const res = await api.addComment(incidentKey, text, isInternal);
    console.log(res);
    const comment = {
      id: res.id,
      author: res.authorName ?? 'You',
      text: res.commentText ?? text, isInternal: res.internal ?? isInternal,
      createdAt: res.createdAt,
    };
    setAllTickets(p => p.map(t => t.id !== incidentKey ? t : {
      ...t, comments: [...t.comments, comment], updatedAt: new Date().toISOString(),
    }));
  }, []);

  const recategorize = useCallback(async (incidentKey, categoryId) => {
    await api.recategorizeIncident(incidentKey, categoryId);
    const cat = categories.find(c => c.id === categoryId || c.id === Number(categoryId));
    setAllTickets(p => p.map(t => {
      if (t.id !== incidentKey) return t;
      return {
        ...t,
        category:   cat?.categoryName   ?? t.category,
        department: cat?.departmentName ?? t.department,
        categoryId: categoryId,
        updatedAt:  new Date().toISOString(),
      };
    }));
    fetchAll();
  }, [fetchAll, categories]);

  const updatePriority = useCallback(async (incidentKey, newPriority) => {
    await api.updateIncidentPriority(incidentKey, newPriority);
    setAllTickets(p => p.map(t => t.id !== incidentKey ? t : {
      ...t, priority: newPriority, updatedAt: new Date().toISOString(),
    }));
  }, []);

  const addCategory = useCallback(async (data) => {
    const res = await createCategory(data);
    const cat = {
      id:             res.id,
      categoryName:   res.categoryName   ?? res.category_name   ?? data.categoryName,
      departmentName: res.departmentName ?? res.department_name ?? data.departmentName,
      ...res,
    };
    setCategories(p => [...p, cat]);
    return cat;
  }, []);

  const editCategory = useCallback(async (id, data) => {
    const res = await updateCategory(id, data);
    setCategories(p => p.map(c => c.id === id ? { ...c, ...data, ...(res ?? {}) } : c));
  }, []);

  const removeCategory = useCallback(async (id) => {
    await deleteCategory(id);
    setCategories(p => p.filter(c => c.id !== id));
  }, []);

  const getTicketById = useCallback((id) => allTickets.find(t => t.id === id) ?? null, [allTickets]);

  return (
    <AdminTicketContext.Provider value={{
      tickets,
      allTickets,
      stats, filters, loading, error,
      page: safePage, totalPages, totalItems, pageSize: PAGE_SIZE,
      slaConfig, refetch, goToPage, updateFilter, clearFilters,
      createTicket, assignTicket, updateStatus,
      addComment, recategorize, updatePriority, getTicketById,
      categories, addCategory, editCategory, removeCategory,
    }}>
      {children}
    </AdminTicketContext.Provider>
  );
};

export const useAdminTickets = () => {
  const ctx = useContext(AdminTicketContext);
  if (!ctx) throw new Error('useAdminTickets must be used within <AdminTicketProvider>');
  return ctx;
};