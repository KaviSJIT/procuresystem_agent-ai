import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, Cpu, Database, Bot } from 'lucide-react';
import { getSystemModels, getHealth } from '../services/api';
import api from '../services/api';

const StatusDot = ({ loaded, warn }) => (
  <span className={`w-2.5 h-2.5 rounded-full inline-block ${loaded ? 'bg-green-500' : warn ? 'bg-amber-400' : 'bg-red-500'}`}></span>
);

export default function SystemDiagnostics() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [e2eRunning, setE2eRunning] = useState(false);
  const [e2eResult, setE2eResult] = useState(null);

  useEffect(() => { loadDiagnostics(); }, []);

  const loadDiagnostics = async () => {
    setLoading(true);
    try {
      const diag = await getSystemModels();
      setDiagnostics(diag);
    } catch (e) {
      console.error('Diagnostics load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const runE2ETest = async () => {
    setE2eRunning(true); setE2eResult(null);
    try {
      const res = await api.post('/api/system/end-to-end-test');
      setE2eResult(res.data);
    } catch (e) {
      setE2eResult({ overall: '🔴 Failed', error: e.response?.data?.detail || e.message, stages: [] });
    } finally {
      setE2eRunning(false);
    }
  };

  const xgb = diagnostics?.xgboost_final || {};
  const rf = diagnostics?.random_forest_final || {};
  const rag = diagnostics?.rag_faiss || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">System Diagnostics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time status of trained model artifacts and AI components.</p>
        </div>
        <button onClick={loadDiagnostics} className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors shrink-0">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* XGBoost */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-800">XGBoost Model</span>
            </div>
            <StatusDot loaded={xgb.loaded} />
          </div>
          <p className="text-xs text-gray-500">{xgb.badge || (xgb.loaded ? '🟢 Loaded' : '🔴 Not loaded')}</p>
          <div className="text-xs space-y-1 text-gray-500 font-mono">
            <p>File: xgboost_procurement_final.pkl</p>
            <p>Features: <span className="text-gray-700">{xgb.features_count || 14}</span></p>
          </div>
          {xgb.error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{xgb.error}</p>}
          {xgb.loaded && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-semibold mb-1">Features:</p>
              <div className="flex flex-wrap gap-1">
                {(xgb.features || []).map((f, i) => (
                  <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200">{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RAG FAISS */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-800">RAG / FAISS</span>
            </div>
            <StatusDot loaded={rag.loaded} />
          </div>
          <p className="text-xs text-gray-500">{rag.badge || (rag.loaded ? '🟢 Loaded' : '🔴 Not loaded')}</p>
          <div className="text-xs space-y-1 text-gray-500 font-mono">
            <p>Index: procurement_faiss.index</p>
            <p>Vectors: <span className="text-gray-700">{rag.vectors?.toLocaleString() || 4790}</span></p>
            <p>Dimensions: <span className="text-gray-700">{rag.dimension || 384}</span></p>
            <p>Documents: <span className="text-gray-700">{rag.documents?.toLocaleString() || 4790}</span></p>
          </div>
          {rag.error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{rag.error}</p>}
        </div>

        {/* Random Forest */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-800">Random Forest Model</span>
            </div>
            <StatusDot loaded={rf.loaded} />
          </div>
          <p className="text-xs text-gray-500">{rf.badge || (rf.loaded ? '🟢 Loaded' : '🔴 Not loaded')}</p>
          <div className="text-xs space-y-1 text-gray-500 font-mono">
            <p>File: random_forest_procurement_risk_final.pkl</p>
            <p>Features: <span className="text-gray-700">{rf.features_count || 0}</span></p>
            <p>Classes: <span className="text-gray-700">{(rf.classes || []).join(', ') || 'LOW, MEDIUM, HIGH'}</span></p>
          </div>
          {rf.error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{rf.error}</p>}
        </div>
      </div>

      {/* End-to-End Test */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">End-to-End System Test</h3>
            <p className="text-xs text-gray-400 mt-0.5">Runs a real test procurement through the complete pipeline and reports each stage.</p>
          </div>
          <button
            onClick={runE2ETest}
            disabled={e2eRunning}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1F4E79] hover:bg-[#1a4268] disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
          >
            {e2eRunning ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Running...</span></> : <><Play className="w-3.5 h-3.5" /><span>Run End-to-End Test</span></>}
          </button>
        </div>

        {e2eResult && (
          <div className="p-5 space-y-4">
            <div className={`text-sm font-semibold px-4 py-2 rounded-md ${
              e2eResult.overall?.includes('🟢') ? 'bg-green-50 text-green-700 border border-green-200' :
              e2eResult.overall?.includes('🟡') ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {e2eResult.overall} — {e2eResult.passed}/{e2eResult.total_stages} stages passed
              {e2eResult.warned > 0 && `, ${e2eResult.warned} warned`}
              {e2eResult.failed > 0 && `, ${e2eResult.failed} failed`}
            </div>

            <div className="space-y-2">
              {(e2eResult.stages || []).map((stage, i) => (
                <div key={i} className="flex items-start justify-between border border-gray-200 rounded-md p-3 text-sm">
                  <div className="flex items-start space-x-3 flex-1">
                    <span className="text-base shrink-0">{stage.status?.split(' ')[0]}</span>
                    <div>
                      <p className="font-medium text-gray-800">{stage.stage}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{stage.detail}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-gray-400 shrink-0 ml-3">{stage.time_ms}ms</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
