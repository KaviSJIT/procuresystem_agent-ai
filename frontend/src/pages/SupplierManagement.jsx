import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, ShieldCheck, AlertCircle, Building2, TrendingUp } from 'lucide-react';
import { getSuppliers } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, [categoryFilter]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await getSuppliers({ category: categoryFilter, search });
      setSuppliers(data || []);
    } catch (e) {
      console.error("Failed to load suppliers:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSuppliers();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-cyan-400" />
            <span>Supplier & Procuring Entity Intelligence</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Empirical metrics derived directly from <code className="text-cyan-400">rag_dataframe.pkl</code> tender historical dataset.
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-800/60 border border-slate-700/60 px-3 py-2 rounded-xl">
          Derived Entities: <strong className="text-white">{suppliers.length}</strong>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by procuring entity / supplier name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="">All Categories</option>
            <option value="WORKS">Works (Civil/Construction)</option>
            <option value="GOODS">Goods</option>
            <option value="SERVICES">Services</option>
          </select>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Supplier / Entity Name</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Total Tenders</th>
                <th className="px-6 py-3.5">Avg Tenderers</th>
                <th className="px-6 py-3.5">Total Contract Value</th>
                <th className="px-6 py-3.5">Risk Score</th>
                <th className="px-6 py-3.5">Reliability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Loading empirical supplier metrics from dataset...
                  </td>
                </tr>
              ) : suppliers.length > 0 ? (
                suppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>{sup.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 uppercase text-slate-400 font-mono">{sup.category}</td>
                    <td className="px-6 py-4 font-bold text-slate-200">{sup.total_tenders}</td>
                    <td className="px-6 py-4 font-mono">{sup.avg_tenderers_per_contract}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-cyan-400">
                      ₹{sup.total_procurement_value.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <RiskBadge level={sup.risk_score > 0.6 ? 'HIGH' : (sup.risk_score > 0.35 ? 'MEDIUM' : 'LOW')} score={sup.risk_score} />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        sup.reliability_score >= 0.7 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {Math.round(sup.reliability_score * 100)}% ({sup.recommendation})
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No supplier records match the selected filter criteria.
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
