const express = require('express');
const router = express.Router();
const admin = require('../config/firebase-admin');

// Login
router.post('/login', async (req, res) => {
  // Firebase handles authentication on the client-side
  // This route can be used for additional server-side logic if needed
  res.status(200).json({ message: 'Login successful' });
});

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName, company } = req.body;
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });
    
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email,
      firstName,
      lastName,
      company,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ message: 'User created successfully', userId: userRecord.uid });
  } catch (error) {
    console.error('Error creating new user:', error);
    res.status(500).json({ error: 'Error creating new user' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  // Firebase handles logout on the client-side
  // This route can be used for additional server-side logic if needed
  res.status(200).json({ message: 'Logout successful' });
});

module.exports = router;