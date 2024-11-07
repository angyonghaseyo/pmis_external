const express = require('express');
const { db } = require('../config/firebase'); // Ensure Firebase is initialized
const CompanyService = require('../services/companyService');
const CompanyController = require('../controllers/companyController');

const router = express.Router();
const companyService = new CompanyService(db);
const companyController = new CompanyController(companyService);

router.get('/company-data', (req, res) => companyController.getCompanyData(req, res));
router.put('/company-data/:companyName', (req, res) => companyController.updateCompanyData(req, res));

module.exports = router;