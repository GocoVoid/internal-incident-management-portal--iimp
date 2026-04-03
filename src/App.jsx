import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { AdminTicketProvider } from './context/AdminTicketContext';
import { ManagerTicketProvider } from './context/ManagerTicketContext';
import StaffMyTickets from './pages/support/StaffMyTickets';

// Pages
import LoginPage            from './pages/LoginPage';

import EmployeeOverview     from './pages/employee/EmployeeOverview';
import EmployeeTickets      from './pages/employee/EmployeeTickets';
import EmployeeCreateTicket from './pages/employee/EmployeeCreateTicket';

import SupportOverview      from './pages/support/SupportOverview';
import SupportQueue         from './pages/support/SupportQueue';


import { ManagerOverviewPage, ManagerTickets, ManagerAssign, ManagerReports, ManagerMyTickets } from './pages/manager/ManagerPages';

import { AdminOverview, AdminTickets, AdminUsers, AdminReports, AdminSLAConfig, AdminRecategorize, AdminCategories, AdminMyTickets }
  from './pages/admin/AdminPages';

// Guards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isFirstLogin } = useAuthContext();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role))
    return <Navigate to="/login" replace />;
  if (isFirstLogin) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthContext();
  if (isAuthenticated && user) {
    const routes = {
      EMPLOYEE:      '/dashboard/employee',
      SUPPORT_STAFF: '/dashboard/support',
      MANAGER:       '/dashboard/manager',
      ADMIN:         '/dashboard/admin',
    };
    return <Navigate to={routes[user.role] ?? '/dashboard/employee'} replace />;
  }
  return children;
};

const P = (role, children) => (
  <ProtectedRoute allowedRoles={[role]}>{children}</ProtectedRoute>
);

// Admin wrapper — single ticket fetch for all admin routes
const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['ADMIN']}>
    <AdminTicketProvider>
      {children}
    </AdminTicketProvider>
  </ProtectedRoute>
);

// Manager wrapper — single ticket fetch for all manager routes
const ManagerRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['MANAGER']}>
    <ManagerTicketProvider>
      {children}
    </ManagerTicketProvider>
  </ProtectedRoute>
);

// App
const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />

    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

    <Route path="/dashboard/employee"         element={P('EMPLOYEE', <EmployeeOverview />)} />
    <Route path="/dashboard/employee/tickets" element={P('EMPLOYEE', <EmployeeTickets />)} />
    <Route path="/dashboard/employee/create"  element={<ProtectedRoute><EmployeeCreateTicket /></ProtectedRoute>} />

    <Route path="/dashboard/support"       element={P('SUPPORT_STAFF', <SupportOverview />)} />
    <Route path="/dashboard/support/queue" element={P('SUPPORT_STAFF', <SupportQueue />)} />
    <Route path="/dashboard/support/my-tickets" element={P('SUPPORT_STAFF', <StaffMyTickets />)} />

    <Route path="/dashboard/manager"            element={<ManagerRoute><ManagerOverviewPage /></ManagerRoute>} />
    <Route path="/dashboard/manager/tickets"    element={<ManagerRoute><ManagerTickets /></ManagerRoute>} />
    <Route path="/dashboard/manager/my-tickets" element={<ManagerRoute><ManagerMyTickets /></ManagerRoute>} />
    <Route path="/dashboard/manager/assign"     element={<ManagerRoute><ManagerAssign /></ManagerRoute>} />
    <Route path="/dashboard/manager/reports"    element={<ManagerRoute><ManagerReports /></ManagerRoute>} />

    <Route path="/dashboard/admin"              element={<AdminRoute><AdminOverview /></AdminRoute>} />
    <Route path="/dashboard/admin/tickets"      element={<AdminRoute><AdminTickets /></AdminRoute>} />
    <Route path="/dashboard/admin/my-tickets"   element={<AdminRoute><AdminMyTickets /></AdminRoute>} />
    <Route path="/dashboard/admin/users"        element={<AdminRoute><AdminUsers /></AdminRoute>} />
    <Route path="/dashboard/admin/reports"      element={<AdminRoute><AdminReports /></AdminRoute>} />
    <Route path="/dashboard/admin/sla"          element={<AdminRoute><AdminSLAConfig /></AdminRoute>} />
    <Route path="/dashboard/admin/recategorize" element={<AdminRoute><AdminRecategorize /></AdminRoute>} />
    <Route path="/dashboard/admin/categories"    element={<AdminRoute><AdminCategories /></AdminRoute>} />

    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
