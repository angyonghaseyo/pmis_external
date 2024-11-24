const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const InquiryService = require('../services/inquiryService');
const InquiryController = require('../controllers/inquiryController');

const router = express.Router();
const inquiryService = new InquiryService();
const inquiryController = new InquiryController(inquiryService);

router.get('/inquiries-feedback/:userId', (req, res) => inquiryController.getInquiriesFeedback(req, res));
router.put('/inquiries-feedback/:id', upload.single('file'), (req, res) => inquiryController.updateInquiryFeedback(req, res));
router.post('/inquiries-feedback', upload.single('file'), (req, res) => inquiryController.createInquiryFeedback(req, res));
router.delete('/inquiries-feedback/:id', (req, res) => inquiryController.deleteInquiryFeedback(req, res));

module.exports = router;
