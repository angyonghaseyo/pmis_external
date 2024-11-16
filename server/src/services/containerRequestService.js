// containerRequestService.js
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
            // Add estimated cost calculation for consolidation
            if (requestData.consolidationService) {
                requestData.estimatedCost =
                    requestData.consolidationPrice * requestData.consolidationSpace;
            }

            const docRef = await this.db.collection('container_requests').add({
                ...requestData,
                createdAt: new Date().toISOString(),
                status: 'Pending'
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
            return true;
        } catch (error) {
            console.error('Error in deleteContainerRequest:', error);
            throw error;
        }
    }
}

module.exports = ContainerRequestService;