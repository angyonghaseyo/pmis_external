class BookingController {
    constructor(bookingService) {
        this.bookingService = bookingService;
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
}

module.exports = BookingController;
