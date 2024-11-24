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
            console.log(requestData, "service");

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

    async assignContainerToRequest(requestId, assignmentData) {
        try {
            console.log('Assigning container to request:', requestId);
            console.log('Assignment data:', assignmentData);

            const docRef = this.db.collection('container_requests').doc(requestId);
            const doc = await docRef.get();

            if (!doc.exists) {
                console.error('Container request not found:', requestId);
                throw new Error('Container request not found');
            }

            console.log('Current request data:', doc.data());

            // Update the container request with assignment details
            await docRef.update({
                status: 'Assigned',
                assignedContainerId: assignmentData.containerId,
                assignedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            console.log('Container request updated successfully');
            return {
                success: true,
                message: 'Container assigned successfully'
            };
        } catch (error) {
            console.error('Error in assignContainerToRequest:', error);
            throw error;
        }
    }

    async rejectContainerRequest(requestId, rejectionData) {
        try {
            const docRef = this.db.collection('container_requests').doc(requestId);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error('Container request not found');
            }

            await docRef.update({
                status: 'Rejected',
                rejectionReason: rejectionData.reason,
                rejectedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            return {
                success: true,
                message: 'Container request rejected successfully'
            };
        } catch (error) {
            console.error('Error in rejectContainerRequest:', error);
            throw error;
        }
    }

    async getContainerRequestsByCarrier(carrierName) {
        try {
            console.log('Fetching container requests for carrier:', carrierName);
            const snapshot = await this.db.collection('container_requests')
                .where('carrierName', '==', carrierName)
                .get();

            const requests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('Retrieved container requests:', requests);
            return requests;
        } catch (error) {
            console.error('Error in getContainerRequestsByCarrier:', error);
            throw error;
        }
    }

}

module.exports = ContainerRequestService;