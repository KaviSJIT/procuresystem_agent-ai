import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  SearchCode,
  Users,
  FileCheck2,
  FileText,
  History,
  BarChart3,
  Cpu,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/new-procurement', label: 'New Procurement', icon: PlusCircle },
    { path: '/analysis', label: 'AI Analysis', icon: SearchCode },
    { path: '/suppliers', label: 'Suppliers', icon: Users },
    { path: '/approvals', label: 'Approval Center', icon: FileCheck2 },
    { path: '/documents', label: 'Document Intel', icon: FileText },
    { path: '/audit', label: 'Audit Trail', icon: History },
    { path: '/evaluation', label: 'Evaluation', icon: BarChart3 },
    { path: '/system', label: 'System Diagnostics', icon: Cpu },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            ProcureAI
          </h1>
          <p className="text-[11px] text-cyan-400 font-medium tracking-tight">Construction Intelligence</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
        <p className="font-semibold text-slate-400">Agentic AI Research</p>
        <p className="truncate">Trained XGBoost + RAG + Qwen</p>
      </div>
    </aside>
  );
}
