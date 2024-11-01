const express = require('express');
const { db } = require('../config/firebase'); // Ensure Firebase is initialized
const CargoService = require('../services/cargoService');
const CargoController = require('../controllers/cargoController');

const router = express.Router();
const cargoService = new CargoService(db);
const cargoController = new CargoController(cargoService);

router.get('/cargo-manifests', (req, res) => cargoController.getCargoManifests(req, res));
router.post('/cargo-manifests', (req, res) => cargoController.submitCargoManifest(req, res));
router.put('/cargo-manifests/:id', (req, res) => cargoController.updateCargoManifest(req, res));
router.delete('/cargo-manifests/:id', (req, res) => cargoController.deleteCargoManifest(req, res));

module.exports = router;