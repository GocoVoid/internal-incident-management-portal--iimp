import React, { useState } from 'react';
import { StatusBadge, PriorityBadge } from '../shared/TicketBadge';
import TicketDetailModal from '../shared/TicketDetailModal';
import useTicketDetail from '../../hooks/useTicketDetail';
import { useAuthContext } from '../../context/AuthContext';
import { useManagerTickets } from '../../context/ManagerTicketContext';
import { useEffect } from 'react';
import { getManagerSupportStaff } from '../../services/managerService';

// Dept KPI Cards
export const DeptKPICards = ({ stats }) => {
  const cards = [
    { label: 'Total Tickets', value: stats.total,      color: 'from-indigo-600 to-indigo-700' },
    { label: 'Open',          value: stats.open,        color: 'from-cyan-500  to-cyan-600'   },
    { label: 'In Progress',   value: stats.inProgress,  color: 'from-amber-500 to-amber-600'  },
    { label: 'Closed',        value: stats.closed,    color: 'from-gray-500   to-gray-600'    },
    { label: 'Resolved',        value: stats.resolved,    color: 'from-green-500   to-green-600'    },
    { label: 'SLA Breached',  value: stats.breached,    color: 'from-red-500   to-red-600'    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((c, i) => (
        <div key={c.label}
          className={`rounded-2xl p-5 text-white bg-gradient-to-br ${c.color} shadow-pratiti-md`}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-3xl font-bold leading-none">{c.value}</p>
          </div>
          <p className="text-sm text-white/80">{c.label}</p>
        </div>
      ))}
    </div>
  );
};

// SLA Heatmap
export const SLAHeatmap = ({ tickets }) => {
  const { user } = useAuthContext();
  const { updateStatus, assignTicket, addComment, recategorize, updatePriority } = useManagerTickets();
  const { selected, openTicket, closeTicket } = useTicketDetail();

  const breached = tickets.filter(t => t.isSlaBreached);
  const atRisk   = tickets.filter(t =>
    !t.isSlaBreached && t.slaDueAt && (new Date(t.slaDueAt) - Date.now()) < 2 * 3600000
  );
  const onTrack  = tickets.filter(t =>
    !t.isSlaBreached && t.slaDueAt && (new Date(t.slaDueAt) - Date.now()) >= 2 * 3600000
  );

  const rows = [
    { label: 'Breached', items: breached, ring: 'border-red-300 bg-red-50',       dot: 'bg-red-500',    text: 'text-red-700'    },
    { label: 'At Risk',  items: atRisk,   ring: 'border-orange-300 bg-orange-50', dot: 'bg-orange-400', text: 'text-orange-700' },
    { label: 'On Track', items: onTrack,  ring: 'border-green-200 bg-green-50',   dot: 'bg-green-500',  text: 'text-green-700'  },
  ];

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">SLA Heatmap</h3>
        <div className="space-y-4">
          {rows.map(row => (
            <div key={row.label}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${row.dot}`} />
                <span className={`text-xs font-medium ${row.text}`}>{row.label}</span>
                <span className="text-xs text-gray-400">({row.items.length})</span>
              </div>
              {row.items.length === 0 ? (
                <p className="text-xs text-gray-400 pl-4">None</p>
              ) : (
                <div className="flex flex-wrap gap-2 pl-4">
                  {row.items.map(t => (
                    <button key={t.id} onClick={() => openTicket(tickets.find(x => x.id === t.id))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all hover:scale-105 ${row.ring} ${row.text}`}
                      title={t.title}>
                      {t.id}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <TicketDetailModal
        ticket={selected} isOpen={!!selected} onClose={closeTicket}
        role={user?.role} user={user}
        onUpdateStatus={updateStatus} onAssign={assignTicket}
        onAddComment={addComment} onRecategorize={recategorize}
        onUpdatePriority={updatePriority}
      />
    </>
  );
};

// Assign Ticket Panel
export const AssignTicketPanel = ({ tickets, onAssign }) => {
  const { user } = useAuthContext();
  const [supportStaff, setSupportStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);

  useEffect(() => {
    getManagerSupportStaff()
      .then(data => setSupportStaff(data ?? []))
      .catch(() => setSupportStaff([]))
      .finally(() => setStaffLoading(false));
  }, [user?.department]);
  const [selectedTicket, setSelectedTicket] = useState('');
  const [selectedStaff,  setSelectedStaff]  = useState('');
  const [loading,        setLoading]        = useState(false);
  const [success,        setSuccess]        = useState('');

  const openTickets = tickets.filter(t => t.status === 'Open');

  const handleAssign = async () => {
    if (!selectedTicket || !selectedStaff) return;
    setLoading(true);
    try {
      const ticketObj = openTickets.find(t => t.id === selectedTicket);
      await onAssign(selectedTicket, Number(selectedStaff), ticketObj?.category ?? '');
      const staff = supportStaff.find(s => s.id === Number(selectedStaff));
      setSuccess(`Ticket assigned to ${staff?.name ?? staff?.fullName}`);
      setSelectedTicket('');
      setSelectedStaff('');
      setTimeout(() => setSuccess(''), 3000);
    } finally { setLoading(false); }
  };

  const selCls = 'w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none bg-white';

  return (
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
        {openTickets.length === 0 && <p className="mt-1 text-xs text-gray-400">No open tickets to assign.</p>}
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

      <button onClick={handleAssign} disabled={!selectedTicket || !selectedStaff || loading}
        className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 transition-colors">
        {loading ? 'Assigning…' : 'Confirm Assignment'}
      </button>

      {success && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200 animate-fade-in">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-green-600">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p className="text-xs text-green-700">{success}</p>
        </div>
      )}
    </div>
  );
};

// Reports Chart
export const ReportsChart = () => {
  const {
    reportSummary, ticketVolume, catBreakdown,
    reportPeriod, reportLoading, changeReportPeriod,
  } = useManagerTickets();

  const maxVal     = Math.max(...ticketVolume.map(d => d.count), 1);
  const maxCat     = Math.max(...catBreakdown.map(d => d.count), 1);
  const compliance = reportSummary?.slaCompliance ?? 0;

  const CAT_COLORS = {
    IT: 'bg-indigo-500', HR: 'bg-purple-500', Admin: 'bg-cyan-500',
    Facilities: 'bg-amber-500', Finance: 'bg-green-500', Others: 'bg-gray-400',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Reports</h3>
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {[['week','Weekly'],['month','Monthly'],['year','Yearly']].map(([val, label]) => (
            <button key={val} onClick={() => changeReportPeriod(val)}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={reportPeriod === val
                ? { background: '#3c3c8c', color: '#fff' }
                : { background: '#fff', color: '#6b7280' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {reportLoading ? (
        <p className="text-xs text-gray-400 text-center py-4">Loading…</p>
      ) : (
        <>
          <div className="flex items-center gap-4 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
            <div>
              <p className="text-2xl font-bold text-indigo-700">{compliance}%</p>
              <p className="text-xs text-indigo-600">SLA Compliance</p>
            </div>
            <div className="flex-1 h-2 bg-indigo-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-700 rounded-full transition-all"
                style={{ width: `${compliance}%` }} />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-3">Ticket volume</p>
            <div className="flex items-end gap-2 h-28">
              {ticketVolume.map(d => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500">{d.count}</span>
                  <div className="w-full rounded-t-lg transition-all"
                    style={{ height: `${(d.count / maxVal) * 80}px`, background: 'linear-gradient(to top,#3c3c8c,#6363b8)' }} />
                  <span className="text-[10px] text-gray-400">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-3">By category</p>
            <div className="space-y-2">
              {catBreakdown.map(c => (
                <div key={c.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-16 shrink-0">{c.label}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${CAT_COLORS[c.label] ?? 'bg-gray-400'}`}
                      style={{ width: `${(c.count / maxCat) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-6 text-right">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};