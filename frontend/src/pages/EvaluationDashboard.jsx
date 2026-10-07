import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { getEvaluationMetrics } from '../services/api';

const MetricCard = ({ label, value, sub }) => (
  <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
    <p className="text-xs text-gray-500 font-medium">{label}</p>
    <p className={`text-lg font-bold mt-1 ${typeof value === 'string' && value.toLowerCase().includes('not') ? 'text-gray-400' : 'text-gray-900'}`}>
      {value ?? '—'}
    </p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const SectionHeader = ({ title, sub }) => (
  <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
    <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const InfoBox = ({ text, color = 'blue' }) => {
  const styles = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  };
  return (
    <div className={`flex items-start space-x-2 border rounded-md p-3 text-xs ${styles[color]}`}>
      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>{text}</span>
    </div>
  );
};

export default function EvaluationDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMetrics(); }, []);

  const loadMetrics = async () => {
    try { setMetrics(await getEvaluationMetrics()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="text-sm text-gray-400 text-center py-16">Loading evaluation metrics...</div>;

  const xgb = metrics?.xgboost_metrics || {};
  const rf = metrics?.random_forest_metrics || {};
  const rag = metrics?.rag_metrics || {};
  const comp = metrics?.workflow_comparison || {};
  const kaggle = metrics?.kaggle_test_summary || {};

  const xgbTrain = xgb.training_metrics || {};
  const xgbEval = xgb.evaluation || {};
  const rfTrain = rf.training_metrics || {};
  const rfEval = rf.evaluation || {};

  const cycleData = [
    { name: 'Conventional', days: comp.conventional?.avg_cycle_time_days ?? 14 },
    { name: 'Rule-Based', days: comp.rule_based?.avg_cycle_time_days ?? 5 },
    { name: 'Agentic AI', days: comp.agentic_ai?.avg_cycle_time_days ?? 0.5 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Evaluation Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Research framework evaluation — actual model artifacts and dataset metrics.</p>
      </div>

      {/* XGBoost */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <SectionHeader title="XGBoost Model Evaluation" sub={`File: ${xgb.model_file} · Type: ${xgb.model_type}`} />
        <div className="p-5 space-y-4">
          <div className="flex items-center space-x-2 text-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${xgb.model_loaded ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="font-medium text-gray-700">{xgb.model_loaded ? 'Model loaded successfully' : 'Model not loaded'}</span>
            <span className="text-gray-400">· {xgb.features_count} features · Target: {xgb.target}</span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Training-Reported Metrics</p>
            <InfoBox text={xgbTrain.note || 'Metrics from Kaggle training notebook.'} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard label="R² Score" value={xgbTrain.r2_score ?? 'N/A'} sub="Coefficient of determination" />
              <MetricCard label="MAE" value={xgbTrain.mae ?? 'N/A'} sub="Mean Absolute Error" />
              <MetricCard label="RMSE" value={xgbTrain.rmse ?? 'N/A'} sub="Root Mean Squared Error" />
              <MetricCard label="MAPE" value={xgbTrain.mape_pct ? `${xgbTrain.mape_pct}%` : 'N/A'} sub="Mean Abs. Percentage Error" />
            </div>
          </div>

          {xgbEval.status === 'computed' && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Proxy Evaluation</p>
              <InfoBox text={xgbEval.note} color="blue" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard label="Records Tested" value={xgbEval.proxy_test_records} />
                <MetricCard label="High Award (>1.15x)" value={xgbEval.predicted_high_risk} />
                <MetricCard label="Normal Award (≤1.15x)" value={xgbEval.predicted_low_risk} />
                <MetricCard label="High Award Rate" value={`${xgbEval.high_risk_rate_pct}%`} />
              </div>
              <p className="text-xs text-gray-400">Avg award multiplier: <span className="font-mono text-gray-600">{xgbEval.avg_award_multiplier}x</span></p>
            </div>
          )}
          {xgbEval.status === 'unavailable' && (
            <InfoBox text={`Live evaluation unavailable: ${xgbEval.reason}`} color="amber" />
          )}
        </div>
      </div>

      {/* Random Forest */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <SectionHeader title="Random Forest Risk Model Evaluation" sub={`File: ${rf.model_file} · Type: ${rf.model_type}`} />
        <div className="p-5 space-y-4">
          <div className="flex items-center space-x-2 text-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${rf.model_loaded ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="font-medium text-gray-700">{rf.model_loaded ? 'Model loaded successfully' : 'Model not loaded'}</span>
            <span className="text-gray-400">· {rf.features_count} features · Classes: {(rf.risk_classes || []).join(', ')}</span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Training-Reported Metrics</p>
            <InfoBox text={rfTrain.note || 'Metrics from Kaggle training notebook.'} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard label="Accuracy" value={rfTrain.accuracy ?? 'N/A'} />
              <MetricCard label="Precision (Macro)" value={rfTrain.precision_macro ?? 'N/A'} />
              <MetricCard label="Recall (Macro)" value={rfTrain.recall_macro ?? 'N/A'} />
              <MetricCard label="F1 Score (Macro)" value={rfTrain.f1_macro ?? 'N/A'} />
            </div>
          </div>

          {rfEval.status === 'computed' && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Proxy Evaluation</p>
              <InfoBox text={rfEval.note} color="blue" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard label="Records Tested" value={rfEval.proxy_test_records} />
                <MetricCard label="LOW Risk" value={rfEval.risk_distribution?.LOW ?? 0} />
                <MetricCard label="MEDIUM Risk" value={rfEval.risk_distribution?.MEDIUM ?? 0} />
                <MetricCard label="HIGH Risk" value={rfEval.risk_distribution?.HIGH ?? 0} />
              </div>
              <p className="text-xs text-gray-400">Avg confidence: <span className="font-mono text-gray-600">{rfEval.avg_confidence_pct}%</span></p>
            </div>
          )}
          {rfEval.status === 'unavailable' && (
            <InfoBox text={`Live evaluation unavailable: ${rfEval.reason}`} color="amber" />
          )}
        </div>
      </div>

      {/* RAG */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <SectionHeader title="RAG / FAISS Knowledge Base" />
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Documents Indexed" value={rag.total_documents?.toLocaleString()} />
            <MetricCard label="FAISS Vectors" value={rag.total_vectors?.toLocaleString()} />
            <MetricCard label="Embedding Dimension" value={rag.embedding_dimension} />
            <MetricCard label="Index Type" value={rag.index_type} />
          </div>
          <p className="text-xs text-gray-400">Embedding model: <span className="font-mono">{rag.embedding_model}</span> · Source: {rag.source_dataset}</p>
        </div>
      </div>

      {/* Kaggle Test Summary */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <SectionHeader title="Kaggle Pipeline Test Summary" sub="Results from official final test run on 10 HP tender records." />
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Tenders Tested" value={kaggle.total_tenders_tested} />
            <MetricCard label="Avg Risk Confidence" value={`${kaggle.average_risk_confidence_pct}%`} />
            <MetricCard label="Avg Compliance Evidence" value={`${kaggle.average_compliance_evidence_pct}%`} />
            <MetricCard label="Avg Processing Time" value={`${kaggle.average_processing_time_sec}s`} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Risk Distribution</p>
              <div className="flex gap-2">
                {Object.entries(kaggle.risk_distribution || {}).map(([k, v]) => (
                  <span key={k} className="text-xs px-2.5 py-1 rounded-full border font-medium bg-gray-50 text-gray-700 border-gray-200">{k}: {v}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Decision Distribution</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(kaggle.decision_distribution || {}).map(([k, v]) => (
                  <span key={k} className="text-xs px-2.5 py-1 rounded-full border font-medium bg-gray-50 text-gray-700 border-gray-200">{k}: {v}</span>
                ))}
              </div>
            </div>
          </div>
          {kaggle.disclaimer && <InfoBox text={kaggle.disclaimer} color="amber" />}
        </div>
      </div>

      {/* Workflow Comparison */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Procurement Cycle Time Comparison</h3>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
            Illustrative / Demo Data
          </span>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-400">{comp.note}</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cycleData} barSize={50}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} unit=" d" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#E5E7EB', borderRadius: '6px', fontSize: '12px' }} formatter={(v) => [`${v} days`]} />
                <Bar dataKey="days" radius={[4, 4, 0, 0]}>
                  <Cell fill="#94A3B8" />
                  <Cell fill="#3B82F6" />
                  <Cell fill="#1F4E79" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Framework', 'Cycle Time', 'Automation', 'Human Intervention', 'Risk Detection', 'Traceability'].map(h => (
                    <th key={h} className="px-4 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[comp.conventional, comp.rule_based, comp.agentic_ai].filter(Boolean).map((row, i) => (
                  <tr key={i} className={`hover:bg-gray-50 ${i === 2 ? 'font-medium' : ''}`}>
                    <td className="px-4 py-3 text-gray-800">{row.name}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{row.avg_cycle_time_days} days</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{row.automation_rate_pct}%</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{row.human_intervention_pct}%</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{row.risk_detection}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{row.traceability}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
