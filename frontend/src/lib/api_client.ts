import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const BASE_URL = `${API_BASE}/api`;

const api = axios.create({
  baseURL: BASE_URL,
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Campaign APIs ────────────────────────────────────────────────────────────

export const campaignApi = {
  list: () => api.get('/campaigns'),
  get: (id: string) => api.get(`/campaigns/${id}`),
  create: (data: { title: string; status?: string; deadline?: string }) =>
    api.post('/campaigns', data),
  getRubric: (id: string) => api.get(`/campaigns/${id}/rubric`),
  updateRubric: (id: string, rubric: Record<string, unknown>) =>
    api.put(`/campaigns/${id}/rubric`, rubric),

  /** Upload JD file → AI returns rubric JSON */
  extractRubric: (campaignId: string, file: File) => {
    const form = new FormData();
    form.append('campaign_id', campaignId);
    form.append('file', file);
    return api.post('/campaigns/ai-core/jd/extract-rubric', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ── Candidate APIs ───────────────────────────────────────────────────────────

export const candidateApi = {
  /** Upload JD file → AI returns rubric JSON */
  analyzeJd: (campaignId: string, file: File) => {
    const form = new FormData();
    form.append('campaign_id', campaignId);
    form.append('file', file);
    return api.post('/campaigns/ai-core/jd/extract-rubric', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Upload ZIP → batch evaluate all CVs */
  batchEvaluate: (campaignId: string, zipFile: File) => {
    const form = new FormData();
    form.append('file', zipFile);
    return api.post(`/campaigns/${campaignId}/batch-evaluate`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Upload single CV file */
  applyFile: (campaignId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/public/jobs/${campaignId}/apply-file`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** List candidates in campaign */
  list: (campaignId: string) => api.get(`/campaigns/${campaignId}/candidates`),

  /** Trigger scoring for single candidate */
  score: (campaignId: string, candidateId: string) =>
    api.post(`/campaigns/${campaignId}/candidates/score`, { candidate_id: candidateId }),

  /** Trigger scoring for bulk candidates */
  bulkScore: (campaignId: string, candidateIds?: string[]) =>
    api.post(`/campaigns/${campaignId}/candidates/bulk-score`, { candidate_ids: candidateIds }),

  /** Get final review with score breakdown */
  finalReview: (candidateId: string) => api.get(`/candidates/${candidateId}/final-review`),

  /** Leaderboard for a campaign */
  leaderboard: (campaignId: string, params?: { status?: string; min_score?: number }) =>
    api.get(`/campaigns/${campaignId}/leaderboard`, { params }),
};

// ── WebSocket helper ─────────────────────────────────────────────────────────

export const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  .replace(/^http/, 'ws')
  .replace('/api', '');

export function createInterviewSocket(): WebSocket {
  return new WebSocket(`${WS_BASE}/api/interview/live`);
}

export default api;
