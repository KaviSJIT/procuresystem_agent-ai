import React, { useState, useEffect } from 'react';
import { Activity, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { getHealth } from '../services/api';

export default function Navbar() {
  const [status, setStatus] = useState({ online: false, models: {} });

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const data = await getHealth();
      setStatus({ online: true, models: data.models || {} });
    } catch {
      setStatus({ online: false, models: {} });
    }
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-3">
        <Activity className="w-5 h-5 text-cyan-400" />
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Agentic AI Construction Procurement Management System</h2>
          <p className="text-xs text-slate-400">Intelligent Procurement Management Framework</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Model Status Pills */}
        <div className="hidden lg:flex items-center space-x-2 text-xs">
          <span className={`px-2.5 py-1 rounded-full border flex items-center space-x-1.5 ${
            status.models.xgboost ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.models.xgboost ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
            <span>XGBoost</span>
          </span>

          <span className={`px-2.5 py-1 rounded-full border flex items-center space-x-1.5 ${
            status.models.rag ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.models.rag ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
            <span>RAG FAISS</span>
          </span>

          <span className={`px-2.5 py-1 rounded-full border flex items-center space-x-1.5 ${
            status.models.qwen ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.models.qwen ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span>Qwen LoRA</span>
          </span>
        </div>

        {/* Global Online Status Indicator */}
        <div className="flex items-center space-x-2 bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-lg text-xs font-medium">
          {status.online ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400">System Online</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              <span className="text-red-400">Offline</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
