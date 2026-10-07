import React from 'react';
import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';

export function RiskBadge({ level, score }) {
  const lvl = (level || 'LOW').toUpperCase();

  if (lvl === 'HIGH') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
        <ShieldAlert className="w-3 h-3" />
        <span>High Risk{score !== undefined ? ` (${score})` : ''}</span>
      </span>
    );
  } else if (lvl === 'MEDIUM') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="w-3 h-3" />
        <span>Medium Risk{score !== undefined ? ` (${score})` : ''}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
      <ShieldCheck className="w-3 h-3" />
      <span>Low Risk{score !== undefined ? ` (${score})` : ''}</span>
    </span>
  );
}
