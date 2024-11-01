const express = require('express');
const { db } = require('../config/firebase');
const AdHocResourceRequestService = require('../services/adHocResourceRequestService');
const AdHocResourceRequestController = require('../controllers/adHocResourceRequestController');

const router = express.Router();
const adHocResourceRequestService = new AdHocResourceRequestService(db);
const adHocResourceRequestController = new AdHocResourceRequestController(adHocResourceRequestService);

router.get('/ad-hoc-resource-requests', (req, res) => adHocResourceRequestController.getAdHocResourceRequests(req, res));
router.post('/ad-hoc-resource-requests', (req, res) => adHocResourceRequestController.submitAdHocResourceRequest(req, res));
router.put('/ad-hoc-resource-requests/:id', (req, res) => adHocResourceRequestController.updateAdHocResourceRequest(req, res));

module.exports = router;