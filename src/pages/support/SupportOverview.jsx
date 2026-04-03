import React, { useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import TicketDetailModal from '../../components/shared/TicketDetailModal';
import { useAuthContext } from '../../context/AuthContext';
import { useSupportTickets } from '../../hooks/useSupportTickets';
import { useTickets } from '../../hooks/useTickets';
import useTicketDetail from '../../hooks/useTicketDetail';
import { StatusBadge, PriorityBadge } from '../../components/shared/TicketBadge';
import { useNavigate } from 'react-router-dom';
import { LoadingState, ErrorState } from '../../components/shared/PageState';

const SLAChip = ({ slaDueAt, isSlaBreached }) => {
  if (!slaDueAt) return <span className="text-xs text-gray-400">—</span>;
  const diff = new Date(slaDueAt) - Date.now();
  if (isSlaBreached || diff <= 0)
    return <span className="text-xs font-semibold text-red-600">Breached</span>;
  const hrs  = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return (
    <span className={`text-xs font-semibold ${hrs < 2 ? 'text-orange-600' : 'text-green-600'}`}>
      {hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`}
    </span>
  );
};

const SupportOverview = () => {
  const { user }  = useAuthContext();
  const navigate  = useNavigate();

  const { tickets, stats, loading, fetchAll } = useSupportTickets();

  const { updateStatus, assignTicket, addComment, recategorize } =
    useTickets(user?.id, 'SUPPORT_STAFF');

  const { selected, openTicket, closeTicket } = useTicketDetail();

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  };

  useEffect(() => { fetchAll(); }, []);

  const breached = tickets.filter(t => t.isSlaBreached);
  const urgent   = tickets.filter(t =>
    !t.isSlaBreached && t.slaDueAt &&
    (new Date(t.slaDueAt) - Date.now()) < 2 * 3600000
  );

  return (
    <DashboardLayout title="Overview">
      <div className="space-y-6 animate-fade-in">

        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Good {getGreeting()}, {user?.fullName?.split(' ')[0]}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Your current workload at a glance.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Assigned', value: tickets.length,                  bg: 'bg-indigo-700' },
            { label: 'In Progress',    value: stats.assignedInProgressCount,   bg: 'bg-amber-500' },
            { label: 'Resolved',       value: stats.assignedResolvedCount,     bg: 'bg-green-600' },
            { label: 'SLA Breached',   value: breached.length,                 bg: 'bg-red-600' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-white`}>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-xs text-white/70 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {(breached.length > 0 || urgent.length > 0) && (
          <div className="space-y-2">
            {breached.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl
                bg-red-50 border border-red-200">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"/>
                <p className="text-xs text-red-700 font-medium">
                  {breached.length} ticket{breached.length > 1 ? 's have' : ' has'} breached SLA.
                </p>
                <button
                  onClick={() => navigate('/dashboard/support/queue')}
                  className="ml-auto text-xs font-semibold text-red-600 hover:underline shrink-0"
                >
                  View queue →
                </button>
              </div>
            )}
            {urgent.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl
                bg-amber-50 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"/>
                <p className="text-xs text-amber-700 font-medium">
                  {urgent.length} ticket{urgent.length > 1 ? 's are' : ' is'} approaching SLA
                  deadline (under 2h).
                </p>
                <button
                  onClick={() => navigate('/dashboard/support/queue')}
                  className="ml-auto text-xs font-semibold text-amber-600 hover:underline shrink-0"
                >
                  View queue →
                </button>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid #f3f4f6' }}>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Queue Preview</h3>
              <p className="text-xs text-gray-400 mt-0.5">Your 5 most recent assigned tickets</p>
            </div>
            <button
              onClick={() => navigate('/dashboard/support/queue')}
              className="text-xs font-medium hover:underline flex items-center gap-1"
              style={{ color: '#14a0c8' }}
            >
              Open full queue
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>

          {loading ? (
            <LoadingState /> 
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">Your queue is empty.</p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-50">
                {tickets.slice(0, 5).map((t) => (
                  <li
                    key={t.id}
                    onClick={() => openTicket(t)}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-indigo-50/30
                      transition-colors cursor-pointer group"
                  >
                    <span
                      className="font-mono text-xs font-bold w-36 shrink-0
                        group-hover:text-indigo-700 transition-colors"
                      style={{ color: '#3c3c8c' }}
                    >
                      {t.id}
                    </span>
                    <span className="flex-1 text-sm text-gray-700 truncate
                      group-hover:text-indigo-700 transition-colors">
                      {t.title}
                    </span>
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge   status={t.status}   />
                    <SLAChip slaDueAt={t.slaDueAt} isSlaBreached={t.isSlaBreached} />
                  </li>
                ))}
              </ul>

              {tickets.length > 5 && (
                <div className="px-5 py-3 flex items-center justify-between"
                  style={{ borderTop: '1px solid #f0f0f5', background: '#fafafa' }}>
                  <span className="text-xs text-gray-400">
                    Showing 5 of {tickets.length} tickets
                  </span>
                  <button
                    onClick={() => navigate('/dashboard/support/queue')}
                    className="text-xs font-medium" style={{ color: '#3c3c8c' }}
                  >
                    View all {tickets.length} →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <TicketDetailModal
        ticket={selected}
        isOpen={!!selected}
        onClose={closeTicket}
        role={user?.role}
        user={user}
        onUpdateStatus={updateStatus}
        onAssign={assignTicket}
        onAddComment={addComment}
        onRecategorize={recategorize}
      />
    </DashboardLayout>
  );
};

export default SupportOverview;