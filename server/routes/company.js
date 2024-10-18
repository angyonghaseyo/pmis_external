const express = require('express');
const router = express.Router();
const admin = require('../config/firebase-admin');

// Get company information
router.get('/', async (req, res) => {
  try {
    const userId = req.user.uid;
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    const companyName = userData.company;
    
    const companyDoc = await admin.firestore().collection('companies').doc(companyName).get();
    
    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.status(200).json(companyDoc.data());
  } catch (error) {
    console.error('Error fetching company information:', error);
    res.status(500).json({ error: 'Error fetching company information' });
  }
});

// Update company information
router.put('/', async (req, res) => {
  try {
    const userId = req.user.uid;
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    const companyName = userData.company;
    
    const updateData = req.body;
    
    await admin.firestore().collection('companies').doc(companyName).update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: userId,
    });
    
    res.status(200).json({ message: 'Company information updated successfully' });
  } catch (error) {
    console.error('Error updating company information:', error);
    res.status(500).json({ error: 'Error updating company information' });
  }
});

module.exports = router;