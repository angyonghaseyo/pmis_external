class CargoTransloadingController {
    constructor(cargoTransloadingService) {
        this.cargoTransloadingService = cargoTransloadingService;
    }

    async getTransloadingRequests(req, res) {
        try {
            const { status, searchQuery, dateRange } = req.query;
            const filters = {
                status: status !== 'all' ? status : null,
                searchQuery,
                dateRange
            };
            const requests = await this.cargoTransloadingService.fetchTransloadingRequests(filters);
            res.status(200).json(requests);
        } catch (error) {
            console.error('Error fetching transloading requests:', error);
            res.status(500).send('Error fetching transloading requests');
        }
    }

    async getTransloadingRequestById(req, res) {
        try {
            const { id } = req.params;
            const request = await this.cargoTransloadingService.fetchTransloadingRequestById(id);
            if (!request) {
                return res.status(404).send('Transloading request not found');
            }
            res.status(200).json(request);
        } catch (error) {
            console.error('Error fetching transloading request:', error);
            res.status(500).send('Error fetching transloading request');
        }
    }

    async submitTransloadingRequest(req, res) {
        try {
            const requestData = JSON.parse(req.body.transloadingDetails);
            const files = {
                transloadingSheet: req.files?.transloadingSheet?.[0],
                additionalDocs: req.files?.additionalDoc
            };

            const result = await this.cargoTransloadingService.createTransloadingRequest(requestData, files);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error submitting transloading request:', error);
            res.status(500).send('Error submitting transloading request');
        }
    }

    async updateTransloadingRequest(req, res) {
        try {
            const { id } = req.params;
            const requestData = JSON.parse(req.body.transloadingDetails);
            const files = {
                transloadingSheet: req.files?.transloadingSheet?.[0],
                additionalDocs: req.files?.additionalDoc
            };

            await this.cargoTransloadingService.updateTransloadingRequest(id, requestData, files);
            res.status(200).send('Transloading request updated successfully');
        } catch (error) {
            console.error('Error updating transloading request:', error);
            res.status(500).send('Error updating transloading request');
        }
    }

    async deleteTransloadingRequest(req, res) {
        try {
            const { id } = req.params;
            await this.cargoTransloadingService.deleteTransloadingRequest(id);
            res.status(200).json({ message: 'Transloading request deleted successfully' });
        } catch (error) {
            console.error('Error deleting transloading request:', error);
            res.status(500).json({ error: 'Error deleting transloading request' });
        }
    }
}

module.exports = CargoTransloadingController;