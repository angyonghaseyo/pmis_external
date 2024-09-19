import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { getCurrentUser, getUserData } from './services/api';
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
import { Box, CssBaseline, CircularProgress } from '@mui/material';

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
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        {user && <Sidebar userType={userType} />}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            padding: '1rem',
            width: '100%',
            maxWidth: `calc(100% - ${drawerWidth}px)`,
            mt: '80px',
          }}
        >
          <Header user={user} />
          <Routes>
            {user ? (
              <>
                <Route path="/" element={<UserWorkspace user={user} />} />
                <Route path="/manpower/inquiries-and-feedback" element={<InquiryFeedback />} />
                <Route path="/manpower/training-program" element={<TrainingProgram />} />
                <Route path="/manpower/operator-requisition" element={<OperatorRequisition />} />
                <Route path="/inquiries/:id" element={<InquiryFeedbackDetail />} />
                <Route path="/settings/profile" element={<EditProfile user={user} />} />
                {userType === 'Admin' && (
                  <>
                    <Route path="/settings/users" element={<SettingsUsers />} />
                    <Route path="/settings/company" element={<CompanyInfo />} />
                  </>
                )}
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