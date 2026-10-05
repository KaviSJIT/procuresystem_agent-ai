import React, { useState, useEffect } from 'react';
import { Cpu, Database, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Terminal, Code2 } from 'lucide-react';
import { getSystemModels, getHealth } from '../services/api';

export default function SystemDiagnostics() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    setLoading(true);
    try {
      const [diag, h] = await Promise.all([
        getSystemModels(),
        getHealth()
      ]);
      setDiagnostics(diag);
      setHealth(h);
    } catch (e) {
      console.error("Diagnostics load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const xgb = diagnostics?.xgboost_final || {};
  const rag = diagnostics?.rag_faiss || {};
  const qwen = diagnostics?.qwen_adapter || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <span>AI Model Artifact Diagnostics & Health</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status inspection of verified trained model files in <code className="text-cyan-400">models/</code> directory.
          </p>
        </div>
        <button
          onClick={loadDiagnostics}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center space-x-1.5 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-inspect Models</span>
        </button>
      </div>

      {/* Grid Cards for Each Model Artifact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. XGBoost Diagnostics Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">XGBoost Model</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                xgb.loaded ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400'
              }`}>
                {xgb.loaded ? 'LOADED' : 'UNLOADED'}
              </span>
            </div>

            <div className="text-xs space-y-1.5 font-mono">
              <p className="text-slate-400">File: <span className="text-slate-200">models/xgboost_procurement_final.pkl</span></p>
              <p className="text-slate-400">Features: <span className="text-cyan-400">{xgb.features_count || 14} Expected Features</span></p>
              <p className="text-slate-400">Environment: <span className="text-slate-200">scikit-learn 1.6.1 + xgboost 2.1.4</span></p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            {xgb.loaded ? '✓ XGBoost Pipeline ready for risk prediction.' : `Error: ${xgb.error}`}
          </div>
        </div>

        {/* 2. RAG FAISS Index Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">RAG & FAISS Index</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                rag.loaded ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400'
              }`}>
                {rag.loaded ? 'LOADED' : 'UNLOADED'}
              </span>
            </div>

            <div className="text-xs space-y-1.5 font-mono">
              <p className="text-slate-400">Index Type: <span className="text-slate-200">IndexFlatIP</span></p>
              <p className="text-slate-400">Vectors: <span className="text-cyan-400">{rag.vectors || 4790}</span></p>
              <p className="text-slate-400">Dimension: <span className="text-cyan-400">{rag.dimension || 384}</span></p>
              <p className="text-slate-400">Documents: <span className="text-slate-200">{rag.documents || 4790}</span></p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            {rag.loaded ? '✓ FAISS index & MiniLM-L6-v2 embedder ready.' : 'RAG artifacts missing.'}
          </div>
        </div>

        {/* 3. Qwen LoRA Adapter Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Qwen LoRA Adapter</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                qwen.loaded ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {qwen.loaded ? 'LOADED' : 'BASE MODEL NEEDED'}
              </span>
            </div>

            <div className="text-xs space-y-1.5 font-mono">
              <p className="text-slate-400">Adapter Path: <span className="text-slate-200">models/qwen_procurement_llm</span></p>
              <p className="text-slate-400">Base Model: <span className="text-amber-400">{qwen.base_model || 'Not configured'}</span></p>
              <p className="text-slate-400">Peft Target: <span className="text-slate-300">o_proj, q_proj, k_proj, v_proj</span></p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-amber-400 font-medium">
            {qwen.reason || 'Qwen adapter found. Base model configuration required.'}
          </div>
        </div>
      </div>
    </div>
  );
}
