import React from 'react';

export function StatusBadge({ status, size = 'sm' }) {
  const norm = (status || '').toLowerCase().replace(/[-_\s]/g, '');

  const styles = {
    available: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    completed: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20',
    returned: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20',
    checkedin: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/20',
    inuse: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/20',
    pending: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
    waitlisted: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20',
    contested: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-500/20',
    booked: 'bg-slate-100 text-slate-700 border-slate-300 ring-slate-500/20',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-300 ring-slate-500/20',
    overdue: 'bg-rose-100 text-rose-800 border-rose-300 ring-rose-500/30 animate-pulse',
    disputed: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
    verified: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    missing: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
    met: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    pendingverification: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20'
  };

  const labels = {
    available: 'Available',
    approved: 'Approved',
    completed: 'Completed',
    returned: 'Returned',
    checkedin: 'Checked In',
    inuse: 'In Use',
    pending: 'Pending Review',
    waitlisted: 'Waitlisted',
    contested: 'Contested (Queue)',
    booked: 'Reserved',
    rejected: 'Declined',
    cancelled: 'Cancelled',
    overdue: 'Overdue Return',
    disputed: 'Disputed',
    verified: 'Verified',
    missing: 'Missing Requirement',
    met: 'Requirement Met',
    pendingverification: 'Pending Review'
  };

  const currentStyle = styles[norm] || 'bg-slate-100 text-slate-700 border-slate-200';
  const label = labels[norm] || status;

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${
      size === 'xs' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
    } ${currentStyle}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {label}
    </span>
  );
}

