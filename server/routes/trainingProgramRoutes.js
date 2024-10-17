const express = require('express');
const router = express.Router();
const firebaseUtils = require('../utils/firebaseUtils');
const authMiddleware = require('../middleware/authMiddleware');

// Get all training programs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const programs = await firebaseUtils.getDocuments('training_programs');
    res.json(programs);
  } catch (error) {
    console.error('Error fetching training programs:', error);
    res.status(500).json({ error: 'Failed to fetch training programs' });
  }
});

// Get a specific training program
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const programId = req.params.id;
    const program = await firebaseUtils.getDocument('training_programs', programId);
    
    if (!program) {
      return res.status(404).json({ error: 'Training program not found' });
    }

    res.json(program);
  } catch (error) {
    console.error('Error fetching training program:', error);
    res.status(500).json({ error: 'Failed to fetch training program' });
  }
});

// Register for a training program
router.post('/:id/register', authMiddleware, async (req, res) => {
  try {
    const programId = req.params.id;
    const userId = req.user.uid;

    const program = await firebaseUtils.getDocument('training_programs', programId);
    
    if (!program) {
      return res.status(404).json({ error: 'Training program not found' });
    }

    if (program.numberOfCurrentRegistrations >= program.participantCapacity) {
      return res.status(400).json({ error: 'Program is already at full capacity' });
    }

    const user = await firebaseUtils.getUser(userId);

    if (user.enrolledPrograms && user.enrolledPrograms.some(ep => ep.programId === programId)) {
      return res.status(400).json({ error: 'User is already enrolled in this program' });
    }

    await firebaseUtils.runTransaction(async (transaction) => {
      // Update user document
      const userRef = firebaseUtils.db.collection('users').doc(userId);
      transaction.update(userRef, {
        enrolledPrograms: firebaseUtils.admin.firestore.FieldValue.arrayUnion({
          programId: programId,
          enrollmentDate: new Date().toISOString(),
          status: 'Enrolled'
        })
      });

      // Update program document
      const programRef = firebaseUtils.db.collection('training_programs').doc(programId);
      transaction.update(programRef, {
        numberOfCurrentRegistrations: firebaseUtils.admin.firestore.FieldValue.increment(1)
      });
    });

    res.json({ message: 'Successfully registered for the training program' });
  } catch (error) {
    console.error('Error registering for training program:', error);
    res.status(500).json({ error: 'Failed to register for training program' });
  }
});

// Withdraw from a training program
router.post('/:id/withdraw', authMiddleware, async (req, res) => {
  try {
    const programId = req.params.id;
    const userId = req.user.uid;

    const user = await firebaseUtils.getUser(userId);

    if (!user.enrolledPrograms || !user.enrolledPrograms.some(ep => ep.programId === programId)) {
      return res.status(400).json({ error: 'User is not enrolled in this program' });
    }

    await firebaseUtils.runTransaction(async (transaction) => {
      // Update user document
      const userRef = firebaseUtils.db.collection('users').doc(userId);
      transaction.update(userRef, {
        enrolledPrograms: user.enrolledPrograms.filter(ep => ep.programId !== programId)
      });

      // Update program document
      const programRef = firebaseUtils.db.collection('training_programs').doc(programId);
      transaction.update(programRef, {
        numberOfCurrentRegistrations: firebaseUtils.admin.firestore.FieldValue.increment(-1)
      });
    });

    res.json({ message: 'Successfully withdrawn from the training program' });
  } catch (error) {
    console.error('Error withdrawing from training program:', error);
    res.status(500).json({ error: 'Failed to withdraw from training program' });
  }
});

module.exports = router;