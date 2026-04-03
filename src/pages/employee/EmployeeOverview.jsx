import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import TicketStatsBar from '../../components/employee/TicketStatsBar';
import CreateTicketModal from '../../components/employee/CreateTicketModal';
import TicketDetailModal from '../../components/shared/TicketDetailModal';
import { useAuthContext } from '../../context/AuthContext';
import { useTickets } from '../../hooks/useTickets';
import useTicketDetail from '../../hooks/useTicketDetail';
import { StatusBadge, PriorityBadge } from '../../components/shared/TicketBadge';
import { useNavigate } from 'react-router-dom';
import { EmployeeKPICards, SystemKPICards } from '../../components/admin/AdminComponents';
import { LoadingState } from '../../components/shared/PageState';

const RECENT_LIMIT = 5;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
};

const SLAChip = ({ slaDueAt, isSlaBreached, status }) => {
  if (status === 'Resolved' || status === 'Closed')
    return <span className="text-xs text-gray-400">—</span>;
  if (!slaDueAt)
    return <span className="text-xs text-gray-400">Pending</span>;

  const diff = new Date(slaDueAt) - Date.now();
  if (isSlaBreached || diff <= 0)
    return (
      <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
        Breached
      </span>
    );

  const hrs  = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const color = hrs < 2 ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50';

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`}
    </span>
  );
};

const EmployeeOverview = () => {
  const { user }  = useAuthContext();
  const navigate  = useNavigate();

  const {
    allTickets,
    stats,
    loading,
    fetchAllByUser,
    createTicket,
    updateStatus,
    assignTicket,
    addComment,
    recategorize,
  } = useTickets(user?.id, 'EMPLOYEE');

  const [showCreate, setShowCreate] = useState(false);
  const { selected, openTicket, closeTicket } = useTicketDetail();

  useEffect(() => {
    fetchAllByUser();
  }, []);

  const recentTickets = [...allTickets]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, RECENT_LIMIT);

  return (
    <DashboardLayout title="Overview">
      <div className="space-y-6 animate-fade-in">

        <div className="flex items-start flex-wrap gap-3 justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Good {getGreeting()}, {user?.fullName?.split(' ')[0]}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Here's your incident summary
            </p>
          </div>
        </div>

        <EmployeeKPICards stats={stats} />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm overflow-hidden">

          <div className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid #f3f4f6' }}>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Recent Tickets</h3>
              <p className="text-xs text-gray-400 mt-0.5">Your 5 most recently raised tickets</p>
            </div>
            <button
              onClick={() => navigate('/dashboard/employee/tickets')}
              className="text-xs font-medium flex items-center gap-1 hover:underline"
              style={{ color: '#14a0c8' }}
            >
              View all
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>

          {loading ? (
            <LoadingState/>

          ) : recentTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-3 text-indigo-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">No tickets yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                Raise your first ticket to get started.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: '#3c3c8c' }}
              >
                Create ticket
              </button>
            </div>

          ) : (
            <>
              <ul className="divide-y divide-gray-50">
                {recentTickets.map((t) => (
                  <li
                    key={t.id}
                    onClick={() => openTicket(t)}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3 hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                  >
                    <span
                      className="font-mono text-xs font-medium w-28 sm:w-36 shrink-0 group-hover:text-indigo-700 transition-colors"
                      style={{ color: '#3c3c8c' }}
                    >
                      {t.id}
                    </span>

                    <span className="flex-1 text-sm text-gray-700 truncate group-hover:text-indigo-700 transition-colors">
                      {t.title}
                    </span>

                    <span className="hidden sm:block">
                    <SLAChip
                      slaDueAt={t.slaDueAt}
                      isSlaBreached={t.isSlaBreached}
                      status={t.status}
                    /></span>

                    <PriorityBadge priority={t.priority} />
                    <StatusBadge  status={t.status} />
                  </li>
                ))}
              </ul>

              {allTickets.length > RECENT_LIMIT && (
                <div
                  className="px-5 py-3 flex items-center justify-between"
                  style={{ borderTop: '1px solid #f3f4f6' }}
                >
                  <span className="text-xs text-gray-400">
                    Showing {RECENT_LIMIT} of {allTickets.length} tickets
                  </span>
                  <button
                    onClick={() => navigate('/dashboard/employee/tickets')}
                    className="text-xs font-medium flex items-center gap-1"
                    style={{ color: '#3c3c8c' }}
                  >
                    View all {allTickets.length} tickets
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <CreateTicketModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createTicket}
      />
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

export default EmployeeOverview;