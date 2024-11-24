const express = require('express');
const { db } = require('../config/firebase');
const WarehouseService = require('../services/warehouseService');
const WarehouseController = require('../controllers/warehouseController');

const router = express.Router();
const warehouseService = new WarehouseService(db);
const warehouseController = new WarehouseController(warehouseService);

router.get('/warehouses', (req, res) => warehouseController.getWarehouses(req, res));
router.get('/warehouses/:id', (req, res) => warehouseController.getWarehouseById(req, res));

module.exports = router;