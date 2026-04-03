import React from 'react';

const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {icon && (
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 text-indigo-400">
        {icon}
      </div>
    )}
    <p className="text-sm font-medium text-gray-700 mb-1">{title}</p>
    {description && <p className="text-xs text-gray-400 max-w-xs mb-4">{description}</p>}
    {action}
  </div>
);

export default EmptyState;
