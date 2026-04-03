import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import TicketStatsBar from '../../components/employee/TicketStatsBar';
import CreateTicketModal from '../../components/employee/CreateTicketModal';
import MyTicketsList from '../../components/employee/MyTicketsList';
import { useAuthContext } from '../../context/AuthContext';
import { useTickets } from '../../hooks/useTickets';

const EmployeeDashboard = () => {
  const { user } = useAuthContext();
  const { tickets, stats, filters, updateFilter, clearFilters, createTicket } =
    useTickets(user?.id, 'EMPLOYEE');
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = (data) => {
    createTicket(data);
  };

  return (
    <DashboardLayout title="My Dashboard">
      <div className="space-y-6 animate-fade-in">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Good {getGreeting()}, {user?.fullName?.split(' ')[0]}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Here's an overview of your incident tickets.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white
              bg-indigo-700 hover:bg-indigo-800 transition-colors shadow-pratiti-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Ticket
          </button>
        </div>

        <TicketStatsBar stats={stats} />

        <MyTicketsList
          tickets={tickets}
          filters={filters}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
          onCreateClick={() => setShowCreate(true)}
        />
      </div>

      <CreateTicketModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />
    </DashboardLayout>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

export default EmployeeDashboard;
