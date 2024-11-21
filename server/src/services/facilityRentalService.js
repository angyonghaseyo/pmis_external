class FacilityRentalService {
    constructor(db) {
        this.db = db;
    }

    async fetchFacilityRentals() {
        try {
            const snapshot = await this.db.collection('facility_rentals').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error in fetchFacilityRentals:', error);
            throw error;
        }
    }

    async createFacilityRental(rentalData) {
        try {
            const docRef = await this.db.collection('facility_rentals').add({
                ...rentalData,
                createdAt: new Date().toISOString(),
                status: 'Pending'
            });
            
            return {
                id: docRef.id,
                ...rentalData
            };
        } catch (error) {
            console.error('Error in createFacilityRental:', error);
            throw error;
        }
    }

    async updateFacilityRental(id, updateData) {
        try {
            const rentalRef = this.db.collection('facility_rentals').doc(id);
            await rentalRef.update({
                ...updateData,
                updatedAt: new Date().toISOString()
            });
            
            const doc = await rentalRef.get();
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('Error in updateFacilityRental:', error);
            throw error;
        }
    }

    async deleteFacilityRental(id) {
        try {
            await this.db.collection('facility_rentals').doc(id).delete();
            return true;
        } catch (error) {
            console.error('Error in deleteFacilityRental:', error);
            throw error;
        }
    }

    async checkAvailability(facilityId, startTime, endTime) {
        try {
            const facilityRef = this.db.collection('Warehouse').doc(facilityId);
            const facilityDoc = await facilityRef.get();
            
            if (!facilityDoc.exists) {
                throw new Error('Facility not found');
            }

            const facility = facilityDoc.data();
            const bookedPeriods = facility.bookedPeriods || [];

            const requestStart = new Date(startTime).getTime();
            const requestEnd = new Date(endTime).getTime();

            const hasConflict = bookedPeriods.some(period => {
                if (period.status !== 'Approved') return false;
                const periodStart = new Date(period.start).getTime();
                const periodEnd = new Date(period.end).getTime();

                return (
                    (requestStart >= periodStart && requestStart < periodEnd) ||
                    (requestEnd > periodStart && requestEnd <= periodEnd) ||
                    (requestStart <= periodStart && requestEnd >= periodEnd)
                );
            });

            return {
                available: !hasConflict,
                facility: {
                    id: facilityDoc.id,
                    ...facility
                }
            };
        } catch (error) {
            console.error('Error in checkAvailability:', error);
            throw error;
        }
    }
}

module.exports = FacilityRentalService;