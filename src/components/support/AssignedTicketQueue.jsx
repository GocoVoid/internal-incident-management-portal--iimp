import React, { useState, useEffect } from 'react';
import { StatusBadge, PriorityBadge } from '../shared/TicketBadge';
import EmptyState from '../shared/EmptyState';

const useLiveClock = () => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  return now;
};

const SLATimer = ({ slaDueAt, isSlaBreached }) => {
  const now = useLiveClock();
  if (!slaDueAt) return <span className="text-xs text-gray-400">No SLA set</span>;
  const diff = new Date(slaDueAt) - now;
  if (isSlaBreached || diff <= 0) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-semibold text-red-600">SLA Breached</span>
      </div>
    );
  }
  const hrs  = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const urgent = hrs < 2;
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${urgent ? 'bg-orange-400 animate-pulse' : 'bg-green-400'}`} />
      <span className={`text-xs font-semibold ${urgent ? 'text-orange-600' : 'text-green-600'}`}>
        {hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`} left
      </span>
    </div>
  );
};

const AssignedTicketQueue = ({ tickets, onSelectTicket, selectedId }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-gray-900">My Queue</h2>
      <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
        {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
      </span>
    </div>

    {tickets.length === 0 ? (
      <EmptyState
        title="Queue is clear"
        description="No tickets are currently assigned to you."
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        }
      />
    ) : (
      <ul className="divide-y divide-gray-50">
        {tickets.map((t) => (
          <li
            key={t.id}
            onClick={() => onSelectTicket(t)}
            className={`px-5 py-4 cursor-pointer transition-colors ${
              selectedId === t.id ? 'bg-indigo-50 border-l-2 border-indigo-700' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="font-mono text-xs text-indigo-600 font-medium">{t.id}</span>
              <PriorityBadge priority={t.priority} />
            </div>
            <p className="text-sm text-gray-800 font-medium mb-2 line-clamp-2">{t.title}</p>
            <div className="flex items-center justify-between">
              <StatusBadge status={t.status} />
              <SLATimer slaDueAt={t.slaDueAt} isSlaBreached={t.isSlaBreached} />
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default AssignedTicketQueue;
