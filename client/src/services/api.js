import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/admin/login', credentials),
  create: (adminData) => api.post('/admin/create', adminData),
  verify: () => api.get('/admin/verify'),
};

// Candidates API
export const candidatesAPI = {
  getAll: (params) => api.get('/candidates', { params }),
  getById: (id) => api.get(`/candidates/${id}`),
  getQRCode: (id) => api.get(`/candidates/${id}/qr-code`),
  getQRImage: (id) => api.get(`/candidates/${id}/qr-image`),
  generateQRCode: (id) => api.post(`/candidates/${id}/generate-qr`),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('excelFile', file);
    return api.post('/candidates/import-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, data) => api.put(`/candidates/${id}`, data),
  delete: (id) => api.delete(`/candidates/${id}`),
  clearAll: () => api.delete('/candidates/clear-all'),
};

// Attendance API
export const attendanceAPI = {
  scan: (qrCode) => api.post('/attendance/scan', { qrCode }),
  getAll: (params) => api.get('/attendance', { params }),
  getStats: (params) => api.get('/attendance/stats', { params }),
  getByCandidate: (id) => api.get(`/attendance/candidate/${id}`),
  update: (id, data) => api.put(`/attendance/${id}`, data),
};

// Squads API
export const squadsAPI = {
  getAll: () => api.get('/squads'),
  getById: (id) => api.get(`/squads/${id}`),
  create: (data) => api.post('/squads', data),
  createWithAI: (data) => api.post('/squads/create-with-ai', data),
  update: (id, data) => api.put(`/squads/${id}`, data),
  delete: (id) => api.delete(`/squads/${id}`),
  getAvailableCandidates: () => api.get('/squads/available-candidates'),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getRecentActivity: () => api.get('/admin/recent-activity'),
  getUniversityStats: () => api.get('/admin/university-stats'),
  getAttendanceTrends: (params) => api.get('/admin/attendance-trends', { params }),
};

// Reports API
export const reportsAPI = {
  getComprehensive: () => api.get('/reports/comprehensive'),
  downloadExcel: () => api.get('/reports/download-excel', { responseType: 'blob' }),
  getAttendance: (params) => api.get('/reports/attendance', { params }),
  getSquadPerformance: () => api.get('/reports/squad-performance'),

};

// Utility functions
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default api; 