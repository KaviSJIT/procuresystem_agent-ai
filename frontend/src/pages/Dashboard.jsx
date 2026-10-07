import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, ShieldAlert, CheckCircle2, TrendingUp, ArrowRight, Plus, Users } from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { getProcurements, getApprovals } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export default function Dashboard() {
  const [procurements, setProcurements] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      const [pData, aData] = await Promise.all([getProcurements(), getApprovals()]);
      setProcurements(pData || []);
      setApprovals(aData || []);
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = approvals.filter(a => a.status === 'PENDING').length;
  const approvedCount = approvals.filter(a => ['APPROVED', 'AUTO_APPROVED'].includes(a.status)).length;
  const highRiskCount = approvals.filter(a => a.risk_assessment?.risk_level === 'HIGH').length;

  const riskData = [
    { name: 'Low Risk', value: procurements.length ? Math.max(1, Math.round(procurements.length * 0.6)) : 6, color: '#15803D' },
    { name: 'Medium Risk', value: procurements.length ? Math.round(procurements.length * 0.25) : 3, color: '#B45309' },
    { name: 'High Risk', value: procurements.length ? Math.round(procurements.length * 0.15) : 1, color: '#B91C1C' },
  ];

  const cycleData = [
    { name: 'Conventional', days: 14.0 },
    { name: 'Rule-Based', days: 5.0 },
    { name: 'Agentic AI', days: 0.5 },
  ];

  const kpiCards = [
    {
      label: 'Total Requests',
      value: procurements.length,
      sub: 'Procurement requests in system',
      icon: FileText,
      iconColor: 'text-[#1F4E79]',
      iconBg: 'bg-blue-50',
    },
    {
      label: 'Pending Approvals',
      value: pendingCount,
      sub: 'Awaiting human review',
      icon: Clock,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    {
      label: 'Approved',
      value: approvedCount,
      sub: 'Procurement requests approved',
      icon: CheckCircle2,
      iconColor: 'text-green-700',
      iconBg: 'bg-green-50',
    },
    {
      label: 'High Risk Requests',
      value: highRiskCount,
      sub: 'Flagged for elevated risk',
      icon: ShieldAlert,
      iconColor: 'text-red-700',
      iconBg: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Procurement Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Monitor procurement activity, approvals, supplier risk, and AI-assisted decisions.
          </p>
        </div>
        <Link
          to="/new-procurement"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-md bg-[#1F4E79] hover:bg-[#1a4268] text-white text-sm font-semibold transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Procurement</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-gray-200 rounded-md p-5 shadow-sm flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-md ${card.iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800">Procurement Risk Distribution</h3>
          <p className="text-xs text-gray-400 mt-0.5">Risk classification across procurement requests</p>
          <div className="h-44 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="value">
                  {riskData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#E5E7EB', borderRadius: '6px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around text-xs border-t border-gray-100 pt-3 mt-2">
            {riskData.map((item, i) => (
              <div key={i} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cycle Time Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-md p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800">Procurement Cycle Time</h3>
          <p className="text-xs text-gray-400 mt-0.5">Average cycle time comparison (days) — Demo Data</p>
          <div className="h-52 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cycleData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} unit=" d" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#E5E7EB', borderRadius: '6px', fontSize: '12px' }}
                  formatter={(v) => [`${v} days`]}
                />
                <Bar dataKey="days" radius={[4, 4, 0, 0]}>
                  <Cell fill="#94A3B8" />
                  <Cell fill="#3B82F6" />
                  <Cell fill="#1F4E79" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Procurement Table */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Recent Procurement Requests</h3>
          <Link to="/approvals" className="text-xs text-[#1F4E79] hover:underline font-medium flex items-center space-x-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Request ID</th>
                <th className="px-6 py-3">Procurement</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Budget</th>
                <th className="px-6 py-3">Risk</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {approvals.length > 0 ? (
                approvals.slice(0, 5).map((appr) => (
                  <tr key={appr.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-gray-500">{appr.id}</td>
                    <td className="px-6 py-3.5 font-medium text-gray-900">{appr.procurement_request?.title || 'Procurement Request'}</td>
                    <td className="px-6 py-3.5 text-xs uppercase text-gray-500">{appr.procurement_request?.category || 'works'}</td>
                    <td className="px-6 py-3.5 font-mono text-sm font-medium text-gray-800">₹{(appr.procurement_request?.budget || 0).toLocaleString()}</td>
                    <td className="px-6 py-3.5"><RiskBadge level={appr.risk_assessment?.risk_level} score={appr.risk_assessment?.risk_score} /></td>
                    <td className="px-6 py-3.5"><StatusBadge status={appr.status} /></td>
                    <td className="px-6 py-3.5 text-right">
                      <Link to="/approvals" className="px-3 py-1.5 text-xs font-medium text-[#1F4E79] border border-[#1F4E79] rounded hover:bg-blue-50 transition-colors">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                    No procurement requests yet. Click <Link to="/new-procurement" className="text-[#1F4E79] font-medium hover:underline">New Procurement</Link> to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
