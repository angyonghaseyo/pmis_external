const express = require('express');
const router = express.Router();
const admin = require('../config/firebase-admin');

// Get all cargo manifests
router.get('/', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('cargo_manifests').get();
    
    const manifests = [];
    snapshot.forEach(doc => {
      manifests.push({ id: doc.id, ...doc.data() });
    });
    
    res.status(200).json(manifests);
  } catch (error) {
    console.error('Error fetching cargo manifests:', error);
    res.status(500).json({ error: 'Error fetching cargo manifests' });
  }
});

// Create a new cargo manifest
router.post('/', async (req, res) => {
  try {
    const { vesselName, arrivalDate, departureDate, cargoItems } = req.body;
    
    const docRef = await admin.firestore().collection('cargo_manifests').add({
      vesselName,
      arrivalDate,
      departureDate,
      cargoItems,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.uid,
    });
    
    res.status(201).json({ id: docRef.id, message: 'Cargo manifest created successfully' });
  } catch (error) {
    console.error('Error creating cargo manifest:', error);
    res.status(500).json({ error: 'Error creating cargo manifest' });
  }
});

// Update a cargo manifest
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    await admin.firestore().collection('cargo_manifests').doc(id).update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.user.uid,
    });
    
    res.status(200).json({ message: 'Cargo manifest updated successfully' });
  } catch (error) {
    console.error('Error updating cargo manifest:', error);
    res.status(500).json({ error: 'Error updating cargo manifest' });
  }
});

// Delete a cargo manifest
router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      await admin.firestore().collection('cargo_manifests').doc(id).delete();
      
      res.status(200).json({ message: 'Cargo manifest deleted successfully' });
    } catch (error) {
      console.error('Error deleting cargo manifest:', error);
      res.status(500).json({ error: 'Error deleting cargo manifest' });
    }
  });
  
  module.exports = router;