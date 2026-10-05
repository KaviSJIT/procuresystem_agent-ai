import React from 'react';

export function StatusBadge({ status }) {
  const st = (status || 'PENDING').toUpperCase();

  if (st === 'APPROVED' || st === 'AUTO_APPROVED') {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
        APPROVED
      </span>
    );
  } else if (st === 'REJECTED' || st === 'REJECTED_RETURNED_FOR_REVIEW') {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/15 border border-rose-500/30 text-rose-400">
        REJECTED / REVIEW
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 border border-amber-500/30 text-amber-400">
      PENDING APPROVAL
    </span>
  );
}

export default StatusBadge;
