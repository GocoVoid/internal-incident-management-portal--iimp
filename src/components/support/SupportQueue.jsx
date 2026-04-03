import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/shared/TicketBadge';
import { useAuthContext } from '../../context/AuthContext';
import { useSupportTickets } from '../../hooks/useSupportTickets';
import { useTickets } from '../../hooks/useTickets';
import { SupportKPICards } from '../../components/admin/AdminComponents';
import { LoadingState } from '../../components/shared/PageState';
import { getComments, saveResolutionNote, updateIncidentStatus } from '../../services/incidentService';

const STATUSES   = ['Open', 'In Progress', 'Resolved'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const SUPPORT_TRANSITIONS = { 'Open': ['In Progress'], 'In Progress': ['Resolved'] };
const PAGE_SIZE  = 10;
const selCls     = 'px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none bg-white';

const formatDate = (iso) => iso
  ? new Date(iso).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
  : '—';

// Ticket Action Modal
const TicketActionModal = ({ ticket, onClose, onRefresh, user }) => {
  const [comments,     setComments]     = useState([]);
  const [fetchingCmts, setFetchingCmts] = useState(false);
  const [tab,          setTab]          = useState('details');
  const [note,         setNote]         = useState('');
  const [comment,      setComment]      = useState('');
  const [loading,      setLoading]      = useState(false);
  const [success,      setSuccess]      = useState('');
  const [error,        setError]        = useState('');
  const { addComment } = useTickets(user?.id, 'SUPPORT_STAFF');
  const allowed = SUPPORT_TRANSITIONS[ticket?.status] ?? [];

  useEffect(() => {
    if (!ticket?.id) return;
    setFetchingCmts(true);
    getComments(ticket.id).then(d => setComments(d ?? [])).catch(() => {}).finally(() => setFetchingCmts(false));
  }, [ticket?.id]);

  const handleUpdateStatus = async (newStatus) => {
    setLoading(true); setError(''); setSuccess('');
    try {
      await updateIncidentStatus(ticket.id, newStatus);
      if (note.trim()) await saveResolutionNote(ticket.id, note.trim());
      setSuccess(`Ticket marked as "${newStatus}" successfully.`);
      setTimeout(() => { setSuccess(''); onRefresh(); onClose(); }, 1500);
    } catch (e) { setError(e?.message ?? 'Failed to update status.'); }
    finally { setLoading(false); }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    setLoading(true); setError('');
    try {
      await addComment(ticket.id, comment.trim(), user?.fullName, false);
      const updated = await getComments(ticket.id);
      setComments(updated ?? []);
      setComment('');
      onRefresh();
    } catch (e) { setError(e?.message ?? 'Failed to post comment.'); }
    finally { setLoading(false); }
  };

  if (!ticket) return null;
  const tabs = [
    { id:'details',  label:'Details' },
    { id:'resolve',  label:'Resolve / Progress' },
    { id:'comment',  label:`Comments (${comments.length})` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

        <div className="flex items-start justify-between gap-4 px-6 py-4" style={{ borderBottom:'1px solid #f3f4f6' }}>
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold mb-0.5" style={{ color:'#3c3c8c' }}>{ticket.id}</p>
            <h3 className="text-base font-semibold text-gray-900">{ticket.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{ticket.category}{ticket.department ? ` · ${ticket.department}` : ''}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex px-6 gap-1" style={{ borderBottom:'1px solid #f3f4f6' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px ${
                tab === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>{t.label}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {tab === 'details' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:'Status',      value: <StatusBadge status={ticket.status} /> },
                  { label:'Priority',    value: <PriorityBadge priority={ticket.priority} /> },
                  { label:'Raised by',   value: ticket.createdByName ?? '—' },
                  { label:'Assigned to', value: ticket.assignedToName ?? '—' },
                  { label:'Created',     value: formatDate(ticket.createdAt) },
                  { label:'Updated',     value: formatDate(ticket.updatedAt) },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-[10px] text-gray-400 mb-1">{label}</p>
                    <div className="text-xs font-medium text-gray-800">{value}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-[10px] text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </>
          )}

          {tab === 'resolve' && (
            <>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Resolution Note <span className="text-gray-400 font-normal">(optional but recommended)</span>
                </label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
                  placeholder="Describe what was done to resolve this issue…"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none" />
              </div>
              {allowed.length > 0 ? (
                <div className="flex gap-2">
                  {allowed.map(s => (
                    <button key={s} onClick={() => handleUpdateStatus(s)} disabled={loading}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 text-white ${
                        s === 'Resolved' ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-700 hover:bg-indigo-800'
                      }`}>
                      {loading ? 'Updating…' : `Mark as ${s}`}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-center text-gray-400 py-2">
                  {['Resolved','Closed'].includes(ticket.status) ? 'Ticket is already resolved/closed.' : 'No transitions available.'}
                </p>
              )}
              {success && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-green-600">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <p className="text-xs text-green-700">{success}</p>
                </div>
              )}
              {error && <p className="text-xs text-red-500">{error}</p>}
            </>
          )}

          {tab === 'comment' && (
            <>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {fetchingCmts ? (
                  <p className="text-xs text-gray-400 text-center py-4">Loading comments…</p>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No comments yet.</p>
                ) : comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-[10px] font-semibold text-indigo-700 shrink-0 mt-0.5">
                      {c.user?.name?.charAt(0) ?? 'U'}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-800">{c.user?.name}</span>
                        <span className="text-[10px] text-gray-400">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{c.commentText}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                  placeholder="Add a comment…"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none" />
                <button onClick={handleAddComment} disabled={!comment.trim() || loading}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 transition-colors">
                  {loading ? 'Posting…' : 'Post Comment'}
                </button>
                {error && <p className="text-xs text-red-500">{error}</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Pagination
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const btnCls = 'min-w-[28px] h-7 px-2 rounded-lg text-xs font-medium transition-colors';
  const pages = [...new Set([0, page-1, page, page+1, totalPages-1])].filter(p => p >= 0 && p < totalPages).sort((a,b) => a-b);
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onPageChange(page-1)} disabled={page===0} className={`${btnCls} disabled:opacity-30`}
        style={{ background:'#fff', color:'#6b7280', border:'1px solid #d1d5db' }}>‹</button>
      {pages.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 && p - pages[i-1] > 1 && <span className="text-xs text-gray-400 px-1">…</span>}
          <button onClick={() => onPageChange(p)} className={btnCls}
            style={p===page ? { background:'#3c3c8c', color:'#fff', border:'1px solid #3c3c8c' } : { background:'#fff', color:'#6b7280', border:'1px solid #d1d5db' }}>
            {p+1}
          </button>
        </React.Fragment>
      ))}
      <button onClick={() => onPageChange(page+1)} disabled={page>=totalPages-1} className={`${btnCls} disabled:opacity-30`}
        style={{ background:'#fff', color:'#6b7280', border:'1px solid #d1d5db' }}>›</button>
    </div>
  );
};

// Main Page
const SupportQueue = () => {
  const { user } = useAuthContext();
  const { tickets, stats, loading, error, fetchAll, silentRefresh } = useSupportTickets();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [priority, setPriority] = useState('');
  const [page,     setPage]     = useState(0);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    const id = setInterval(() => { if (document.visibilityState === 'visible') silentRefresh(); }, 30_000);
    return () => clearInterval(id);
  }, [silentRefresh]);

  useEffect(() => { setPage(0); }, [search, status, priority]);

  const filtered = tickets.filter(t => {
    if (status   && t.status   !== status)   return false;
    if (priority && t.priority !== priority) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage     = Math.min(page, totalPages - 1);
  const pagedTickets = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const fmt          = iso => new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  const handleRefresh = useCallback(() => silentRefresh(), [silentRefresh]);

  return (
    <DashboardLayout title="My Queue">
      <div className="space-y-5 animate-fade-in">

        <div>
          <h2 className="text-lg font-semibold text-gray-900">My Queue</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Tickets assigned to you. Click <strong>View</strong> to update status or add a resolution note.
          </p>
        </div>

        <SupportKPICards stats={stats} />

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>
        )}

        {loading ? <LoadingState /> : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm overflow-hidden">

            <div className="px-5 py-4 flex flex-wrap items-center gap-3" style={{ borderBottom:'1px solid #f3f4f6' }}>
              <div className="relative flex-1 min-w-[160px]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID or title…"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none" />
              </div>
              <select value={status}   onChange={e => setStatus(e.target.value)}   className={selCls}>
                <option value="">All Status</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={priority} onChange={e => setPriority(e.target.value)} className={selCls}>
                <option value="">All Priority</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {(search || status || priority) && (
                <button onClick={() => { setSearch(''); setStatus(''); setPriority(''); }}
                  className="text-xs font-medium" style={{ color:'#14a0c8' }}>Clear</button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background:'#f9fafb', borderBottom:'1px solid #f3f4f6' }}>
                    {['Ticket ID','Title','Category','Priority','Status','Raised By','Created',''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"
                            strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-200">
                            <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                          </svg>
                          <p className="text-sm text-gray-400">
                            {search||status||priority ? 'No tickets match your filters.' : 'No tickets assigned to you.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : pagedTickets.map(t => (
                    <tr key={t.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium whitespace-nowrap" style={{ color:'#3c3c8c' }}>{t.id}</td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="truncate text-gray-800 font-medium">{t.title}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{t.category}</td>
                      <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{t.createdByName ?? <span className="text-gray-300 italic">Unknown</span>}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(t.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelectedTicket(t)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium text-white whitespace-nowrap transition-colors"
                          style={{ background:'linear-gradient(135deg,#3c3c8c,#4f4fa3)' }}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 bg-gray-50 flex items-center justify-between gap-4" style={{ borderTop:'1px solid #f3f4f6' }}>
              <p className="text-xs text-gray-400">
                {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}{(search||status||priority) && ' (filtered)'}
              </p>
              <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </div>
        )}
      </div>

      {selectedTicket && (
        <TicketActionModal
          ticket={selectedTicket}
          user={user}
          onClose={() => setSelectedTicket(null)}
          onRefresh={handleRefresh}
        />
      )}
    </DashboardLayout>
  );
};

export default SupportQueue;