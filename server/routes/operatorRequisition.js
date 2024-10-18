const express = require('express');
const router = express.Router();
const admin = require('../config/firebase-admin');

// Get all operator requisitions for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.uid;
    const snapshot = await admin.firestore().collection('operator_requisitions')
      .where('userId', '==', userId)
      .get();
    
    const requisitions = [];
    snapshot.forEach(doc => {
      requisitions.push({ id: doc.id, ...doc.data() });
    });
    
    res.status(200).json(requisitions);
  } catch (error) {
    console.error('Error fetching operator requisitions:', error);
    res.status(500).json({ error: 'Error fetching operator requisitions' });
  }
});

// Create a new operator requisition
router.post('/', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { operatorSkill, date, time, duration } = req.body;
    
    const docRef = await admin.firestore().collection('operator_requisitions').add({
      userId,
      operatorSkill,
      date,
      time,
      duration,
      status: 'Pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    res.status(201).json({ id: docRef.id, message: 'Operator requisition created successfully' });
  } catch (error) {
    console.error('Error creating operator requisition:', error);
    res.status(500).json({ error: 'Error creating operator requisition' });
  }
});

// Update an operator requisition
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    await admin.firestore().collection('operator_requisitions').doc(id).update(updateData);
    
    res.status(200).json({ message: 'Operator requisition updated successfully' });
  } catch (error) {
    console.error('Error updating operator requisition:', error);
    res.status(500).json({ error: 'Error updating operator requisition' });
  }
});

// Delete an operator requisition
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await admin.firestore().collection('operator_requisitions').doc(id).delete();
    
    res.status(200).json({ message: 'Operator requisition deleted successfully' });
  } catch (error) {
    console.error('Error deleting operator requisition:', error);
    res.status(500).json({ error: 'Error deleting operator requisition' });
  }
});

module.exports = router;