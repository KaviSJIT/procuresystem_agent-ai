import React from 'react';
import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';

export function RiskBadge({ level, score }) {
  const lvl = (level || 'LOW').toUpperCase();

  if (lvl === 'HIGH') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-400">
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>HIGH RISK ({score !== undefined ? score : ''})</span>
      </span>
    );
  } else if (lvl === 'MEDIUM') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>MEDIUM RISK ({score !== undefined ? score : ''})</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
      <ShieldCheck className="w-3.5 h-3.5" />
      <span>LOW RISK ({score !== undefined ? score : ''})</span>
    </span>
  );
}

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
