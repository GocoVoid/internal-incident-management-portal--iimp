import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import MyTicketsList from '../../components/employee/MyTicketsList';
import { useAuthContext } from '../../context/AuthContext';
import { useTickets } from '../../hooks/useTickets';

const EmployeeTickets = () => {
  const { user } = useAuthContext();
  const { tickets, filters, updateFilter, clearFilters } = useTickets(user?.id, 'EMPLOYEE');

  return (
    <DashboardLayout title="My Tickets">
      <div className="animate-fade-in">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">My Tickets</h2>
        </div>
        <MyTicketsList
          tickets={tickets}
          filters={filters}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
          onCreateClick={() => {}}
        />
      </div>
    </DashboardLayout>
  );
};

export default EmployeeTickets;
