// ============================================================
// api.js — Axios API Client
// ============================================================
// Central place for all backend API calls.
// Automatically attaches JWT token to every request.
// Redirects to /login on 401 (token expired).
// ============================================================
import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({
  baseURL: rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`,
  timeout: 30000,    // 30s timeout (parsing large files can take time)
});

// ── Request Interceptor: attach JWT ──────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor: handle 401 globally ────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Ignore 401s from the login endpoint so the local error message can display
      if (!error.config.url.includes('/auth/login')) {
        // Token expired or invalid — clear storage and go to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth Endpoints ────────────────────────────────────────────
export const authAPI = {
  register: (data)  => api.post('/auth/register', data),
  login:    (data)  => api.post('/auth/login', data),
  me:       ()      => api.get('/auth/me'),
  logout:   ()      => api.post('/auth/logout'),
};

// ── Session Endpoints ─────────────────────────────────────────
export const sessionAPI = {
  create:    (formData) => api.post('/sessions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,  // 2 min timeout for large file uploads
  }),
  list:      ()         => api.get('/sessions'),
  get:       (id)       => api.get(`/sessions/${id}`),
  delete:    (id)       => api.delete(`/sessions/${id}`),
};

// ── Analytics Endpoints ───────────────────────────────────────
export const analyticsAPI = {
  overview:      (id)              => api.get(`/sessions/${id}/analytics/overview`),
  participants:  (id)              => api.get(`/sessions/${id}/analytics/participants`),
  timeline:      (id, granularity) => api.get(`/sessions/${id}/analytics/timeline`, { params: { granularity } }),
  peakHours:     (id)              => api.get(`/sessions/${id}/analytics/peak-hours`),
  wordFrequency: (id, limit = 20)  => api.get(`/sessions/${id}/analytics/word-frequency`, { params: { limit } }),
  emojiFrequency:(id)              => api.get(`/sessions/${id}/analytics/emoji-frequency`),
  mediaLinks:    (id)              => api.get(`/sessions/${id}/analytics/media-links`),
  responseTime:  (id)              => api.get(`/sessions/${id}/analytics/response-time`),
};

// ── Chat Endpoints ────────────────────────────────────────────
export const chatAPI = {
  ask:           (id, question, password = null) => api.post(`/sessions/${id}/chat`, { question, password }, { timeout: 120000 }),
  getHistory:    (id)           => api.get(`/sessions/${id}/chat/history`),
  clearHistory:  (id)           => api.delete(`/sessions/${id}/chat/history`),
};

// ── User Endpoints ────────────────────────────────────────────
export const userAPI = {
  changePassword: (data) => api.put('/users/password', data),
  updateSettings: (data) => api.put('/users/settings', data),
  deleteAccount:  (data) => api.delete('/users/me', { data }),
};

export default api;
