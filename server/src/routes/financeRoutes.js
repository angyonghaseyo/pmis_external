// routes/financeRoutes.js
const express = require('express');
const FinanceService = require('../services/financeService');
const FinanceController = require('../controllers/financeController')

const router = express.Router();
const financeService = new FinanceService();
const financeController = new FinanceController(financeService);

router.get('/billing-requests', (req, res) => financeController.getBillingRequests(req, res));

module.exports = router;