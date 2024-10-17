import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { getUserData } from './services/api';
import Header from './Header';
import Sidebar from './Sidebar';
import UserWorkspace from './components/UserWorkspace';
import SettingsUsers from './components/SettingsUsers';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import EditProfile from './EditProfile';
import InquiryFeedback from './InquiryFeedback';
import InquiryFeedbackDetail from './InquiryFeedbackDetail';
import TrainingProgram from './TrainingProgram';
import CompanyInfo from './CompanyInfo';
import OperatorRequisition from './OperatorRequisition';
import VesselVisits from './VesselVisits';
import CargoManifest from './CargoManifest'; // Add this import
import { Box, CssBaseline, CircularProgress } from '@mui/material';
import { simulateBerthTestData } from './SimulateBerthTestData'; 
import { simulateManpowerTestData } from './SimulateManpowerTestData';
import { simulateAssetTestData } from './SimulateAssetTestData';

const drawerWidth = 240;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const runSimulations = useCallback(async () => {
    try {
      console.log("Starting simulations...");
      await simulateBerthTestData();
      console.log("Berth simulation completed");
      await simulateManpowerTestData();
      console.log("Manpower simulation completed");
      await simulateAssetTestData();
      console.log("Asset simulation completed");
    } catch (error) {
      console.error("Error running simulations:", error);
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async (currentUser) => {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('Fetched user data:', userData);
          setUser({
            ...currentUser,
            ...userData,
            accessRights: userData.accessRights || []
          });
          
          // Run simulations after user data is fetched
          await runSimulations();
        } else {
          console.log("No user profile found in 'users' collection, signing out");
          await signOut(auth);
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        await signOut(auth);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await fetchUserData(currentUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [runSimulations]);

  const hasAccessRights = (requiredRights) => {
    console.log('User access rights:', user?.accessRights);
    console.log('Required rights:', requiredRights);
    if (!user || !user.accessRights) return false;
    const hasRights = requiredRights.some(right => user.accessRights.includes(right));
    console.log('Has required rights:', hasRights);
    return hasRights;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        {user && <Header user={user} />}
        {user && <Sidebar user={user} />}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: user ? `calc(100% - ${drawerWidth}px)` : '100%',
            mt: user ? '80px' : 0,
            minHeight: '100vh',
          }}
        >
          <Routes>
            {user ? (
              <>
                <Route path="/" element={<UserWorkspace user={user} />} />
                {hasAccessRights(['View Inquiries and Feedbacks', 'Create Inquiries and Feedback']) && (
                  <Route path="/manpower/inquiries-and-feedback" element={<InquiryFeedback user={user} />} />
                )}
                {hasAccessRights(['Enrol Training Program']) && (
                  <Route path="/manpower/training-program" element={<TrainingProgram />} />
                )}
                {hasAccessRights(['View Operator Requisitions', 'Create Operator Requisition']) && (
                  <Route path="/manpower/operator-requisition" element={<OperatorRequisition user={user} />} />
                )}

                <Route path="/settings/profile" element={<EditProfile user={user} />} />
                {hasAccessRights(['View Users List', 'Delete User', 'Invite User', 'Delete User Invitations', 'View Invitations List']) && (
                  <Route path="/settings/users" element={<SettingsUsers user={user} />} />
                )}
                {hasAccessRights(['View Company Information', 'Edit Company Information']) && (
                  <Route path="/settings/company" element={<CompanyInfo user={user} />} />
                )}
                {hasAccessRights(['View Vessel Visit Requests', 'Create Vessel Visit Request', 'Edit Vessel Visit Requests', 'Delete Vessel Visit Requests']) && (
                  <Route path="/vessels/vessel-visit-request" element={<VesselVisits user={user} />} />
                )}
                {hasAccessRights(['View Cargo Manifests', 'Submit Cargo Manifest', 'Update Cargo Manifest', 'Delete Cargo Manifest']) && (
                  <Route path="/cargos/cargo-manifest" element={<CargoManifest user={user} />} />
                )}
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/signup" element={<SignUpForm />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="*" element={<Navigate to="/login" />} />
              </>
            )}
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;