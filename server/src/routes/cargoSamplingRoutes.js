const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { db } = require('../config/firebase');
const CargoSamplingService = require('../services/cargoSamplingService');
const CargoSamplingController = require('../controllers/cargoSamplingController');

const router = express.Router();
const cargoSamplingService = new CargoSamplingService(db);
const cargoSamplingController = new CargoSamplingController(cargoSamplingService);

// Routes for cargo sampling
router.get('/sampling-requests', (req, res) => cargoSamplingController.getSamplingRequests(req, res));
router.get('/sampling-requests/:id', (req, res) => cargoSamplingController.getSamplingRequestById(req, res));
router.post('/sampling-requests', upload.fields([
    { name: 'safetyDataSheet', maxCount: 1 },
    { name: 'additionalDoc', maxCount: 5 }
]), (req, res) => cargoSamplingController.submitSamplingRequest(req, res));
router.put('/sampling-requests/:id', upload.fields([
    { name: 'safetyDataSheet', maxCount: 1 },
    { name: 'additionalDoc', maxCount: 5 }
]), (req, res) => cargoSamplingController.updateSamplingRequest(req, res));
router.delete('/sampling-requests/:id', (req, res) => cargoSamplingController.deleteSamplingRequest(req, res));

module.exports = router;