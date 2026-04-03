import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuthContext } from '../../context/AuthContext';
import { useAdminTickets } from '../../context/AdminTicketContext';
import { CATEGORY_LIST } from '../../data/mockData';
import { StatusBadge, PriorityBadge } from '../../components/shared/TicketBadge';
import { SystemKPICards, UserManagementTable, RecategorizePanel, SLAConfigPanel } from '../../components/admin/AdminComponents';
import TicketDetailModal from '../../components/shared/TicketDetailModal';
import useTicketDetail from '../../hooks/useTicketDetail';
import { LoadingState, ErrorState, StatCardSkeleton } from '../../components/shared/PageState';
import { getTicketVolume, getCategoryBreakdown, getReportSummary, buildExportUrl } from '../../services/reportService';
import { getUsers, toggleUserStatus, updateUser, createUser } from '../../services/userService';
import { getSLAConfig, updateSLAConfig } from '../../services/slaService';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/shared/Modal';

const STATUSES   = ['Open', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const PALETTE    = ['#3c3c8c','#14a0c8','#783c78','#d97706','#059669','#9ca3af'];

const useChartJS = () => {
  const [loaded, setLoaded] = useState(!!window.Chart);
  useEffect(() => {
    if (window.Chart) { setLoaded(true); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    s.onload = () => setLoaded(true);
    document.head.appendChild(s);
  }, []);
  return loaded;
};

const useChart = (ref, config, deps = []) => {
  useEffect(() => {
    if (!ref.current || !window.Chart) return;
    const c = new window.Chart(ref.current, config);
    return () => c.destroy();
  }, deps);
};

// Admin Overview
// Pagination
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
          {i > 0 && p - pages[i - 1] > 1 && (
            <span className="text-xs text-gray-400 px-1">…</span>
          )}
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

export const AdminOverview = () => {
  const { user }   = useAuthContext();
  const navigate   = useNavigate();
  const { allTickets, stats, loading, error, refetch, updateStatus, assignTicket, addComment, recategorize, updatePriority } =
    useAdminTickets();
  const { selected, openTicket, closeTicket } = useTicketDetail();
  const othersCount = allTickets.filter(t => t.category === 'Others').length;

  return (
    <DashboardLayout title="Overview">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">System Overview</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : (
          <>
            <SystemKPICards stats={stats} />

            {othersCount > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <p className="text-xs text-amber-800 font-medium">
                  {othersCount} ticket{othersCount > 1 ? 's need' : ' needs'} re-categorization.
                </p>
                <button onClick={() => navigate('/dashboard/admin/recategorize')}
                  className="ml-auto text-xs font-semibold text-amber-700 hover:underline shrink-0">
                  Re-categorize →
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Manage Users',      desc: 'Create & manage accounts',      to: '/dashboard/admin/users',        color: '#3c3c8c' },
                { label: 'View All Tickets',  desc: `${stats.total} tickets`,         to: '/dashboard/admin/tickets',      color: '#14a0c8' },
                { label: 'System Reports',    desc: 'SLA & volume analytics',         to: '/dashboard/admin/reports',      color: '#783c78' },
                { label: 'SLA Configuration', desc: 'Edit resolution time limits',    to: '/dashboard/admin/sla',          color: '#d97706' },
                { label: 'Re-categorize',     desc: `${othersCount} pending`,         to: '/dashboard/admin/recategorize', color: '#059669' },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.to)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-4 text-left hover:border-indigo-200 hover:bg-indigo-50/20 transition-all group">
                  <div className="w-8 h-8 rounded-xl mb-3 flex items-center justify-center" style={{ background: `${a.color}18` }}>
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: a.color }} />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">{a.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
                </button>
              ))}
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

// Admin All Tickets
export const AdminTickets = () => {
  const { user } = useAuthContext();
  const { tickets, filters, loading, error, refetch, updateFilter, clearFilters,
          updateStatus, assignTicket, addComment, recategorize, updatePriority,
          page, totalPages, totalItems, goToPage } = useAdminTickets();
  const { selected, openTicket, closeTicket } = useTicketDetail();

  const formatDate = iso => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const selCls = 'px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none bg-white';

  const departments = useMemo(
    () => [...new Set(CATEGORY_LIST.map(c => c.departmentName).filter(Boolean))].sort(),
    []
  );

  const filteredCategories = useMemo(
    () => filters.department
      ? CATEGORY_LIST.filter(c => c.departmentName === filters.department)
      : CATEGORY_LIST,
    [filters.department]
  );

  const handleDeptChange = (dept) => {
    updateFilter('department', dept);
    updateFilter('category', '');
  };

  return (
    <DashboardLayout title="All Tickets">
      <div className="space-y-5 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">All Tickets</h2>
          <p className="text-sm text-gray-500 mt-0.5">System-wide incident view across all departments.</p>
        </div>

        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm overflow-hidden">
            <div className="px-5 py-4 flex flex-wrap items-center gap-3" style={{ borderBottom: '1px solid #f3f4f6' }}>
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
              <select value={filters.status}   onChange={e => updateFilter('status',   e.target.value)} className={selCls}>
                <option value="">All Status</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filters.priority} onChange={e => updateFilter('priority', e.target.value)} className={selCls}>
                <option value="">All Priority</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={filters.department} onChange={e => handleDeptChange(e.target.value)} className={selCls}>
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={filters.category} onChange={e => updateFilter('category', e.target.value)} className={selCls}>
                <option value="">All {filters.department ? `${filters.department} ` : ''}Categories</option>
                {filteredCategories.map(c => <option key={c.id} value={c.categoryName}>{c.categoryName}</option>)}
              </select>
              {Object.values(filters).some(Boolean) && (
                <button onClick={clearFilters} className="text-xs font-medium" style={{ color: '#14a0c8' }}>Clear</button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                    {['Ticket ID','Title','Category','Priority','Status','Department','SLA','Created',''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tickets.map(t => (
                    <tr key={t.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium" style={{ color: '#3c3c8c' }}>{t.id}</td>
                      <td className="px-4 py-3 max-w-[180px]"><p className="truncate font-medium text-gray-800">{t.title}</p></td>
                      <td className="px-4 py-3 text-gray-600">{t.category}</td>
                      <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3 text-gray-500">{t.department ?? '—'}</td>
                      <td className="px-4 py-3">
                        {t.isSlaBreached
                          ? <span className="text-xs font-semibold text-red-600">SLA Breached</span>
                          : <span className="text-xs text-green-600">On track</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(t.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openTicket(t)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium text-white transition-colors whitespace-nowrap"
                          style={{ background:'linear-gradient(135deg,#3c3c8c,#4f4fa3)' }}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-gray-50 flex items-center justify-between" style={{ borderTop: '1px solid #f3f4f6' }}>
              <p className="text-xs text-gray-400">{totalItems} ticket{totalItems !== 1 ? 's' : ''} total</p>
              <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
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

// Admin Users
export const AdminUsers = () => {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try { setUsers((await getUsers()) ?? []); }
    catch (e) { setError(e?.message ?? 'Failed to load users.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleStatus = async (id, active) => {
    await toggleUserStatus(id, active);
    setUsers(p => p.map(u => u.id === id ? { ...u, active } : u));
  };

  const handleUpdateUser = async (id, form) => {
    await updateUser(id, form);
    setUsers(p => p.map(u => u.id === id ? { ...u, ...form } : u));
  };

  const handleCreateUser = async (form) => {
    const newUser = await createUser(form);
    setUsers(p => [newUser, ...p]);
  };

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-5 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Create, edit, and manage all system users.</p>
        </div>
        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={fetchUsers} /> : (
          <UserManagementTable
            users={users}
            onToggleStatus={handleToggleStatus}
            onUpdateUser={handleUpdateUser}
            onCreateUser={handleCreateUser}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

// Admin Reports

export const AdminReports = () => {
  const [period, setPeriod] = useState('Weekly');
  const chartjsLoaded = useChartJS();
  const barRef   = useRef();
  const lineRef  = useRef();
  const doughRef = useRef();

  const [summary,     setSummary]     = useState(null);
  const [volume,      setVolume]      = useState([]); 
  const [dailyVol,    setDailyVol]    = useState([]);  
  const [catBreak,    setCatBreak]    = useState([]);
  const [rLoading,    setRLoading]    = useState(true);
  const [rError,      setRError]      = useState(null);
  const [exporting,   setExporting]   = useState(false);

  const PERIOD_MAP = { Weekly: 'week', Monthly: 'month' };

  const fetchReports = useCallback(async () => {
    setRLoading(true); setRError(null);
    try {
      const range = PERIOD_MAP[period] ?? 'week';
      
      const [s, v, daily, c] = await Promise.all([
        getReportSummary({ range }),
        getTicketVolume({ range }),
        getTicketVolume({ range: 'day' }),
        getCategoryBreakdown({ range }),
      ]);
      
      setSummary(s);
      setVolume(v ?? []);
      setDailyVol(daily ?? []);
      setCatBreak(c ?? []);
    } catch (e) {
      setRError(e?.message ?? 'Failed to load reports.');
    } finally { setRLoading(false); }
  }, [period]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  useChart(lineRef, {
    type: 'line',
    data: { labels: volume.map(d => d.label), datasets: [{ label: 'Volume', data: volume.map(d => d.count),
      borderColor: '#14a0c8', backgroundColor: 'rgba(20,160,200,0.10)', borderWidth: 2.5,
      pointBackgroundColor: '#14a0c8', pointBorderColor: '#fff', pointBorderWidth: 2,
      pointRadius: 5, fill: true, tension: 0.4 }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1a4e', cornerRadius: 8, padding: 10 } },
      scales: { x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } } },
        y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } } } },
  }, [chartjsLoaded, volume]);

  useChart(barRef, {
    type: 'bar',
    data: { labels: dailyVol.map(d => d.label), datasets: [{ label: 'Tickets', data: dailyVol.map(d => d.count),
      backgroundColor: dailyVol.map((_, i) => i % 2 === 0 ? '#3c3c8c' : '#14a0c8'),
      borderRadius: 6, borderSkipped: false, barThickness: 26 }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1a4e', cornerRadius: 8, padding: 10 } },
      scales: { x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } } },
        y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } } } },
  }, [chartjsLoaded, dailyVol]);

  useChart(doughRef, {
    type: 'doughnut',
    data: { labels: catBreak.map(d => d.label), datasets: [{ data: catBreak.map(d => d.count),
      backgroundColor: PALETTE, borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '68%',
      plugins: { legend: { position: 'right', labels: { color: '#374151', font: { size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 8 } },
        tooltip: { backgroundColor: '#1a1a4e', cornerRadius: 8, padding: 10 } } },
  }, [chartjsLoaded, catBreak]);

  const handleExport = () => {
    setExporting(true);
    try {
      let csvContent = "SYSTEM REPORT EXPORT\n";
      csvContent += `Generated on: ${new Date().toLocaleString()}\n`;
      csvContent += `Period View: ${period}\n\n`;

      if (summary) {
        csvContent += "--- SUMMARY STATISTICS ---\n";
        csvContent += "Metric,Value\n";
        csvContent += `Total Today,${summary.totalToday ?? 0}\n`;
        csvContent += `SLA Compliance (%),${summary.slaCompliance ?? 0}\n`;
        csvContent += `SLA Breached,${summary.breachedCount ?? 0}\n`;
        csvContent += `Open Tickets,${summary.openCount ?? 0}\n\n`;
      }

      if (volume && volume.length > 0) {
        csvContent += "--- VOLUME TREND ---\n";
        csvContent += "Date/Label,Ticket Count\n";
        volume.forEach(item => {
          const safeLabel = `"${String(item.label).replace(/"/g, '""')}"`;
          csvContent += `${safeLabel},${item.count}\n`;
        });
        csvContent += "\n";
      }

      if (catBreak && catBreak.length > 0) {
        csvContent += "--- CATEGORY BREAKDOWN ---\n";
        csvContent += "Category,Ticket Count\n";
        catBreak.forEach(item => {
          const safeLabel = `"${String(item.label).replace(/"/g, '""')}"`;
          csvContent += `${safeLabel},${item.count}\n`;
        });
        csvContent += "\n";
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.setAttribute('href', url);
      link.setAttribute('download', `IIMP_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Export Error:", err);
      alert(err?.message ?? 'Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start flex-wrap gap-3 justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">System Reports</h2>
          </div>
          <div className="flex items-center gap-3">
            
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {['Weekly','Monthly'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className="px-4 py-2 text-xs font-medium transition-colors"
                  style={period === p ? { background: '#3c3c8c', color: '#fff' } : { background: '#fff', color: '#6b7280' }}>
                  {p}
                </button>
              ))}
            </div>

            <button onClick={handleExport} disabled={exporting || rLoading || !!rError}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors disabled:opacity-60"
              style={{ color: '#3c3c8c', borderColor: '#c5c5e8', background: '#fff' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>
        </div>

        {rLoading ? <LoadingState message="Loading report data…" /> : rError ? <ErrorState message={rError} onRetry={fetchReports} /> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total today',    value: summary?.totalToday      ?? 0,    color: '#3c3c8c', bg: '#f0f0fa' },
                { label: 'SLA compliance', value: `${summary?.slaCompliance ?? 0}%`, color: '#059669', bg: '#f0fdf4' },
                { label: 'SLA breached',   value: summary?.breachedCount   ?? 0,    color: '#dc2626', bg: '#fff1f2' },
                { label: 'Open tickets',   value: summary?.openCount       ?? 0,    color: '#14a0c8', bg: '#edf8fc' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-4">
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {!chartjsLoaded ? (
              <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-400">Loading charts…</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Volume Trend</h3>
                  <p className="text-xs text-gray-400 mb-4">Ticket submissions — {period} view</p>
                  <div style={{ height: 200 }}><canvas ref={lineRef} /></div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">By Category</h3>
                  <p className="text-xs text-gray-400 mb-4">Distribution across departments</p>
                  <div style={{ height: 200 }}><canvas ref={doughRef} /></div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

// Admin SLA Config
export const AdminSLAConfig = () => {
  const { slaConfig: prefetched, loading: ctxLoading } = useAdminTickets();
  const [config, setConfig] = useState([]);

  React.useEffect(() => {
    if (prefetched?.length) setConfig(prefetched);
  }, [prefetched]);

  const handleUpdate = async (id, resolutionTimeHours) => {
    await updateSLAConfig(id, resolutionTimeHours);
    setConfig(p => p.map(c => c.id === id ? { ...c, resolutionTimeHours } : c));
  };

  return (
    <DashboardLayout title="SLA Configuration">
      <div className="space-y-5 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">SLA Configuration</h2>
          <p className="text-sm text-gray-500 mt-0.5">Set resolution time limits per priority level. Changes apply to new tickets only.</p>
        </div>
        <div className="max-w-md">
          {ctxLoading && !config.length ? <LoadingState /> : (
            <SLAConfigPanel config={config} onUpdate={handleUpdate} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

// Admin Recategorize
export const AdminRecategorize = () => {
  const { allTickets, loading, error, refetch, recategorize } = useAdminTickets();
  const othersTickets = allTickets.filter(t => t.category === 'Others');

  return (
    <DashboardLayout title="Re-categorize Tickets">
      <div className="space-y-5 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Re-categorize "Others" Tickets</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Assign the correct department to tickets submitted under "Others".
            The SLA clock starts only after re-categorization.
          </p>
        </div>
        <div className="max-w-2xl">
          {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
            <RecategorizePanel tickets={othersTickets} onRecategorize={recategorize} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

// Admin Categories & Departments
const CAT_INIT = { categoryName: '', departmentName: '' };

export const AdminCategories = () => {
  const { categories, loading, error, refetch, addCategory, editCategory, removeCategory } = useAdminTickets();
  const [showModal,  setShowModal]  = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [form,       setForm]       = useState(CAT_INIT);
  const [formErr,    setFormErr]    = useState({});
  const [saving,     setSaving]     = useState(false);
  const [apiErr,     setApiErr]     = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [deleting,   setDeleting]   = useState(false);
  const [deptFilter, setDeptFilter] = useState('');

  const departments = [...new Set(categories.map(c => c.departmentName).filter(Boolean))].sort();
  const displayed   = deptFilter
    ? categories.filter(c => c.departmentName === deptFilter)
    : categories;

  const selCls = 'px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-indigo-400 outline-none bg-white';

  const inpCls = (f) => `w-full px-3 py-2 text-sm rounded-xl border outline-none transition-all
    ${formErr[f] ? 'border-red-300 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`;

  const openCreate = () => { setEditItem(null); setForm(CAT_INIT); setFormErr({}); setApiErr(''); setShowModal(true); };
  const openEdit   = (cat) => { setEditItem(cat); setForm({ categoryName: cat.categoryName, departmentName: cat.departmentName }); setFormErr({}); setApiErr(''); setShowModal(true); };

  const validate = () => {
    const e = {};
    if (!form.categoryName.trim())   e.categoryName   = 'Required';
    if (!form.departmentName.trim()) e.departmentName = 'Required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setFormErr(e); return; }
    setSaving(true); setApiErr('');
    try {
      if (editItem) await editCategory(editItem.id, form);
      else          await addCategory(form);
      setShowModal(false);
    } catch (err) {
      setApiErr(err?.message ?? 'Failed to save.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    try { await removeCategory(confirmDel); setConfirmDel(null); }
    finally { setDeleting(false); }
  };

  return (
    <DashboardLayout title="Categories & Departments">
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-start flex-wrap gap-3 justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Categories & Departments</h2>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white transition-colors"
            style={{ background:'linear-gradient(135deg,#3c3c8c,#4f4fa3)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Category
          </button>
        </div>

        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm overflow-hidden">
            <div className="px-5 py-3 flex items-center gap-3 flex-wrap" style={{ borderBottom: '1px solid #f3f4f6' }}>
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className={selCls}>
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {deptFilter && (
                <button onClick={() => setDeptFilter('')} className="text-xs font-medium" style={{ color:'#14a0c8' }}>
                  Clear filter
                </button>
              )}
              <span className="ml-auto text-xs text-gray-400">{displayed.length} of {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}</span>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  {['Category', 'Department', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.length === 0 ? (
                  <tr><td colSpan={3} className="px-5 py-10 text-center text-sm text-gray-400">
                    {deptFilter ? `No categories in "${deptFilter}" department.` : 'No categories yet.'}
                  </td></tr>
                ) : displayed.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{cat.categoryName}</td>
                    <td className="px-5 py-3 text-gray-600">{cat.departmentName}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(cat)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium text-white transition-colors"
                          style={{ background:'linear-gradient(135deg,#3c3c8c,#4f4fa3)' }}>Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editItem ? 'Edit Category' : 'Add Category'} size="sm">
        <div className="space-y-4">
          {apiErr && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">{apiErr}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Category Name *</label>
            <input value={form.categoryName}
              onChange={e => { setForm(p => ({ ...p, categoryName: e.target.value })); setFormErr(p => ({ ...p, categoryName: '' })); }}
              placeholder="e.g. IT, HR, Facilities" className={inpCls('categoryName')} />
            {formErr.categoryName && <p className="mt-1 text-xs text-red-600">{formErr.categoryName}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Department Name *</label>
            <input value={form.departmentName}
              onChange={e => { setForm(p => ({ ...p, departmentName: e.target.value })); setFormErr(p => ({ ...p, departmentName: '' })); }}
              placeholder="e.g. IT, Human Resources" className={inpCls('departmentName')} />
            {formErr.departmentName && <p className="mt-1 text-xs text-red-600">{formErr.departmentName}</p>}
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60"
              style={{ background:'linear-gradient(135deg,#3c3c8c,#4f4fa3)' }}>
              {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Category'}
            </button>
          </div>
        </div>
      </Modal>

    </DashboardLayout>
  );
};

// Admin My Tickets
export const AdminMyTickets = () => {
  const { user } = useAuthContext();
  const { allTickets, loading, error, refetch,
          updateStatus, assignTicket, addComment, recategorize, updatePriority } = useAdminTickets();
  const { selected, openTicket, closeTicket } = useTicketDetail();

  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [priority, setPriority] = useState('');

  const [myPage, setMyPage] = useState(0);
  const MY_PAGE_SIZE = 10;

  useEffect(() => { setMyPage(0); }, [search, status, priority]);

  const allMyTickets = allTickets.filter(t => {
    const createdByName  = t.createdByName;
    const matchesOwner = createdByName === user?.fullName;
    const matchesSt    = !status   || t.status   === status;
    const matchesPr    = !priority || t.priority === priority;
    const matchesSe    = !search   || t.title.toLowerCase().includes(search.toLowerCase())
                                   || t.id.toLowerCase().includes(search.toLowerCase());
    return matchesOwner && matchesSt && matchesPr && matchesSe;
  });

  const myTotalPages = Math.max(1, Math.ceil(allMyTickets.length / MY_PAGE_SIZE));
  const safeMyPage   = Math.min(myPage, myTotalPages - 1);
  const myTickets    = allMyTickets.slice(safeMyPage * MY_PAGE_SIZE, (safeMyPage + 1) * MY_PAGE_SIZE);

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
                      {['Ticket ID', 'Title', 'Category', 'Department', 'Priority', 'Status', 'Assigned To', 'Created', ''].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allMyTickets.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center">
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
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="truncate text-gray-800 font-medium">{t.title}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{t.category}</td>
                        <td className="px-4 py-3 text-gray-500">{t.department ?? '—'}</td>
                        <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-3 text-gray-500">
                          {t.assignedToName ? t.assignedToName : (
                            <span className="text-gray-300 italic">Unassigned</span>
                          )}
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