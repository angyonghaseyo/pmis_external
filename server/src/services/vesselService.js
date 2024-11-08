const { db } = require('../config/firebase');

class VesselService {
    async fetchVesselVisits() {
        const querySnapshot = await db.collection('vesselVisitRequests').get();
        return querySnapshot.docs.map((doc) => ({
            documentId: doc.id,
            ...doc.data(),
        }));
    }

    async fetchConfirmedVesselVisitsWithoutManifests() {
        try {
            // Get all cargo manifests to check existing IMO numbers
            const manifestsRef = db.collection("cargo_manifests");
            const manifestsSnapshot = await manifestsRef.get();
            const existingManifestIMOs = new Set(
              manifestsSnapshot.docs.map(doc => doc.data().imoNumber)
            );
        
            // Get all confirmed vessel visits
            const vesselVisitRequestsRef = db.collection("vesselVisitRequests");
            const q = vesselVisitRequestsRef.where("status", "==", "confirmed");
            const querySnapshot = await q.get();
        
            // Return all confirmed visits along with a flag indicating if they have a manifest
            return querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              hasManifest: existingManifestIMOs.has(doc.data().imoNumber)
            }));
          } catch (error) {
            console.error('Error fetching confirmed vessel visits:', error);
            throw error;
          }
    }

    async fetchVesselVisitsAdHocRequests() {
        const statuses = ['confirmed', 'arriving', 'under tow', 'berthed'];
        const vesselVisitRequestsRef = db.collection('vesselVisitRequests');
        const q = vesselVisitRequestsRef.where('status', 'in', statuses); 
        const querySnapshot = await q.get();
    
        return querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
    }

    async fetchActiveVesselVisits() {
        try {
            const vesselVisitRequestsRef = db.collection("vesselVisitRequests");
            const q = vesselVisitRequestsRef.where('status', '!=', 'completed');
            const querySnapshot = await q.get();
            
            const currentTime = new Date().getTime();
            const visits = querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .filter(visit => {
                const etd = new Date(visit.etd).getTime();
                const eta = new Date(visit.eta).getTime();
                return etd > currentTime && 
                    visit.status === "confirmed" && 
                    !isNaN(eta) && 
                    !isNaN(etd);
            })
            .sort((a, b) => new Date(a.eta).getTime() - new Date(b.eta).getTime());

            return visits;
        } catch (error) {
            console.error('Error fetching active vessel visits:', error);
            throw error;
        }
    }

    async fetchVesselVisitsForBooking() {
        try {
            const vesselVisitsRef = db.collection('vesselVisitRequests');
            const snapshot = await vesselVisitsRef.get();
            
            const visits = [];
            snapshot.forEach(doc => {
                const visitData = doc.data();
                // Only include necessary fields and transform data structure for booking form
                if (visitData.vesselName && visitData.status === 'confirmed') {
                    const existingVisit = visits.find(v => v.vesselName === visitData.vesselName);
                    const voyage = {
                        voyageNumber: visitData.voyageNumber || doc.id,
                        departurePort: visitData.portOfDeparture,
                        arrivalPort: visitData.portOfArrival,
                        eta: visitData.eta,
                        etd: visitData.etd
                    };
    
                    if (existingVisit) {
                        existingVisit.voyages.push(voyage);
                    } else {
                        visits.push({
                            vesselName: visitData.vesselName,
                            voyages: [voyage]
                        });
                    }
                }
            });
            
            return visits;
        } catch (error) {
            console.error('Error fetching vessel visits for booking:', error);
            throw error;
        }
    }
    

}

module.exports = VesselService;