const express = require('express');
const router = express.Router();
const admin = require('../config/firebaseAdmin');

router.get('/resources', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('resources')
      .where('userType', '==', 'external')
      .get();
    const resources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Error fetching resources' });
  }
});

module.exports = router;
