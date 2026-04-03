import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import TicketDetailModal from '../../components/shared/TicketDetailModal';
import { StatusBadge, PriorityBadge } from '../../components/shared/TicketBadge';
import { useAuthContext } from '../../context/AuthContext';
import { useSupportTickets } from '../../hooks/useSupportTickets';
import { useTickets } from '../../hooks/useTickets';
import useTicketDetail from '../../hooks/useTicketDetail';

// Constants
const STATUSES   = ['Open', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

// Loading / Error states
const LoadingState = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm
    py-16 flex flex-col items-center gap-3">
    <div className="w-6 h-6 rounded-full border-2 border-indigo-100 border-t-indigo-500 animate-spin"/>
    <span className="text-xs text-gray-400">Loading tickets…</span>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center gap-3 py-10">
    <p className="text-sm text-red-500">{message}</p>
    <button
      onClick={onRetry}
      className="text-xs font-medium text-indigo-600 hover:underline"
    >
      Retry
    </button>
  </div>
);

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const set = new Set([0, page - 1, page, page + 1, totalPages - 1]);
  const pages = [...set].filter(p => p >= 0 && p < totalPages).sort((a, b) => a - b);
  const btnCls = 'min-w-[28px] h-7 px-2 rounded-lg text-xs font-medium transition-colors';
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onPageChange(page - 1)} disabled={page === 0}
        className={`${btnCls} disabled:opacity-30`}
        style={{ background:'#fff', color:'#6b7280', border:'1px solid #d1d5db' }}>‹</button>
      {pages.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 && p - pages[i - 1] > 1 && <span className="text-xs text-gray-400 px-1">…</span>}
          <button onClick={() => onPageChange(p)} className={btnCls}
            style={p === page
              ? { background:'#3c3c8c', color:'#fff', border:'1px solid #3c3c8c' }
              : { background:'#fff', color:'#6b7280', border:'1px solid #d1d5db' }}>
            {p + 1}
          </button>
        </React.Fragment>
      ))}
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1}
        className={`${btnCls} disabled:opacity-30`}
        style={{ background:'#fff', color:'#6b7280', border:'1px solid #d1d5db' }}>›</button>
    </div>
  );
};

const PAGE_SIZE = 10;

export const StaffMyTickets = () => {
  const { user } = useAuthContext();

  const { tickets: allTickets, loading, error, fetchAll } = useSupportTickets();

  const { updateStatus, addComment } = useTickets(user?.id, 'SUPPORT_STAFF');

  const { selected, openTicket, closeTicket } = useTicketDetail();

  useEffect(() => { fetchAll(); }, []);

  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [priority, setPriority] = useState('');

  const [page,     setPage]     = useState(0);

  const myTickets = allTickets.filter(t => {
    const matchesOwner = t.createdByName === user?.fullName;
    const matchesSt    = !status   || t.status   === status;
    const matchesPr    = !priority || t.priority === priority;
    const matchesSe    = !search
                      || t.title.toLowerCase().includes(search.toLowerCase())
                      || t.id.toLowerCase().includes(search.toLowerCase());
    return matchesOwner && matchesSt && matchesPr && matchesSe;
  });

  useEffect(() => { setPage(0); }, [search, status, priority]);

  const totalPages = Math.max(1, Math.ceil(myTickets.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages - 1);
  const pagedTickets = myTickets.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const formatDate = iso => new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const selCls = 'px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none bg-white';

  const myStats = {
    total:      myTickets.length,
    open:       myTickets.filter(t => t.status === 'Open').length,
    inProgress: myTickets.filter(t => t.status === 'In Progress').length,
    resolved:   myTickets.filter(t => t.status === 'Resolved').length,
    closed:     myTickets.filter(t => t.status === 'Closed').length,
  };

  const statCards = [
    { label: 'Total',       value: myStats.total,      color: 'from-indigo-600 to-indigo-700' },
    { label: 'Open',        value: myStats.open,        color: 'from-cyan-500 to-cyan-600'     },
    { label: 'In Progress', value: myStats.inProgress,  color: 'from-amber-500 to-amber-600'   },
    { label: 'Resolved',    value: myStats.resolved,    color: 'from-green-500 to-green-600'   },
    { label: 'Closed',      value: myStats.closed,      color: 'from-gray-500 to-gray-600'     },
  ];

  return (
    <DashboardLayout title="My Tickets">
      <div className="space-y-5 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">My Tickets</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              All tickets you have personally created.
            </p>
          </div>
        </div>

        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={fetchAll} /> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {statCards.map(c => (
                <div key={c.label}
                  className={`rounded-2xl p-4 text-white bg-gradient-to-br ${c.color} shadow-pratiti-md`}>
                  <p className="text-2xl font-bold leading-none mb-1">{c.value}</p>
                  <p className="text-xs text-white/80">{c.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm overflow-hidden">
              <div className="px-5 py-4 flex flex-wrap items-center gap-3"
                style={{ borderBottom: '1px solid #f3f4f6' }}>

                <div className="relative flex-1 min-w-[160px]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by ID or title…"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none"
                  />
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
                  <button
                    onClick={() => { setSearch(''); setStatus(''); setPriority(''); }}
                    className="text-xs font-medium"
                    style={{ color: '#14a0c8' }}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                      {['Ticket ID', 'Title', 'Category', 'Priority', 'Status', 'Assigned To', 'Created', ''].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {myTickets.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"
                              strokeLinecap="round" strokeLinejoin="round"
                              className="w-10 h-10 text-gray-200">
                              <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                            </svg>
                            <p className="text-sm text-gray-400">
                              {search || status || priority
                                ? 'No tickets match your filters.'
                                : "You haven't created any tickets yet."}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : pagedTickets.map(t => (
                      <tr key={t.id} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium" style={{ color: '#3c3c8c' }}>{t.id}</td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="truncate text-gray-800 font-medium">{t.title}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{t.category}</td>
                        <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                        <td className="px-4 py-3"><StatusBadge   status={t.status}   /></td>
                        <td className="px-4 py-3 text-gray-500">
                          {t.assignedToName ?? (
                            <span className="text-gray-300 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(t.createdAt)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openTicket(t)}
                            className="px-3 py-1.5 rounded-xl text-xs font-medium text-white whitespace-nowrap transition-colors"
                            style={{ background: 'linear-gradient(135deg,#3c3c8c,#4f4fa3)' }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-3 bg-gray-50" style={{ borderTop: '1px solid #f3f4f6' }}>
                <p className="text-xs text-gray-400">
                  {myTickets.length} ticket{myTickets.length !== 1 ? 's' : ''}
                  {(search || status || priority) && ' (filtered)'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <TicketDetailModal
        ticket={selected}
        isOpen={!!selected}
        onClose={closeTicket}
        role={user?.role}
        user={user}
        onUpdateStatus={updateStatus}
        onAddComment={addComment}
      />
    </DashboardLayout>
  );
};

export default StaffMyTickets;