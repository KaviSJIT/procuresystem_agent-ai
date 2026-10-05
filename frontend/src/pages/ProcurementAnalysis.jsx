import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Cpu,
  FileText,
  Bot,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  Info
} from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export default function ProcurementAnalysis() {
  const location = useLocation();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
        <Bot className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-white">No Procurement Analysis Loaded</h3>
        <p className="text-xs text-slate-400">
          Please submit a new procurement request from the form to view real-time model analysis.
        </p>
        <Link
          to="/new-procurement"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold"
        >
          <span>Go to New Procurement Form</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const req = result.procurement_request || {};
  const risk = result.risk_assessment || {};
  const rag = result.rag_evidence || {};
  const qwen = result.qwen_analysis || null;
  const agents = result.agent_results || {};
  const rec = result.ai_recommendation || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-extrabold text-white">{req.title || 'Procurement Analysis'}</h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {result.request_id}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Category: <span className="uppercase text-slate-200 font-semibold">{req.category}</span> • Budget: <span className="text-cyan-400 font-semibold">₹{(req.budget || 0).toLocaleString()}</span> • Location: {req.location || 'N/A'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <StatusBadge status={result.status} />
          <Link
            to="/approvals"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center space-x-1.5"
          >
            <span>Open Approval Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Grid Layout for AI Components */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. XGBoost Risk Prediction Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">XGBoost Risk Model</h3>
            </div>
            <RiskBadge level={risk.risk_level} score={risk.risk_score} />
          </div>

          <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl space-y-2">
            <p className="text-xs text-slate-400">Model Output Prediction:</p>
            <p className="text-sm font-semibold text-slate-100">{risk.prediction}</p>
            <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-700/50">
              <span>Risk Probability:</span>
              <span className="font-mono text-cyan-400 font-bold">{Math.round((risk.risk_score || 0) * 100)}%</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evaluated Features ({risk.features_evaluated?.length || 14})</p>
            <div className="flex flex-wrap gap-1">
              {(risk.features_evaluated || []).map((feat, i) => (
                <span key={i} className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700/50">
                  {feat}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 2. AI Recommendation & Multi-Agent Synthesis */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 space-y-4 shadow-xl shadow-cyan-950/20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Multi-Agent AI Recommendation</h3>
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full">
              Confidence Score: {Math.round((result.confidence || 0) * 100)}%
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Synthesized Recommendation</p>
              <p className="text-base font-semibold text-white mt-1 leading-relaxed">
                {rec.ai_recommendation || 'Recommendation processed by Agentic AI.'}
              </p>
            </div>

            <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl space-y-1 text-xs">
              <p className="font-semibold text-cyan-400">Agent Reasoning & Evidence Alignment:</p>
              <p className="text-slate-300 leading-normal">{rec.reasoning}</p>
            </div>
          </div>

          {/* Qwen LLM Section */}
          <div className="pt-2 border-t border-slate-800 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold flex items-center space-x-1.5">
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>Qwen LoRA LLM Integration Status</span>
              </span>
              <span className="font-mono text-slate-300">
                {qwen ? 'LLM Output Generated' : 'Base model configuration required (QWEN_BASE_MODEL)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. RAG Evidence Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>RAG Evidence (Top {rag.results?.length || 0} FAISS Similarity Retrieval Results)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">IndexFlatIP • 384 Dims • MiniLM-L6-v2</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(rag.results || []).map((doc, idx) => (
            <div key={idx} className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white truncate max-w-[70%]">
                  {doc.metadata?.tender_title || `Tender Document #${doc.doc_id}`}
                </span>
                <span className="font-mono font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Similarity: {doc.score}
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-3">{doc.document}</p>
              {doc.metadata && (
                <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                  <span>Entity: <strong className="text-slate-300">{doc.metadata.tender_procuringEntity_name || 'N/A'}</strong></span>
                  <span>Amount: <strong className="text-cyan-400">₹{(doc.metadata.tender_value_amount || 0).toLocaleString()}</strong></span>
                  <span>Tenderers: <strong className="text-slate-300">{doc.metadata.tender_numberOfTenderers || 0}</strong></span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
