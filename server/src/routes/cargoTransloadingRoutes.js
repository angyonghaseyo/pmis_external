const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { db } = require('../config/firebase');
const CargoTransloadingService = require('../services/cargoTransloadingService');
const CargoTransloadingController = require('../controllers/cargoTransloadingController');

const router = express.Router();
const cargoTransloadingService = new CargoTransloadingService(db);
const cargoTransloadingController = new CargoTransloadingController(cargoTransloadingService);

// Routes for cargo transloading
router.get('/transloading-requests', (req, res) => cargoTransloadingController.getTransloadingRequests(req, res));
router.get('/transloading-requests/:id', (req, res) => cargoTransloadingController.getTransloadingRequestById(req, res));
router.post('/transloading-requests', upload.fields([
    { name: 'transloadingSheet', maxCount: 1 },
    { name: 'additionalDoc', maxCount: 5 }
]), (req, res) => cargoTransloadingController.submitTransloadingRequest(req, res));
router.put('/transloading-requests/:id', upload.fields([
    { name: 'transloadingSheet', maxCount: 1 },
    { name: 'additionalDoc', maxCount: 5 }
]), (req, res) => cargoTransloadingController.updateTransloadingRequest(req, res));
router.delete('/transloading-requests/:id', (req, res) => cargoTransloadingController.deleteTransloadingRequest(req, res));

module.exports = router;