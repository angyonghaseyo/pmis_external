const express = require('express');
const router = express.Router();
const admin = require('../config/firebaseAdmin');

router.post('/users', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const userRecord = await admin.auth().createUser({
      email,
      password: 'temporaryPassword',
      displayName: name,
    });
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      name,
      email,
      role,
      userType: 'admin'
    });
    res.status(201).json({ message: 'User created successfully', userId: userRecord.uid });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('users')
      .where('userType', '==', 'admin')
      .get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role } = req.body;
    await admin.firestore().collection('users').doc(userId).update({ name, email, role });
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error updating user' });
  }
});

router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await admin.auth().deleteUser(userId);
    await admin.firestore().collection('users').doc(userId).delete();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error deleting user' });
  }
});

module.exports = router;
