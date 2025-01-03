import axios from "axios";
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updateProfile,
  deleteUser as firebaseDeleteUser,
} from "../firebaseConfig";
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
  orderBy,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { db } from "../firebaseConfig";
import { API_URL } from "../config/apiConfig";

const storage = getStorage();

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
  console.error(
    "API Error:",
    error.response ? error.response.data : error.message
  );
  throw error;
};

// Authentication
export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password).catch(handleApiError);

export const registerUser = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    await setDoc(doc(db, "users", user.uid), { ...userData, uid: user.uid });

    // Update or create company document
    const companyRef = doc(db, "companies", userData.company);
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
    await updateDoc(doc(db, "users", user.uid), userData);
  } catch (error) {
    handleApiError(error);
  }
};

export const getUserUpdatedData = async (userEmail) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", userEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("User not found");
    }

    return querySnapshot.docs[0].data();
  } catch (error) {
    console.error("Error fetching updated user data:", error);
    throw error;
  }
};

// Fetch current user's company
export const getCurrentUserCompany = async () => {
  const user = await auth.currentUser;
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      return userDoc.data().company;
    }
  }
  throw new Error("User company not found");
};

export const updateUserPassword = (newPassword) =>
  auth.currentUser.updatePassword(newPassword).catch(handleApiError);

// Password Reset
export const sendPasswordResetEmailToUser = (email) =>
  sendPasswordResetEmail(auth, email).catch(handleApiError);

export const confirmUserPasswordReset = (oobCode, newPassword) =>
  confirmPasswordReset(auth, oobCode, newPassword).catch(handleApiError);

export const getUsers = async (userEmail) => {
  try {
    const response = await fetch(`${API_URL}/users?email=${userEmail}`);
    if (!response.ok) {
      throw new Error("Error fetching users");
    }
    const users = await response.json();
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const getAllUsersInCompany = async (userEmail) => {
  try {
    const response = await fetch(
      `${API_URL}/all-users-in-company?email=${userEmail}`
    );
    if (!response.ok) {
      throw new Error("Error fetching users in company");
    }
    const users = await response.json();
    return users;
  } catch (error) {
    console.error("Error fetching users in company:", error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      ...userData,
      userType: "Normal",
    });
    return docRef.id;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateUser = async (userId, userData, isPending = false) => {
  try {
    const dataToUpdate = {
      ...userData,
      userType: "Normal",
    };

    if (isPending) {
      await updateDoc(doc(db, "invitations", userId), dataToUpdate);
    } else {
      await updateDoc(doc(db, "users", userId), dataToUpdate);
    }
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteUser = async (email) => {
  try {
    const response = await fetch(
      `${API_URL}/users?email=${encodeURIComponent(email)}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) {
      throw new Error("Error deleting user");
    }
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteUserAccount = async (email) => {
  try {
    const response = await fetch(`${API_URL}/user-account`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-User-Email": email,
      },
    });
    if (!response.ok) {
      throw new Error("Error deleting user account");
    }
  } catch (error) {
    handleApiError(error);
  }
};

export const inviteUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/invitations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error("Error inviting user");
    }
    const result = await response.json();
    return result.id;
  } catch (error) {
    handleApiError(error);
  }
};

export const cancelInvitation = async (invitationId) => {
  try {
    const response = await fetch(`${API_URL}/invitations/${invitationId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Error canceling invitation");
    }
  } catch (error) {
    handleApiError(error);
  }
};

// Get user's inquiries and feedback
export const getUserInquiriesFeedback = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/inquiries-feedback/${userId}`);
    if (!response.ok) {
      throw new Error("Error fetching inquiries and feedback");
    }
    const results = await response.json();
    return results;
  } catch (error) {
    console.error("Error fetching inquiries and feedback:", error);
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

    const response = await fetch(`${API_URL}/inquiries-feedback`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Error creating inquiry/feedback");
    }

    const result = await response.json();
    return result.id;
  } catch (error) {
    console.error("Error in createInquiryFeedback:", error);
    throw error;
  }
};

export const updateInquiryFeedback = async (incrementalId, data) => {
  try {
    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key]);
    }

    const response = await fetch(
      `${API_URL}/inquiries-feedback/${incrementalId}`,
      {
        method: "PUT",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Error updating inquiry/feedback");
    }
  } catch (error) {
    console.error("Error updating inquiry/feedback:", error);
    throw error;
  }
};
// Delete inquiry or feedback
export const deleteInquiryFeedback = async (incrementalId) => {
  try {
    const response = await fetch(`${API_URL}/inquiries-feedback/${incrementalId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Error deleting inquiry/feedback'
      }));
      throw new Error(errorData.error || 'Error deleting inquiry/feedback');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in deleteInquiryFeedback:', error);
    throw error;
  }
};

// Company operations
export const getCompanyInfo = async (companyName) => {
  try {
    const response = await fetch(
      `${API_URL}/company-data?companyName=${encodeURIComponent(companyName)}`
    );
    if (!response.ok) {
      throw new Error("Error fetching company data");
    }
    const companyData = await response.json();
    return companyData;
  } catch (error) {
    console.error("Error fetching company data:", error);
    throw error;
  }
};

export const updateCompanyInfo = async (companyName, data) => {
  try {
    const response = await fetch(`${API_URL}/company-data/${companyName}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Error updating company info");
    }
  } catch (error) {
    console.error("Error updating company info:", error);
    throw new Error(`Failed to update company information: ${error.message}`);
  }
};

export const uploadCompanyLogo = async (companyName, file) => {
  try {
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('companyName', companyName);

    const response = await fetch(`${API_URL}/company-data/upload-logo`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload logo');
    }

    const data = await response.json();
    return data.logoUrl;
  } catch (error) {
    console.error('Error uploading company logo:', error);
    throw error;
  }
};


export const getOperatorRequisitions = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/operator-requisitions/${userId}`);
    if (!response.ok) {
      throw new Error("Error fetching operator requisitions");
    }
    const results = await response.json();
    return results;
  } catch (error) {
    console.error("Error fetching operator requisitions:", error);
    throw error;
  }
};

export const createOperatorRequisition = async (requisitionData) => {
  try {
    const response = await fetch(`${API_URL}/operator-requisitions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requisitionData),
    });
    if (!response.ok) {
      throw new Error("Error creating operator requisition");
    }
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error("Error creating operator requisition:", error);
    throw error;
  }
};

export const updateOperatorRequisition = async (requisitionId, updateData) => {
  try {
    const response = await fetch(
      `${API_URL}/operator-requisitions/${requisitionId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      }
    );
    if (!response.ok) {
      throw new Error("Error updating operator requisition");
    }
  } catch (error) {
    console.error("Error updating operator requisition:", error);
    throw error;
  }
};

export const deleteOperatorRequisition = async (requisitionId) => {
  try {
    const response = await fetch(
      `${API_URL}/operator-requisitions/${requisitionId}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) {
      throw new Error("Error deleting operator requisition");
    }
  } catch (error) {
    console.error("Error deleting operator requisition:", error);
    throw error;
  }
};

// Warehouse management
export const getWarehouses = async () => {
  try {
    const response = await fetch(`${API_URL}/warehouses`);
    if (!response.ok) {
      throw new Error('Failed to fetch warehouses');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    throw error;
  }
};

export const getWarehouseById = async (warehouseId) => {
  try {
    const response = await fetch(`${API_URL}/warehouses/${warehouseId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch warehouse');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    throw error;
  }
};

// Facility rental management
export const getFacilityRentals = async () => {
  try {
    const response = await fetch(`${API_URL}/facility-rentals`);
    if (!response.ok) {
      throw new Error('Failed to fetch facility rentals');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching facility rentals:', error);
    throw error;
  }
};

export const createFacilityRental = async (rentalData) => {
  try {
    const response = await fetch(`${API_URL}/facility-rentals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rentalData),
    });
    if (!response.ok) {
      throw new Error('Failed to create facility rental');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating facility rental:', error);
    throw error;
  }
};

export const updateFacilityRental = async (rentalId, updateData) => {
  try {
    const response = await fetch(`${API_URL}/facility-rentals/${rentalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) {
      throw new Error('Failed to update facility rental');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating facility rental:', error);
    throw error;
  }
};

export const deleteFacilityRental = async (rentalId) => {
  try {
    const response = await fetch(`${API_URL}/facility-rentals/${rentalId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete facility rental');
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting facility rental:', error);
    throw error;
  }
};

export const checkFacilityAvailability = async (facilityId, startTime, endTime) => {
  try {
    const response = await fetch(`${API_URL}/facility-rentals/check-availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        facilityId,
        startTime,
        endTime,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to check facility availability');
    }
    return await response.json();
  } catch (error) {
    console.error('Error checking facility availability:', error);
    throw error;
  }
};

export const getTrainingPrograms = async () => {
  try {
      const response = await fetch(`${API_URL}/training-programs`);
      if (!response.ok) {
          throw new Error('Failed to fetch training programs');
      }
      const programs = await response.json();
      return programs;
  } catch (error) {
      console.error('Error fetching training programs:', error);
      throw error;
  }
};

export const registerForProgram = async (programId, userEmail) => {
  try {
      const response = await fetch(`${API_URL}/training-programs/${programId}/register`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userEmail })
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to register for program');
      }

      return await response.json();
  } catch (error) {
      console.error('Error registering for program:', error);
      throw error;
  }
};

export const withdrawFromProgram = async (programId, userEmail) => {
  try {
      const response = await fetch(`${API_URL}/training-programs/${programId}/withdraw`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userEmail })
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to withdraw from program');
      }

      return await response.json();
  } catch (error) {
      console.error('Error withdrawing from program:', error);
      throw error;
  }
};

export const updateProgramCompletionStatus = async () => {
  try {
      const response = await fetch(`${API_URL}/training-programs/update-completion`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          }
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update program completion status');
      }

      return await response.json();
  } catch (error) {
      console.error('Error updating program completion status:', error);
      throw error;
  }
};


export const getCargoManifests = async () => {
  try {
    const response = await fetch(`${API_URL}/cargo-manifests`);
    if (!response.ok) {
      throw new Error('Failed to fetch cargo manifests');
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching cargo manifests:", error);
    throw error;
  }
};

export const submitCargoManifest = async (manifestData) => {
  try {
    const response = await fetch(`${API_URL}/cargo-manifests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(manifestData),
    });
    if (!response.ok) {
      throw new Error("Error submitting cargo manifest");
    }
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error("Error submitting cargo manifest:", error);
    throw error;
  }
};

export const updateCargoManifest = async (id, manifestData) => {
  try {
    const response = await fetch(`${API_URL}/cargo-manifests/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(manifestData),
    });
    if (!response.ok) {
      throw new Error("Error updating cargo manifest");
    }
  } catch (error) {
    console.error("Error updating cargo manifest:", error);
    throw error;
  }
};

export const deleteCargoManifest = async (id) => {
  try {
    const response = await fetch(`${API_URL}/cargo-manifests/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Error deleting cargo manifest");
    }
  } catch (error) {
    console.error("Error deleting cargo manifest:", error);
    throw error;
  }
};

export const getVesselVisitRequestsAdHocRequest = async () => {
  try {
    const response = await fetch(`${API_URL}/vessel-visits-adhoc-requests`);
    if (!response.ok) {
      throw new Error("Failed to fetch vessel visits");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching vessel visits:", error);
    throw error;
  }
};

export const getActiveVesselVisits = async () => {
  try {
    const response = await fetch(`${API_URL}/active-vessel-visits`);
    if (!response.ok) {
      throw new Error("Failed to fetch active vessel visits");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching active vessel visits:", error);
    throw error;
  }
};

export const getAdHocResourceRequests = async () => {
  try {
    const response = await fetch(`${API_URL}/ad-hoc-resource-requests`);
    if (!response.ok) {
      throw new Error("Failed to fetch ad hoc requests");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching ad hoc requests:", error);
    throw error;
  }
};

export const submitAdHocResourceRequest = async (requestData) => {
  try {
    const response = await fetch(`${API_URL}/ad-hoc-resource-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });
    if (!response.ok) {
      throw new Error("Failed to submit ad hoc request");
    }
    return await response.json();
  } catch (error) {
    console.error("Error submitting ad hoc request:", error);
    throw error;
  }
};

export const updateAdHocResourceRequest = async (requestId, requestData) => {
  try {
    const response = await fetch(
      `${API_URL}/ad-hoc-resource-requests/${requestId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to update ad hoc request");
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating ad hoc request:", error);
    throw error;
  }
};

export const getContainerTypes = async () => {
  try {
    const response = await fetch(`${API_URL}/container-types`);

    if (!response.ok) {
      throw new Error("Error fetching container types");
    }

    return await response.json();
  } catch (error) {
    console.error("Error in getContainerTypes:", error);
    throw error;
  }
};

export const getContainerTypesForCompany = async (company) => {
  try {
    const response = await fetch(
      `${API_URL}/container-types/company?company=${encodeURIComponent(
        company
      )}`
    );
    if (!response.ok) {
      throw new Error("Error fetching container types");
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getContainerTypesForCompany:", error);
    throw error;
  }
};

export const addContainerType = async (company, containerData) => {
  try {
    const formData = new FormData();
    formData.append('company', company);
    formData.append('size', containerData.size);
    formData.append('price', containerData.price);
    formData.append('name', containerData.name);
    formData.append('consolidationPrice', containerData.consolidationPrice);
    if (containerData.imageFile) {
      formData.append('image', containerData.imageFile);
    }

    const response = await fetch(`${API_URL}/container-types`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error adding container type');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in addContainerType:', error);
    throw error;
  }
};

export const getCarrierContainerPrices = async (company) => {
  try {
    const response = await fetch(
      `${API_URL}/carrier-container-prices?company=${encodeURIComponent(
        company
      )}`
    );
    if (!response.ok) {
      throw new Error("Error fetching carrier container prices");
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getCarrierContainerPrices:", error);
    throw error;
  }
};

export const assignContainerPrice = async (company, containerData) => {
  try {
    const response = await fetch(`${API_URL}/carrier-container-prices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        company,
        ...containerData,
      }),
    });

    if (!response.ok) {
      throw new Error("Error assigning container price");
    }

    return await response.json();
  } catch (error) {
    console.error("Error in assignContainerPrice:", error);
    throw error;
  }
};

export const updateContainerPrice = async (
  company,
  equipmentId,
  updateData
) => {
  try {
    const response = await fetch(
      `${API_URL}/carrier-container-prices/${company}/${equipmentId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      throw new Error("Error updating container price");
    }
    return await response.json();
  } catch (error) {
    console.error("Error in updateContainerPrice:", error);
    throw error;
  }
};

export const deleteContainerPrice = async (company, equipmentId) => {
  try {
    const response = await fetch(
      `${API_URL}/carrier-container-prices/${company}/${equipmentId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Error deleting container price");
    }
  } catch (error) {
    console.error("Error in deleteContainerPrice:", error);
    throw error;
  }
};

export const getBillingRequests = async (companyId, requestType) => {
  try {
    const response = await fetch(
      `${API_URL}/billing-requests?companyId=${encodeURIComponent(
        companyId
      )}&requestType=${encodeURIComponent(requestType)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching billing requests:", error);
    throw error;
  }
};

export const getBillingRequestsByMonth = async (companyId, month) => {
  try {
    const response = await fetch(
      `${API_URL}/billing-requests-by-month?companyId=${encodeURIComponent(
        companyId
      )}&month=${encodeURIComponent(month)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching billing requests by month:", error);
    throw error;
  }
};

export const getBookingById = async (bookingId) => {
  try {
    const response = await fetch(`${API_URL}/bookings/${bookingId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch booking");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching booking:", error);
    throw error;
  }
};

export const getBookings = async () => {
  try {
    const response = await fetch(`${API_URL}/bookings`);
    if (!response.ok) {
      throw new Error("Failed to fetch bookings");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw error;
  }
};

export const createBooking = async (bookingData) => {
  try {
    const response = await fetch(`${API_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    });
    if (!response.ok) {
      throw new Error("Failed to create booking");
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

export const updateBooking = async (id, bookingData) => {
  try {
    const response = await fetch(`${API_URL}/bookings/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    });
    if (!response.ok) {
      throw new Error("Failed to update booking");
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating booking:", error);
    throw error;
  }
};

export const deleteBooking = async (id) => {
  try {
    const response = await fetch(`${API_URL}/bookings/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete booking");
    }
    return await response.json();
  } catch (error) {
    console.error("Error deleting booking:", error);
    throw error;
  }
};

export const uploadBookingDocument = async (
  bookingId,
  cargoId,
  documentType,
  file
) => {
  try {
    const formData = new FormData();
    formData.append("document", file);
    formData.append("documentType", documentType);

    const response = await fetch(
      `${API_URL}/bookings/${bookingId}/cargo/${cargoId}/documents`,
      {
        method: "POST",
        body: formData,
      }
    );
    if (!response.ok) {
      throw new Error("Failed to upload document");
    }
    return await response.json();
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
};

export const retrieveBookingDocument = async (bookingId, cargoId, documentType) => {
  try {
    const response = await fetch(
      `${API_URL}/bookings/${bookingId}`
    );

    if (!response.ok) {
      throw new Error('Failed to retrieve document');
    }

    const data = await response.json();
    const documentUrl = data.cargo[cargoId].documents[documentType];
    if (documentType === "Safety Data Sheet") {
      await updateDoc(doc(db, "bookings", bookingId), {
        [`cargo.${cargoId}.documentStatus['UN Classification Sheet']`]: {
          status: "IN_PROGRESS",
          lastUpdated: serverTimestamp(),
          comments: "Prerequisites met, waiting for agency review"
        }
      });
    }
    return {
      url: documentUrl,
      fileName: documentUrl.split('/').pop()
    };
  } catch (error) {
    console.error('Error retrieving document:', error);
    throw error;
  }
};

export const registerTruckForCargo = async (cargoId, truckLicense) => {
  try {
    const response = await fetch(`${API_URL}/bookings/register-truck`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cargoId, truckLicense }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to register truck");
    }

    return await response.json();
  } catch (error) {
    console.error("Error registering truck:", error);
    throw error;
  }
};

export const getContainerRequests = async () => {
  try {
    const response = await fetch(`${API_URL}/container-requests`);
    if (!response.ok) {
      throw new Error("Failed to fetch container requests");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching container requests:", error);
    throw error;
  }
};

export const createContainerRequest = async (requestData) => {
  try {
    const response = await fetch(`${API_URL}/container-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });
    if (!response.ok) {
      throw new Error("Failed to create container request");
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating container request:", error);
    throw error;
  }
};

export const updateContainerRequest = async (id, requestData) => {
  try {
    const response = await fetch(`${API_URL}/container-requests/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });
    if (!response.ok) {
      throw new Error("Failed to update container request");
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating container request:", error);
    throw error;
  }
};

export const deleteContainerRequest = async (id) => {
  try {
    const response = await fetch(`${API_URL}/container-requests/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete container request");
    }
    return await response.json();
  } catch (error) {
    console.error("Error deleting container request:", error);
    throw error;
  }
};

export const getAgencies = async () => {
  try {
    const response = await fetch(`${API_URL}/agencies`);
    if (!response.ok) {
      throw new Error("Error fetching agencies");
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getAgencies:", error);
    throw error;
  }
};

export const verifyAgencyAccess = async (agencyKey, documentType) => {
  try {
    const response = await fetch(`${API_URL}/agencies/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agencyKey, documentType }),
    });
    if (!response.ok) {
      throw new Error("Error verifying agency access");
    }
    return await response.json();
  } catch (error) {
    console.error("Error in verifyAgencyAccess:", error);
    throw error;
  }
};

export const updateDocumentStatus = async (
  agencyKey,
  bookingId,
  cargoId,
  documentType,
  status,
  comments
) => {
  try {
    const response = await fetch(`${API_URL}/agencies/document-status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agencyKey,
        bookingId,
        cargoId,
        documentType,
        status,
        comments,
      }),
    });
    if (!response.ok) {
      throw new Error("Error updating document status");
    }
    return await response.json();
  } catch (error) {
    console.error("Error in updateDocumentStatus:", error);
    throw error;
  }
};

// Assets and Facilities
export const getAssets = () => authAxios.get("/assets").catch(handleApiError);

export const getFacilities = () =>
  authAxios.get("/facilities").catch(handleApiError);

// Vessel Visits
export const getVesselVisits = async () => {
  try {
    const response = await fetch(`${API_URL}/vessel-visits-booking`);
    if (!response.ok) {
      throw new Error("Failed to fetch vessel visits");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching vessel visits:", error);
    throw error;
  }
};

export const getVesselVisitsConfirmedWithoutManifests = async () => {
  try {
    const response = await fetch(`${API_URL}/vessel-visits-confirmed-without-manifests`);
    if (!response.ok) {
      throw new Error("Failed to fetch confirmed vessel visits without manifests");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching confirmed vessel visits without manifests:", error);
    throw error;
  }
};

export const createVesselVisit = (visitData) =>
  authAxios.post("/vessel-visits", visitData).catch(handleApiError);

export const updateVesselVisit = (visitId, visitData) =>
  authAxios.put(`/vessel-visits/${visitId}`, visitData).catch(handleApiError);


export const getBillingRequestsByMonth1 = async (companyId, monthRange) => {
  try {
      const response = await fetch(
          `${API_URL}/billing-requests-by-month1?` + 
          `companyId=${encodeURIComponent(companyId)}&` +
          `startDate=${encodeURIComponent(monthRange.start)}&` +
          `endDate=${encodeURIComponent(monthRange.end)}`,
          {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json',
              }
          }
      );

      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
  } catch (error) {
      console.error('Error fetching billing requests by month:', error);
      throw error;
  }
};

export const getPricingRates = async () => {
  try {
    const response = await fetch(`${API_URL}/pricing-rates`);
    if (!response.ok) {
      throw new Error('Failed to fetch pricing rates');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching pricing rates:', error);
    throw error;
  }
};

export const submitSamplingRequest = async (requestData) => {
  try {
    const formData = new FormData();
    formData.append('samplingDetails', JSON.stringify({
      cargoDetails: requestData.cargoDetails,
      samplingDetails: requestData.samplingDetails,
      schedule: requestData.schedule,
      specialInstructions: requestData.specialInstructions || '',
      company: requestData.company
    }));

    if (requestData.documents?.safetyDataSheet instanceof File) {
      formData.append('safetyDataSheet', requestData.documents.safetyDataSheet);
    }

    if (Array.isArray(requestData.documents?.additionalDocs)) {
      requestData.documents.additionalDocs.forEach((doc) => {
        if (doc instanceof File) {
          formData.append('additionalDoc', doc);
        }
      });
    }

    const response = await fetch(`${API_URL}/sampling-requests`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error submitting sampling request');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in submitSamplingRequest:', error);
    throw error;
  }
};

export const updateSamplingRequest = async (requestId, requestData) => {
  try {
    const formData = new FormData();
    formData.append('samplingDetails', JSON.stringify({
      cargoDetails: requestData.cargoDetails,
      samplingDetails: requestData.samplingDetails,
      schedule: requestData.schedule,
      specialInstructions: requestData.specialInstructions,
      status: requestData.status
    }));

    if (requestData.documents?.safetyDataSheet instanceof File) {
      formData.append('safetyDataSheet', requestData.documents.safetyDataSheet);
    }

    const response = await fetch(`${API_URL}/sampling-requests/${requestId}`, {
      method: 'PUT',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error updating sampling request');
    }

    // Check if the response has content and is JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    // If not JSON, just return success
    return { success: true, message: 'Sampling request updated successfully' };
  } catch (error) {
    console.error('Error in updateSamplingRequest:', error);
    throw error;
  }
};

export const getSamplingRequests = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`${API_URL}/sampling-requests?${queryParams}`);

    if (!response.ok) {
      throw new Error('Error fetching sampling requests');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in getSamplingRequests:', error);
    throw error;
  }
};

export const deleteSamplingRequest = async (requestId) => {
  try {
    const response = await fetch(`${API_URL}/sampling-requests/${requestId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Error deleting sampling request'
      }));
      throw new Error(errorData.error || 'Error deleting sampling request');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in deleteSamplingRequest:', error);
    throw error;
  }
};

export const getSamplingRequestById = async (requestId) => {
  try {
    const response = await fetch(`${API_URL}/sampling-requests/${requestId}`);

    if (!response.ok) {
      throw new Error('Error fetching sampling request');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in getSamplingRequestById:', error);
    throw error;
  }
};

export const submitRepackingRequest = async (requestData) => {
  try {
    const formData = new FormData();
    formData.append('repackingDetails', JSON.stringify({
      cargoDetails: requestData.cargoDetails,
      repackingDetails: requestData.repackingDetails,
      schedule: requestData.schedule,
      specialInstructions: requestData.specialInstructions || '',
      company: requestData.company
    }));

    if (requestData.documents?.repackagingChecklist instanceof File) {
      formData.append('repackagingChecklist', requestData.documents.repackagingChecklist);
    }

    const response = await fetch(`${API_URL}/repacking-requests`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error submitting repacking request');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in submitRepackingRequest:', error);
    throw error;
  }
};

export const updateRepackingRequest = async (requestId, requestData) => {
  try {
    const formData = new FormData();
    formData.append('repackingDetails', JSON.stringify({
      cargoDetails: requestData.cargoDetails,
      repackingDetails: requestData.repackingDetails,
      schedule: requestData.schedule,
      specialInstructions: requestData.specialInstructions,
      status: requestData.status
    }));

    if (requestData.documents?.repackagingChecklist instanceof File) {
      formData.append('repackagingChecklist', requestData.documents.repackagingChecklist);
    }

    const response = await fetch(`${API_URL}/repacking-requests/${requestId}`, {
      method: 'PUT',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error updating repacking request');
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return { success: true, message: 'Repacking request updated successfully' };
  } catch (error) {
    console.error('Error in updateRepackingRequest:', error);
    throw error;
  }
};

export const getRepackingRequestById = async (requestId) => {
  try {
    const response = await fetch(`${API_URL}/repacking-requests/${requestId}`);

    if (!response.ok) {
      throw new Error('Error fetching repacking request');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in getRepackingRequestById:', error);
    throw error;
  }
};

export const deleteRepackingRequest = async (requestId) => {
  try {
    const response = await fetch(`${API_URL}/repacking-requests/${requestId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Error deleting repacking request'
      }));
      throw new Error(errorData.error || 'Error deleting repacking request');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in deleteRepackingRequest:', error);
    throw error;
  }
};

export const getRepackingRequests = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`${API_URL}/repacking-requests?${queryParams}`);

    if (!response.ok) {
      throw new Error('Error fetching repacking requests');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in getRepackingRequests:', error);
    throw error;
  }
};

export const getStorageRequests = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`${API_URL}/storage-requests?${queryParams}`);

    if (!response.ok) {
      throw new Error('Error fetching storage requests');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in getStorageRequests:', error);
    throw error;
  }
};

// Get a single storage request by ID
export const getStorageRequestById = async (requestId) => {
  try {
    const response = await fetch(`${API_URL}/storage-requests/${requestId}`);

    if (!response.ok) {
      throw new Error('Error fetching storage request');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in getStorageRequestById:', error);
    throw error;
  }
};

// Submit a new storage request
export const submitStorageRequest = async (requestData) => {
  try {
    const formData = new FormData();
    formData.append('storageDetails', JSON.stringify({
      cargoDetails: requestData.cargoDetails,
      warehouseRequirement: requestData.warehouseRequirement,
      schedule: requestData.schedule,
      specialInstructions: requestData.specialInstructions || '',
      company: requestData.company
    }));

    if (requestData.documents?.storageChecklist instanceof File) {
      formData.append('storageChecklist', requestData.documents.storageChecklist);
    }

    if (Array.isArray(requestData.documents?.additionalDocs)) {
      requestData.documents.additionalDocs.forEach((doc) => {
        if (doc instanceof File) {
          formData.append('additionalDoc', doc);
        }
      });
    }

    const response = await fetch(`${API_URL}/storage-requests`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error submitting storage request');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in submitStorageRequest:', error);
    throw error;
  }
};

// Update an existing storage request
export const updateStorageRequest = async (requestId, requestData) => {
  try {
    const formData = new FormData();
    formData.append('storageDetails', JSON.stringify({
      cargoDetails: requestData.cargoDetails,
      warehouseRequirement: requestData.warehouseRequirement,
      schedule: requestData.schedule,
      specialInstructions: requestData.specialInstructions,
      status: requestData.status
    }));

    if (requestData.documents?.storageChecklist instanceof File) {
      formData.append('storageChecklist', requestData.documents.storageChecklist);
    }

    const response = await fetch(`${API_URL}/storage-requests/${requestId}`, {
      method: 'PUT',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error updating storage request');
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return { success: true, message: 'Storage request updated successfully' };
  } catch (error) {
    console.error('Error in updateStorageRequest:', error);
    throw error;
  }
};

// Delete a storage request
export const deleteStorageRequest = async (requestId) => {
  try {
    const response = await fetch(`${API_URL}/storage-requests/${requestId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Error deleting storage request'
      }));
      throw new Error(errorData.error || 'Error deleting storage request');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in deleteStorageRequest:', error);
    throw error;
  }
};

export const getTransloadingRequests = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`${API_URL}/transloading-requests?${queryParams}`);

    if (!response.ok) {
      throw new Error('Error fetching transloading requests');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in getTransloadingRequests:', error);
    throw error;
  }
};

export const getTransloadingRequestById = async (requestId) => {
  try {
    const response = await fetch(`${API_URL}/transloading-requests/${requestId}`);

    if (!response.ok) {
      throw new Error('Error fetching transloading request');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in getTransloadingRequestById:', error);
    throw error;
  }
};

export const submitTransloadingRequest = async (requestData) => {
  try {
    const formData = new FormData();
    formData.append('transloadingDetails', JSON.stringify({
      cargoDetails: requestData.cargoDetails,
      destinationArea: requestData.destinationArea,
      transloadingTimeWindow: requestData.transloadingTimeWindow,
      specialInstructions: requestData.specialInstructions || '',
      company: requestData.company
    }));

    if (requestData.documents?.transloadingSheet instanceof File) {
      formData.append('transloadingSheet', requestData.documents.transloadingSheet);
    }

    if (Array.isArray(requestData.documents?.additionalDocs)) {
      requestData.documents.additionalDocs.forEach((doc) => {
        if (doc instanceof File) {
          formData.append('additionalDoc', doc);
        }
      });
    }

    const response = await fetch(`${API_URL}/transloading-requests`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error submitting transloading request');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in submitTransloadingRequest:', error);
    throw error;
  }
};

export const updateTransloadingRequest = async (requestId, requestData) => {
  try {
    const formData = new FormData();
    formData.append('transloadingDetails', JSON.stringify({
      cargoDetails: requestData.cargoDetails,
      destinationArea: requestData.destinationArea,
      transloadingTimeWindow: requestData.transloadingTimeWindow,
      specialInstructions: requestData.specialInstructions,
      status: requestData.status
    }));

    if (requestData.documents?.transloadingSheet instanceof File) {
      formData.append('transloadingSheet', requestData.documents.transloadingSheet);
    }

    const response = await fetch(`${API_URL}/transloading-requests/${requestId}`, {
      method: 'PUT',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error updating transloading request');
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return { success: true, message: 'Transloading request updated successfully' };
  } catch (error) {
    console.error('Error in updateTransloadingRequest:', error);
    throw error;
  }
};

export const deleteTransloadingRequest = async (requestId) => {
  try {
    const response = await fetch(`${API_URL}/transloading-requests/${requestId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Error deleting transloading request'
      }));
      throw new Error(errorData.error || 'Error deleting transloading request');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in deleteTransloadingRequest:', error);
    throw error;
  }
};

export const getContainerRequestsByCarrier = async (carrierName) => {
  try {
    const response = await fetch(`${API_URL}/container-requests/carrier/${encodeURIComponent(carrierName)}`);
    if (!response.ok) {
      throw new Error("Failed to fetch container requests");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching container requests:", error);
    throw error;
  }
};

export const assignContainer = async (requestId, assignmentData) => {
  try {
    const response = await fetch(`${API_URL}/container-requests/${requestId}/assign`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(assignmentData),
    });
    if (!response.ok) {
      throw new Error("Failed to assign container");
    }
    return await response.json();
  } catch (error) {
    console.error("Error assigning container:", error);
    throw error;
  }
};

export const rejectContainerRequest = async (requestId, rejectionData) => {
  try {
    const response = await fetch(`${API_URL}/container-requests/${requestId}/reject`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rejectionData),
    });
    if (!response.ok) {
      throw new Error("Failed to reject container request");
    }
    return await response.json();
  } catch (error) {
    console.error("Error rejecting container request:", error);
    throw error;
  }
};

const api = {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  getCurrentUserCompany,
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
  getWarehouses,
  getWarehouseById,
  getFacilityRentals,
  createFacilityRental,
  updateFacilityRental,
  deleteFacilityRental,
  checkFacilityAvailability,
  getOperatorRequisitions,
  createOperatorRequisition,
  updateOperatorRequisition,
  deleteOperatorRequisition,
  getAssets,
  getFacilities,
  getVesselVisits,
  createVesselVisit,
  updateVesselVisit,
  getAllUsersInCompany,
  getCargoManifests,
  submitCargoManifest,
  updateCargoManifest,
  deleteCargoManifest,
  getVesselVisitRequestsAdHocRequest,
  getAdHocResourceRequests,
  submitAdHocResourceRequest,
  updateAdHocResourceRequest,
  getContainerTypesForCompany,
  addContainerType,
  getCarrierContainerPrices,
  assignContainerPrice,
  updateContainerPrice,
  deleteContainerPrice,
  getBillingRequests,
  getBillingRequestsByMonth,
  registerTruckForCargo,
  getContainerRequests,
  createContainerRequest,
  updateContainerRequest,
  deleteContainerRequest,
  getBookingById,
  getBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  getBillingRequestsByMonth1,
  uploadBookingDocument,
  retrieveBookingDocument,
  getPricingRates,
  updateSamplingRequest,
  submitSamplingRequest,
  getSamplingRequests,
  deleteSamplingRequest,
  getSamplingRequestById,
  submitRepackingRequest,
  updateRepackingRequest,
  getRepackingRequestById,
  deleteRepackingRequest,
  getRepackingRequests,
  getStorageRequests,
  getStorageRequestById,
  submitStorageRequest,
  updateStorageRequest,
  deleteStorageRequest,
  getTransloadingRequests,
  getTransloadingRequestById,
  submitTransloadingRequest,
  updateTransloadingRequest,
  deleteTransloadingRequest,
  getContainerRequestsByCarrier,
  assignContainer,
  rejectContainerRequest

};

export default api;
