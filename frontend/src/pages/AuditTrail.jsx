import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { getAuditTrail } from '../services/api';

function dotColor(evt) {
  if (evt.human_decision === 'APPROVED') return 'bg-green-500';
  if (evt.human_decision === 'REJECTED') return 'bg-red-500';
  if (evt.agent?.includes('Human')) return 'bg-green-500';
  if (evt.agent?.includes('XGBoost')) return 'bg-blue-500';
  if (evt.agent?.includes('RAG')) return 'bg-amber-500';
  if (evt.status === 'FAILED') return 'bg-red-400';
  if (evt.status === 'SKIPPED') return 'bg-gray-300';
  return 'bg-gray-400';
}

export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchReq, setSearchReq] = useState('');

  useEffect(() => { loadAuditData(); }, []);

  const loadAuditData = async (reqId = '') => {
    setLoading(true);
    try {
      const data = await getAuditTrail(reqId);
      setLogs(data || []);
    } catch (e) {
      console.error('Audit load error:', e);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-sm text-gray-500 mt-0.5">Complete timestamped activity log for every procurement decision and agent action.</p>
        </div>
        <span className="text-sm text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-md shrink-0">
          Total Events: <strong className="text-gray-800">{logs.length}</strong>
        </span>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Request ID or event..."
            value={searchReq}
            onChange={(e) => setSearchReq(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-md pl-9 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1F4E79] transition-colors"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-[#1F4E79] hover:bg-[#1a4268] text-white font-medium text-sm rounded-md transition-colors">
          Filter
        </button>
        {searchReq && (
          <button type="button" onClick={() => { setSearchReq(''); loadAuditData(''); }}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm rounded-md hover:bg-gray-50 transition-colors">
            Clear
          </button>
        )}
      </form>

      <div className="bg-white border border-gray-200 rounded-md shadow-sm p-6">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading audit timeline...</p>
        ) : logs.length > 0 ? (
          <div className="relative border-l-2 border-gray-200 ml-3 pl-6 space-y-5">
            {logs.map((evt, idx) => (
              <div key={idx} className="relative">
                <div className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${dotColor(evt)}`}></div>
                <div className="border border-gray-200 rounded-md p-4 space-y-2 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-sm font-semibold text-gray-800">{evt.action || 'EVENT'}</span>
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">{evt.agent || 'System'}</span>
                      {evt.status && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          evt.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                          evt.status === 'FAILED' ? 'bg-red-50 text-red-700' :
                          evt.status === 'SKIPPED' ? 'bg-gray-100 text-gray-500' :
                          'bg-amber-50 text-amber-700'
                        }`}>{evt.status}</span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-gray-400">{evt.timestamp}</span>
                  </div>
                  {evt.input_summary && <p className="text-sm text-gray-700">{evt.input_summary}</p>}
                  {evt.output_summary && (
                    <p className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded border border-gray-100 font-mono leading-relaxed">
                      {evt.output_summary}
                    </p>
                  )}
                  {evt.request_id && (
                    <p className="text-xs text-gray-400">Request: <span className="font-mono text-gray-600">{evt.request_id}</span></p>
                  )}
                  {evt.human_decision && (
                    <div className="flex items-center space-x-2 text-xs pt-1 border-t border-gray-100">
                      <span className="text-gray-400">Human Decision:</span>
                      <strong className={evt.human_decision === 'APPROVED' ? 'text-green-700' : evt.human_decision === 'REJECTED' ? 'text-red-700' : 'text-amber-700'}>
                        {evt.human_decision}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">
            No audit events logged yet. Creating procurement requests will populate the timeline.
          </p>
        )}
      </div>
    </div>
  );
}
