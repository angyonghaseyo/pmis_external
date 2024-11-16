class BookingController {
    constructor(bookingService) {
        this.bookingService = bookingService;
    }

    async getBookingById(req, res) {
        try {
            const { id } = req.params;
            const booking = await this.bookingService.getBookingById(id);
            
            if (!booking) {
                return res.status(404).json({ error: 'Booking not found' });
            }
            
            res.status(200).json(booking);
        } catch (error) {
            console.error('Error getting booking:', error);
            res.status(500).json({ error: 'Error fetching booking details' });
        }
    }

    async getBookings(req, res) {
        try {
            const bookings = await this.bookingService.fetchBookings();
            res.status(200).json(bookings);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            res.status(500).json({ error: 'Error fetching bookings' });
        }
    }

    async createBooking(req, res) {
        try {
            const bookingData = req.body;
            const result = await this.bookingService.createBooking(bookingData);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error creating booking:', error);
            res.status(500).json({ error: 'Error creating booking' });
        }
    }

    async updateBooking(req, res) {
        try {
            const { id } = req.params;
            const bookingData = req.body;
            const result = await this.bookingService.updateBooking(id, bookingData);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error updating booking:', error);
            res.status(500).json({ error: 'Error updating booking' });
        }
    }

    async deleteBooking(req, res) {
        try {
            const { id } = req.params;
            await this.bookingService.deleteBooking(id);
            res.status(200).json({ message: 'Booking deleted successfully' });
        } catch (error) {
            console.error('Error deleting booking:', error);
            res.status(500).json({ error: 'Error deleting booking' });
        }
    }

    async uploadDocument(req, res) {
        try {
            const { bookingId, cargoId } = req.params;
            const { documentType } = req.body;
            const file = req.file;
            
            const result = await this.bookingService.uploadDocument(bookingId, cargoId, documentType, file);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error uploading document:', error);
            res.status(500).json({ error: 'Error uploading document' });
        }
    }

    async retrieveDocument(req, res) {
        try {
            const { bookingId, cargoId, documentType } = req.params;
            const result = await this.bookingService.retrieveDocument(bookingId, cargoId, documentType);
            
            if (!result) {
                return res.status(404).json({ error: 'Document not found' });
            }
    
            res.json(result);
        } catch (error) {
            console.error('Controller error:', error);
            res.status(500).json({ error: 'Error retrieving document' });
        }
    }

    async registerTruckForCargo(req, res) {
        try {
            const { cargoId, truckLicense } = req.body;
            
            if (!cargoId || !truckLicense) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const result = await this.bookingService.registerTruckForCargo(cargoId, truckLicense);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error registering truck for cargo:', error);
            res.status(500).json({ 
                error: error.message || 'Error registering truck for cargo' 
            });
        }
    }
}

module.exports = BookingController;
