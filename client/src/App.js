import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
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
import { Box, CssBaseline } from '@mui/material';

const drawerWidth = 240;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        {user && <Sidebar />}
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
                <Route path="/inquiries/:id" element={<InquiryFeedbackDetail />} /> 
                <Route path="/settings/profile" element={<EditProfile user={user} />} />
                <Route path="/settings/users" element={<SettingsUsers />} />
                <Route path="/settings/company" element={<CompanyInfo />} /> 
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
