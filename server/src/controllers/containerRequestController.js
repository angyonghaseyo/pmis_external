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
            const { id } = req.params;
            const { container } = req.body;
            const result = await this.containerRequestService.assignContainer(id, container);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error assigning container:', error);
            res.status(500).json({ error: 'Error assigning container' });
        }
    }

    async rejectRequest(req, res) {
        try {
            const { id } = req.params;
            const { rejectionReason } = req.body;
            const result = await this.containerRequestService.rejectRequest(id, rejectionReason);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error rejecting request:', error);
            res.status(500).json({ error: 'Error rejecting request' });
        }
    }
}

module.exports = ContainerRequestController;