class CargoStorageController {
    constructor(cargoStorageService) {
        this.cargoStorageService = cargoStorageService;
    }

    async getStorageRequests(req, res) {
        try {
            const { status, searchQuery, dateRange } = req.query;
            const filters = {
                status: status !== 'all' ? status : null,
                searchQuery,
                dateRange
            };
            const requests = await this.cargoStorageService.fetchStorageRequests(filters);
            res.status(200).json(requests);
        } catch (error) {
            console.error('Error fetching storage requests:', error);
            res.status(500).send('Error fetching storage requests');
        }
    }

    async getStorageRequestById(req, res) {
        try {
            const { id } = req.params;
            const request = await this.cargoStorageService.fetchStorageRequestById(id);
            if (!request) {
                return res.status(404).send('Storage request not found');
            }
            res.status(200).json(request);
        } catch (error) {
            console.error('Error fetching storage request:', error);
            res.status(500).send('Error fetching storage request');
        }
    }

    async submitStorageRequest(req, res) {
        try {
            const requestData = JSON.parse(req.body.storageDetails);
            const files = {
                storageChecklist: req.files?.storageChecklist?.[0],
                additionalDocs: req.files?.additionalDoc
            };

            const result = await this.cargoStorageService.createStorageRequest(requestData, files);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error submitting storage request:', error);
            res.status(500).send('Error submitting storage request');
        }
    }

    async updateStorageRequest(req, res) {
        try {
            const { id } = req.params;
            const requestData = JSON.parse(req.body.storageDetails);
            const files = {
                storageChecklist: req.files?.storageChecklist?.[0],
                additionalDocs: req.files?.additionalDoc
            };

            await this.cargoStorageService.updateStorageRequest(id, requestData, files);
            res.status(200).send('Storage request updated successfully');
        } catch (error) {
            console.error('Error updating storage request:', error);
            res.status(500).send('Error updating storage request');
        }
    }

    async deleteStorageRequest(req, res) {
        try {
            const { id } = req.params;
            await this.cargoStorageService.deleteStorageRequest(id);
            res.status(200).json({ message: 'Storage request deleted successfully' });
        } catch (error) {
            console.error('Error deleting storage request:', error);
            res.status(500).json({ error: 'Error deleting storage request' });
        }
    }
}

module.exports = CargoStorageController;