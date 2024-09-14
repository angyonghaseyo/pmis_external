import axios from 'axios';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updateProfile,
  deleteUser as firebaseDeleteUser
} from '../firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const authAxios = axios.create({
  baseURL: API_URL,
});

authAxios.interceptors.request.use(async (config) => {
  const token = await auth.currentUser?.getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling helper
const handleApiError = (error) => {
  console.error('API Error:', error.response ? error.response.data : error.message);
  throw error;
};

// Authentication
export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password).catch(handleApiError);

export const registerUser = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await setDoc(doc(db, 'users', user.uid), { ...userData, uid: user.uid });
    return userCredential;
  } catch (error) {
    return handleApiError(error);
  }
};

export const logoutUser = () => auth.signOut().catch(handleApiError);

// User management
export const getCurrentUser = () => auth.currentUser;

export const updateUserProfile = async (userData) => {
  try {
    const user = auth.currentUser;
    await updateProfile(user, userData);
    await updateDoc(doc(db, 'users', user.uid), userData);
  } catch (error) {
    handleApiError(error);
  }
};

export const updateUserPassword = (newPassword) =>
  auth.currentUser.updatePassword(newPassword).catch(handleApiError);

// Password Reset
export const sendPasswordResetEmailToUser = (email) =>
  sendPasswordResetEmail(auth, email).catch(handleApiError);

export const confirmUserPasswordReset = (oobCode, newPassword) =>
  confirmPasswordReset(auth, oobCode, newPassword).catch(handleApiError);

// User Account Management
export const getUsers = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    const currentUserData = userDocSnap.data();

    if (!currentUserData || !currentUserData.company) {
      throw new Error('User company information not found');
    }

    const usersQuery = query(
      collection(db, 'users'),
      where('company', '==', currentUserData.company)
    );

    const querySnapshot = await getDocs(usersQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const docRef = await setDoc(doc(collection(db, 'users')), userData);
    return docRef.id;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateUser = async (userId, userData) => {
  try {
    await updateDoc(doc(db, 'users', userId), userData);
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteUserAccount = async () => {
  try {
    const user = auth.currentUser;
    await deleteDoc(doc(db, 'users', user.uid));
    await firebaseDeleteUser(user);
  } catch (error) {
    handleApiError(error);
  }
};

// New function for inviting users
export const inviteUser = async (userData) => {
  try {
    const invitationRef = await addDoc(collection(db, 'invitations'), {
      ...userData,
      createdAt: new Date(),
      status: 'pending'
    });
    return invitationRef.id;
  } catch (error) {
    handleApiError(error);
  }
};

// Dashboard data
export const getLeaveStatistics = () => authAxios.get('/leave-statistics').catch(handleApiError);

export const getTimeLog = () => authAxios.get('/time-log').catch(handleApiError);

export const getServiceOperations = () => authAxios.get('/service-operations').catch(handleApiError);

// Assets and Facilities
export const getAssets = () => authAxios.get('/assets').catch(handleApiError);

export const getFacilities = () => authAxios.get('/facilities').catch(handleApiError);

// Manpower
export const getEmployees = () => authAxios.get('/employees').catch(handleApiError);

export const updateEmployee = (employeeId, data) =>
  authAxios.put(`/employees/${employeeId}`, data).catch(handleApiError);

// Vessel Visits
export const getVesselVisits = () => authAxios.get('/vessel-visits').catch(handleApiError);

export const createVesselVisit = (visitData) =>
  authAxios.post('/vessel-visits', visitData).catch(handleApiError);

export const updateVesselVisit = (visitId, visitData) =>
  authAxios.put(`/vessel-visits/${visitId}`, visitData).catch(handleApiError);

// Port Operations
export const getPortOperations = () => authAxios.get('/port-operations').catch(handleApiError);

export const createPortOperation = (operationData) =>
  authAxios.post('/port-operations', operationData).catch(handleApiError);

// Cargos
export const getCargos = () => authAxios.get('/cargos').catch(handleApiError);

export const createCargo = (cargoData) => authAxios.post('/cargos', cargoData).catch(handleApiError);

export const updateCargo = (cargoId, cargoData) =>
  authAxios.put(`/cargos/${cargoId}`, cargoData).catch(handleApiError);

// Financial
export const getFinancialReports = () => authAxios.get('/financial-reports').catch(handleApiError);

export const createInvoice = (invoiceData) =>
  authAxios.post('/invoices', invoiceData).catch(handleApiError);

// Customs and Trade Documents
export const getCustomsDocuments = () => authAxios.get('/customs-documents').catch(handleApiError);

export const submitCustomsDocument = (documentData) =>
  authAxios.post('/customs-documents', documentData).catch(handleApiError);

// Settings
export const getUserSettings = () => authAxios.get('/user-settings').catch(handleApiError);

export const updateUserSettings = (settingsData) =>
  authAxios.put('/user-settings', settingsData).catch(handleApiError);

const api = {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  updateUserPassword,
  sendPasswordResetEmailToUser,
  confirmUserPasswordReset,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  deleteUserAccount,
  inviteUser,
  getLeaveStatistics,
  getTimeLog,
  getServiceOperations,
  getAssets,
  getFacilities,
  getEmployees,
  updateEmployee,
  getVesselVisits,
  createVesselVisit,
  updateVesselVisit,
  getPortOperations,
  createPortOperation,
  getCargos,
  createCargo,
  updateCargo,
  getFinancialReports,
  createInvoice,
  getCustomsDocuments,
  submitCustomsDocument,
  getUserSettings,
  updateUserSettings,
};

export default api;