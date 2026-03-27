import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  analyze: (id) => api.post(`/transactions/analyze/${id}`),
};

export const entitiesAPI = {
  getAll: (params) => api.get('/entities', { params }),
  getById: (id) => api.get(`/entities/${id}`),
  getRelationships: (id) => api.get(`/entities/${id}/relationships`),
  getNetworkGraph: () => api.get('/entities/network/graph'),
};

export const casesAPI = {
  getAll: (params) => api.get('/cases', { params }),
  create: (data) => api.post('/cases', data),
  update: (id, data) => api.patch(`/cases/${id}`, data),
};

export const ltkmAPI = {
  getReports: () => api.get('/ltkm/reports'),
  generate: (entityId) => api.post(`/ltkm/generate/${entityId}`),
  downloadPDF: (reportId) => 
    api.get(`/ltkm/reports/${reportId}/pdf`, { responseType: 'blob' }),
};

export const alertsAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  acknowledge: (id) => api.patch(`/alerts/${id}/acknowledge`),
};

export const watchlistAPI = {
  getAll: () => api.get('/watchlist'),
  screen: (entityId) => api.post(`/watchlist/screen/${entityId}`),
};

export const intelligenceAPI = {
  getThreats: () => api.get('/intelligence/threats'),
};

export const auditAPI = {
  getLogs: (params) => api.get('/audit/logs', { params }),
};

export const adminAPI = {
  initData: () => api.post('/admin/init-data'),
  getUsers: () => api.get('/users'),
};

export default api;
