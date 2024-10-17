import axios from 'axios';
import { auth } from '../firebaseConfig';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add the auth token
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercept responses to handle token expiration
api.interceptors.response.use((response) => {
  return response;
}, async (error) => {
  const originalRequest = error.config;
  if (error.response.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return api(originalRequest);
    }
  }
  return Promise.reject(error);
});

const handleError = (error) => {
  console.error('API Error:', error.response ? error.response.data : error.message);
  throw error;
};

// Auth APIs
export const loginUser = (email, password) => api.post('/auth/login', { email, password }).catch(handleError);
export const registerUser = (userData) => api.post('/auth/register', userData).catch(handleError);
export const logoutUser = () => api.post('/auth/logout').catch(handleError);
export const requestPasswordReset = (email) => api.post('/auth/reset-password', { email }).catch(handleError);
export const confirmPasswordReset = (oobCode, newPassword) => api.post('/auth/confirm-reset', { oobCode, newPassword }).catch(handleError);

// User APIs
export const getCurrentUser = () => api.get('/users/me').catch(handleError);
export const updateUserProfile = (userData) => api.put('/users/profile', userData).catch(handleError);
export const updateUserPassword = (currentPassword, newPassword) => api.put('/users/password', { currentPassword, newPassword }).catch(handleError);

// Company Info APIs
export const getCompanyInfo = () => api.get('/company-info').catch(handleError);
export const updateCompanyInfo = (companyData) => api.put('/company-info', companyData).catch(handleError);
export const uploadCompanyLogo = (file) => {
  const formData = new FormData();
  formData.append('logo', file);
  return api.post('/company-info/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).catch(handleError);
};

// Inquiry & Feedback APIs
export const getInquiriesFeedback = () => api.get('/inquiries-feedback').catch(handleError);
export const createInquiryFeedback = (data) => api.post('/inquiries-feedback', data).catch(handleError);
export const updateInquiryFeedback = (id, data) => api.put(`/inquiries-feedback/${id}`, data).catch(handleError);
export const deleteInquiryFeedback = (id) => api.delete(`/inquiries-feedback/${id}`).catch(handleError);

// Operator Requisition APIs
export const getOperatorRequisitions = () => api.get('/operator-requisitions').catch(handleError);
export const createOperatorRequisition = (data) => api.post('/operator-requisitions', data).catch(handleError);
export const updateOperatorRequisition = (id, data) => api.put(`/operator-requisitions/${id}`, data).catch(handleError);
export const deleteOperatorRequisition = (id) => api.delete(`/operator-requisitions/${id}`).catch(handleError);

// Training Program APIs
export const getTrainingPrograms = () => api.get('/training-programs').catch(handleError);
export const registerForProgram = (programId) => api.post(`/training-programs/${programId}/register`).catch(handleError);
export const withdrawFromProgram = (programId) => api.post(`/training-programs/${programId}/withdraw`).catch(handleError);

// Vessel Visit APIs
export const getVesselVisits = () => api.get('/vessel-visits').catch(handleError);
export const createVesselVisit = (data) => api.post('/vessel-visits', data).catch(handleError);
export const updateVesselVisit = (id, data) => api.put(`/vessel-visits/${id}`, data).catch(handleError);
export const deleteVesselVisit = (id) => api.delete(`/vessel-visits/${id}`).catch(handleError);

// Cargo Manifest APIs
export const getCargoManifests = () => api.get('/cargo-manifests').catch(handleError);
export const createCargoManifest = (data) => api.post('/cargo-manifests', data).catch(handleError);
export const updateCargoManifest = (id, data) => api.put(`/cargo-manifests/${id}`, data).catch(handleError);
export const deleteCargoManifest = (id) => api.delete(`/cargo-manifests/${id}`).catch(handleError);
export const submitCargoManifest = (id) => api.post(`/cargo-manifests/${id}/submit`).catch(handleError);

// File Upload API
export const uploadFile = (file, path) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', path);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).catch(handleError);
};

export default api;