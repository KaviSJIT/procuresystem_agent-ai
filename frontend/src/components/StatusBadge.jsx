import React from 'react';

export function StatusBadge({ status }) {
  const st = (status || 'PENDING').toUpperCase();

  if (st === 'APPROVED' || st === 'AUTO_APPROVED') {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
        Approved
      </span>
    );
  } else if (st === 'SENT_FOR_REVIEW' || st === 'UNDER_REVIEW') {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        Under Review
      </span>
    );
  } else if (st === 'REJECTED' || st === 'REJECTED_RETURNED_FOR_REVIEW') {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
        Rejected
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      Pending Approval
    </span>
  );
}

export default StatusBadge;
