const express = require('express');
const { db } = require('../config/firebase'); // Ensure Firebase is initialized
const OperatorService = require('../services/operatorService');
const OperatorController = require('../controllers/operatorController');

const router = express.Router();
const operatorService = new OperatorService(db);
const operatorController = new OperatorController(operatorService);

router.get('/operator-requisitions/:userId', (req, res) => operatorController.getOperatorRequisitions(req, res));
router.post('/operator-requisitions', (req, res) => operatorController.createOperatorRequisition(req, res));
router.put('/operator-requisitions/:id', (req, res) => operatorController.updateOperatorRequisition(req, res));
router.delete('/operator-requisitions/:id', (req, res) => operatorController.deleteOperatorRequisition(req, res));

module.exports = router;