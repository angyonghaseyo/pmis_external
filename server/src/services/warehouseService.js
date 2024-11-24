class WarehouseService {
    constructor(db) {
        this.db = db;
    }

    async fetchWarehouses() {
        try {
            const snapshot = await this.db.collection('Warehouse')
                .where('status', '==', 'Available')
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                warehouseId: doc.id,
                ...doc.data(),
                bookedPeriods: doc.data().bookedPeriods || []
            }));
        } catch (error) {
            console.error('Error in fetchWarehouses:', error);
            throw error;
        }
    }

    async fetchWarehouseById(id) {
        try {
            const doc = await this.db.collection('Warehouse').doc(id).get();
            if (!doc.exists) {
                return null;
            }
            return {
                id: doc.id,
                warehouseId: doc.id,
                ...doc.data(),
                bookedPeriods: doc.data().bookedPeriods || []
            };
        } catch (error) {
            console.error('Error in fetchWarehouseById:', error);
            throw error;
        }
    }
}

module.exports = WarehouseService;