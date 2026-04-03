
import React, { useState, useEffect } from 'react';
import { StatusBadge, PriorityBadge } from '../shared/TicketBadge';
import TicketDetailModal from '../shared/TicketDetailModal';
import { useAuthContext } from '../../context/AuthContext';
import { PRIORITIES, STATUSES } from '../../data/mockData';
import { useTickets } from '../../hooks/useTickets';
import { LoadingState } from '../shared/PageState';

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const PAGE_SIZE = 10;

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

const MyTicketsList = ({ onCreateClick }) => {
  const { user } = useAuthContext();

  const {
    tickets: allTickets,
    filters,
    loading,
    updateFilter,
    clearFilters,
    fetchAllByUser,
    updateStatus,
    assignTicket,
    addComment,
    recategorize,
  } = useTickets(user?.id, 'EMPLOYEE');

  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(0);
  const hasActiveFilters = Object.values(filters).some(Boolean);

  useEffect(() => { fetchAllByUser(); }, []);
  useEffect(() => { setPage(0); }, [filters]);

  const totalPages = Math.max(1, Math.ceil(allTickets.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const tickets = allTickets.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const myStats = {
    total:      allTickets.length,
    open:       allTickets.filter(t => t.status === 'Open').length,
    inProgress: allTickets.filter(t => t.status === 'In Progress').length,
    resolved:   allTickets.filter(t => t.status === 'Resolved').length,
    closed:     allTickets.filter(t => t.status === 'Closed').length,
  };

  const statCards = [
    { label: 'Total',       value: myStats.total,      color: 'from-indigo-600 to-indigo-700' },
    { label: 'Open',        value: myStats.open,        color: 'from-cyan-500 to-cyan-600'     },
    { label: 'In Progress', value: myStats.inProgress,  color: 'from-amber-500 to-amber-600'   },
    { label: 'Resolved',    value: myStats.resolved,    color: 'from-green-500 to-green-600'   },
    { label: 'Closed',      value: myStats.closed,      color: 'from-gray-500 to-gray-600'     },
  ];

  const selCls = 'px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none bg-white';

  return (
    <>
      <div className="space-y-5 animate-fade-in">


        {loading ? <LoadingState /> : (
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
                  <input value={filters.search} onChange={e => updateFilter('search', e.target.value)}
                    placeholder="Search by ID or title…"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none" />
                </div>

                <select value={filters.status}   onChange={e => updateFilter('status', e.target.value)}   className={selCls}>
                  <option value="">All Status</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filters.priority} onChange={e => updateFilter('priority', e.target.value)} className={selCls}>
                  <option value="">All Priority</option>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs font-medium" style={{ color: '#14a0c8' }}>
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
                    {allTickets.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"
                              strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-200">
                              <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                            </svg>
                            <p className="text-sm text-gray-400">
                              {hasActiveFilters ? 'No tickets match your filters.' : "You haven't created any tickets yet."}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : tickets.map(t => (
                      <tr key={t.id} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium" style={{ color: '#3c3c8c' }}>{t.id}</td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="truncate text-gray-800 font-medium">{t.title}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{t.category}</td>
                        <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-3 text-gray-500">
                          {t.assignedToName ? t.assignedToName : (
                            <span className="text-gray-300 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(t.createdAt)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelected(t)}
                            className="px-3 py-1.5 rounded-xl text-xs font-medium text-white whitespace-nowrap transition-colors"
                            style={{ background: 'linear-gradient(135deg,#3c3c8c,#4f4fa3)' }}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-3 bg-gray-50 flex items-center justify-between" style={{ borderTop: '1px solid #f3f4f6' }}>
                <p className="text-xs text-gray-400">
                  {allTickets.length} ticket{allTickets.length !== 1 ? 's' : ''}
                  {hasActiveFilters && ' (filtered)'}
                </p>
                <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </div>
          </>
        )}
      </div>

      <TicketDetailModal
        ticket={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        role={user?.role}
        user={user}
        onUpdateStatus={updateStatus}
        onAssign={assignTicket}
        onAddComment={addComment}
        onRecategorize={recategorize}
      />
    </>
  );
};

export default MyTicketsList;