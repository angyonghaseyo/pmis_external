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
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  increment,
  arrayUnion,
  Timestamp,
  arrayRemove,
  runTransaction,
  orderBy
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

import { db } from '../firebaseConfig';

const storage = getStorage();

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

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

    // Update or create company document
    const companyRef = doc(db, 'companies', userData.company);
    const companyDoc = await getDoc(companyRef);
    if (companyDoc.exists()) {
      await updateDoc(companyRef, { userCount: increment(1) });
    } else {
      await setDoc(companyRef, { name: userData.company, userCount: 1 });
    }

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

export const getUsers = async (userId) => {
  try {

    const response = await fetch(`http://localhost:5001/users?email=${userId}`);
    if (!response.ok) {
      throw new Error('Error fetching users');
    }
    const users = await response.json();
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};


export const getAllUsersInCompany = async (userId) => {
  try {
    const response = await fetch(`http://localhost:5001/all-users-in-company?email=${userId}`);
    if (!response.ok) {
      throw new Error('Error fetching users in company');
    }
    const users = await response.json();
    return users;
  } catch (error) {
    console.error('Error fetching users in company:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const docRef = await addDoc(collection(db, 'users'), { ...userData, userType: 'Normal' });
    return docRef.id;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateUser = async (userId, userData, isPending = false) => {
  try {
    const dataToUpdate = {
      ...userData,
      userType: 'Normal'
    };

    if (isPending) {
      await updateDoc(doc(db, 'invitations', userId), dataToUpdate);
    } else {
      await updateDoc(doc(db, 'users', userId), dataToUpdate);
    }
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteUser = async (email) => {
  try {
    const response = await fetch(`http://localhost:5001/users?email=${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error deleting user');
    }
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteUserAccount = async (email) => {
  try {
    const response = await fetch('http://localhost:5001/user-account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': email,
      },
    });
    if (!response.ok) {
      throw new Error('Error deleting user account');
    }
  } catch (error) {
    handleApiError(error);
  }
};

export const inviteUser = async (userData) => {
  try {
    const response = await fetch('http://localhost:5001/invitations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error('Error inviting user');
    }
    const result = await response.json();
    return result.id;
  } catch (error) {
    handleApiError(error);
  }
};

export const cancelInvitation = async (invitationId) => {
  try {
    const response = await fetch(`http://localhost:5001/invitations/${invitationId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error canceling invitation');
    }
  } catch (error) {
    handleApiError(error);
  }
};

// Get user's inquiries and feedback
export const getUserInquiriesFeedback = async (userId) => {
  try {
    const response = await fetch(`http://localhost:5001/inquiries-feedback/${userId}`);
    if (!response.ok) {
      throw new Error('Error fetching inquiries and feedback');
    }
    const results = await response.json();
    console.log(results)
    return results;
  } catch (error) {
    console.error('Error fetching inquiries and feedback:', error);
    throw error;
  }
};
// Create new inquiry or feedback with auto-incrementing ID
export const createInquiryFeedback = async (data) => {
  try {
    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key]);
    }

    const response = await fetch('http://localhost:5001/inquiries-feedback', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Error creating inquiry/feedback');
    }

    const result = await response.json();
    return result.id;
  } catch (error) {
    console.error('Error in createInquiryFeedback:', error);
    throw error;
  }
};

export const updateInquiryFeedback = async (incrementalId, data) => {
  try {
    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key]);
    }

    const response = await fetch(`http://localhost:5001/inquiries-feedback/${incrementalId}`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Error updating inquiry/feedback');
    }
  } catch (error) {
    console.error('Error updating inquiry/feedback:', error);
    throw error;
  }
};
// Delete inquiry or feedback
export const deleteInquiryFeedback = async (id) => {
  try {
    const docRef = doc(db, 'inquiries_feedback', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting inquiry/feedback:', error);
    throw error;
  }
};

// Company operations
export const getCompanyInfo = async (companyName) => {
  try {
    console.log("Company Name", companyName)
    const response = await fetch(`http://localhost:5001/company-data?companyName=${encodeURIComponent(companyName)}`);
    if (!response.ok) {
      throw new Error('Error fetching company data');
    }
    const companyData = await response.json();
    return companyData;
  } catch (error) {
    console.error('Error fetching company data:', error);
    throw error;
  }
};

export const updateCompanyInfo = async (companyName, data) => {
  try {
    const response = await fetch(`http://localhost:5001/company-data/${companyName}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Error updating company info');
    }
  } catch (error) {
    console.error('Error updating company info:', error);
    throw new Error(`Failed to update company information: ${error.message}`);
  }
};
export const getOperatorRequisitions = async (userId) => {
  try {
    const response = await fetch(`http://localhost:5001/operator-requisitions/${userId}`);
    if (!response.ok) {
      throw new Error('Error fetching operator requisitions');
    }
    const results = await response.json();
    return results;
  } catch (error) {
    console.error('Error fetching operator requisitions:', error);
    throw error;
  }
};

export const createOperatorRequisition = async (requisitionData) => {
  try {
    const response = await fetch('http://localhost:5001/operator-requisitions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requisitionData),
    });
    if (!response.ok) {
      throw new Error('Error creating operator requisition');
    }
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error creating operator requisition:', error);
    throw error;
  }
};

export const updateOperatorRequisition = async (requisitionId, updateData) => {
  try {
    const response = await fetch(`http://localhost:5001/operator-requisitions/${requisitionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) {
      throw new Error('Error updating operator requisition');
    }
  } catch (error) {
    console.error('Error updating operator requisition:', error);
    throw error;
  }
};

export const deleteOperatorRequisition = async (requisitionId) => {
  try {
    const response = await fetch(`http://localhost:5001/operator-requisitions/${requisitionId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error deleting operator requisition');
    }
  } catch (error) {
    console.error('Error deleting operator requisition:', error);
    throw error;
  }
};

export const getTrainingPrograms = async () => {
  try {
    const response = await fetch('http://localhost:5001/training-programs');
    if (!response.ok) {
      throw new Error('Error fetching training programs');
    }
    const programs = await response.json();
    return programs;
  } catch (error) {
    console.error('Error fetching training programs:', error);
    throw error;
  }
};

// Get user data including enrolled programs
export const getUserData = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const getUserUpdatedData = async (userEmail) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', userEmail));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('User not found');
    }

    return querySnapshot.docs[0].data();
  } catch (error) {
    console.error('Error fetching updated user data:', error);
    throw error;
  }
};

export const registerForProgram = async (programId, userEmail) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', userEmail));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('User not found');
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const programRef = doc(db, 'training_programs', programId);
    const programDoc = await getDoc(programRef);

    if (!programDoc.exists()) {
      throw new Error('Program not found');
    }

    const programData = programDoc.data();

    // Check capacity
    if (programData.numberOfCurrentRegistrations >= programData.participantCapacity) {
      throw new Error('Program is full');
    }

    // Check if already enrolled
    if (userData.enrolledPrograms?.some(program => program.programId === programId)) {
      throw new Error('Already enrolled in this program');
    }

    // Use transaction to ensure atomicity
    await runTransaction(db, async (transaction) => {
      // Update program registrations
      transaction.update(programRef, {
        numberOfCurrentRegistrations: increment(1)
      });

      // Update user enrollments
      transaction.update(userDoc.ref, {
        enrolledPrograms: arrayUnion({
          programId: programId,
          enrollmentDate: Timestamp.now(),
          status: 'Enrolled'
        })
      });
    });
  } catch (error) {
    console.error('Error in registerForProgram:', error);
    throw error;
  }
};

export const withdrawFromProgram = async (programId, userEmail) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', userEmail));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('User not found');
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const programRef = doc(db, 'training_programs', programId);
    
    const enrollmentToRemove = userData.enrolledPrograms?.find(ep => ep.programId === programId);
    
    if (!enrollmentToRemove) {
      throw new Error('Not enrolled in this program');
    }

    // Use transaction to ensure atomicity
    await runTransaction(db, async (transaction) => {
      // Update program registrations
      transaction.update(programRef, {
        numberOfCurrentRegistrations: increment(-1)
      });

      // Update user enrollments
      transaction.update(userDoc.ref, {
        enrolledPrograms: arrayRemove(enrollmentToRemove)
      });
    });
  } catch (error) {
    console.error('Error in withdrawFromProgram:', error);
    throw error;
  }
};

// Update program completion status
export const updateProgramCompletionStatus = async () => {
  try {
    const now = Timestamp.now();
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.enrolledPrograms) {
        const updatedEnrollments = userData.enrolledPrograms.map(enrollment => {
          if (enrollment.status === 'Enrolled') {
            const programRef = doc(db, 'training_programs', enrollment.programId);
            return getDoc(programRef).then(programDoc => {
              const programData = programDoc.data();
              if (programData.endDate.toDate() <= now.toDate()) {
                return { ...enrollment, status: 'Completed' };
              }
              return enrollment;
            });
          }
          return enrollment;
        });

        const resolvedEnrollments = await Promise.all(updatedEnrollments);
        await updateDoc(userDoc.ref, { enrolledPrograms: resolvedEnrollments });
      }
    }
  } catch (error) {
    console.error('Error updating program completion status:', error);
    throw error;
  }
};

export const getCargoManifests = async () => {
  try {
    const manifestsRef = collection(db, 'cargo_manifests');
    const snapshot = await getDocs(manifestsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching cargo manifests:', error);
    throw error;
  }
};

export const submitCargoManifest = async (manifestData) => {
  try {
    const response = await fetch('http://localhost:5001/cargo-manifests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(manifestData),
    });
    if (!response.ok) {
      throw new Error('Error submitting cargo manifest');
    }
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error submitting cargo manifest:', error);
    throw error;
  }
};

export const updateCargoManifest = async (id, manifestData) => {
  try {
    const response = await fetch(`http://localhost:5001/cargo-manifests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(manifestData),
    });
    if (!response.ok) {
      throw new Error('Error updating cargo manifest');
    }
  } catch (error) {
    console.error('Error updating cargo manifest:', error);
    throw error;
  }
};


export const deleteCargoManifest = async (id) => {
  try {
    const response = await fetch(`http://localhost:5001/cargo-manifests/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error deleting cargo manifest');
    }
  } catch (error) {
    console.error('Error deleting cargo manifest:', error);
    throw error;
  }
};

export const getVesselVisitRequestsAdHocRequest = async () => {
  try {
    const response = await fetch('http://localhost:5001/vessel-visits-adhoc-requests');
    if (!response.ok) {
      throw new Error('Failed to fetch vessel visits');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching vessel visits:', error);
    throw error;
  }
};

export const getActiveVesselVisits = async () => {
  try {
    const response = await fetch('http://localhost:5001/active-vessel-visits');
    if (!response.ok) {
      throw new Error('Failed to fetch active vessel visits');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching active vessel visits:', error);
    throw error;
  }
};

// In api.js, add these functions
export const getAdHocResourceRequests = async () => {
  try {
    const response = await fetch('http://localhost:5001/ad-hoc-resource-requests');
    if (!response.ok) {
      throw new Error('Failed to fetch ad hoc requests');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching ad hoc requests:', error);
    throw error;
  }
};

export const submitAdHocResourceRequest = async (requestData) => {
  try {
    const response = await fetch('http://localhost:5001/ad-hoc-resource-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    if (!response.ok) {
      throw new Error('Failed to submit ad hoc request');
    }
    return await response.json();
  } catch (error) {
    console.error('Error submitting ad hoc request:', error);
    throw error;
  }
};

export const updateAdHocResourceRequest = async (requestId, requestData) => {
  try {
    const response = await fetch(`http://localhost:5001/ad-hoc-resource-requests/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    if (!response.ok) {
      throw new Error('Failed to update ad hoc request');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating ad hoc request:', error);
    throw error;
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

export const getVesselVisitsConfirmedWithoutManifests = () => {
  return axios.get('/vessel-visits-confirmed-without-manifests').catch(handleApiError);
}

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
  cancelInvitation,
  getUserInquiriesFeedback,
  createInquiryFeedback,
  updateInquiryFeedback,
  deleteInquiryFeedback,
  getCompanyInfo,
  updateCompanyInfo,
  getOperatorRequisitions,
  createOperatorRequisition,
  updateOperatorRequisition,
  deleteOperatorRequisition,
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
  getAllUsersInCompany,
  getCargoManifests,
  submitCargoManifest,
  updateCargoManifest,
  deleteCargoManifest,
  getVesselVisitRequestsAdHocRequest,
  getAdHocResourceRequests,
  submitAdHocResourceRequest,
  updateAdHocResourceRequest,
};

export default api;