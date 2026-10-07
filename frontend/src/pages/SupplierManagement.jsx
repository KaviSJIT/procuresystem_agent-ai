import React, { useState, useEffect } from 'react';
import { Search, Filter, Building2, RefreshCw } from 'lucide-react';
import { getSuppliers } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => { fetchSuppliers(); }, [categoryFilter]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await getSuppliers({ category: categoryFilter, search });
      setSuppliers(data || []);
    } catch (e) {
      console.error('Failed to load suppliers:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchSuppliers(); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Supplier Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Procuring entity metrics derived from the HP Procurement tender dataset (rag_dataframe.pkl).
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-md shrink-0">
          <span>Entities loaded: <strong className="text-gray-800">{suppliers.length}</strong></span>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-700">
        <strong>Methodology:</strong> Risk score = 1 − (0.05 × avg_tenderers + 0.02 × tender_count), clamped [0.12, 0.88].
        Higher competition and more tenders = lower risk. These are empirical metrics from historical tender data — not AI predictions.
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by procuring entity name..."
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
            <option value="WORKS">Works</option>
            <option value="GOODS">Goods</option>
            <option value="SERVICES">Services</option>
          </select>
          <button onClick={fetchSuppliers} className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
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
                <th className="px-5 py-3">Procuring Entity</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Total Tenders</th>
                <th className="px-5 py-3">Avg Tenderers</th>
                <th className="px-5 py-3">Total Contract Value</th>
                <th className="px-5 py-3">Risk Score</th>
                <th className="px-5 py-3">Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">Loading supplier data from dataset...</td></tr>
              ) : suppliers.length > 0 ? (
                suppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-900 text-xs">{sup.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 uppercase">{sup.category}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800">{sup.total_tenders}</td>
                    <td className="px-5 py-3.5 font-mono text-gray-700">{sup.avg_tenderers_per_contract}</td>
                    <td className="px-5 py-3.5 font-mono text-sm text-gray-800">₹{sup.total_procurement_value.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <RiskBadge
                        level={sup.risk_score > 0.6 ? 'HIGH' : sup.risk_score > 0.35 ? 'MEDIUM' : 'LOW'}
                        score={sup.risk_score}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        sup.reliability_score >= 0.7 ? 'bg-green-50 text-green-700 border border-green-200' :
                        sup.reliability_score >= 0.4 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {sup.recommendation}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">No supplier records match the filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
