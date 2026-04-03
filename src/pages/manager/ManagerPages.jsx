import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuthContext } from '../../context/AuthContext';
import { useManagerTickets } from '../../context/ManagerTicketContext';
import { StatusBadge, PriorityBadge } from '../../components/shared/TicketBadge';
import { AssignTicketPanel, DeptKPICards, SLAHeatmap } from '../../components/manager/ManagerComponents';
import TicketDetailModal from '../../components/shared/TicketDetailModal';
import useTicketDetail from '../../hooks/useTicketDetail';
import { LoadingState, ErrorState } from '../../components/shared/PageState';
import CreateTicketModal from '../../components/employee/CreateTicketModal';
import { useNavigate } from 'react-router-dom';
import { getManagerSupportStaff } from '../../services/managerService';

const STATUSES   = ['Open', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const PAGE_SIZE  = 10;

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const set = new Set([0, page - 1, page, page + 1, totalPages - 1]);
  const pages = [...set].filter(p => p >= 0 && p < totalPages).sort((a, b) => a - b);
  const btnCls = 'min-w-[28px] h-7 px-2 rounded-lg text-xs font-medium transition-colors';
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onPageChange(page - 1)} disabled={page === 0}
        className={`${btnCls} disabled:opacity-30`}
        style={{ background: '#fff', color: '#6b7280', border: '1px solid #d1d5db' }}>‹</button>
      {pages.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 && p - pages[i - 1] > 1 && <span className="text-xs text-gray-400 px-1">…</span>}
          <button onClick={() => onPageChange(p)} className={btnCls}
            style={p === page
              ? { background: '#3c3c8c', color: '#fff', border: '1px solid #3c3c8c' }
              : { background: '#fff', color: '#6b7280', border: '1px solid #d1d5db' }}>
            {p + 1}
          </button>
        </React.Fragment>
      ))}
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1}
        className={`${btnCls} disabled:opacity-30`}
        style={{ background: '#fff', color: '#6b7280', border: '1px solid #d1d5db' }}>›</button>
    </div>
  );
};

// Manager Overview
export const ManagerOverviewPage = () => {
  const { user }   = useAuthContext();
  const navigate   = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const { tickets, stats, loading, error, refetch,
          createTicket, updateStatus, assignTicket,
          addComment, recategorize, updatePriority } = useManagerTickets();
  const { selected, openTicket, closeTicket } = useTicketDetail();

  return (
    <DashboardLayout title="Overview">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start flex-wrap gap-3 justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{user?.department} Department</h2>
            <p className="text-sm text-gray-500 mt-0.5">Department incident overview.</p>
          </div>
        </div>

        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
          <>
            <DeptKPICards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SLAHeatmap tickets={tickets} />
              <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Assign open tickets',   desc: `${stats.open} ticket${stats.open !== 1 ? 's' : ''} waiting`, to: '/dashboard/manager/assign'  },
                    { label: 'View all dept tickets', desc: `${stats.total} total tickets`,                                to: '/dashboard/manager/tickets' },
                    { label: 'View reports',          desc: 'SLA compliance & volume trends',                             to: '/dashboard/manager/reports' },
                  ].map(a => (
                    <button key={a.label} onClick={() => navigate(a.to)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left group">
                      <div>
                        <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-700 transition-colors">{a.label}</p>
                        <p className="text-xs text-gray-500">{a.desc}</p>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </>
        )}
      </div>

      <CreateTicketModal isOpen={showCreate} onClose={() => setShowCreate(false)} onSubmit={createTicket} />
      <TicketDetailModal
        ticket={selected} isOpen={!!selected} onClose={closeTicket}
        role={user?.role} user={user}
        onUpdateStatus={updateStatus} onAssign={assignTicket}
        onAddComment={addComment} onRecategorize={recategorize}
        onUpdatePriority={updatePriority}
      />
    </DashboardLayout>
  );
};

// Manager Tickets
export const ManagerTickets = () => {
  const { user } = useAuthContext();
  const { tickets, allTickets, filters, loading, error, refetch,
          updateFilter, clearFilters, updateStatus,
          assignTicket, addComment, recategorize, updatePriority } = useManagerTickets();
  const { selected, openTicket, closeTicket } = useTicketDetail();

  const [page, setPage] = useState(0);

  useEffect(() => { setPage(0); }, [filters]);

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-IN', {
    day:'2-digit', month:'short', year:'numeric',
  });
  const selCls = 'px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none bg-white';

  const departments = [...new Set((allTickets ?? []).map(t => t.department).filter(Boolean))].sort();
  const categories  = [...new Set((allTickets ?? []).map(t => t.category).filter(Boolean))].sort();

  const totalPages = Math.max(1, Math.ceil(tickets.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages - 1);
  const pageSlice  = tickets.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <DashboardLayout title="Tickets">
      <div className="space-y-5 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Department Tickets</h2>
          <p className="text-sm text-gray-500 mt-0.5">All incidents in the {user?.department} department.</p>
        </div>

        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm overflow-hidden">
            <div className="px-5 py-4 flex flex-wrap items-center gap-3" style={{ borderBottom:'1px solid #f3f4f6' }}>
              <div className="relative flex-1 min-w-[160px]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input value={filters.search} onChange={e => updateFilter('search', e.target.value)}
                  placeholder="Search tickets…"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none" />
              </div>
              <select value={filters.status}   onChange={e => updateFilter('status',   e.target.value)} className={selCls}>
                <option value="">All Status</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filters.priority} onChange={e => updateFilter('priority', e.target.value)} className={selCls}>
                <option value="">All Priority</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={filters.category ?? ''} onChange={e => updateFilter('category', e.target.value)} className={selCls}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {Object.values(filters).some(Boolean) && (
                <button onClick={clearFilters} className="text-xs font-medium" style={{ color:'#14a0c8' }}>Clear</button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background:'#f9fafb', borderBottom:'1px solid #f3f4f6' }}>
                    {['Ticket ID','Title','Category','Priority','Status','Assigned To','Created',''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageSlice.map(t => (
                    <tr key={t.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium" style={{ color:'#3c3c8c' }}>{t.id}</td>
                      <td className="px-4 py-3 max-w-[200px]"><p className="truncate text-gray-800 font-medium">{t.title}</p></td>
                      <td className="px-4 py-3 text-gray-600">{t.category}</td>
                      <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3 text-gray-500">{t.assignedToName ?? (t.assignedTo ? `Staff #${t.assignedTo}` : '—')}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(t.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => openTicket(t)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium text-white transition-colors whitespace-nowrap"
                          style={{ background:'linear-gradient(135deg,#3c3c8c,#4f4fa3)' }}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">No tickets found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-gray-50 flex items-center justify-between" style={{ borderTop:'1px solid #f3f4f6' }}>
              <p className="text-xs text-gray-400">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
              <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </div>
        )}
      </div>

      <TicketDetailModal
        ticket={selected} isOpen={!!selected} onClose={closeTicket}
        role={user?.role} user={user}
        onUpdateStatus={updateStatus} onAssign={assignTicket}
        onAddComment={addComment} onRecategorize={recategorize}
        onUpdatePriority={updatePriority}
      />
    </DashboardLayout>
  );
};

// Manager Assign
export const ManagerAssign = () => {
  const { user } = useAuthContext();
  const { tickets, loading, error, refetch, allTickets, assignTicket, addComment } = useManagerTickets();

  const [supportStaff,    setSupportStaff]    = useState([]);
  const [staffLoading,    setStaffLoading]    = useState(true);
  const [selectedTicket,  setSelectedTicket]  = useState('');
  const [selectedStaff,   setSelectedStaff]   = useState('');
  const [assigning,       setAssigning]       = useState(false);
  const [success,         setSuccess]         = useState('');
  const [assignError,     setAssignError]     = useState('');
  const [comment,         setComment]         = useState('');
  const [isInternal,      setIsInternal]      = useState(false);
  const [commenting,      setCommenting]      = useState(false);
  const [commentSuccess,  setCommentSuccess]  = useState('');
  const [commentError,    setCommentError]    = useState('');

  const [unassignedPage, setUnassignedPage] = useState(0);

  useEffect(() => {
    getManagerSupportStaff()
      .then(data => setSupportStaff(data ?? []))
      .catch(() => setSupportStaff([]))
      .finally(() => setStaffLoading(false));
  }, []);

  const openTickets       = (allTickets ?? tickets).filter(t => t.status === 'Open');
  const unassignedTickets = openTickets.filter(t => !t.assignedTo);

  const unassignedTotalPages = Math.max(1, Math.ceil(unassignedTickets.length / PAGE_SIZE));
  const safeUnassignedPage   = Math.min(unassignedPage, unassignedTotalPages - 1);
  const unassignedPageSlice  = unassignedTickets.slice(safeUnassignedPage * PAGE_SIZE, (safeUnassignedPage + 1) * PAGE_SIZE);

  const handleAssign = async () => {
    if (!selectedTicket || !selectedStaff) return;
    setAssigning(true);
    setAssignError('');
    try {
      const ticketObj = openTickets.find(t => t.id === selectedTicket);
      const staff = supportStaff.find(s => s.id === Number(selectedStaff));
      const staffName = staff?.name ?? staff?.fullName ?? null;
      await assignTicket(selectedTicket, Number(selectedStaff), ticketObj?.category ?? '', staffName);
      setSuccess(`Ticket ${selectedTicket} assigned to ${staffName ?? 'staff member'}.`);
      setSelectedTicket('');
      setSelectedStaff('');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setAssignError(err?.message ?? 'Assignment failed. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !comment.trim()) return;
    setCommenting(true);
    setCommentError('');
    try {
      await addComment(selectedTicket, comment.trim(), user?.fullName, isInternal);
      setCommentSuccess('Comment posted successfully.');
      setComment('');
      setIsInternal(false);
      setTimeout(() => setCommentSuccess(''), 4000);
    } catch (err) {
      setCommentError(err?.message ?? 'Failed to post comment.');
    } finally {
      setCommenting(false);
    }
  };

  const selCls = 'w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none bg-white';

  return (
    <DashboardLayout title="Assign Tickets">
      <div className="space-y-5 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Assign Tickets</h2>
          <p className="text-sm text-gray-500 mt-0.5">Assign open tickets to support staff members and add comments.</p>
        </div>

        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Assign Ticket</h3>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Open ticket</label>
                  <select value={selectedTicket} onChange={e => setSelectedTicket(e.target.value)} className={selCls}>
                    <option value="">Select a ticket…</option>
                    {openTickets.map(t => (
                      <option key={t.id} value={t.id}>[{t.priority}] {t.id} — {t.title.slice(0, 40)}</option>
                    ))}
                  </select>
                  {openTickets.length === 0 && (
                    <p className="mt-1 text-xs text-gray-400">No open tickets to assign.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Assign to</label>
                  <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}
                    className={selCls} disabled={staffLoading}>
                    <option value="">{staffLoading ? 'Loading staff…' : 'Select support staff…'}</option>
                    {supportStaff.map(s => (
                      <option key={s.id} value={s.id}>{s.name ?? s.fullName} — {s.department}</option>
                    ))}
                  </select>
                </div>

                <button onClick={handleAssign}
                  disabled={!selectedTicket || !selectedStaff || assigning}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-colors"
                  style={{ background: 'linear-gradient(135deg,#3c3c8c,#4f4fa3)' }}>
                  {assigning ? 'Assigning…' : 'Confirm Assignment'}
                </button>

                {success && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200 animate-fade-in">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-green-600">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <p className="text-xs text-green-700">{success}</p>
                  </div>
                )}
                {assignError && <p className="text-xs text-red-500 px-1">{assignError}</p>}
              </div>

            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f3f4f6' }}>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Open Unassigned Tickets</h3>
                  {unassignedTickets.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">{unassignedTickets.length} ticket{unassignedTickets.length !== 1 ? 's' : ''} waiting</p>
                  )}
                </div>
              </div>
              {unassignedTickets.length === 0 ? (
                <li className="px-5 py-10 text-center text-sm text-gray-400 list-none">All open tickets have been assigned. ✓</li>
              ) : (
                <>
                  <ul className="divide-y divide-gray-50">
                    {unassignedPageSlice.map(t => (
                      <li key={t.id}
                        onClick={() => setSelectedTicket(t.id)}
                        className={`flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors ${selectedTicket === t.id ? 'bg-indigo-50 border-l-2 border-indigo-500' : 'hover:bg-gray-50'}`}>
                        <span className="font-mono text-xs font-medium w-36 shrink-0" style={{ color: '#3c3c8c' }}>{t.id}</span>
                        <span className="flex-1 text-sm text-gray-700 truncate">{t.title}</span>
                        <PriorityBadge priority={t.priority} />
                      </li>
                    ))}
                  </ul>
                  <div className="px-5 py-3 bg-gray-50 flex items-center justify-between" style={{ borderTop: '1px solid #f3f4f6' }}>
                    <p className="text-xs text-gray-400">{unassignedTickets.length} unassigned</p>
                    <Pagination page={safeUnassignedPage} totalPages={unassignedTotalPages} onPageChange={setUnassignedPage} />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

// Manager Reports
export const ManagerReports = () => {
  const { reportSummary, ticketVolume, catBreakdown,
          reportPeriod, reportLoading, changeReportPeriod } = useManagerTickets();

  const [dailyVolume,   setDailyVolume]   = useState([]);
  const [dailyLoading,  setDailyLoading]  = useState(false);

  useEffect(() => {
    setDailyLoading(true);
    import('../../services/managerService')
      .then(({ getManagerTicketVolume }) => getManagerTicketVolume('day'))
      .then(data => setDailyVolume(data ?? []))
      .catch(() => setDailyVolume([]))
      .finally(() => setDailyLoading(false));
  }, []);

  const maxVal     = Math.max(...ticketVolume.map(d => d.count), 1);
  const maxDaily   = Math.max(...dailyVolume.map(d => d.count), 1);
  const maxCat     = Math.max(...catBreakdown.map(d => d.count), 1);
  const compliance = reportSummary?.slaCompliance ?? 0;

  const PERIOD_LABELS = { week: 'Weekly', month: 'Monthly', year: 'Yearly' };
  const CAT_COLORS = {
    IT:'bg-indigo-500', HR:'bg-purple-500', Admin:'bg-cyan-500',
    Facilities:'bg-amber-500', Finance:'bg-green-500', Others:'bg-gray-400',
  };

  const handleExport = () => {
    try {
      let csvContent = "Department Reports Export\n\n";

      csvContent += "--- SUMMARY METRICS ---\n";
      csvContent += "Metric,Value\n";
      csvContent += `SLA Compliance,${compliance}%\n`;
      csvContent += `Total Today,${reportSummary?.totalToday ?? 0}\n`;
      csvContent += `Report Period,${PERIOD_LABELS[reportPeriod] ?? 'Weekly'}\n\n`;

      csvContent += "--- VOLUME TREND ---\n";
      csvContent += "Time Label,Ticket Count\n";
      if (ticketVolume && ticketVolume.length > 0) {
        ticketVolume.forEach(d => {
          csvContent += `"${d.label}",${d.count}\n`;
        });
      } else {
        csvContent += "No data available\n";
      }
      csvContent += "\n";

      csvContent += "--- CATEGORY BREAKDOWN ---\n";
      csvContent += "Category,Ticket Count\n";
      if (catBreakdown && catBreakdown.length > 0) {
        catBreakdown.forEach(c => {
          csvContent += `"${c.label}",${c.count}\n`;
        });
      } else {
        csvContent += "No data available\n";
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `IIMP_Report_${reportPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Append to body (required for Firefox compatibility), click, and cleanup
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Export generation failed:", error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Department Reports</h2>
            <p className="text-sm text-gray-500 mt-0.5">Ticket trends, SLA performance, and category breakdown.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {[['week','Weekly'],['month','Monthly'],['year','Yearly']].map(([val, label]) => (
                <button key={val} onClick={() => changeReportPeriod(val)}
                  className="px-4 py-2 text-xs font-medium transition-colors"
                  style={reportPeriod === val
                    ? { background:'#3c3c8c', color:'#fff' }
                    : { background:'#fff', color:'#6b7280' }}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors"
              style={{ color:'#3c3c8c', borderColor:'#c5c5e8', background:'#fff' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">SLA Compliance</p>
              <p className="text-3xl font-bold mt-1" style={{ color:'#3c3c8c' }}>{compliance}%</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Total today</p>
              <p className="text-2xl font-bold text-gray-800">{reportSummary?.totalToday ?? '—'}</p>
            </div>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background:'#f3f4f6' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width:`${compliance}%`, background:'linear-gradient(90deg,#3c3c8c,#14a0c8)' }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-400">0%</span>
            <span className="text-[10px] font-medium" style={{ color:'#3c3c8c' }}>{compliance}% compliant</span>
            <span className="text-[10px] text-gray-400">100%</span>
          </div>
        </div>

        {reportLoading ? (
          <div className="h-40 flex items-center justify-center bg-white rounded-2xl border border-gray-100">
            <p className="text-sm text-gray-400">Loading report data…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Volume Trend</h3>
              <p className="text-xs text-gray-400 mb-4">Ticket submissions — {PERIOD_LABELS[reportPeriod] ?? 'Weekly'}</p>
              {ticketVolume.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-10">No data for this period.</p>
              ) : (
                <div className="flex items-end gap-1.5 h-36">
                  {ticketVolume.map(d => (
                    <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <span className="text-[10px] text-gray-500">{d.count}</span>
                      <div className="w-full rounded-t-lg transition-all"
                        style={{ height:`${Math.max((d.count / maxVal) * 112, d.count > 0 ? 4 : 0)}px`, background:'linear-gradient(to top,#3c3c8c,#6363b8)' }} />
                      <span className="text-[10px] text-gray-400 truncate w-full text-center">{d.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">By Category</h3>
              <div className="space-y-2.5">
                {catBreakdown.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-10">No data available.</p>
                ) : catBreakdown.map(c => (
                  <div key={c.label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-20 shrink-0">{c.label}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${CAT_COLORS[c.label] ?? 'bg-gray-400'}`}
                        style={{ width:`${(c.count / maxCat) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-6 text-right">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>


          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

// Manager My Tickets
export const ManagerMyTickets = () => {
  const { user } = useAuthContext();
  const { allTickets, loading, error, refetch,
          updateStatus, assignTicket, addComment, recategorize, updatePriority } = useManagerTickets();
  const { selected, openTicket, closeTicket } = useTicketDetail();

  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [priority, setPriority] = useState('');
  const [myPage,   setMyPage]   = useState(0);

  useEffect(() => { setMyPage(0); }, [search, status, priority]);

  const allMyTickets = allTickets.filter(t => {
    const createdByName  = t.createdByName;
    const matchesOwner = createdByName === user?.fullName;
    const matchesStatus = !status   || t.status   === status;
    const matchesPrio   = !priority || t.priority === priority;
    const matchesSearch = !search   || t.title.toLowerCase().includes(search.toLowerCase())
                                    || t.id.toLowerCase().includes(search.toLowerCase());
    return matchesOwner && matchesStatus && matchesPrio && matchesSearch;
  });

  const myTotalPages = Math.max(1, Math.ceil(allMyTickets.length / PAGE_SIZE));
  const safeMyPage   = Math.min(myPage, myTotalPages - 1);
  const myTickets    = allMyTickets.slice(safeMyPage * PAGE_SIZE, (safeMyPage + 1) * PAGE_SIZE);

  const formatDate = iso => new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const selCls = 'px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none bg-white';

  const myStats = {
    total:      allMyTickets.length,
    open:       allMyTickets.filter(t => t.status === 'Open').length,
    inProgress: allMyTickets.filter(t => t.status === 'In Progress').length,
    resolved:   allMyTickets.filter(t => t.status === 'Resolved').length,
    closed:     allMyTickets.filter(t => t.status === 'Closed').length,
  };

  const statCards = [
    { label: 'Total',       value: myStats.total,      color: 'from-indigo-600 to-indigo-700' },
    { label: 'Open',        value: myStats.open,        color: 'from-cyan-500 to-cyan-600'     },
    { label: 'In Progress', value: myStats.inProgress,  color: 'from-amber-500 to-amber-600'   },
    { label: 'Resolved',    value: myStats.resolved,    color: 'from-green-500 to-green-600'   },
    { label: 'Closed',    value: myStats.closed,    color: 'from-gray-500 to-gray-600'   },
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

        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
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
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by ID or title…"
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
                    className="text-xs font-medium" style={{ color: '#14a0c8' }}>
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
                    {allMyTickets.length === 0 ? (
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
                    ) : myTickets.map(t => (
                      <tr key={t.id} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium" style={{ color: '#3c3c8c' }}>{t.id}</td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="truncate text-gray-800 font-medium">{t.title}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{t.category}</td>
                        <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-3 text-gray-500">
                          {t.assignedToName ?? (t.assignedTo ? `Staff #${t.assignedTo}` : (
                            <span className="text-gray-300 italic">Unassigned</span>
                          ))}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(t.createdAt)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => openTicket(t)}
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
                  {allMyTickets.length} ticket{allMyTickets.length !== 1 ? 's' : ''}
                  {(search || status || priority) && ` (filtered)`}
                </p>
                <Pagination page={safeMyPage} totalPages={myTotalPages} onPageChange={setMyPage} />
              </div>
            </div>
          </>
        )}
      </div>

      <TicketDetailModal
        ticket={selected} isOpen={!!selected} onClose={closeTicket}
        role={user?.role} user={user}
        onUpdateStatus={updateStatus} onAssign={assignTicket}
        onAddComment={addComment} onRecategorize={recategorize}
        onUpdatePriority={updatePriority}
      />
    </DashboardLayout>
  );
};