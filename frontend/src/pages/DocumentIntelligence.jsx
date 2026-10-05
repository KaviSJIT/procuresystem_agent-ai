import React, { useState } from 'react';
import { FileText, Upload, AlertCircle, CheckCircle2, FileCheck } from 'lucide-react';
import { uploadDocument, analyzeDocumentText } from '../services/api';

export default function DocumentIntelligence() {
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selected);

    try {
      const res = await uploadDocument(formData);
      setAnalysis(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Document processing failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextAnalyze = async () => {
    if (!textInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeDocumentText(textInput, 'pasted_contract.txt');
      setAnalysis(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Text analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <FileText className="w-6 h-6 text-cyan-400" />
          <span>Document Intelligence & Contract Compliance</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload PDF, DOCX, TXT, or CSV procurement files to extract key contract clauses, risk indicators, missing documentation, and compliance issues.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white">Option 1: Upload File</h3>
            <p className="text-xs text-slate-400">Select contract document or tender specification file</p>
          </div>

          <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 bg-slate-800/40 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
            <Upload className="w-8 h-8 text-cyan-400 mb-2" />
            <span className="text-sm font-semibold text-slate-200">
              {file ? file.name : 'Click to Browse File'}
            </span>
            <span className="text-xs text-slate-500 mt-1">Supports PDF, DOCX, TXT, CSV (Max 10MB)</span>
            <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.docx,.txt,.csv" />
          </label>

          <p className="text-[11px] text-slate-500 text-center">Auto-processed by Document Intelligence Agent</p>
        </div>

        {/* Text Area Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white">Option 2: Paste Contract Text</h3>
            <p className="text-xs text-slate-400">Directly analyze raw text of clauses or tender terms</p>
          </div>

          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste contract clauses, technical specifications, or tender terms here..."
            rows={5}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />

          <button
            onClick={handleTextAnalyze}
            disabled={loading || !textInput.trim()}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-all shadow"
          >
            {loading ? 'Analyzing Document Text...' : 'Analyze Pasted Contract Text'}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysis && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-cyan-400" />
              <span>Document Extraction & Compliance Report</span>
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
              {analysis.compliance_status || 'ANALYZED'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Missing Info / Compliance */}
            <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
              <p className="font-semibold text-amber-400 uppercase tracking-wider">Missing Required Attachments & Compliance Issues</p>
              {(analysis.missing_information || analysis.compliance_issues || []).length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {(analysis.missing_information || analysis.compliance_issues || []).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-emerald-400">✓ All mandatory compliance certificates and clauses detected.</p>
              )}
            </div>

            {/* Document Summary */}
            <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
              <p className="font-semibold text-cyan-400 uppercase tracking-wider">Analysis Summary</p>
              <p className="text-slate-300 leading-relaxed">
                {typeof analysis.summary === 'string' ? analysis.summary : JSON.stringify(analysis.summary)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
