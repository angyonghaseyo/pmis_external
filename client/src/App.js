import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import Header from './Header';
import UserWorkspace from './components/UserWorkspace';
import UserAccountManagement from './components/UserAccountManagement';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import ForgotPassword from './ForgetPassword';
import ResetPassword from './ResetPassword';
import './App.css';

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
      <div className="App">
        <Header user={user} />
        <main className="main-content">
          <Routes>
            <Route path="/login" element={!user ? <LoginForm /> : <Navigate to="/" />} />
            <Route path="/signup" element={!user ? <SignUpForm /> : <Navigate to="/" />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/"
              element={
                user ? (
                  <>
                    <UserWorkspace user={user} />
                    <UserAccountManagement />
                  </>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;