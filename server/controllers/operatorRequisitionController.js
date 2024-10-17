const firebaseUtils = require('../utils/firebaseUtils');

const operatorRequisitionController = {
  // Get all operator requisitions for the user
  async getAllRequisitions(req, res) {
    try {
      const userId = req.user.uid;
      const requisitions = await firebaseUtils.getDocuments('operator_requisitions', [
        { field: 'userId', operator: '==', value: userId }
      ]);
      res.json(requisitions);
    } catch (error) {
      console.error('Error fetching operator requisitions:', error);
      res.status(500).json({ error: 'Failed to fetch operator requisitions' });
    }
  },

  // Get a specific operator requisition
  async getRequisition(req, res) {
    try {
      const requisitionId = req.params.id;
      const requisition = await firebaseUtils.getDocument('operator_requisitions', requisitionId);
      
      if (!requisition) {
        return res.status(404).json({ error: 'Operator requisition not found' });
      }

      if (requisition.userId !== req.user.uid) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }

      res.json(requisition);
    } catch (error) {
      console.error('Error fetching operator requisition:', error);
      res.status(500).json({ error: 'Failed to fetch operator requisition' });
    }
  },

  // Create a new operator requisition
  async createRequisition(req, res) {
    try {
      const { operatorSkill, date, time, duration } = req.body;
      const userId = req.user.uid;

      const requisitionData = {
        operatorSkill,
        date,
        time,
        duration,
        userId,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      const requisitionId = await firebaseUtils.addDocument('operator_requisitions', requisitionData);
      res.status(201).json({ message: 'Operator requisition created successfully', id: requisitionId });
    } catch (error) {
      console.error('Error creating operator requisition:', error);
      res.status(500).json({ error: 'Failed to create operator requisition' });
    }
  },

  // Update an operator requisition
  async updateRequisition(req, res) {
    try {
      const requisitionId = req.params.id;
      const updatedData = req.body;
      
      const requisition = await firebaseUtils.getDocument('operator_requisitions', requisitionId);
      
      if (!requisition) {
        return res.status(404).json({ error: 'Operator requisition not found' });
      }

      if (requisition.userId !== req.user.uid) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }

      await firebaseUtils.updateDocument('operator_requisitions', requisitionId, updatedData);
      res.json({ message: 'Operator requisition updated successfully' });
    } catch (error) {
      console.error('Error updating operator requisition:', error);
      res.status(500).json({ error: 'Failed to update operator requisition' });
    }
  },

  // Delete an operator requisition
  async deleteRequisition(req, res) {
    try {
      const requisitionId = req.params.id;
      
      const requisition = await firebaseUtils.getDocument('operator_requisitions', requisitionId);
      
      if (!requisition) {
        return res.status(404).json({ error: 'Operator requisition not found' });
      }

      if (requisition.userId !== req.user.uid) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }

      await firebaseUtils.deleteDocument('operator_requisitions', requisitionId);
      res.json({ message: 'Operator requisition deleted successfully' });
    } catch (error) {
      console.error('Error deleting operator requisition:', error);
      res.status(500).json({ error: 'Failed to delete operator requisition' });
    }
  }
};

module.exports = operatorRequisitionController;