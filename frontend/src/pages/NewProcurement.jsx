import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Send, Sparkles, AlertCircle, FileText } from 'lucide-react';
import { createProcurement } from '../services/api';

export default function NewProcurement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State initialized with prompt demo values
  const [formData, setFormData] = useState({
    title: 'Construction Steel Procurement',
    category: 'works',
    material_or_service: '100 tons Structural Steel',
    quantity: '100 tons',
    budget: 5000000,
    required_date: '30 days',
    location: 'Chennai',
    supplier_requirements: 'Find reliable suppliers with low procurement and delivery risk.',
    description: 'Procurement of 100 tons high-grade structural construction steel for HP PWD building project.'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' ? (parseFloat(value) || 0) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await createProcurement(formData);
      setLoading(false);
      // Navigate to analysis page passing state
      navigate('/analysis', { state: { result } });
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Failed to submit procurement request to AI pipeline.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <PlusCircle className="w-6 h-6 text-cyan-400" />
          <span>New Construction Procurement Request</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Submit procurement requirements to trigger XGBoost risk scoring, RAG FAISS retrieval, Qwen LoRA analysis, and multi-agent synthesis.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Procurement Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Procurement Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="works">Works (Civil & Construction)</option>
              <option value="goods">Goods & Structural Materials</option>
              <option value="services">Technical Consultancy / Services</option>
            </select>
          </div>

          {/* Material / Service */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Material / Service Details
            </label>
            <input
              type="text"
              name="material_or_service"
              value={formData.material_or_service}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Quantity / Volume
            </label>
            <input
              type="text"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Estimated Budget (₹ INR) *
            </label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              required
              step="10000"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-cyan-400 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Required Date / Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Required Delivery Timeline
            </label>
            <input
              type="text"
              name="required_date"
              value={formData.required_date}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Project Location / Procuring Entity
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Supplier Requirements */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Supplier Qualifications & Reliability Criteria
            </label>
            <input
              type="text"
              name="supplier_requirements"
              value={formData.supplier_requirements}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Detailed Scope & Requirement Description
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm shadow-lg shadow-cyan-600/20 transition-all flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Running Agentic AI Pipeline...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit to AI Agent Pipeline</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
