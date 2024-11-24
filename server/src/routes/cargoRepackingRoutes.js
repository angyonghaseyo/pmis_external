const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { db } = require('../config/firebase');
const CargoRepackingService = require('../services/cargoRepackingService');
const CargoRepackingController = require('../controllers/cargoRepackingController');

const router = express.Router();
const cargoRepackingService = new CargoRepackingService(db);
const cargoRepackingController = new CargoRepackingController(cargoRepackingService);

// Routes for cargo repacking
router.get('/repacking-requests', (req, res) => cargoRepackingController.getRepackingRequests(req, res));
router.get('/repacking-requests/:id', (req, res) => cargoRepackingController.getRepackingRequestById(req, res));
router.post('/repacking-requests', upload.fields([
    { name: 'repackagingChecklist', maxCount: 1 }
]), (req, res) => cargoRepackingController.submitRepackingRequest(req, res));
router.put('/repacking-requests/:id', upload.fields([
    { name: 'repackagingChecklist', maxCount: 1 }
]), (req, res) => cargoRepackingController.updateRepackingRequest(req, res));
router.delete('/repacking-requests/:id', (req, res) => cargoRepackingController.deleteRepackingRequest(req, res));

module.exports = router;