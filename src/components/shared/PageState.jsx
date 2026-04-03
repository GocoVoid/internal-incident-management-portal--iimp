import React from 'react';

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
);

export const TicketRowSkeleton = () => (
  <li className="flex items-center gap-4 px-5 py-3">
    <Skeleton className="h-4 w-32 rounded" />
    <Skeleton className="h-4 flex-1 rounded" />
    <Skeleton className="h-5 w-16 rounded-full" />
    <Skeleton className="h-5 w-20 rounded-full" />
  </li>
);

export const StatCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-pratiti-sm p-5 flex items-center gap-4">
    <Skeleton className="h-8 w-12" />
    <Skeleton className="h-4 w-24" />
  </div>
);

// Full-panel loading spinner
export const LoadingState = ({ message = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <svg width="36" height="36" viewBox="0 0 40 40" className="petal-spinner">
      <ellipse cx="14" cy="14" rx="7" ry="11" fill="#14a0c8" opacity="0.9" transform="rotate(-45 14 14)"/>
      <ellipse cx="26" cy="14" rx="7" ry="11" fill="#3c3c8c" opacity="0.9" transform="rotate(45 26 14)"/>
      <ellipse cx="14" cy="26" rx="7" ry="11" fill="#783c78" opacity="0.9" transform="rotate(45 14 26)"/>
      <ellipse cx="26" cy="26" rx="7" ry="11" fill="#252568" opacity="0.85" transform="rotate(-45 26 26)"/>
    </svg>
    <p className="text-sm text-gray-400">{message}</p>
  </div>
);

// Error state with retry
export const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 animate-fade-in">
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-50">
      <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>
    <p className="text-sm font-medium text-gray-700">Something went wrong</p>
    <p className="text-xs text-gray-400 max-w-xs text-center">{message}</p>
    {onRetry && (
      <button onClick={onRetry}
        className="mt-1 px-4 py-2 rounded-xl text-xs font-medium text-white transition-colors"
        style={{ background: '#3c3c8c' }}>
        Try again
      </button>
    )}
  </div>
);
