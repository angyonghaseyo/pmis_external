const { db } = require('../config/firebase');

class ContainerPricingService {
    constructor(db) {
        this.db = db;
    }

    async getCarrierContainerPrices(company) {
        try {
            const carrierContainerRef = this.db.collection('carrier_container_prices').doc(company);
            const snapshot = await carrierContainerRef.get();

            if (!snapshot.exists) {
                return [];
            }

            return snapshot.data().containers || [];
        } catch (error) {
            console.error('Error fetching carrier container prices:', error);
            throw error;
        }
    }

    async createContainerPrice(company, containerData) {
        try {
            console.log('Creating container price for company:', company);
            console.log('Container data:', containerData);

            if (!company) {
                throw new Error('Company is required');
            }

            const carrierContainerRef = this.db.collection('carrier_container_prices').doc(company);
            const snapshot = await carrierContainerRef.get();

            let existingContainers = [];
            if (snapshot.exists) {
                existingContainers = snapshot.data()?.containers || [];
            }

            // Check for duplicate Equipment ID
            const isDuplicate = existingContainers.some(
                container => container.EquipmentID === containerData.EquipmentID
            );

            if (isDuplicate) {
                throw new Error(`Container with Equipment ID ${containerData.EquipmentID} already exists`);
            }

            const newContainer = {
                ...containerData,
                company, // Ensure company is included in the container data
                bookingStatus: containerData.bookingStatus || 'available',
                spaceUsed: containerData.spaceUsed || 0,
                containerConsolidationsID: containerData.containerConsolidationsID || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Use set with merge to create or update the document
            await carrierContainerRef.set({
                containers: [...existingContainers, newContainer],
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            return newContainer;
        } catch (error) {
            console.error('Detailed error in createContainerPrice:', error);
            throw new Error(`Error creating container price: ${error.message}`);
        }
    }

    async updateContainerPrice(company, equipmentId, updateData) {
        try {
            const carrierContainerRef = this.db.collection('carrier_container_prices').doc(company);
            const snapshot = await carrierContainerRef.get();

            if (!snapshot.exists) {
                throw new Error(`No container pricing found for company: ${company}`);
            }

            const containers = snapshot.data().containers || [];
            const containerIndex = containers.findIndex(c => c.EquipmentID === equipmentId);

            if (containerIndex === -1) {
                throw new Error(`Container with Equipment ID ${equipmentId} not found`);
            }

            const updatedContainer = {
                ...containers[containerIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };

            containers[containerIndex] = updatedContainer;

            await carrierContainerRef.update({
                containers: containers,
                lastUpdated: new Date().toISOString()
            });

            return updatedContainer;
        } catch (error) {
            console.error('Error updating container price:', error);
            throw error;
        }
    }

    async deleteContainerPrice(company, equipmentId) {
        try {
            const carrierContainerRef = this.db.collection('carrier_container_prices').doc(company);
            const snapshot = await carrierContainerRef.get();

            if (!snapshot.exists) {
                throw new Error(`No container pricing found for company: ${company}`);
            }

            const containers = snapshot.data().containers || [];
            const updatedContainers = containers.filter(c => c.EquipmentID !== equipmentId);

            if (containers.length === updatedContainers.length) {
                throw new Error(`Container with Equipment ID ${equipmentId} not found`);
            }

            await carrierContainerRef.update({
                containers: updatedContainers,
                lastUpdated: new Date().toISOString()
            });

            return { success: true, message: `Container ${equipmentId} deleted successfully` };
        } catch (error) {
            console.error('Error deleting container price:', error);
            throw error;
        }
    }

    async getAvailableContainers(company) {
        try {
            const carrierContainerRef = this.db.collection('carrier_container_prices').doc(company);
            const snapshot = await carrierContainerRef.get();

            if (!snapshot.exists) {
                return [];
            }

            const containers = snapshot.data().containers || [];
            return containers.filter(container =>
                container.bookingStatus === 'available' &&
                container.spaceUsed < container.size
            );
        } catch (error) {
            console.error('Error fetching available containers:', error);
            throw error;
        }
    }

    async getContainerByEquipmentId(company, equipmentId) {
        try {
            const carrierContainerRef = this.db.collection('carrier_container_prices').doc(company);
            const snapshot = await carrierContainerRef.get();

            if (!snapshot.exists) {
                return null;
            }

            const containers = snapshot.data().containers || [];
            return containers.find(container => container.EquipmentID === equipmentId) || null;
        } catch (error) {
            console.error('Error fetching container by Equipment ID:', error);
            throw error;
        }
    }
}

module.exports = ContainerPricingService;