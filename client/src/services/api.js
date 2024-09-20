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
  orderBy
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

import { db } from '../firebaseConfig';

const storage = getStorage();

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

    // Fetch users from the 'users' collection
    const usersQuery = query(
      collection(db, 'users'),
      where('company', '==', currentUserData.company)
    );
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), status: 'Active' }));

    // Fetch invitations - pending, approved, and rejected ones
    const invitationsQuery = query(
      collection(db, 'invitations'),
      where('company', '==', currentUserData.company),
      where('status', 'in', ['Pending', 'Approved', 'Rejected']) 
    );
    const invitationsSnapshot = await getDocs(invitationsQuery);
    const invitationUsers = invitationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      status: doc.data().status === 'Rejected' ? 'Rejected' : doc.data().status === 'Approved' ? 'Approved' : 'Pending',
    }));

    return [...users, ...invitationUsers];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getAllUsersInCompany = async () => {
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
    const usersSnapshot = await getDocs(usersQuery);

    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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

export const inviteUser = async (userData) => {
  try {
    const invitationRef = await addDoc(collection(db, 'invitations'), {
      ...userData,
      userType: 'Normal', 
      createdAt: new Date(),
      status: 'Pending'
    });
    return invitationRef.id;
  } catch (error) {
    handleApiError(error);
  }
};

export const cancelInvitation = async (invitationId) => {
  try {
    await deleteDoc(doc(db, 'invitations', invitationId));
  } catch (error) {
    handleApiError(error);
  }
};

// Get user's inquiries and feedback
export const getUserInquiriesFeedback = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const q = query(collection(db, 'inquiries_feedback'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching inquiries and feedback:', error);
    throw error;
  }
};

// Create new inquiry or feedback with auto-incrementing ID
export const createInquiryFeedback = async (data) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }

    let fileURL = null;

    // Process file upload if a file exists
    if (data.file && data.file instanceof File) {
      try {
        const fileExtension = data.file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
        const fileRef = storageRef(storage, `inquiries_feedback/${fileName}`);
        const snapshot = await uploadBytes(fileRef, data.file);
        fileURL = await getDownloadURL(snapshot.ref);
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error('Failed to upload file: ' + uploadError.message);
      }
    }

    const { file, ...dataWithoutFile } = data;
    const inquiriesRef = collection(db, 'inquiries_feedback');
    const snapshot = await getDocs(inquiriesRef);
    const newIncrementalId = snapshot.size + 1; 

    const docData = {
      ...dataWithoutFile,
      incrementalId: newIncrementalId, 
      userId: user.uid,
      createdAt: serverTimestamp(),
      status: 'Pending',
      fileURL: fileURL,
    };

    console.log('Final document data:', docData);

    const docRef = await addDoc(inquiriesRef, docData);
    return docRef.id;
  } catch (error) {
    console.error('Error in createInquiryFeedback:', error);
    throw error;
  }
};

// Update inquiry or feedback
export const updateInquiryFeedback = async (incrementalId, data) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }

    const inquiriesRef = collection(db, 'inquiries_feedback');
    const querySnapshot = await getDocs(inquiriesRef);
    let docId = null;

    querySnapshot.forEach((doc) => {
      const inquiryData = doc.data();
      if (inquiryData.incrementalId === incrementalId) {
        docId = doc.id; 
      }
    });

    if (!docId) {
      throw new Error(`No inquiry/feedback found with incremental ID: ${incrementalId}`);
    }

    // Process file upload if there is a new file
    let fileURL = data.fileURL || null;  
    if (data.file && data.file instanceof File) {
      try {
        const fileExtension = data.file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
        const fileRef = storageRef(storage, `inquiries_feedback/${fileName}`);
        const snapshot = await uploadBytes(fileRef, data.file);
        fileURL = await getDownloadURL(snapshot.ref);
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error('Failed to upload file: ' + uploadError.message);
      }
    }

    const { file, ...dataWithoutFile } = data;
    const updateData = {
      ...dataWithoutFile,
      fileURL: fileURL,
    };

    const docRef = doc(db, 'inquiries_feedback', docId);
    await updateDoc(docRef, updateData);
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
    const companyDoc = await getDoc(doc(db, 'companies', companyName));
    if (companyDoc.exists()) {
      return companyDoc.data();
    } else {
      throw new Error('Company not found');
    }
  } catch (error) {
    console.error('Error fetching company info:', error);
    throw error;
  }
};

export const updateCompanyInfo = async (companyName, data) => {
  try {
    const companyRef = doc(db, 'companies', companyName);
    await updateDoc(companyRef, data);
  } catch (error) {
    console.error('Error updating company info:', error);
    throw new Error(`Failed to update company information: ${error.message}`);
  }
};

export const getOperatorRequisitions = async (userId) => {
  try {
    console.log('Fetching operator requisitions for user:', userId);
    const q = query(
      collection(db, 'operator_requisitions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    console.log('Query snapshot:', querySnapshot);
    const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Fetched requisitions:', results);
    return results;
  } catch (error) {
    console.error('Error fetching operator requisitions:', error);
    if (error.code === 'failed-precondition') {
      console.error('This query requires an index. Please check the Firebase console for a link to create the index, or create it manually.');
    }
    throw error;
  }
};

export const createOperatorRequisition = async (requisitionData) => {
  try {
    const docRef = await addDoc(collection(db, 'operator_requisitions'), {
      ...requisitionData,
      createdAt: serverTimestamp(),
      status: 'Pending'  
    });
    console.log('Created new requisition with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating operator requisition:', error);
    throw error;
  }
};

export const updateOperatorRequisition = async (requisitionId, updateData) => {
  try {
    const requisitionRef = doc(db, 'operator_requisitions', requisitionId);
    await updateDoc(requisitionRef, updateData);
    console.log('Updated requisition:', requisitionId);
  } catch (error) {
    console.error('Error updating operator requisition:', error);
    throw error;
  }
};

export const deleteOperatorRequisition = async (requisitionId) => {
  try {
    await deleteDoc(doc(db, 'operator_requisitions', requisitionId));
    console.log('Deleted requisition:', requisitionId);
  } catch (error) {
    console.error('Error deleting operator requisition:', error);
    throw error;
  }
};

export const getTrainingPrograms = async () => {
  try {
    const programsRef = collection(db, 'training_programs');
    const programsSnapshot = await getDocs(programsRef);
    return programsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching training programs:', error);
    throw error;
  }
};

// Get user data including enrolled programs
export const getUserData = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
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

// Register user for a training program
export const registerForProgram = async (programId, userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const programRef = doc(db, 'training_programs', programId);

    // Update user document
    await updateDoc(userRef, {
      enrolledPrograms: arrayUnion({
        programId: programId,
        enrollmentDate: Timestamp.now(),
        status: 'Enrolled'
      })
    });

    // Update program document
    await updateDoc(programRef, {
      numberOfCurrentRegistrations: increment(1)
    });
  } catch (error) {
    console.error('Error registering for program:', error);
    throw error;
  }
};

// Withdraw user from a training program
export const withdrawFromProgram = async (programId, userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const programRef = doc(db, 'training_programs', programId);

    // Get user data to find the specific enrollment to remove
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    const enrollmentToRemove = userData.enrolledPrograms.find(ep => ep.programId === programId);

    if (!enrollmentToRemove) {
      throw new Error('User is not enrolled in this program');
    }

    // Update user document
    await updateDoc(userRef, {
      enrolledPrograms: arrayRemove(enrollmentToRemove)
    });

    // Update program document
    await updateDoc(programRef, {
      numberOfCurrentRegistrations: increment(-1)
    });
  } catch (error) {
    console.error('Error withdrawing from program:', error);
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
  getAllUsersInCompany
};

export default api;