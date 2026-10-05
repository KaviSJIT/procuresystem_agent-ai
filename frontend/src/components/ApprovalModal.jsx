import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, ShieldAlert, FileText, Cpu, Check, MessageSquare } from 'lucide-react';
import { RiskBadge } from './RiskBadge';
import { approveRequest, rejectRequest } from '../services/api';

export default function ApprovalModal({ approval, onClose, onActionComplete }) {
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!approval) return null;

  const req = approval.procurement_request || {};
  const risk = approval.risk_assessment || {};
  const rag = approval.rag_evidence || {};
  const agents = approval.agent_results || {};
  const aiRec = approval.ai_recommendation || {};

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      await approveRequest(approval.id, 'Procurement Officer', comments);
      setLoading(false);
      onActionComplete();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Approval submission failed');
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError(null);
    try {
      await rejectRequest(approval.id, 'Procurement Officer', comments);
      setLoading(false);
      onActionComplete();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Rejection submission failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <div>
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-bold text-white">Approval Center Review</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/20">
                {approval.id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Procurement Request ID: {approval.procurement_request_id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Procurement Summary Card */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Procurement Request</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Title</p>
                <p className="font-semibold text-white">{req.title || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Category</p>
                <p className="font-semibold text-white uppercase">{req.category || 'works'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Budget</p>
                <p className="font-semibold text-cyan-400">₹{(req.budget || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Location</p>
                <p className="font-semibold text-white">{req.location || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* XGBoost Risk Prediction Section */}
          <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>XGBoost Risk Model Analysis</span>
              </h4>
              <RiskBadge level={risk.risk_level} score={risk.risk_score} />
            </div>
            <p className="text-sm text-slate-300 font-medium">{risk.prediction}</p>
            <p className="text-xs text-slate-500 font-mono">Evaluated 14 XGBoost feature metrics against trained pipeline (xgboost_procurement_final.pkl)</p>
          </div>

          {/* AI Recommendation & Confidence */}
          <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">AI Recommendation & Explanation</h4>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                Confidence: {Math.round((approval.confidence || 0) * 100)}%
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-100">{aiRec.ai_recommendation || 'Recommendation generated by agentic pipeline'}</p>
            <p className="text-xs text-slate-400">{aiRec.reasoning}</p>
          </div>

          {/* RAG Evidence Retrieved Tenders */}
          {rag.results && rag.results.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>RAG Evidence (Top {rag.results.length} FAISS References)</span>
              </h4>
              <div className="space-y-2">
                {rag.results.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="bg-slate-800/40 border border-slate-800 p-3 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between font-semibold text-slate-300">
                      <span>{item.metadata?.tender_title || `Document #${item.doc_id}`}</span>
                      <span className="text-cyan-400 font-mono">Similarity: {item.score}</span>
                    </div>
                    <p className="text-slate-400 line-clamp-2">{item.document}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Human Comment & Decision Box */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Procurement Officer Decision Note</span>
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter review notes, technical justification, or approval comments..."
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-800/60 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition-all flex items-center space-x-2"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject & Return</span>
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve Procurement</span>
          </button>
        </div>
      </div>
    </div>
  );
}
