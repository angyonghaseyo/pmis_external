import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import Header from './Header';
import Sidebar from './Sidebar';
import UserWorkspace from './components/UserWorkspace';
import SettingsUsers from './components/SettingsUsers';
import SettingsProfile from './components/SettingsProfile';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import ForgotPassword from './ForgetPassword';
import ResetPassword from './ResetPassword';
import EditProfile from './EditProfile';
import { Box, CssBaseline, CircularProgress } from '@mui/material';

const drawerWidth = 240;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().userType);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
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
        {user && <Sidebar user={user} userRole={userRole} />}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            padding: '1rem',
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            mt: '64px', // Adjust based on your Header height
          }}
        >
          <Header user={user} />
          <Routes>
            {user ? (
              <>
                <Route path="/" element={<UserWorkspace user={user} />} />
                <Route path="/settings/profile" element={<SettingsProfile user={user} />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                {userRole === 'Admin' && (
                  <Route path="/settings/users" element={<SettingsUsers />} />
                )}
                {/* Add more authenticated routes here as needed */}
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