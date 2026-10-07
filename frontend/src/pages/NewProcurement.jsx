import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, Send } from 'lucide-react';
import { createProcurement } from '../services/api';

const inputClass = "w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1F4E79] focus:ring-1 focus:ring-[#1F4E79] transition-colors";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export default function NewProcurement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: 'Construction Steel Procurement',
    category: 'works',
    material_or_service: '100 tons Structural Steel',
    quantity: '100 tons',
    budget: 5000000,
    required_date: '30 days',
    location: 'Chennai',
    supplier_requirements: 'Find reliable suppliers with low procurement and delivery risk.',
    description: 'Procurement of 100 tons high-grade structural construction steel for HP PWD building project.',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'budget' ? (parseFloat(value) || 0) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const result = await createProcurement(formData);
      setLoading(false);
      navigate('/analysis', { state: { result } });
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Failed to submit procurement request.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Create Procurement Request</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Submit procurement requirements for AI-assisted risk assessment and multi-agent analysis.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Procurement Details */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3">Procurement Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className={labelClass}>Procurement Title <span className="text-red-500">*</span></label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Category <span className="text-red-500">*</span></label>
              <select name="category" value={formData.category} onChange={handleChange} className={inputClass}>
                <option value="works">Works (Civil & Construction)</option>
                <option value="goods">Goods & Structural Materials</option>
                <option value="services">Technical Consultancy / Services</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Material / Service</label>
              <input type="text" name="material_or_service" value={formData.material_or_service} onChange={handleChange} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3">Financial Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Estimated Budget (₹ INR) <span className="text-red-500">*</span></label>
              <input type="number" name="budget" value={formData.budget} onChange={handleChange} required step="10000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Quantity / Volume</label>
              <input type="text" name="quantity" value={formData.quantity} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Delivery Requirements */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3">Delivery Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Required Timeline</label>
              <input type="text" name="required_date" value={formData.required_date} onChange={handleChange} className={inputClass} placeholder="e.g. 30 days" />
            </div>
            <div>
              <label className={labelClass}>Project Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Supplier Requirements */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3">Supplier Requirements</h2>
          <div>
            <label className={labelClass}>Required Supplier Criteria</label>
            <input type="text" name="supplier_requirements" value={formData.supplier_requirements} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-md bg-[#1F4E79] hover:bg-[#1a4268] disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>Processing...</span></>
            ) : (
              <><Send className="w-4 h-4" /><span>Submit Procurement Request</span></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
