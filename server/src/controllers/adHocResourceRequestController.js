class AdHocResourceRequestController {
    constructor(adHocResourceRequestService) {
        this.adHocResourceRequestService = adHocResourceRequestService;
    }

    async getAdHocResourceRequests(req, res) {
        try {
            const requests = await this.adHocResourceRequestService.fetchAdHocResourceRequests();
            res.status(200).json(requests);
        } catch (error) {
            console.error('Error getting ad hoc requests:', error);
            res.status(500).json({ error: 'Error fetching ad hoc requests' });
        }
    }

    async submitAdHocResourceRequest(req, res) {
        const requestData = req.body;
        try {
            const result = await this.adHocResourceRequestService.createAdHocResourceRequest(requestData);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error submitting ad hoc request:', error);
            res.status(500).json({ error: 'Error submitting ad hoc request' });
        }
    }

    async updateAdHocResourceRequest(req, res) {
        const { id } = req.params;
        const requestData = req.body;
        try {
            const result = await this.adHocResourceRequestService.updateAdHocResourceRequest(id, requestData);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error updating ad hoc request:', error);
            res.status(500).json({ error: 'Error updating ad hoc request' });
        }
    }
}

module.exports = AdHocResourceRequestController;