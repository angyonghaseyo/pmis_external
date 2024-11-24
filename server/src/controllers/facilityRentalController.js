class FacilityRentalController {
    constructor(facilityRentalService) {
        this.facilityRentalService = facilityRentalService;
    }

    async getFacilityRentals(req, res) {
        try {
            const rentals = await this.facilityRentalService.fetchFacilityRentals();
            res.status(200).json(rentals);
        } catch (error) {
            console.error('Error getting facility rentals:', error);
            res.status(500).json({ error: 'Error fetching facility rentals' });
        }
    }

    async createFacilityRental(req, res) {
        try {
            const result = await this.facilityRentalService.createFacilityRental(req.body);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error creating facility rental:', error);
            res.status(500).json({ error: 'Error creating facility rental' });
        }
    }

    async updateFacilityRental(req, res) {
        try {
            const { id } = req.params;
            const result = await this.facilityRentalService.updateFacilityRental(id, req.body);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error updating facility rental:', error);
            res.status(500).json({ error: 'Error updating facility rental' });
        }
    }

    async deleteFacilityRental(req, res) {
        try {
            const { id } = req.params;
            await this.facilityRentalService.deleteFacilityRental(id);
            res.status(200).json({ message: 'Facility rental deleted successfully' });
        } catch (error) {
            console.error('Error deleting facility rental:', error);
            res.status(500).json({ error: 'Error deleting facility rental' });
        }
    }

    async checkAvailability(req, res) {
        try {
            const { facilityId, startTime, endTime } = req.body;
            const result = await this.facilityRentalService.checkAvailability(facilityId, startTime, endTime);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error checking availability:', error);
            res.status(500).json({ error: 'Error checking facility availability' });
        }
    }
}

module.exports = FacilityRentalController;