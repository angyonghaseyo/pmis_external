const express = require('express');
const router = express.Router();
const admin = require('../config/firebase-admin');

// Get all vessel visits
router.get('/', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('vessel_visits').get();
    
    const visits = [];
    snapshot.forEach(doc => {
      visits.push({ id: doc.id, ...doc.data() });
    });
    
    res.status(200).json(visits);
  } catch (error) {
    console.error('Error fetching vessel visits:', error);
    res.status(500).json({ error: 'Error fetching vessel visits' });
  }
});

// Create a new vessel visit
router.post('/', async (req, res) => {
  try {
    const { vesselName, eta, etd, purpose, cargoDetails } = req.body;
    
    const docRef = await admin.firestore().collection('vessel_visits').add({
      vesselName,
      eta,
      etd,
      purpose,
      cargoDetails,
      status: 'Scheduled',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.uid,
    });
    
    res.status(201).json({ id: docRef.id, message: 'Vessel visit created successfully' });
  } catch (error) {
    console.error('Error creating vessel visit:', error);
    res.status(500).json({ error: 'Error creating vessel visit' });
  }
});

// Update a vessel visit
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    await admin.firestore().collection('vessel_visits').doc(id).update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.user.uid,
    });
    
    res.status(200).json({ message: 'Vessel visit updated successfully' });
  } catch (error) {
    console.error('Error updating vessel visit:', error);
    res.status(500).json({ error: 'Error updating vessel visit' });
  }
});

// Delete a vessel visit
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await admin.firestore().collection('vessel_visits').doc(id).delete();
    
    res.status(200).json({ message: 'Vessel visit deleted successfully' });
  } catch (error) {
    console.error('Error deleting vessel visit:', error);
    res.status(500).json({ error: 'Error deleting vessel visit' });
  }
});

module.exports = router;