import React, { useState, useEffect } from 'react';
import { FileCheck2, Clock, CheckCircle2, XCircle, Eye, RefreshCw } from 'lucide-react';
import { getApprovals } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';
import ApprovalModal from '../components/ApprovalModal';

export default function ApprovalCenter() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedApproval, setSelectedApproval] = useState(null);

  useEffect(() => {
    loadApprovals();
  }, [filterStatus]);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const data = await getApprovals(filterStatus);
      setApprovals(data || []);
    } catch (e) {
      console.error("Error loading approvals:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <FileCheck2 className="w-6 h-6 text-cyan-400" />
            <span>Human-in-the-Loop Approval Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review multi-agent recommendations, inspect XGBoost risk scores and RAG evidence, and approve or reject procurement requests.
          </p>
        </div>
        <button
          onClick={loadApprovals}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center space-x-1.5 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl w-fit">
        {['', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === st
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {st === '' ? 'All Approvals' : st}
          </button>
        ))}
      </div>

      {/* Approvals Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Approval ID</th>
                <th className="px-6 py-3.5">Procurement Title</th>
                <th className="px-6 py-3.5">Budget</th>
                <th className="px-6 py-3.5">XGBoost Risk</th>
                <th className="px-6 py-3.5">AI Confidence</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Loading approval queue...
                  </td>
                </tr>
              ) : approvals.length > 0 ? (
                approvals.map((appr) => {
                  const req = appr.procurement_request || {};
                  const risk = appr.risk_assessment || {};
                  return (
                    <tr key={appr.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-cyan-400">{appr.id}</td>
                      <td className="px-6 py-4 font-semibold text-white">{req.title || 'Procurement Request'}</td>
                      <td className="px-6 py-4 font-mono font-semibold text-cyan-400">
                        ₹{(req.budget || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <RiskBadge level={risk.risk_level} score={risk.risk_score} />
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-200">
                        {Math.round((appr.confidence || 0) * 100)}%
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={appr.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedApproval(appr)}
                          className="px-3.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg font-semibold transition-colors flex items-center space-x-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View & Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No approval requests match the selected status filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Review Modal */}
      {selectedApproval && (
        <ApprovalModal
          approval={selectedApproval}
          onClose={() => setSelectedApproval(null)}
          onActionComplete={loadApprovals}
        />
      )}
    </div>
  );
}
