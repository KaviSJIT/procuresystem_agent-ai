import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, UserCheck, Cpu, Database, Search, ArrowDown } from 'lucide-react';
import { getAuditTrail } from '../services/api';

export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchReq, setSearchReq] = useState('');

  useEffect(() => {
    loadAuditData();
  }, []);

  const loadAuditData = async (reqId = '') => {
    setLoading(true);
    try {
      const data = await getAuditTrail(reqId);
      setLogs(data || []);
    } catch (e) {
      console.error("Audit load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadAuditData(searchReq);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <History className="w-6 h-6 text-cyan-400" />
            <span>Audit Trail & Cryptographic Decision Traceability</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Preserves existing <code className="text-cyan-400">procurement_audit_log.json</code> records and tracks every agent action timestamp by timestamp.
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-800/60 border border-slate-700/60 px-3.5 py-2 rounded-xl shrink-0">
          Total Recorded Events: <strong className="text-cyan-400 font-mono">{logs.length}</strong>
        </div>
      </div>

      {/* Filter by Request ID */}
      <form onSubmit={handleSearchSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-3 shadow-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search audit trail by Request ID or event ID..."
            value={searchReq}
            onChange={(e) => setSearchReq(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow"
        >
          Filter Trail
        </button>
      </form>

      {/* Timeline View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {loading ? (
          <p className="text-xs text-slate-500 text-center py-8">Loading audit timeline...</p>
        ) : logs.length > 0 ? (
          <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-8">
            {logs.map((evt, idx) => {
              const isHuman = evt.agent?.includes('Human') || evt.action?.includes('HUMAN');
              const isXGB = evt.agent?.includes('XGBoost');
              const isRAG = evt.agent?.includes('RAG');

              return (
                <div key={idx} className="relative group">
                  {/* Circle Marker */}
                  <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isHuman
                      ? 'bg-emerald-500 border-emerald-400 ring-4 ring-emerald-500/10'
                      : isXGB
                      ? 'bg-cyan-500 border-cyan-400 ring-4 ring-cyan-500/10'
                      : 'bg-slate-700 border-slate-500'
                  }`}></div>

                  {/* Log Content Card */}
                  <div className="bg-slate-800/40 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-2 transition-colors">
                    <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white uppercase tracking-wider">{evt.action || 'EVENT'}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                          {evt.agent || 'System'}
                        </span>
                      </div>
                      <span className="font-mono text-cyan-400 text-[11px]">{evt.timestamp}</span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium">{evt.input_summary}</p>
                    <p className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg font-mono border border-slate-800">
                      {evt.output_summary}
                    </p>

                    {evt.human_decision && (
                      <div className="pt-1 flex items-center space-x-2 text-xs">
                        <span className="text-slate-400">Human Decision:</span>
                        <strong className={evt.human_decision === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400'}>
                          {evt.human_decision}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-8">
            No audit events logged yet. Creating procurement requests will populate the timeline.
          </p>
        )}
      </div>
    </div>
  );
}
