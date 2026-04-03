import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    {children}
  </svg>
);

const Icons = {
  Grid:         () => <Icon><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></Icon>,
  Ticket:       () => <Icon><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></Icon>,
  Plus:         () => <Icon><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Icon>,
  Clock:        () => <Icon><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Icon>,
  Users:        () => <Icon><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></Icon>,
  Chart:        () => <Icon><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Icon>,
  Settings:     () => <Icon><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></Icon>,
  Folder:       () => <Icon><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></Icon>,
  Tag:          () => <Icon><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></Icon>,
  Assign:       () => <Icon><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></Icon>,
  Logout:       () => <Icon><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Icon>,
  ChevronLeft:  () => <Icon><polyline points="15 18 9 12 15 6"/></Icon>,
  ChevronRight: () => <Icon><polyline points="9 18 15 12 9 6"/></Icon>,
  MyTickets:    () => <Icon><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M16 11l1.5 1.5L21 9"/></Icon>,
  Menu:         () => <Icon><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></Icon>,
  X:            () => <Icon><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Icon>,
};

// Nav config per role
const NAV_ITEMS = {
  EMPLOYEE: [
    { label: 'Overview',      to: '/dashboard/employee',         icon: <Icons.Grid />,   end: true },
    { label: 'My Tickets',    to: '/dashboard/employee/tickets', icon: <Icons.Ticket /> },
  ],
  SUPPORT_STAFF: [
    { label: 'Overview',      to: '/dashboard/support',          icon: <Icons.Grid />,   end: true },
    { label: 'My Queue',      to: '/dashboard/support/queue',    icon: <Icons.Clock /> },
    { label: 'My Tickets',    to: '/dashboard/support/my-tickets',    icon: <Icons.Ticket /> },
  ],
  MANAGER: [
    { label: 'Overview',      to: '/dashboard/manager',              icon: <Icons.Grid />,      end: true },
    { label: 'Tickets',       to: '/dashboard/manager/tickets',      icon: <Icons.Ticket /> },
    { label: 'My Tickets',    to: '/dashboard/manager/my-tickets',   icon: <Icons.MyTickets /> },
    { label: 'Assign',        to: '/dashboard/manager/assign',       icon: <Icons.Assign /> },
    { label: 'Reports',       to: '/dashboard/manager/reports',      icon: <Icons.Chart /> },
  ],
  ADMIN: [
    { label: 'Overview',      to: '/dashboard/admin',              icon: <Icons.Grid />,      end: true },
    { label: 'All Tickets',   to: '/dashboard/admin/tickets',      icon: <Icons.Ticket /> },
    { label: 'My Tickets',    to: '/dashboard/admin/my-tickets',   icon: <Icons.MyTickets /> },
    { label: 'Users',         to: '/dashboard/admin/users',        icon: <Icons.Users /> },
    { label: 'Reports',       to: '/dashboard/admin/reports',      icon: <Icons.Chart /> },
    { label: 'SLA Config',    to: '/dashboard/admin/sla',          icon: <Icons.Settings /> },
    { label: 'Re-categorize', to: '/dashboard/admin/recategorize', icon: <Icons.Folder /> },
    { label: 'Categories',    to: '/dashboard/admin/categories',   icon: <Icons.Tag /> },
  ],
};

const ROLE_LABELS = {
  EMPLOYEE: 'Employee', SUPPORT_STAFF: 'Support Staff',
  MANAGER: 'Manager',   ADMIN: 'Admin',
};

// Sidebar content
const SidebarContent = ({ collapsed, setCollapsed, onNavClick }) => {
  const { user, handleLogout } = useAuthContext();
  const navigate               = useNavigate();
  const navItems = NAV_ITEMS[user?.role] ?? [];

  return (
    <div className="flex flex-col h-full">
      <div
        className={`flex items-center h-16 px-4 shrink-0 ${collapsed ? 'justify-center' : 'gap-3'}`}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        {!collapsed && (
          <div>
            <p className="text-white font-semibold text-sm leading-tight tracking-tight">IIMP</p>
            <p className="text-[10px] tracking-[0.18em] uppercase" style={{ color: 'rgba(255,255,255,0.38)' }}>
              Pratiti
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {!collapsed && (
          <p className="text-[9px] font-semibold tracking-[0.16em] uppercase px-3 mb-2"
            style={{ color: 'rgba(255,255,255,0.25)' }}>
            Menu
          </p>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={collapsed ? item.label : undefined}
            className="block"
            onClick={onNavClick}
          >
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer
                  ${collapsed ? 'justify-center' : ''}`}
                style={
                  isActive
                    ? {
                        background: 'linear-gradient(90deg, rgba(20,160,200,0.28), rgba(20,160,200,0.08))',
                        borderLeft: '3px solid #14a0c8',
                        paddingLeft: collapsed ? 12 : 9,
                        color: '#fff',
                      }
                    : { color: 'rgba(255,255,255,0.52)' }
                }
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ color: isActive ? '#14a0c8' : 'rgba(255,255,255,0.40)' }} className="shrink-0">
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="truncate text-xs font-medium">{item.label}</span>
                )}
                {collapsed && isActive && (
                  <span className="absolute right-1 w-1.5 h-1.5 rounded-full" style={{ background: '#14a0c8' }} />
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 pb-4 pt-2 space-y-0.5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={() => setCollapsed(p => !p)}
          className={`
            hidden md:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200
            text-white/70 hover:text-white 
            hover:bg-white/10 active:bg-white/20
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          {collapsed ? (
            <Icons.ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <Icons.ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Sidebar
const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const [collapsed, setCollapsed] = useState(false);

  const sidebarStyle = {
    background: 'linear-gradient(180deg, #1a1a4e 0%, #252568 40%, #3c3c8c 100%)',
    boxShadow: '4px 0 32px rgba(26,26,78,0.30)',
  };

  return (
    <>
      <aside
        className="hidden md:flex h-screen flex-col shrink-0 transition-all duration-300 ease-in-out"
        style={{ width: collapsed ? 64 : 240, ...sidebarStyle }}
      >
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} onNavClick={undefined} />
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(26,26,78,0.55)', backdropFilter: 'blur(2px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className="fixed top-0 left-0 h-full z-50 md:hidden transition-transform duration-300 ease-in-out flex flex-col"
        style={{
          width: 240,
          ...sidebarStyle,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <div className="absolute top-4 right-3 z-10">
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Icons.X />
          </button>
        </div>
        <SidebarContent collapsed={false} setCollapsed={() => {}} onNavClick={() => setMobileOpen(false)} />
      </aside>
    </>
  );
};

export { Icons as SidebarIcons };
export default Sidebar;
