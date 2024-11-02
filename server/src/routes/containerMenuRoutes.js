const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const ContainerMenuService = require('../services/containerMenuService');
const ContainerMenuController = require('../controllers/containerMenuController');
const { db } = require('../config/firebase');

const router = express.Router();
const containerMenuService = new ContainerMenuService(db);
const containerMenuController = new ContainerMenuController(containerMenuService);

router.get('/container-types', (req, res) => containerMenuController.getContainerTypes(req, res));
router.post('/container-types', upload.single('image'), (req, res) => containerMenuController.addContainerType(req, res));

module.exports = router;
