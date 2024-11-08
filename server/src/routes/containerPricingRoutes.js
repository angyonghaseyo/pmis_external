const express = require('express');
const { db } = require('../config/firebase'); 
const ContainerPricingService = require('../services/containerPricingService');
const ContainerPricingController = require('../controllers/containerPricingController');

const router = express.Router();
const containerPricingService = new ContainerPricingService(db);
const containerPricingController = new ContainerPricingController(containerPricingService);

router.get('/carrier-container-prices', (req, res) => containerPricingController.getCarrierContainerPrices(req, res));
router.post('/carrier-container-prices', (req, res) => containerPricingController.assignContainerPrice(req, res));
router.put('/carrier-container-prices/:company/:equipmentId', (req, res) => containerPricingController.updateContainerPrice(req, res));
router.delete('/carrier-container-prices/:company/:equipmentId', (req, res) => containerPricingController.deleteContainerPrice(req, res));

module.exports = router;