const express = require('express');
const { db } = require('../config/firebase');
const BookingService = require('../services/bookingService');
const BookingController = require('../controllers/bookingController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();
const bookingService = new BookingService(db);
const bookingController = new BookingController(bookingService);

router.get('/bookings/:id', (req, res) => bookingController.getBookingById(req, res));
router.get('/bookings', (req, res) => bookingController.getBookings(req, res));
router.post('/bookings', (req, res) => bookingController.createBooking(req, res));
router.put('/bookings/:id', (req, res) => bookingController.updateBooking(req, res));
router.delete('/bookings/:id', (req, res) => bookingController.deleteBooking(req, res));
router.post('/bookings/:bookingId/cargo/:cargoId/documents', upload.single('document'), (req, res) => bookingController.uploadDocument(req, res));
router.get('/bookings/:bookingId/cargo/:cargoId/documents/:documentType', (req, res) => {
    console.log('Route hit with params:', req.params);
    return bookingController.retrieveDocument(req, res);
});
router.post('/bookings/register-truck', (req, res) => bookingController.registerTruckForCargo(req, res));

module.exports = router;