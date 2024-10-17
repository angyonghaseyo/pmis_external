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
router.post('/login', (req, res) => {
  // Implement login logic here
  res.status(501).json({ message: 'Login functionality not implemented' });
});

// User Logout
router.post('/logout', (req, res) => {
  // Implement logout logic here
  res.status(501).json({ message: 'Logout functionality not implemented' });
});

// Password Reset Request
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    await firebaseUtils.sendPasswordResetEmail(email);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to send password reset email' });
  }
});

module.exports = router;