import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * Shared "nothing here yet" placeholder for lists/tables, so pages stop
 * inventing their own empty-state markup ad hoc.
 */
const EmptyState = ({ icon: Icon = Inbox, title = 'Nothing here yet', description, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
    <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-teal-600" strokeWidth={1.5} />
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>}
    {action}
  </div>
);

export default EmptyState;
