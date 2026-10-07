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
  HardHat
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
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 min-h-screen">
      {/* Brand */}
      <div className="p-5 border-b border-gray-200 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-[#1F4E79] flex items-center justify-center text-white">
          <HardHat className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-[#1F4E79]">ProcureAI</h1>
          <p className="text-[11px] text-gray-500 font-medium">Construction Procurement</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#1F4E79] font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 text-[11px] text-gray-400">
        <p className="font-semibold text-gray-500">Agentic AI Research</p>
        <p>XGBoost · RAG FAISS · Qwen LoRA</p>
      </div>
    </aside>
  );
}
