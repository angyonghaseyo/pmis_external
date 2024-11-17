class CargoSamplingController {
    constructor(cargoSamplingService) {
        this.cargoSamplingService = cargoSamplingService;
    }

    async getSamplingRequests(req, res) {
        try {
            const { status, searchQuery, dateRange } = req.query;
            const filters = {
                status: status !== 'all' ? status : null,
                searchQuery,
                dateRange
            };
            const requests = await this.cargoSamplingService.fetchSamplingRequests(filters);
            res.status(200).json(requests);
        } catch (error) {
            console.error('Error fetching sampling requests:', error);
            res.status(500).send('Error fetching sampling requests');
        }
    }

    async getSamplingRequestById(req, res) {
        try {
            const { id } = req.params;
            const request = await this.cargoSamplingService.fetchSamplingRequestById(id);
            if (!request) {
                return res.status(404).send('Sampling request not found');
            }
            res.status(200).json(request);
        } catch (error) {
            console.error('Error fetching sampling request:', error);
            res.status(500).send('Error fetching sampling request');
        }
    }

    async submitSamplingRequest(req, res) {
        try {
            const requestData = JSON.parse(req.body.samplingDetails);
            const files = {
                safetyDataSheet: req.files?.safetyDataSheet?.[0],
                additionalDocs: req.files?.additionalDoc
            };

            const result = await this.cargoSamplingService.createSamplingRequest(requestData, files);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error submitting sampling request:', error);
            res.status(500).send('Error submitting sampling request');
        }
    }

    async updateSamplingRequest(req, res) {
        try {
            const { id } = req.params;
            const requestData = JSON.parse(req.body.samplingDetails);
            const files = {
                safetyDataSheet: req.files?.safetyDataSheet?.[0],
                additionalDocs: req.files?.additionalDoc
            };

            await this.cargoSamplingService.updateSamplingRequest(id, requestData, files);
            res.status(200).send('Sampling request updated successfully');
        } catch (error) {
            console.error('Error updating sampling request:', error);
            res.status(500).send('Error updating sampling request');
        }
    }

    async deleteSamplingRequest(req, res) {
        try {
            const { id } = req.params;
            await this.cargoSamplingService.deleteSamplingRequest(id);
            res.status(200).json({ message: 'Sampling request deleted successfully' });
        } catch (error) {
            console.error('Error deleting sampling request:', error);
            res.status(500).json({ error: 'Error deleting sampling request' });
        }
    }
}

module.exports = CargoSamplingController;