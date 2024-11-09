const { db } = require('../config/firebase');

class ContainerRequestService {
  constructor(db) {
    this.db = db;
  }

  async fetchContainerRequests() {
    try {
      const snapshot = await this.db.collection('container_requests').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error in fetchContainerRequests:', error);
      throw error;
    }
  }

  async createContainerRequest(requestData) {
    try {
      const docRef = await this.db.collection('container_requests').add({
        ...requestData,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return {
        id: docRef.id,
        ...requestData
      };
    } catch (error) {
      console.error('Error in createContainerRequest:', error);
      throw error;
    }
  }

  async updateContainerRequest(id, requestData) {
    try {
      const docRef = this.db.collection('container_requests').doc(id);
      await docRef.update({
        ...requestData,
        updatedAt: new Date().toISOString()
      });
      
      const doc = await docRef.get();
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error in updateContainerRequest:', error);
      throw error;
    }
  }

  async deleteContainerRequest(id) {
    try {
      await this.db.collection('container_requests').doc(id).delete();
      return { success: true, message: 'Container request deleted successfully' };
    } catch (error) {
      console.error('Error in deleteContainerRequest:', error);
      throw error;
    }
  }
}

module.exports = ContainerRequestService;
