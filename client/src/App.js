import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { getUserData } from './services/api';
import Header from './Header';
import Sidebar from './Sidebar';
import UserWorkspace from './components/UserWorkspace';
import SettingsUsers from './components/SettingsUsers';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import ForgotPassword from './ForgetPassword';
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
        const userData = await getUserData(currentUser.uid);
        setUserType(userData.userType);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
      simulateBerthTestData();
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <Header user={user} />
        {user && <Sidebar userType={userType} />}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: user ? `calc(100% - ${drawerWidth}px)` : '100%',
            mt: '80px',
            minHeight: '100vh', // Ensure full height
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