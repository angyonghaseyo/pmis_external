import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import UserWorkspace from './components/UserWorkspace';
import SettingsUsers from './components/SettingsUsers';
import LoginForm from './components/LoginForm';
import SignUpForm from './components/SignUpForm';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import EditProfile from './components/EditProfile';
import InquiryFeedback from './components/InquiryFeedback';
import TrainingProgram from './components/TrainingProgram';
import CompanyInfo from './components/CompanyInfo';
import OperatorRequisition from './components/OperatorRequisition';
import VesselVisits from './components/VesselVisits';
import CargoManifest from './components/CargoManifest';
import { Box, CssBaseline, CircularProgress } from '@mui/material';

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
            mt: user ? '64px' : 0,
          }}
        >
          <Routes>
            {user ? (
              <>
                <Route path="/" element={<UserWorkspace user={user} />} />
                <Route path="/settings/users" element={<SettingsUsers user={user} />} />
                <Route path="/settings/profile" element={<EditProfile user={user} />} />
                <Route path="/settings/company" element={<CompanyInfo user={user} />} />
                <Route path="/manpower/inquiries-and-feedback" element={<InquiryFeedback user={user} />} />
                <Route path="/manpower/training-program" element={<TrainingProgram user={user} />} />
                <Route path="/manpower/operator-requisition" element={<OperatorRequisition user={user} />} />
                <Route path="/vessels/vessel-visit-request" element={<VesselVisits user={user} />} />
                <Route path="/cargos/cargo-manifest" element={<CargoManifest user={user} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/signup" element={<SignUpForm />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            )}
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;