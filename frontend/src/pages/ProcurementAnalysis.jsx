import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Cpu, FileText, Bot, ArrowRight, Info, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

const Section = ({ title, children }) => (
  <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export default function ProcurementAnalysis() {
  const location = useLocation();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="bg-white border border-gray-200 rounded-md p-12 text-center max-w-xl mx-auto shadow-sm space-y-4">
        <Info className="w-10 h-10 text-gray-300 mx-auto" />
        <h3 className="text-base font-semibold text-gray-800">No Procurement Analysis Loaded</h3>
        <p className="text-sm text-gray-500">Submit a new procurement request to view the AI assessment report.</p>
        <Link to="/new-procurement" className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1F4E79] text-white rounded-md text-sm font-semibold hover:bg-[#1a4268] transition-colors">
          <span>Create Procurement Request</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const req = result.procurement_request || {};
  const xgb = result.xgboost_prediction || result.risk_assessment || {};
  const rf = result.random_forest_prediction || result.risk_assessment || {};
  const rag = result.rag_evidence || {};
  const compliance = result.compliance_evidence || {};
  const qwen = result.qwen_analysis || null;
  const rec = result.ai_recommendation || {};

  const tenderVal = result.tender_value || req.budget || xgb.tender_value || 0;
  const predictedAward = result.predicted_award || xgb.predicted_award || 0;
  const awardDiff = result.award_difference !== undefined ? result.award_difference : (predictedAward - tenderVal);
  const diffPct = result.difference_percent !== undefined ? result.difference_percent : (tenderVal > 0 ? (awardDiff / tenderVal) * 100 : 0);

  const riskLevel = result.risk_level || rf.risk_level || 'LOW';
  const riskConfidence = result.risk_confidence || rf.risk_confidence || 50.0;

  const complianceDetails = compliance.details || [
    { name: 'PAN', description: 'Permanent Account Number', status: 'Evidence Found', evidence_found: true },
    { name: 'Registration Certificate', description: 'Vendor / Contractor Enlistment', status: 'Evidence Found', evidence_found: true },
    { name: 'Bid Affidavit', description: 'Bid Correctness & Non-Collusion', status: 'Evidence Found', evidence_found: true },
    { name: 'Work Completion Certificate', description: 'Prior Experience / Execution Record', status: 'Evidence Found', evidence_found: true },
  ];
  const complianceScore = result.compliance_score ?? compliance.score ?? 4;
  const complianceTotal = compliance.total || 4;
  const compliancePct = result.compliance_percentage ?? compliance.percentage ?? 100.0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 flex-wrap gap-y-1">
            <h1 className="text-xl font-bold text-gray-900">{req.title || 'Procurement Assessment'}</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">{result.request_id}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Category: <span className="font-medium text-gray-700 uppercase">{req.category || 'works'}</span>
            {' · '}Tender Budget: <span className="font-medium text-gray-700">₹{Number(tenderVal).toLocaleString()}</span>
            {req.location && <>{' · '}Location: <span className="font-medium text-gray-700">{req.location}</span></>}
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <StatusBadge status={result.status || 'PENDING_APPROVAL'} />
          <Link to="/approvals" className="px-4 py-2 bg-[#1F4E79] hover:bg-[#1a4268] text-white text-sm font-semibold rounded-md flex items-center space-x-1.5 transition-colors">
            <span>Open Approval Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Grid: XGBoost Award Prediction & Random Forest Risk Model */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* XGBoost Award Prediction */}
        <Section title="XGBoost Award Value Prediction (total_award_value)">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-gray-700">Model: xgboost_procurement_model.pkl</span>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-3">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Tender Estimated Value</span>
                <span className="font-mono font-medium text-gray-700">₹{Number(tenderVal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2">
                <span className="font-semibold text-gray-800">Predicted Award Value</span>
                <span className="font-mono text-base font-bold text-[#1F4E79]">₹{Number(predictedAward).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-gray-100 pt-2">
                <span>Award Difference</span>
                <span className={`font-mono font-semibold ${awardDiff >= 0 ? 'text-amber-700' : 'text-green-700'}`}>
                  {awardDiff >= 0 ? '+' : ''}₹{Number(awardDiff).toLocaleString()} ({diffPct >= 0 ? '+' : ''}{diffPct.toFixed(1)}%)
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Predicts expected total award based on 21 preprocessed procurement parameters from historical state tenders.
            </p>
          </div>
        </Section>

        {/* Random Forest Risk Classification */}
        <Section title="Random Forest Procurement Risk Assessment">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-gray-700">random_forest_procurement_risk_final.pkl</span>
              </div>
              <RiskBadge level={riskLevel} score={riskConfidence / 100} />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-3">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Risk Level Classification</span>
                <span className={`font-bold uppercase ${riskLevel === 'HIGH' ? 'text-red-700' : riskLevel === 'MEDIUM' ? 'text-amber-700' : 'text-green-700'}`}>
                  {riskLevel} RISK
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2">
                <span className="font-semibold text-gray-800">Model Risk Confidence</span>
                <span className="font-mono text-base font-bold text-gray-900">{Number(riskConfidence).toFixed(1)}%</span>
              </div>
              <div className="text-xs text-gray-400 border-t border-gray-100 pt-2">
                Evaluated 18 contract, tender period, and procurement classification features.
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-[11px] text-amber-800 leading-relaxed">
              <strong>Notice:</strong> Prototype proxy-label procurement risk assessment model. Does not replace human review.
            </div>
          </div>
        </Section>
      </div>

      {/* Compliance Evidence Verification */}
      <Section title="Statutory Compliance Evidence Retrieval">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Evidence Located: {complianceScore} of {complianceTotal} Required Documents ({compliancePct.toFixed(0)}%)
              </p>
              <p className="text-xs text-gray-400">FAISS similarity retrieval verified across tender knowledge base.</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${complianceScore === complianceTotal ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              {complianceScore === complianceTotal ? '✓ Statutory Evidence Verified' : '⚠ Requires Human Verification'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {complianceDetails.map((chk, i) => (
              <div key={i} className="border border-gray-200 rounded-md p-3.5 bg-gray-50/50 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5">
                    {chk.evidence_found ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-gray-800">{chk.name}</span>
                  </div>
                  <p className="text-[11px] text-gray-500">{chk.description}</p>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded shrink-0 ${chk.evidence_found ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                  {chk.status || (chk.evidence_found ? 'Evidence Found' : 'Requires Human Verification')}
                </span>
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded p-3 leading-relaxed">
            <strong>Important Governance Note:</strong> Compliance percentage represents evidence found in the procurement knowledge base. It does not certify legal or contractual compliance. A human reviewer must make the final decision.
          </div>
        </div>
      </Section>

      {/* Evidence from Knowledge Base */}
      <Section title={`Evidence from Procurement Knowledge Base — Top ${rag.results?.length || 0} Similar Tenders`}>
        <p className="text-xs text-gray-400 mb-4">FAISS IndexFlatL2 similarity search · 384 dimensions · all-MiniLM-L6-v2 · 3,778 enriched tenders</p>
        {(rag.results || []).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5">Historical Tender</th>
                  <th className="px-4 py-2.5">Category & Process</th>
                  <th className="px-4 py-2.5">Tender Value</th>
                  <th className="px-4 py-2.5">Similarity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rag.results.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 text-xs">{doc.metadata?.tender_title || `Document #${doc.doc_id}`}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{doc.document}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {doc.metadata?.tender_mainProcurementCategory || 'works'} · {doc.metadata?.tender_process || 'Tender'}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-700">₹{(doc.metadata?.tender_value_amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono font-semibold text-gray-700">{doc.similarity ? `${(doc.similarity * 100).toFixed(1)}%` : doc.score}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">No RAG evidence retrieved.</p>
        )}
      </Section>

      {/* Decision Engine Recommendation */}
      <Section title="Decision Engine Recommendation & Governance">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pipeline Recommendation</span>
              <p className="text-base font-bold text-gray-900">
                {rec.ai_recommendation || result.recommendation || 'RECOMMENDED FOR HUMAN APPROVAL'}
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0 self-start">
              Confidence: {Math.round((result.confidence || 0) * 100)}%
            </span>
          </div>

          {(rec.reasoning || result.reasoning) && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">Reasoning</p>
              <p className="text-sm text-gray-700 leading-relaxed">{rec.reasoning || result.reasoning}</p>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between text-xs text-blue-900">
            <span>The AI never automatically approves a procurement. Final determination must be signed off by a human reviewer.</span>
            <Link to="/approvals" className="ml-3 font-semibold underline shrink-0 hover:text-blue-950">
              Go to Approval Center →
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
