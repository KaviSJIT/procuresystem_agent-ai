import React, { useState, useEffect } from 'react';
import { RefreshCw, Eye } from 'lucide-react';
import { getApprovals } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';
import ApprovalModal from '../components/ApprovalModal';

const filterTabs = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function ApprovalCenter() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedApproval, setSelectedApproval] = useState(null);

  useEffect(() => { loadApprovals(); }, [filterStatus]);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const data = await getApprovals(filterStatus);
      setApprovals(data || []);
    } catch (e) {
      console.error('Error loading approvals:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Approval Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Review and approve AI-assisted procurement recommendations.
          </p>
        </div>
        <button
          onClick={loadApprovals}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 border-b border-gray-200">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              filterStatus === tab.value
                ? 'border-[#1F4E79] text-[#1F4E79]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
              <tr>
                <th className="px-5 py-3">Approval ID</th>
                <th className="px-5 py-3">Procurement Title</th>
                <th className="px-5 py-3">Budget</th>
                <th className="px-5 py-3">Predicted Award</th>
                <th className="px-5 py-3">Risk Level</th>
                <th className="px-5 py-3">AI Confidence</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-400">Loading approval queue...</td></tr>
              ) : approvals.length > 0 ? (
                approvals.map((appr) => {
                  const req = appr.procurement_request || {};
                  const risk = appr.risk_assessment || {};
                  const predAward = risk.predicted_award || appr.ai_recommendation?.predicted_award;
                  return (
                    <tr key={appr.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-gray-500">{appr.id}</td>
                      <td className="px-5 py-4 font-medium text-gray-900">{req.title || 'Procurement Request'}</td>
                      <td className="px-5 py-4 font-mono font-medium text-gray-800">₹{(req.budget || 0).toLocaleString()}</td>
                      <td className="px-5 py-4 font-mono font-medium text-[#1F4E79]">
                        {predAward ? `₹${Number(predAward).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-5 py-4"><RiskBadge level={risk.risk_level || 'LOW'} score={risk.risk_score} /></td>
                      <td className="px-5 py-4 font-mono font-semibold text-gray-700">
                        {risk.risk_confidence ? `${Number(risk.risk_confidence).toFixed(1)}%` : `${Math.round((appr.confidence || 0) * 100)}%`}
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={appr.status} /></td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedApproval(appr)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-[#1F4E79] border border-[#1F4E79] rounded hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View & Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-400">No approval requests match the selected filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
