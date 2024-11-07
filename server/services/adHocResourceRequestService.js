const { db } = require('../config/firebase');

class AdHocResourceRequestService {
    constructor(db) {
        this.db = db;
    }

    async fetchAdHocResourceRequests() {
        try {
            const snapshots = await this.db.collection('AdHocResourceRequest').get();
            return snapshots.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error in fetchAdHocRequests:', error);
            throw error;
        }
    }

    async createAdHocResourceRequest(requestData) {
        try {
            const docRef = await this.db.collection('AdHocResourceRequest').add({
                ...requestData,
                createdAt: new Date().toISOString(),
                status: 'Pending'
            });
            
            return {
                id: docRef.id,
                ...requestData
            };
        } catch (error) {
            console.error('Error in createAdHocRequest:', error);
            throw error;
        }
    }

    async updateAdHocResourceRequest(id, requestData) {
        try {
            const docRef = this.db.collection('AdHocResourceRequest').doc(id);
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
            console.error('Error in updateAdHocRequest:', error);
            throw error;
        }
    }
}

module.exports = AdHocResourceRequestService;