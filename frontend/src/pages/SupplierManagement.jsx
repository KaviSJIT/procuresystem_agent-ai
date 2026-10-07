import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText, RefreshCw } from 'lucide-react';
import { getSuppliers } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';

export default function SupplierManagement() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => { fetchRecords(); }, [categoryFilter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await getSuppliers({ category: categoryFilter, search });
      setRecords(data || []);
    } catch (e) {
      console.error('Failed to load tender records:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchRecords(); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tender Records</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real HP procurement tender records from the RAG dataset (enriched_rag_documents.pkl).
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-md shrink-0">
          <span>Records loaded: <strong className="text-gray-800">{records.length}</strong></span>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-700">
        <strong>Dataset:</strong> 3,778 real HP Government procurement tenders. Risk score = 1 − (0.05 × num_tenderers),
        clamped [0.12, 0.88]. More competition = lower risk. These are empirical metrics from historical tender data — not AI predictions.
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by tender title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-md pl-9 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1F4E79] transition-colors"
          />
        </form>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#1F4E79] transition-colors"
          >
            <option value="">All Categories</option>
            <option value="works">Works</option>
            <option value="goods">Goods</option>
            <option value="services">Services</option>
          </select>
          <button
            onClick={fetchRecords}
            className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
              <tr>
                <th className="px-5 py-3">Tender Title</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Process</th>
                <th className="px-5 py-3">Tenderers</th>
                <th className="px-5 py-3">Contract Value</th>
                <th className="px-5 py-3">Risk Score</th>
                <th className="px-5 py-3">Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">
                    Loading tender records from dataset...
                  </td>
                </tr>
              ) : records.length > 0 ? (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-start space-x-2">
                        <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="font-medium text-gray-900 text-xs leading-snug max-w-xs">{rec.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 uppercase">{rec.category}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{rec.procurement_process || '—'}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800 text-center">{rec.num_tenderers}</td>
                    <td className="px-5 py-3.5 font-mono text-sm text-gray-800">
                      {rec.total_procurement_value > 0
                        ? `₹${rec.total_procurement_value.toLocaleString('en-IN')}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <RiskBadge
                        level={rec.risk_score > 0.6 ? 'HIGH' : rec.risk_score > 0.35 ? 'MEDIUM' : 'LOW'}
                        score={rec.risk_score}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        rec.reliability_score >= 0.7
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : rec.reliability_score >= 0.4
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {rec.recommendation}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">
                    No tender records match the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
