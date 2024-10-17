import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

const PrivateRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? children : <Navigate to="/login" />;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setUserAndToken = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  useEffect(() => {
    console.log('App component mounted or updated');
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    console.log('Stored token:', token ? 'exists' : 'does not exist');
    console.log('Stored user:', storedUser);
    if (token && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      console.log('Setting user state:', parsedUser);
      setUser(parsedUser);
    } else {
      console.log('No stored user or token found');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    console.log('User state changed:', user);
  }, [user]);

  const handleLogout = () => {
    console.log('Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    console.log('User state cleared');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  console.log('Rendering App component, user:', user);

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        {user && <Header user={user} onLogout={handleLogout} />}
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
                <Route path="/" element={<PrivateRoute><UserWorkspace user={user} /></PrivateRoute>} />
                <Route path="/settings/users" element={<PrivateRoute><SettingsUsers user={user} /></PrivateRoute>} />
                <Route path="/settings/profile" element={<PrivateRoute><EditProfile user={user} /></PrivateRoute>} />
                <Route path="/settings/company" element={<PrivateRoute><CompanyInfo user={user} /></PrivateRoute>} />
                <Route path="/manpower/inquiries-and-feedback" element={<PrivateRoute><InquiryFeedback user={user} /></PrivateRoute>} />
                <Route path="/manpower/training-program" element={<PrivateRoute><TrainingProgram user={user} /></PrivateRoute>} />
                <Route path="/manpower/operator-requisition" element={<PrivateRoute><OperatorRequisition user={user} /></PrivateRoute>} />
                <Route path="/vessels/vessel-visit-request" element={<PrivateRoute><VesselVisits user={user} /></PrivateRoute>} />
                <Route path="/cargos/cargo-manifest" element={<PrivateRoute><CargoManifest user={user} /></PrivateRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/login" element={<LoginForm setUserAndToken={setUserAndToken} />} />
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