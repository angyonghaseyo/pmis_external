const firebaseUtils = require('../utils/firebaseUtils');

const trainingProgramController = {
  // Get all training programs
  async getAllPrograms(req, res) {
    try {
      const programs = await firebaseUtils.getDocuments('training_programs');
      res.json(programs);
    } catch (error) {
      console.error('Error fetching training programs:', error);
      res.status(500).json({ error: 'Failed to fetch training programs' });
    }
  },

  // Get a specific training program
  async getProgram(req, res) {
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
  },

  // Register for a training program
  async registerForProgram(req, res) {
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
  },

  // Withdraw from a training program
  async withdrawFromProgram(req, res) {
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
  },

  // Get enrolled programs for the user
  async getEnrolledPrograms(req, res) {
    try {
      const userId = req.user.uid;
      const user = await firebaseUtils.getUser(userId);

      if (!user.enrolledPrograms) {
        return res.json([]);
      }

      const enrolledProgramIds = user.enrolledPrograms.map(ep => ep.programId);
      const enrolledPrograms = await Promise.all(
        enrolledProgramIds.map(id => firebaseUtils.getDocument('training_programs', id))
      );

      res.json(enrolledPrograms.filter(program => program !== null));
    } catch (error) {
      console.error('Error fetching enrolled programs:', error);
      res.status(500).json({ error: 'Failed to fetch enrolled programs' });
    }
  }
};

module.exports = trainingProgramController;