const express = require('express');
const router = express.Router();
const cors = require('cors');
const { db } = require('../config/firebase');
const CargoSamplingService = require('../services/cargoSamplingService');
const CargoSamplingController = require('../controllers/cargoSamplingController');

// Initialize services and controllers
const cargoSamplingService = new CargoSamplingService(db);
const cargoSamplingController = new CargoSamplingController(cargoSamplingService);

// Apply CORS
router.use(cors());

// Base routes
router.get('/sampling-requests', (req, res) => cargoSamplingController.getSamplingRequests(req, res));
router.post('/sampling-requests', (req, res) => cargoSamplingController.createSamplingRequest(req, res));
router.put('/sampling-requests/:id', (req, res) => cargoSamplingController.updateSamplingRequest(req, res));
router.delete('/sampling-requests/:id', (req, res) => cargoSamplingController.deleteSamplingRequest(req, res));

module.exports = router;