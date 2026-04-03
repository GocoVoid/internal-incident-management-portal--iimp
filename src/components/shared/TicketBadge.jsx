import React from 'react';

const STATUS_STYLES = {
  'Open':        'bg-cyan-100 text-cyan-700 border border-cyan-200',
  'In Progress': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Resolved':    'bg-green-50 text-green-700 border border-green-200',
  'Closed':      'bg-gray-100 text-gray-500 border border-gray-200',
};

const PRIORITY_STYLES = {
  'Low':      'bg-green-50  text-green-700  border border-green-200',
  'Medium':   'bg-amber-50  text-amber-700  border border-amber-200',
  'High':     'bg-orange-50 text-orange-700 border border-orange-200',
  'Critical': 'bg-red-50    text-red-700    border border-red-200',
};

const STATUS_DOTS = {
  'Open':        'bg-cyan-500',
  'In Progress': 'bg-amber-500',
  'Resolved':    'bg-green-500',
  'Closed':      'bg-gray-400',
};

const PRIORITY_DOTS = {
  'Low':      'bg-green-500',
  'Medium':   'bg-amber-500',
  'High':     'bg-orange-500',
  'Critical': 'bg-red-500',
};

export const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-500'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[status] ?? 'bg-gray-400'}`} />
    {status}
  </span>
);

export const PriorityBadge = ({ priority }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[priority] ?? 'bg-gray-100 text-gray-500'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOTS[priority] ?? 'bg-gray-400'}`} />
    {priority}
  </span>
);
