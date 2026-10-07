import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

export const getSystemModels = async () => {
  const res = await api.get(`${API_BASE}/system/models`);
  return res.data;
};

export const createProcurement = async (payload) => {
  const res = await api.post(`${API_BASE}/procurement`, payload);
  return res.data;
};

export const getProcurements = async () => {
  const res = await api.get(`${API_BASE}/procurement`);
  return res.data;
};

export const getProcurementById = async (id) => {
  const res = await api.get(`${API_BASE}/procurement/${id}`);
  return res.data;
};

export const searchRAG = async (query, topK = 5) => {
  const res = await api.post(`${API_BASE}/procurement/search`, { query, top_k: topK });
  return res.data;
};

export const getSuppliers = async (params = {}) => {
  const res = await api.get(`${API_BASE}/suppliers`, { params });
  return res.data;
};

export const analyzeSupplier = async (payload) => {
  const res = await api.post(`${API_BASE}/suppliers/analyze`, payload);
  return res.data;
};

export const getApprovals = async (status = '') => {
  const res = await api.get(`${API_BASE}/approvals`, { params: status ? { status } : {} });
  return res.data;
};

export const getApprovalById = async (id) => {
  const res = await api.get(`${API_BASE}/approvals/${id}`);
  return res.data;
};

export const approveRequest = async (id, reviewedBy, comments) => {
  const res = await api.post(`${API_BASE}/approvals/${id}/approve`, {
    reviewed_by: reviewedBy || 'Procurement Officer',
    comments: comments || 'Approved after multi-agent AI verification'
  });
  return res.data;
};

export const rejectRequest = async (id, reviewedBy, comments) => {
  const res = await api.post(`${API_BASE}/approvals/${id}/reject`, {
    reviewed_by: reviewedBy || 'Procurement Officer',
    comments: comments || 'Returned for review'
  });
  return res.data;
};

export const sendForReview = async (id, reviewedBy, comments) => {
  const res = await api.post(`${API_BASE}/approvals/${id}/review`, {
    reviewed_by: reviewedBy || 'Procurement Officer',
    comments: comments || 'Sent for further review'
  });
  return res.data;
};

export const uploadDocument = async (formData) => {
  const res = await api.post(`${API_BASE}/documents/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const analyzeDocumentText = async (text, filename) => {
  const res = await api.post(`${API_BASE}/documents/analyze`, { text, filename });
  return res.data;
};

export const getAuditTrail = async (requestId = '') => {
  const res = await api.get(`${API_BASE}/audit`, { params: requestId ? { request_id: requestId } : {} });
  return res.data;
};

export const getEvaluationMetrics = async () => {
  const res = await api.get(`${API_BASE}/evaluation/metrics`);
  return res.data;
};

export default api;
