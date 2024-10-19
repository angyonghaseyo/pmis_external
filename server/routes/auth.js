const express = require('express');
const router = express.Router();
const admin = require('../config/firebaseAdmin');

// Login user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        const token = await admin.auth().createCustomToken(userRecord.uid);
        res.json({ token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Register user
router.post('/register', async (req, res) => {
    const { email, password, firstName, lastName, company } = req.body;
    try {
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
            userType: 'Normal',
        });
        res.status(201).json({ message: 'User created successfully', userId: userRecord.uid });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;