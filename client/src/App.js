import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { auth } from './firebaseConfig';
import { CircularProgress, Box } from '@mui/material';

// Import components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginForm from './components/LoginForm';
import SignUpForm from './components/SignUpForm';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import UserWorkspace from './components/UserWorkspace';
import EditProfile from './components/EditProfile';
import InquiryFeedback from './components/InquiryFeedback';
import OperatorRequisition from './components/OperatorRequisition';
import TrainingProgram from './components/TrainingProgram';
import CargoManifest from './components/CargoManifest';
import VesselVisits from './components/VesselVisits';
import CompanyInfo from './components/CompanyInfo';
import SettingsUsers from './components/SettingsUsers';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
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
      {user ? (
        <Box sx={{ display: 'flex' }}>
          <Header user={user} />
          <Sidebar user={user} />
          <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
            <Routes>
              <Route path="/" element={<UserWorkspace user={user} />} />
              <Route path="/profile" element={<EditProfile />} />
              <Route path="/inquiry-feedback" element={<InquiryFeedback />} />
              <Route path="/operator-requisition" element={<OperatorRequisition />} />
              <Route path="/training-program" element={<TrainingProgram />} />
              <Route path="/cargo-manifest" element={<CargoManifest />} />
              <Route path="/vessel-visits" element={<VesselVisits />} />
              <Route path="/company-info" element={<CompanyInfo />} />
              <Route path="/settings/users" element={<SettingsUsers />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Box>
        </Box>
      ) : (
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignUpForm />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
