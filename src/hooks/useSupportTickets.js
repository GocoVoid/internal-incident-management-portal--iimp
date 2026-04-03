import { useState, useCallback, useRef, useEffect } from 'react';
import * as api from '../services/supportService';

const usePolling = (fn, intervalMs, enabled = true) => {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      if (document.visibilityState === 'visible') fnRef.current();
    };
    const id = setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [intervalMs, enabled]);
};

const normalise = (t) => ({
  id:             t.incidentKey,
  dbId:           t.id,
  title:          t.title,
  description:    t.description,
  category:       typeof t.category === 'string' ? t.category : t.category?.categoryName ?? '',
  department:     t.department ?? null,
  priority: ({ HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low', CRITICAL: 'Critical' })[t.priority] ?? t.priority ?? '',
  status: (t.status ?? '')
    .replace('IN_PROGRESS', 'In Progress')
    .replace('OPEN',        'Open')
    .replace('CLOSED',      'Closed')
    .replace('RESOLVED',    'Resolved'),
  createdByName:  t.createdByName  ?? null,
  assignedToName: t.assignedToName ?? null,
  slaDueAt:       t.slaDueAt,
  isSlaBreached:  t.slaBreached ?? t.isSlaBreached ?? false,
  createdAt:      t.createdAt,
  updatedAt:      t.updatedAt    ?? null,
  comments:       [],
  attachments: (t.attachments ?? []).map(a => ({
    id:          a.id,
    fileName:    a.fileName,
    fileUrl:     a.fileUrl,
    fileSize:    a.fileSize,
    contentType: a.contentType,
  })),
});

export const useSupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [stats,   setStats]   = useState({
    assignedOpenCount: 0, assignedInProgressCount: 0, assignedResolvedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const hasFetched = useRef(false);
  const [pollingEnabled, setPollingEnabled] = useState(false);

  // Initial load
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [queueRes, statsRes] = await Promise.all([
        api.getAssignedTickets(),
        api.getSupportStats(),
      ]);

      const raw  = queueRes?.assignedTickets ?? queueRes ?? [];
      const list = raw.map(normalise);
      setTickets(list);
      setStats({
        assignedOpenCount:       statsRes.assignedOpenCount       ?? 0,
        assignedInProgressCount: statsRes.assignedInProgressCount ?? 0,
        assignedResolvedCount:   statsRes.assignedResolvedCount   ?? 0,
      });
      console.log(statsRes.assignedOpenCount);
console.log(statsRes.assignedInProgressCount);
console.log(statsRes.assignedResolvedCount);
      hasFetched.current = true;
      setPollingEnabled(true);
    } catch (err) {
      setError(err?.message ?? 'Failed to load queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  const silentRefresh = useCallback(async () => {
    try {
      const [queueRes, statsRes] = await Promise.all([
        api.getAssignedTickets(),
        api.getSupportStats(),
      ]);
      const raw  = queueRes?.assignedTickets ?? queueRes ?? [];
      const list = raw.map(normalise);
      setTickets(list);
      setStats({
        assignedOpenCount:       statsRes.assignedOpenCount       ?? 0,
        assignedInProgressCount: statsRes.assignedInProgressCount ?? 0,
        assignedResolvedCount:   statsRes.assignedResolvedCount   ?? 0,
      });
      
      
    } catch (_) {}
  }, []);

  usePolling(silentRefresh, 30_000, pollingEnabled);

  return { tickets, stats, loading, error, fetchAll, silentRefresh };
};