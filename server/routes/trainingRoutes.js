const express = require('express');
const { db } = require('../config/firebase'); // Ensure Firebase is initialized
const TrainingService = require('../services/trainingService');
const TrainingController = require('../controllers/trainingController');

const router = express.Router();
const trainingService = new TrainingService(db);
const trainingController = new TrainingController(trainingService);

router.get('/training-programs', (req, res) => trainingController.getTrainingPrograms(req, res));

module.exports = router;