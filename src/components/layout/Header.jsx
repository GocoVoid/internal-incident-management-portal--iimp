import React, { useState } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import CreateTicketModal from '../employee/CreateTicketModal';
import { createIncident } from '../../services/incidentService';
import { AdminTicketContext } from '../../context/AdminTicketContext';


const HamburgerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const ROLE_LABELS = { EMPLOYEE:'Employee', SUPPORT_STAFF:'Support Staff', MANAGER:'Manager', ADMIN:'Admin' };
const ROLE_COLORS = {
  EMPLOYEE:      { bg:'rgba(20,160,200,0.12)',  text:'#14a0c8',  border:'rgba(20,160,200,0.25)'  },
  SUPPORT_STAFF: { bg:'rgba(120,60,120,0.12)',  text:'#a06aa0',  border:'rgba(120,60,120,0.25)'  },
  MANAGER:       { bg:'rgba(60,60,140,0.12)',   text:'#6363b8',  border:'rgba(60,60,140,0.25)'   },
  ADMIN:         { bg:'rgba(37,37,104,0.12)',   text:'#4f4fa3',  border:'rgba(37,37,104,0.25)'   },
};

const formatTime = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const formatDateTime = (iso) => new Date(iso).toLocaleString('en-IN', {
  day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit',
});

const extractIncidentKey = (msg) => {
  const m = msg?.match(/IIMP-\d{4}-\d{6}/);
  return m ? m[0] : null;
};

const ticketRoute = (role) => {
  const map = {
    EMPLOYEE: '/dashboard/employee/tickets',
    SUPPORT_STAFF: '/dashboard/support/queue',
    MANAGER: '/dashboard/manager/tickets',
    ADMIN: '/dashboard/admin/tickets',
  };
  return map[role] ?? '/dashboard/employee/tickets';
};

// Single notification row
const NotifRow = ({ n, onExpand, expanded, onMarkRead, userRole, navigate }) => {
  const incidentKey = extractIncidentKey(n.message);

  const handleClick = () => {
    onExpand(n.id);
    if (!n.read) onMarkRead(n.id);
  };

  return (
    <div
      onClick={handleClick}
      className="px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50"
      style={{ background: n.read ? '#fff' : 'rgba(20,160,200,0.05)' }}
    >
      <div className="flex items-start gap-2">
        {!n.read && (
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#14a0c8' }} />
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-xs leading-relaxed ${expanded ? 'text-gray-800' : 'text-gray-600 line-clamp-2'}`}>
            {n.message}
          </p>

          {expanded && (
            <div className="mt-2 space-y-1 animate-fade-in">
              <p className="text-[10px] text-gray-400">{formatDateTime(n.createdAt)}</p>
              {incidentKey && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(ticketRoute(userRole)); }}
                  className="text-xs font-medium hover:underline"
                  style={{ color: '#14a0c8' }}
                >
                  View {incidentKey}
                </button>
              )}
            </div>
          )}

          {!expanded && (
            <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(n.createdAt)}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Header
const Header = ({ title, onMenuClick }) => {
  const { user, handleLogout }  = useAuthContext();
  const navigate                = useNavigate();
  const [showNotifs,   setShowNotifs]   = useState(false);
  const [expandedId,   setExpandedId]   = useState(null);
  const [showCreate,   setShowCreate]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const adminCtx  = React.useContext(AdminTicketContext);
  const handleCreateTicket = async (data) => {
    if (adminCtx?.createTicket) return adminCtx.createTicket(data);
    return createIncident({ title: data.title, description: data.description, priority: "Medium", category: data.category });
  };

  const badgeCount  = Math.min(unreadCount, 9);
  const badgeLabel  = unreadCount > 9 ? '9+' : String(badgeCount);
  const roleStyle   = ROLE_COLORS[user?.role] ?? ROLE_COLORS.EMPLOYEE;
  const initials    = (user?.fullName ?? user?.name ?? 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleExpand = (id) => setExpandedId(prev => prev === id ? null : id);
  const onLogout = () => { handleLogout(); navigate('/login', { replace: true }); };

  return (
    <>
      <header className="h-16 bg-white shrink-0 relative z-20 flex items-center px-6 gap-4"
        style={{ borderBottom:'1px solid #e5e7eb', boxShadow:'0 1px 8px rgba(60,60,140,0.06)' }}>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
          >
            <HamburgerIcon />
          </button>
          <div className="w-0.5 h-6 rounded-full shrink-0"
            style={{ background:'linear-gradient(to bottom,#14a0c8,#3c3c8c)' }} />
          <h1 className="text-sm font-semibold text-gray-900 tracking-tight truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">


          <button onClick={() => setShowCreate(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white transition-colors"
            style={{ background:'linear-gradient(135deg,#3c3c8c,#4f4fa3)' }}>
            <PlusIcon />
            New Ticket
          </button>

          <div className="w-px h-5 mx-1" style={{ background:'#e5e7eb' }} />

          <div className="relative">
            <button onClick={() => { setShowNotifs(p => !p); setExpandedId(null); }}
              className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-colors text-gray-500"
              style={{ background: showNotifs ? '#f0f0fa' : 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f0fa'}
              onMouseLeave={e => { if (!showNotifs) e.currentTarget.style.background = 'transparent'; }}>
              <BellIcon />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-white"
                  style={{ background:'#dc2626' }}>
                  {badgeLabel}
                </span>
              )}
            </button>

            {showNotifs && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowNotifs(false)} />
                <div className="fixed right-2 left-2 sm:left-auto sm:absolute sm:right-0 top-auto sm:top-full mt-2 sm:w-80 bg-white rounded-2xl z-40 overflow-hidden animate-slide-up"
                  style={{ boxShadow:'0 8px 32px rgba(60,60,140,0.16)', border:'1px solid #e5e7eb' }}>

                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom:'1px solid #f3f4f6' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-900">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ background:'#dc2626' }}>
                          {badgeLabel}
                          {console.log(unreadCount)}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={() => { markAllRead(); setExpandedId(null); }}
                        className="text-xs font-medium" style={{ color:'#14a0c8' }}>
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-8">No notifications</p>
                    ) : notifications.map(n => (
                      <NotifRow
                        key={n.id}
                        n={n}
                        expanded={expandedId === n.id}
                        onExpand={handleExpand}
                        onMarkRead={markRead}
                        userRole={user?.role}
                        navigate={navigate}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>


<div className="relative">
  <div
    className="flex items-center gap-2.5 pl-1 cursor-pointer rounded-xl px-2 py-1 transition-colors"
    onClick={() => setShowProfile(p => !p)}
    style={{ background: showProfile ? '#f0f0fa' : 'transparent' }}
    onMouseEnter={e => e.currentTarget.style.background = '#f0f0fa'}
    onMouseLeave={e => { if (!showProfile) e.currentTarget.style.background = 'transparent'; }}
  >
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{ background: 'linear-gradient(135deg,#3c3c8c,#783c78)' }}
    >
      {initials}
    </div>
    <div className="hidden md:block">
      <p className="text-xs font-semibold text-gray-900 leading-tight">{user?.fullName ?? user?.name}</p>
    </div>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className="hidden md:block w-3 h-3 text-gray-400 transition-transform"
      style={{ transform: showProfile ? 'rotate(180deg)' : 'rotate(0deg)' }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  </div>

  {showProfile && (
    <>
      <div className="fixed inset-0 z-30" onClick={() => setShowProfile(false)} />
      <div
        className="fixed right-2 left-2 sm:left-auto sm:absolute sm:right-0 top-[4.5rem] sm:top-full sm:mt-2 sm:w-72 bg-white rounded-2xl z-40 overflow-hidden animate-slide-up"
        style={{ boxShadow: '0 8px 32px rgba(60,60,140,0.16)', border: '1px solid #e5e7eb' }}
      >
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#3c3c8c,#783c78)' }} />

        <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,#3c3c8c,#783c78)' }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
              {user?.fullName ?? user?.name}
            </p>
            <p className="text-[12px] text-gray-400 truncate mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="px-4 py-3 space-y-2.5" style={{ borderBottom: '1px solid #f3f4f6' }}>
          {[
            { label: 'Role',       value: ROLE_LABELS[user?.role] ?? user?.role },
            { label: 'Department', value: user?.department ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between gap-2 min-w-0">
              <span className="text-[12px] text-gray-400 shrink-0">{label}</span>
              <span className="text-[12px] font-medium text-gray-700 truncate text-right min-w-0" title={value}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="px-4 py-3">
          <button
            onClick={() => { setShowProfile(false); onLogout(); }}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-medium transition-colors"
            style={{ color:'#dc2626', border:'1px solid #fecaca', background:'#fef2f2' }}
            onMouseEnter={e => e.currentTarget.style.background='#fee2e2'}
            onMouseLeave={e => e.currentTarget.style.background='#fef2f2'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </>
  )}
</div>

        </div>
      </header>

      <CreateTicketModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateTicket}
      />
    </>
  );
};

export default Header;