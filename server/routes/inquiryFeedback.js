const express = require('express');
const router = express.Router();
const admin = require('../config/firebase-admin');

// Get all inquiries and feedback for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.uid;
    const snapshot = await admin.firestore().collection('inquiries_feedback')
      .where('userId', '==', userId)
      .get();
    
    const inquiries = [];
    snapshot.forEach(doc => {
      inquiries.push({ id: doc.id, ...doc.data() });
    });
    
    res.status(200).json(inquiries);
  } catch (error) {
    console.error('Error fetching inquiries and feedback:', error);
    res.status(500).json({ error: 'Error fetching inquiries and feedback' });
  }
});

// Create a new inquiry or feedback
router.post('/', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { type, subject, description, urgency } = req.body;
    
    const docRef = await admin.firestore().collection('inquiries_feedback').add({
      userId,
      type,
      subject,
      description,
      urgency,
      status: 'Pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    res.status(201).json({ id: docRef.id, message: 'Inquiry/Feedback created successfully' });
  } catch (error) {
    console.error('Error creating inquiry/feedback:', error);
    res.status(500).json({ error: 'Error creating inquiry/feedback' });
  }
});

// Update an inquiry or feedback
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    await admin.firestore().collection('inquiries_feedback').doc(id).update(updateData);
    
    res.status(200).json({ message: 'Inquiry/Feedback updated successfully' });
  } catch (error) {
    console.error('Error updating inquiry/feedback:', error);
    res.status(500).json({ error: 'Error updating inquiry/feedback' });
  }
});

// Delete an inquiry or feedback
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await admin.firestore().collection('inquiries_feedback').doc(id).delete();
    
    res.status(200).json({ message: 'Inquiry/Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting inquiry/feedback:', error);
    res.status(500).json({ error: 'Error deleting inquiry/feedback' });
  }
});

module.exports = router;