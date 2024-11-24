const express = require('express');
const { db } = require('../config/firebase');
const TrainingService = require('../services/trainingService');
const TrainingController = require('../controllers/trainingController');

const router = express.Router();
const trainingService = new TrainingService(db);
const trainingController = new TrainingController(trainingService);

// Get all training programs
router.get('/training-programs', (req, res) => 
    trainingController.getTrainingPrograms(req, res)
);

// Register for a training program
router.post('/training-programs/:programId/register', (req, res) => 
    trainingController.registerForProgram(req, res)
);

// Withdraw from a training program
router.post('/training-programs/:programId/withdraw', (req, res) => 
    trainingController.withdrawFromProgram(req, res)
);

// Update completion status for all programs
router.post('/training-programs/update-completion', (req, res) => 
    trainingController.updateProgramCompletionStatus(req, res)
);

module.exports = router;