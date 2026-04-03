import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CreateTicketModal from '../../components/employee/CreateTicketModal';
import {
  DeptKPICards,
  SLAHeatmap,
  AssignTicketPanel,
  ReportsChart,
} from '../../components/manager/ManagerComponents';
import { useAuthContext } from '../../context/AuthContext';
import { useManagerTickets } from '../../context/ManagerTicketContext';
import { LoadingState, ErrorState } from '../../components/shared/PageState';

const ManagerDashboard = () => {
  const { user } = useAuthContext();
  const { tickets, stats, loading, error, refetch, createTicket, assignTicket } = useManagerTickets();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <DashboardLayout title="Manager Dashboard">
      <div className="space-y-6 animate-fade-in">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {user?.department} Department
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Overview of all incidents in your department.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white
              bg-indigo-700 hover:bg-indigo-800 transition-colors shadow-pratiti-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Ticket
          </button>
        </div>

        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
          <>
            <DeptKPICards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SLAHeatmap tickets={tickets} />
              <AssignTicketPanel tickets={tickets} onAssign={assignTicket} />
            </div>

            <ReportsChart />
          </>
        )}
      </div>

      <CreateTicketModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createTicket}
      />
    </DashboardLayout>
  );
};

export default ManagerDashboard;
