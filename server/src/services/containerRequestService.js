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

    async assignContainer(requestId, container) {
        try {
            const requiredSpace = container.consolidationService
                ? parseFloat(container.consolidationSpace)
                : parseFloat(container.size);

            if (requiredSpace > (parseFloat(container.size) - parseFloat(container.spaceUsed))) {
                throw new Error('Not enough space in the selected container');
            }

            // Update container space usage
            const updatedContainer = {
                ...container,
                spaceUsed: (parseFloat(container.spaceUsed) + requiredSpace).toString(),
                bookingStatus: container.consolidationService ? "consolidation" : "booked",
                containerConsolidationsID: container.consolidationService
                    ? [...(container.containerConsolidationsID || []), requestId]
                    : container.containerConsolidationsID
            };

            // Update the carrier container prices document
            await this.db.collection("carrier_container_prices")
                .doc(container.carrierName)
                .update({
                    containers: admin.firestore.FieldValue.arrayRemove(container)
                });

            await this.db.collection("carrier_container_prices")
                .doc(container.carrierName)
                .update({
                    containers: admin.firestore.FieldValue.arrayUnion(updatedContainer)
                });

            // Update the container request
            await this.db.collection("container_requests")
                .doc(requestId)
                .update({
                    status: "Assigned",
                    assignedContainerId: container.EquipmentID
                });

            // Update the associated booking
            const bookingsSnapshot = await this.db.collection("bookings").get();
            for (const doc of bookingsSnapshot.docs) {
                const bookingData = doc.data();
                if (bookingData.cargo && bookingData.cargo[container.cargoId]) {
                    await this.db.collection("bookings")
                        .doc(doc.id)
                        .update({
                            [`cargo.${container.cargoId}.isContainerRented`]: true
                        });
                    break;
                }
            }

            return { success: true, message: 'Container assigned successfully' };
        } catch (error) {
            console.error('Error in assignContainer:', error);
            throw error;
        }
    }

    async rejectRequest(requestId, rejectionReason) {
        try {
            await this.db.collection("container_requests")
                .doc(requestId)
                .update({
                    status: "Rejected",
                    rejectionReason: rejectionReason
                });

            return { success: true, message: 'Request rejected successfully' };
        } catch (error) {
            console.error('Error in rejectRequest:', error);
            throw error;
        }
    }
}

module.exports = ContainerRequestService;