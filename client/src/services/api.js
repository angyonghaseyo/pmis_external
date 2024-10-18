import axios from 'axios';
import { auth } from '../firebaseConfig';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the authentication token to every request
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

// Authentication
export const loginUser = (email, password) =>
  auth.signInWithEmailAndPassword(email, password);

export const registerUser = (email, password, userData) =>
  auth.createUserWithEmailAndPassword(email, password)
    .then((result) => api.post('/auth/register', { ...userData, uid: result.user.uid }));

export const logoutUser = () => auth.signOut();

export const sendPasswordResetEmail = (email) =>
  auth.sendPasswordResetEmail(email);

export const confirmPasswordReset = (code, newPassword) =>
  auth.confirmPasswordReset(code, newPassword);

// User management
export const getCurrentUser = () => auth.currentUser;

export const updateUserProfile = (userData) =>
  api.put('/users/profile', userData);

export const getUserProfile = () =>
  api.get('/users/profile');

export const getUsers = () =>
  api.get('/users');

export const createUser = (userData) =>
  api.post('/users', userData);

export const updateUser = (id, userData) =>
  api.put(`/users/${id}`, userData);

export const deleteUser = (id) =>
  api.delete(`/users/${id}`);

// Inquiry and Feedback
export const getInquiriesFeedback = () =>
  api.get('/inquiry-feedback');

export const createInquiryFeedback = (data) =>
  api.post('/inquiry-feedback', data);

export const updateInquiryFeedback = (id, data) =>
  api.put(`/inquiry-feedback/${id}`, data);

export const deleteInquiryFeedback = (id) =>
  api.delete(`/inquiry-feedback/${id}`);

// Operator Requisition
export const getOperatorRequisitions = () =>
  api.get('/operator-requisition');

export const createOperatorRequisition = (data) =>
  api.post('/operator-requisition', data);

export const updateOperatorRequisition = (id, data) =>
  api.put(`/operator-requisition/${id}`, data);

export const deleteOperatorRequisition = (id) =>
  api.delete(`/operator-requisition/${id}`);

// Training Program
export const getTrainingPrograms = () =>
  api.get('/training-program');

export const enrollInTrainingProgram = (programId) =>
  api.post(`/training-program/enroll/${programId}`);

// Cargo Manifest
export const getCargoManifests = () =>
  api.get('/cargo-manifest');

export const createCargoManifest = (data) =>
  api.post('/cargo-manifest', data);

export const updateCargoManifest = (id, data) =>
  api.put(`/cargo-manifest/${id}`, data);

export const deleteCargoManifest = (id) =>
  api.delete(`/cargo-manifest/${id}`);

// Vessel Visit
export const getVesselVisits = () =>
  api.get('/vessel-visit');

export const createVesselVisit = (data) =>
  api.post('/vessel-visit', data);

export const updateVesselVisit = (id, data) =>
  api.put(`/vessel-visit/${id}`, data);

export const deleteVesselVisit = (id) =>
  api.delete(`/vessel-visit/${id}`);

// Company
export const getCompanyInfo = () =>
  api.get('/company');

export const updateCompanyInfo = (data) =>
  api.put('/company', data);

// User Dashboard
export const getUserDashboardData = () =>
  api.get('/user/dashboard');

export default api;