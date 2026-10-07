import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, ShieldAlert, FileText, Cpu, MessageSquare, RotateCcw, ShieldCheck } from 'lucide-react';
import { RiskBadge } from './RiskBadge';
import { approveRequest, rejectRequest, sendForReview } from '../services/api';

export default function ApprovalModal({ approval, onClose, onActionComplete }) {
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!approval) return null;

  const req = approval.procurement_request || {};
  const risk = approval.risk_assessment || {};
  const rag = approval.rag_evidence || {};
  const aiRec = approval.ai_recommendation || {};

  const tenderVal = req.budget || risk.tender_value || 0;
  const predictedAward = risk.predicted_award || aiRec.predicted_award || 0;
  const awardDiff = risk.award_difference !== undefined ? risk.award_difference : (predictedAward - tenderVal);
  const diffPct = risk.difference_percent !== undefined ? risk.difference_percent : (tenderVal > 0 ? (awardDiff / tenderVal) * 100 : 0);
  const riskLevel = risk.risk_level || 'LOW';
  const riskConfidence = risk.risk_confidence || (approval.confidence ? approval.confidence * 100 : 50.0);

  const complianceScore = aiRec.compliance_score ?? 4;
  const compliancePct = aiRec.compliance_percentage ?? 100;

  const handleReview = async () => {
    setLoading(true); setError(null);
    try {
      await sendForReview(approval.id, 'Procurement Officer', comments);
      setLoading(false); onActionComplete(); onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Send for review failed');
    }
  };

  const handleApprove = async () => {
    setLoading(true); setError(null);
    try {
      await approveRequest(approval.id, 'Procurement Officer', comments);
      setLoading(false); onActionComplete(); onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Approval submission failed');
    }
  };

  const handleReject = async () => {
    setLoading(true); setError(null);
    try {
      await rejectRequest(approval.id, 'Procurement Officer', comments);
      setLoading(false); onActionComplete(); onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Rejection submission failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-lg w-full max-w-4xl shadow-xl overflow-hidden my-8">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Procurement Approval Review</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Approval ID: <span className="font-mono font-medium text-gray-700">{approval.id}</span>
              {' · '}Request: <span className="font-mono font-medium text-gray-700">{approval.procurement_request_id}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
          )}

          {/* Request Information */}
          <section>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Request Information</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Title</p>
                <p className="font-semibold text-gray-900 truncate">{req.title || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Category</p>
                <p className="font-semibold text-gray-900 uppercase">{req.category || 'works'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Tender Budget</p>
                <p className="font-semibold text-[#1F4E79]">₹{Number(tenderVal).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Location</p>
                <p className="font-semibold text-gray-900">{req.location || 'N/A'}</p>
              </div>
            </div>
          </section>

          {/* ML Models: XGBoost Award & Random Forest Risk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* XGBoost Award Prediction */}
            <div className="border border-gray-200 rounded-md p-4 space-y-2.5 bg-gray-50/50">
              <div className="flex items-center space-x-2 text-xs font-semibold text-gray-700">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>XGBoost Award Value Prediction</span>
              </div>
              <div className="bg-white border border-gray-200 rounded p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Predicted Award</span>
                  <span className="font-mono font-bold text-gray-900">₹{Number(predictedAward).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-1.5">
                  <span className="text-gray-500">Budget Difference</span>
                  <span className={`font-mono font-semibold ${awardDiff >= 0 ? 'text-amber-700' : 'text-green-700'}`}>
                    {awardDiff >= 0 ? '+' : ''}₹{Number(awardDiff).toLocaleString()} ({diffPct >= 0 ? '+' : ''}{diffPct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Random Forest Risk Classification */}
            <div className="border border-gray-200 rounded-md p-4 space-y-2.5 bg-gray-50/50">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Random Forest Procurement Risk</span>
                </div>
                <RiskBadge level={riskLevel} score={riskConfidence / 100} />
              </div>
              <div className="bg-white border border-gray-200 rounded p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Risk Level</span>
                  <span className="font-bold uppercase text-gray-900">{riskLevel} RISK</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-1.5">
                  <span className="text-gray-500">Risk Confidence</span>
                  <span className="font-mono font-bold text-gray-900">{Number(riskConfidence).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance & AI Recommendation */}
          <section>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pipeline Decision & Statutory Compliance</h4>
            <div className="border border-gray-200 rounded-md p-4 space-y-3 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                <div>
                  <p className="text-xs text-gray-400">Decision Engine Recommendation</p>
                  <p className="text-sm font-bold text-gray-900">{aiRec.ai_recommendation || 'RECOMMENDED FOR HUMAN APPROVAL'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2.5 py-1 rounded bg-green-50 text-green-700 border border-green-200 font-medium">
                    Compliance: {complianceScore}/4 ({compliancePct}%)
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Confidence: {Math.round((approval.confidence || 0) * 100)}%
                  </span>
                </div>
              </div>
              {aiRec.reasoning && (
                <p className="text-xs text-gray-600 leading-relaxed">{aiRec.reasoning}</p>
              )}
            </div>
          </section>

          {/* RAG Evidence */}
          {rag.results && rag.results.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>RAG Evidence — Top {rag.results.length} Similar Tenders</span>
              </h4>
              <div className="space-y-2">
                {rag.results.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-md p-3 text-xs space-y-1 bg-gray-50">
                    <div className="flex justify-between font-semibold text-gray-800">
                      <span className="truncate max-w-[70%]">{item.metadata?.tender_title || `Document #${item.doc_id}`}</span>
                      <span className="text-gray-500 font-mono shrink-0 ml-2">Similarity: {item.similarity ? `${(item.similarity * 100).toFixed(1)}%` : item.score}</span>
                    </div>
                    <p className="text-gray-500 line-clamp-2">{item.document}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reviewer Comments */}
          <section className="border-t border-gray-100 pt-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Reviewer Comments (Human Decision Mandatory)</span>
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter review notes, justification, or decision comments..."
              rows={3}
              className="w-full bg-white border border-gray-300 rounded-md p-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1F4E79] transition-colors"
            />
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="px-5 py-2 rounded-md text-sm font-medium bg-white text-red-700 border border-red-300 hover:bg-red-50 transition-colors flex items-center space-x-2"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject</span>
          </button>
          <button
            onClick={handleReview}
            disabled={loading}
            className="px-5 py-2 rounded-md text-sm font-medium bg-white text-amber-700 border border-amber-300 hover:bg-amber-50 transition-colors flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Send for Review</span>
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="px-5 py-2 rounded-md text-sm font-medium bg-[#1F4E79] text-white hover:bg-[#1a4268] transition-colors flex items-center space-x-2 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve Procurement</span>
          </button>
        </div>
      </div>
    </div>
  );
}
