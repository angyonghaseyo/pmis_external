// containerRequestController.js
class ContainerRequestController {
    constructor(containerRequestService) {
        this.containerRequestService = containerRequestService;
    }

    async getContainerRequests(req, res) {
        try {
            const requests = await this.containerRequestService.fetchContainerRequests();
            res.status(200).json(requests);
        } catch (error) {
            console.error('Error fetching container requests:', error);
            res.status(500).json({ error: 'Error fetching container requests' });
        }
    }

    async createContainerRequest(req, res) {
        try {
            const requestData = req.body;
            console.log(requestData, "123");
            // Add validation for consolidation service
            if (requestData.serviceType === "Consolidation") {
                console.log(requestData, "12345");
                if (!requestData.consolidationSpace || !requestData.carrierName) {
                    return res.status(400).json({
                        error: 'Missing required fields for consolidation service'
                    });
                }
            }

            console.log(requestData, "1234567");
            const result = await this.containerRequestService.createContainerRequest(requestData);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error creating container request:', error);
            res.status(500).json({ error: 'Error creating container request' });
        }
    }

    async updateContainerRequest(req, res) {
        try {
            const { id } = req.params;
            const requestData = req.body;
            const result = await this.containerRequestService.updateContainerRequest(id, requestData);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error updating container request:', error);
            res.status(500).json({ error: 'Error updating container request' });
        }
    }

    async deleteContainerRequest(req, res) {
        try {
            const { id } = req.params;
            await this.containerRequestService.deleteContainerRequest(id);
            res.status(200).json({ message: 'Container request deleted successfully' });
        } catch (error) {
            console.error('Error deleting container request:', error);
            res.status(500).json({ error: 'Error deleting container request' });
        }
    }

    async assignContainer(req, res) {
        try {
            console.log('Received container assignment request');
            console.log('Request ID:', req.params.id);
            console.log('Assignment data:', req.body);

            const result = await this.containerRequestService.assignContainerToRequest(
                req.params.id,
                req.body
            );

            console.log('Assignment result:', result);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error in assignContainer:', error);
            res.status(500).json({
                error: error.message || 'Error assigning container'
            });
        }
    }
    async rejectRequest(req, res) {
        try {
            const { id } = req.params;
            const rejectionData = req.body;

            const result = await this.containerRequestService.rejectContainerRequest(
                id,
                rejectionData
            );

            res.status(200).json(result);
        } catch (error) {
            console.error('Error rejecting container request:', error);
            res.status(500).json({
                error: error.message || 'Error rejecting container request'
            });
        }
    }

    async getRequestsByCarrier(req, res) {
        try {
            console.log('Received carrier request for:', req.params.carrierName);
            const requests = await this.containerRequestService
                .getContainerRequestsByCarrier(req.params.carrierName);

            console.log('Sending response with requests:', requests.length);
            res.status(200).json(requests);
        } catch (error) {
            console.error('Error in getRequestsByCarrier:', error);
            res.status(500).json({
                error: error.message || 'Error fetching carrier requests'
            });
        }
    }
}

module.exports = ContainerRequestController;