import React, { useState, useEffect } from 'react';
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
import { Box, CssBaseline, CircularProgress } from '@mui/material';
import { simulateBerthTestData } from './SimulateBerthTestData'; // Import the function

const drawerWidth = 240;

function App() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async (currentUser) => {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserType(userData.userType);
          setUser(currentUser);
        } else {
          console.log("No user profile found in 'users' collection, signing out");
          await signOut(auth);
          setUser(null);
          setUserType(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        await signOut(auth);
        setUser(null);
        setUserType(null);
      } finally {
        setLoading(false);
      }
      simulateBerthTestData();
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await fetchUserData(currentUser);
      } else {
        setUser(null);
        setUserType(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

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
        {user && <Sidebar userType={userType} />}
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
                <Route path="/" element={<UserWorkspace user={user} userType={userType} />} />
                <Route path="/manpower/inquiries-and-feedback" element={<InquiryFeedback userType={userType} />} />
                <Route path="/manpower/training-program" element={<TrainingProgram userType={userType} />} />
                <Route path="/manpower/operator-requisition" element={<OperatorRequisition userType={userType} />} />
                <Route path="/inquiries/:id" element={<InquiryFeedbackDetail userType={userType} />} />
                <Route path="/settings/profile" element={<EditProfile user={user} userType={userType} />} />
                <Route path="/settings/users" element={<SettingsUsers userType={userType} />} />
                <Route path="/settings/company" element={<CompanyInfo userType={userType} />} />
                <Route path="/vessels/vessel-visit-request" element={<VesselVisits userType={userType} />} />
                <Route path="*" element={<Navigate to="/" />} />
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