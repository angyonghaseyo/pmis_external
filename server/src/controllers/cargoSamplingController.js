class CargoSamplingController {
    constructor(cargoSamplingService) {
        this.cargoSamplingService = cargoSamplingService;
    }

    async getSamplingRequests(req, res) {
        try {
            const { status } = req.query;
            const requests = await this.cargoSamplingService.getSamplingRequests(status);
            res.status(200).json(requests);
        } catch (error) {
            console.error('Error in getSamplingRequests:', error);
            res.status(500).json({ error: 'Error fetching sampling requests' });
        }
    }

    async createSamplingRequest(req, res) {
        try {
            const requestData = req.body;
            const result = await this.cargoSamplingService.createSamplingRequest(requestData);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error in createSamplingRequest:', error);
            res.status(500).json({ error: 'Error creating sampling request' });
        }
    }

    async updateSamplingRequest(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            await this.cargoSamplingService.updateSamplingRequest(id, updateData);
            res.status(200).json({ message: 'Sampling request updated successfully' });
        } catch (error) {
            console.error('Error in updateSamplingRequest:', error);
            res.status(500).json({ error: 'Error updating sampling request' });
        }
    }

    async deleteSamplingRequest(req, res) {
        try {
            const { id } = req.params;
            await this.cargoSamplingService.deleteSamplingRequest(id);
            res.status(200).json({ message: 'Sampling request deleted successfully' });
        } catch (error) {
            console.error('Error in deleteSamplingRequest:', error);
            res.status(500).json({ error: 'Error deleting sampling request' });
        }
    }

    async uploadSamplingDocument(req, res) {
        try {
            const { id } = req.params;
            const { documentType } = req.body;
            const file = req.file;

            const result = await this.cargoSamplingService.uploadSamplingDocument(id, documentType, file);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error in uploadSamplingDocument:', error);
            res.status(500).json({ error: 'Error uploading document' });
        }
    }
}

module.exports = CargoSamplingController;