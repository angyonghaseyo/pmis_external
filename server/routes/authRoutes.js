const express = require('express');
const router = express.Router();
const firebaseUtils = require('../utils/firebaseUtils');
const { validateRegistration } = require('../middleware/validationMiddleware');

// User Registration
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { email, password, firstName, lastName, company } = req.body;
    const userData = {
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      company,
    };
    
    const userRecord = await firebaseUtils.createUser(userData);
    res.status(201).json({ message: 'User registered successfully', uid: userRecord.uid });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  console.log('Login attempt:', req.body.email);
  try {
    const { email, password } = req.body;
    console.log('Attempting to sign in with email and password');
    const userCredential = await firebaseUtils.signInWithEmailAndPassword(email, password);
    console.log('Sign in successful, getting user');
    const user = userCredential.user;
    console.log('Getting ID token');
    const token = await user.getIdToken();
    console.log('Login successful for user:', user.uid);
    
    res.json({ 
      message: 'Login successful',
      token: token,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid email or password', details: error.message });
  }
});


// User Logout
router.post('/logout', async (req, res) => {
  try {
    // Firebase handles token invalidation on the client-side
    // Here we're just sending a success response
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Password Reset Request
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    await firebaseUtils.sendPasswordResetEmail(email);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to send password reset email' });
  }
});

// Confirm Password Reset
router.post('/reset-password', async (req, res) => {
  try {
    const { oobCode, newPassword } = req.body;
    await firebaseUtils.confirmPasswordReset(oobCode, newPassword);
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset confirmation error:', error);
    res.status(400).json({ error: 'Invalid or expired password reset code' });
  }
});

// Verify Reset Password Code
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { oobCode } = req.body;
    const email = await firebaseUtils.verifyPasswordResetCode(oobCode);
    res.json({ email });
  } catch (error) {
    console.error('Error verifying reset code:', error);
    res.status(400).json({ error: 'Invalid or expired reset code' });
  }
});

module.exports = router;