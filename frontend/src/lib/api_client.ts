import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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
  list: () => api.get('/campaigns/'),
  get: (id: string) => api.get(`/campaigns/${id}`),
  create: (data: { title: string; status?: string; deadline?: string }) =>
    api.post('/campaigns/', data),
  updateRubric: (id: string, rubric: Record<string, unknown>) =>
    api.put(`/campaigns/${id}/rubric`, rubric),

  /** Upload JD file → AI returns rubric JSON */
  extractRubric: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/campaigns/ai-core/jd/extract-rubric', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ── Candidate APIs ───────────────────────────────────────────────────────────

export const candidateApi = {
  /** Upload ZIP → batch evaluate all CVs */
  batchEvaluate: (campaignId: string, zipFile: File) => {
    const form = new FormData();
    form.append('file', zipFile);
    return api.post(`/campaigns/${campaignId}/batch-evaluate`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Leaderboard for a campaign */
  leaderboard: (campaignId: string, params?: { status?: string; min_score?: number }) =>
    api.get(`/campaigns/${campaignId}/leaderboard`, { params }),
};

// ── WebSocket helper ─────────────────────────────────────────────────────────

export const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  .replace(/^http/, 'ws')
  .replace('/api/v1', '');

export function createInterviewSocket(): WebSocket {
  return new WebSocket(`${WS_BASE}/api/v1/interview/live`);
}

export default api;
