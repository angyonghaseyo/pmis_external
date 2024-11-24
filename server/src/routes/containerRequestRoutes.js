// containerRequestRoutes.js
const express = require('express');
const { db } = require('../config/firebase');
const ContainerRequestService = require('../services/containerRequestService');
const ContainerRequestController = require('../controllers/containerRequestController');

const router = express.Router();
const containerRequestService = new ContainerRequestService(db);
const containerRequestController = new ContainerRequestController(containerRequestService);

router.get('/container-requests', (req, res) => containerRequestController.getContainerRequests(req, res));
router.post('/container-requests', (req, res) => containerRequestController.createContainerRequest(req, res));
router.put('/container-requests/:id', (req, res) => containerRequestController.updateContainerRequest(req, res));
router.delete('/container-requests/:id', (req, res) => containerRequestController.deleteContainerRequest(req, res));
router.get('/container-requests/carrier/:carrierName', (req, res) =>
    containerRequestController.getRequestsByCarrier(req, res));
router.put('/container-requests/:id/assign', (req, res) =>
    containerRequestController.assignContainer(req, res));
router.put('/container-requests/:id/reject', (req, res) =>
    containerRequestController.rejectRequest(req, res));

module.exports = router;