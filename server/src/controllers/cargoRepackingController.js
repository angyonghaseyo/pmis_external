class CargoRepackingController {
    constructor(cargoRepackingService) {
        this.cargoRepackingService = cargoRepackingService;
    }

    async getRepackingRequests(req, res) {
        try {
            const { status, searchQuery, dateRange } = req.query;
            const filters = {
                status: status !== 'all' ? status : null,
                searchQuery,
                dateRange
            };
            const requests = await this.cargoRepackingService.fetchRepackingRequests(filters);
            res.status(200).json(requests);
        } catch (error) {
            console.error('Error fetching repacking requests:', error);
            res.status(500).send('Error fetching repacking requests');
        }
    }

    async getRepackingRequestById(req, res) {
        try {
            const { id } = req.params;
            const request = await this.cargoRepackingService.fetchRepackingRequestById(id);
            if (!request) {
                return res.status(404).send('Repacking request not found');
            }
            res.status(200).json(request);
        } catch (error) {
            console.error('Error fetching repacking request:', error);
            res.status(500).send('Error fetching repacking request');
        }
    }

    async submitRepackingRequest(req, res) {
        try {
            const requestData = JSON.parse(req.body.repackingDetails);
            const files = {
                repackagingChecklist: req.files?.repackagingChecklist?.[0]
            };

            const result = await this.cargoRepackingService.createRepackingRequest(requestData, files);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error submitting repacking request:', error);
            res.status(500).send('Error submitting repacking request');
        }
    }

    async updateRepackingRequest(req, res) {
        try {
            const { id } = req.params;
            const requestData = JSON.parse(req.body.repackingDetails);
            const files = {
                repackagingChecklist: req.files?.repackagingChecklist?.[0]
            };

            await this.cargoRepackingService.updateRepackingRequest(id, requestData, files);
            res.status(200).send('Repacking request updated successfully');
        } catch (error) {
            console.error('Error updating repacking request:', error);
            res.status(500).send('Error updating repacking request');
        }
    }

    async deleteRepackingRequest(req, res) {
        try {
            const { id } = req.params;
            await this.cargoRepackingService.deleteRepackingRequest(id);
            res.status(200).json({ message: 'Repacking request deleted successfully' });
        } catch (error) {
            console.error('Error deleting repacking request:', error);
            res.status(500).json({ error: 'Error deleting repacking request' });
        }
    }
}

module.exports = CargoRepackingController;