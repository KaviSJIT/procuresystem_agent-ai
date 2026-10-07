import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { uploadDocument, analyzeDocumentText } from '../services/api';

const FindingSection = ({ title, items, color = 'gray' }) => {
  if (!items || items.length === 0) return null;
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  };
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className={`text-xs px-3 py-1.5 rounded border ${colors[color]}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export default function DocumentIntelligence() {
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected); setLoading(true); setError(null); setAnalysis(null);
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
    setLoading(true); setError(null); setAnalysis(null);
    try {
      const res = await analyzeDocumentText(textInput, 'pasted_contract.txt');
      setAnalysis(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Text analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const findings = analysis?.findings || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Document Intelligence</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Upload or paste procurement documents to extract compliance requirements, risk indicators, and contract clauses.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Upload Document</h3>
            <p className="text-xs text-gray-400 mt-0.5">PDF, DOCX, TXT, CSV (max 10MB)</p>
          </div>
          <label className="border-2 border-dashed border-gray-300 hover:border-[#1F4E79] bg-gray-50 rounded-md p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
            {loading && file ? (
              <Loader2 className="w-8 h-8 text-[#1F4E79] animate-spin mb-2" />
            ) : (
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
            )}
            <span className="text-sm font-medium text-gray-700">{file ? file.name : 'Click to browse or drag & drop'}</span>
            <span className="text-xs text-gray-400 mt-1">Supports PDF, DOCX, TXT, CSV</span>
            <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.docx,.txt,.csv" disabled={loading} />
          </label>
          <p className="text-xs text-gray-400 text-center">Processed by Document Intelligence Agent + RAG retrieval</p>
        </div>

        {/* Paste text */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm p-5 space-y-4 flex flex-col">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Paste Contract Text</h3>
            <p className="text-xs text-gray-400 mt-0.5">Directly analyze raw contract clauses or tender terms</p>
          </div>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste contract clauses, technical specifications, or tender terms here..."
            rows={6}
            className="flex-1 w-full bg-white border border-gray-300 rounded-md p-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1F4E79] transition-colors resize-none"
          />
          <button
            onClick={handleTextAnalyze}
            disabled={loading || !textInput.trim()}
            className="w-full py-2.5 bg-[#1F4E79] hover:bg-[#1a4268] disabled:opacity-50 text-white font-semibold text-sm rounded-md transition-colors flex items-center justify-center space-x-2"
          >
            {loading && !file ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Analyzing...</span></> : <span>Analyze Text</span>}
          </button>
        </div>
      </div>

      {/* Results */}
      {analysis && (
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-800">Document Analysis Report</h3>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              analysis.compliance_status === 'COMPLIANT' ? 'bg-green-50 text-green-700 border border-green-200' :
              analysis.compliance_status === 'ERROR' ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {analysis.compliance_status || analysis.summary?.processing_status || 'ANALYZED'}
            </span>
          </div>

          <div className="p-5 space-y-5">
            {/* Extraction info */}
            {analysis.extraction_error && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
                <strong>Extraction note:</strong> {analysis.extraction_error}
              </div>
            )}

            {/* Summary */}
            {analysis.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                {[
                  { label: 'Characters', value: analysis.summary.total_characters?.toLocaleString() },
                  { label: 'Words', value: analysis.summary.total_words?.toLocaleString() },
                  { label: 'Indicators Found', value: analysis.summary.findings_count ?? (analysis.findings ? Object.values(analysis.findings).flat().length : 0) },
                  { label: 'Missing Items', value: analysis.summary.missing_count ?? (analysis.missing_information?.length || 0) },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <p className="text-lg font-bold text-gray-900">{s.value ?? '—'}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Findings grid */}
            {Object.keys(findings).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FindingSection title="Eligibility Requirements" items={findings.eligibility} color="blue" />
                <FindingSection title="Financial Requirements" items={findings.financial} color="green" />
                <FindingSection title="Technical Requirements" items={findings.technical} color="blue" />
                <FindingSection title="Compliance Requirements" items={findings.compliance} color="gray" />
                <FindingSection title="Risk Indicators" items={findings.risk_indicators} color="red" />
                <FindingSection title="Key Clauses" items={findings.key_clauses} color="gray" />
                <FindingSection title="Penalties" items={findings.penalties} color="amber" />
                <FindingSection title="Delivery Conditions" items={findings.delivery_conditions} color="gray" />
                <FindingSection title="Termination Conditions" items={findings.termination_conditions} color="red" />
              </div>
            )}

            {/* Missing items */}
            {analysis.missing_information?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 space-y-2">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Missing / Not Detected</p>
                <ul className="space-y-1">
                  {analysis.missing_information.map((item, i) => (
                    <li key={i} className="text-xs text-amber-700 flex items-start space-x-1.5">
                      <span className="mt-0.5">⚠</span><span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* RAG Evidence */}
            {analysis.rag_evidence?.results?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Similar Historical Tenders (RAG Evidence)</p>
                <div className="space-y-2">
                  {analysis.rag_evidence.results.slice(0, 3).map((doc, i) => (
                    <div key={i} className="border border-gray-200 rounded-md p-3 text-xs bg-gray-50">
                      <div className="flex justify-between font-medium text-gray-800 mb-1">
                        <span className="truncate max-w-[70%]">{doc.metadata?.tender_title || `Document #${doc.doc_id}`}</span>
                        <span className="font-mono text-gray-500 shrink-0 ml-2">Score: {doc.score}</span>
                      </div>
                      <p className="text-gray-500 line-clamp-2">{doc.document}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
