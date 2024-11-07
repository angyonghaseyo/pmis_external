const express = require('express');
const { db } = require('../config/firebase'); // Ensure Firebase is initialized
const VesselService = require('../services/vesselService');
const VesselController = require('../controllers/vesselController');

const router = express.Router();
const vesselService = new VesselService(db);
const vesselController = new VesselController(vesselService);

router.get('/vessel-visits', (req, res) => vesselController.getVesselVisits(req, res));
router.get('/vessel-visits-confirmed-without-manifests', (req, res) => vesselController.getConfirmedVesselVisitsWithoutManifests(req, res));
router.get('/vessel-visits-adhoc-requests', (req, res) => vesselController.getVesselVisitsAdHocRequests(req, res));
router.get('/active-vessel-visits', (req, res) => vesselController.getActiveVesselVisits(req, res));

module.exports = router;