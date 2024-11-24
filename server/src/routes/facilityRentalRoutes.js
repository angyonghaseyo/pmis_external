const express = require('express');
const { db } = require('../config/firebase');
const FacilityRentalService = require('../services/facilityRentalService');
const FacilityRentalController = require('../controllers/facilityRentalController');

const router = express.Router();
const facilityRentalService = new FacilityRentalService(db);
const facilityRentalController = new FacilityRentalController(facilityRentalService);

router.get('/facility-rentals', (req, res) => facilityRentalController.getFacilityRentals(req, res));
router.post('/facility-rentals', (req, res) => facilityRentalController.createFacilityRental(req, res));
router.put('/facility-rentals/:id', (req, res) => facilityRentalController.updateFacilityRental(req, res));
router.delete('/facility-rentals/:id', (req, res) => facilityRentalController.deleteFacilityRental(req, res));
router.post('/facility-rentals/check-availability', (req, res) => facilityRentalController.checkAvailability(req, res));

module.exports = router;