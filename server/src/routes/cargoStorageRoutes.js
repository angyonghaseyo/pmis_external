const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { db } = require('../config/firebase');
const CargoStorageService = require('../services/cargoStorageService');
const CargoStorageController = require('../controllers/cargoStorageController');

const router = express.Router();
const cargoStorageService = new CargoStorageService(db);
const cargoStorageController = new CargoStorageController(cargoStorageService);

// Routes for cargo storage
router.get('/storage-requests', (req, res) => cargoStorageController.getStorageRequests(req, res));
router.get('/storage-requests/:id', (req, res) => cargoStorageController.getStorageRequestById(req, res));
router.post('/storage-requests', upload.fields([
    { name: 'storageChecklist', maxCount: 1 },
    { name: 'additionalDoc', maxCount: 5 }
]), (req, res) => cargoStorageController.submitStorageRequest(req, res));
router.put('/storage-requests/:id', upload.fields([
    { name: 'storageChecklist', maxCount: 1 },
    { name: 'additionalDoc', maxCount: 5 }
]), (req, res) => cargoStorageController.updateStorageRequest(req, res));
router.delete('/storage-requests/:id', (req, res) => cargoStorageController.deleteStorageRequest(req, res));

module.exports = router;