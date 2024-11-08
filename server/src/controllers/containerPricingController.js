class ContainerPricingController {
    constructor(containerPricingService) {
        this.containerPricingService = containerPricingService;
    }

    async getCarrierContainerPrices(req, res) {
        try {
            const { company } = req.query;
            if (!company) {
                return res.status(400).json({ error: 'Company parameter is required' });
            }
            const containers = await this.containerPricingService.getCarrierContainerPrices(company);
            res.status(200).json(containers);
        } catch (error) {
            console.error('Error in getCarrierContainerPrices:', error);
            res.status(500).json({ error: 'Error fetching carrier container prices' });
        }
    }

    async assignContainerPrice(req, res) {
        try {
            const { company, ...containerData } = req.body;
            if (!company || !containerData) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            const result = await this.containerPricingService.assignContainerPrice(company, containerData);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error in assignContainerPrice:', error);
            res.status(500).json({ error: 'Error assigning container price' });
        }
    }

    async updateContainerPrice(req, res) {
        try {
            const { company, equipmentId } = req.params;
            const updateData = req.body;
            if (!company || !equipmentId || !updateData) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            await this.containerPricingService.updateContainerPrice(company, equipmentId, updateData);
            res.status(200).json({ message: 'Container price updated successfully' });
        } catch (error) {
            console.error('Error in updateContainerPrice:', error);
            res.status(500).json({ error: 'Error updating container price' });
        }
    }

    async deleteContainerPrice(req, res) {
        try {
            const { company, equipmentId } = req.params;
            if (!company || !equipmentId) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            await this.containerPricingService.deleteContainerPrice(company, equipmentId);
            res.status(200).json({ message: 'Container price deleted successfully' });
        } catch (error) {
            console.error('Error in deleteContainerPrice:', error);
            res.status(500).json({ error: 'Error deleting container price' });
        }
    }
}

module.exports = ContainerPricingController;
