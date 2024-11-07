class OperatorController {
    constructor(operatorService) {
        this.operatorService = operatorService;
    }

    async getOperatorRequisitions(req, res) {
        const { userId } = req.params;
        try {
            const results = await this.operatorService.fetchOperatorRequisitions(userId);
            res.status(200).json(results);
        } catch (error) {
            console.error('Error fetching operator requisitions:', error);
            res.status(500).send('Error fetching operator requisitions.');
        }
    }

    async createOperatorRequisition(req, res) {
        try {
            const requisitionData = req.body;
            const docRef = await this.operatorService.createOperatorRequisition(requisitionData);
            res.status(201).json({ id: docRef.id });
        } catch (error) {
            console.error('Error creating operator requisition:', error);
            res.status(500).send('Error creating operator requisition.');
        }
    }

    async updateOperatorRequisition(req, res) {
        const { id } = req.params;
        const updateData = req.body;
        try {
            await this.operatorService.updateOperatorRequisition(id, updateData);
            res.status(200).send('Operator requisition updated successfully.');
        } catch (error) {
            console.error('Error updating operator requisition:', error);
            res.status(500).send('Error updating operator requisition.');
        }
    }

    async deleteOperatorRequisition(req, res) {
        const { id } = req.params;
        try {
            await this.operatorService.deleteOperatorRequisition(id);
            res.status(200).send('Operator requisition deleted successfully.');
        } catch (error) {
            console.error('Error deleting operator requisition:', error);
            res.status(500).send('Error deleting operator requisition.');
        }
    }
}

module.exports = OperatorController;