const express = require('express');
const { db } = require('../config/firebase'); // Ensure Firebase is initialized
const FacilityService = require('../services/facilityService');
const FacilityController = require('../controllers/facilityController');

const router = express.Router();
const facilityService = new FacilityService(db);
const facilityController = new FacilityController(facilityService);

router.post('/check-facility-availability', (req, res) => facilityController.checkFacilityAvailability(req, res));

module.exports = router;