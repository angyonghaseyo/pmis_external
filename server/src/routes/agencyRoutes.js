const express = require('express');
const AgencyService = require('../services/agencyService');
const AgencyController = require('../controllers/agencyController');
const { db } = require('../config/firebase');

const router = express.Router();
const agencyService = new AgencyService(db);
const agencyController = new AgencyController(agencyService);

router.get('/agencies', (req, res) => agencyController.getAgencies(req, res));
router.post('/agencies/verify', (req, res) => agencyController.verifyAgencyAccess(req, res));
router.put('/agencies/document-status', (req, res) => agencyController.updateDocumentStatus(req, res));

module.exports = router;
