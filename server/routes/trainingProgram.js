const express = require('express');
const router = express.Router();
const admin = require('../config/firebase-admin');

// Get all training programs
router.get('/', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('training_programs').get();
    
    const programs = [];
    snapshot.forEach(doc => {
      programs.push({ id: doc.id, ...doc.data() });
    });
    
    res.status(200).json(programs);
  } catch (error) {
    console.error('Error fetching training programs:', error);
    res.status(500).json({ error: 'Error fetching training programs' });
  }
});

// Get user's enrolled programs
router.get('/enrolled', async (req, res) => {
  try {
    const userId = req.user.uid;
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    const enrolledPrograms = userData.enrolledPrograms || [];
    
    res.status(200).json(enrolledPrograms);
  } catch (error) {
    console.error('Error fetching enrolled programs:', error);
    res.status(500).json({ error: 'Error fetching enrolled programs' });
  }
});

// Enroll in a training program
router.post('/enroll/:programId', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { programId } = req.params;
    
    const userRef = admin.firestore().collection('users').doc(userId);
    const programRef = admin.firestore().collection('training_programs').doc(programId);
    
    await admin.firestore().runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const programDoc = await transaction.get(programRef);
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      if (!programDoc.exists) {
        throw new Error('Training program not found');
      }
      
      const userData = userDoc.data();
      const programData = programDoc.data();
      
      if (programData.participants >= programData.capacity) {
        throw new Error('Program is full');
      }
      
      const newEnrollment = {
        programId,
        enrollmentDate: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      transaction.update(userRef, {
        enrolledPrograms: admin.firestore.FieldValue.arrayUnion(newEnrollment),
      });
      
      transaction.update(programRef, {
        participants: admin.firestore.FieldValue.increment(1),
      });
    });
    
    res.status(200).json({ message: 'Enrolled in training program successfully' });
  } catch (error) {
    console.error('Error enrolling in training program:', error);
    res.status(500).json({ error: 'Error enrolling in training program' });
  }
});

module.exports = router;