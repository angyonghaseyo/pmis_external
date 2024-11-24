const express = require('express');
const router = express.Router();
const PricingController = require('../controllers/pricingController');
const PricingService = require('../services/pricingService');

const pricingService = new PricingService();
const pricingController = new PricingController(pricingService);

router.get('/pricing-rates', (req, res) => pricingController.getPricingRates(req, res));

module.exports = router;