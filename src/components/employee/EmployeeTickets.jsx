import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import MyTicketsList from '../../components/employee/MyTicketsList';
import { useAuthContext } from '../../context/AuthContext';
import { useTickets } from '../../hooks/useTickets';
import { useNavigate } from 'react-router-dom';

const EmployeeTickets = () => {
  const { user }   = useAuthContext();
  const navigate   = useNavigate();
  const { tickets, filters, updateFilter, clearFilters } = useTickets(user?.id, 'EMPLOYEE');

  return (
    <DashboardLayout title="My Tickets">
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">My Tickets</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              All incidents raised by you. Click any row to view full details.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/employee/create')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-pratiti-sm transition-colors"
            style={{ background: 'linear-gradient(135deg,#3c3c8c,#4f4fa3)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Ticket
          </button>
        </div>

        <MyTicketsList
          tickets={tickets}
          filters={filters}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
          onCreateClick={() => navigate('/dashboard/employee/create')}
        />
      </div>
    </DashboardLayout>
  );
};

export default EmployeeTickets;
