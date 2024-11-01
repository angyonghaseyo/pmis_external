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
        // Access `cargo_manifests` collection and get IMO numbers
        const manifestsRef = db.collection("cargo_manifests");
        const manifestsSnapshot = await manifestsRef.get();
        const existingManifestIMOs = new Set(
            manifestsSnapshot.docs.map(doc => doc.data().imoNumber)
        );

        // Access `vesselVisitRequests` collection and query confirmed vessel visits
        const vesselVisitRequestsRef = db.collection("vesselVisitRequests");
        const q = vesselVisitRequestsRef.where("status", "==", "confirmed");
        const querySnapshot = await q.get();

        // Filter out vessels that already have manifests
        return querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .filter(visit => !existingManifestIMOs.has(visit.imoNumber));
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
                    visit.status === "pending user intervention" && 
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

}

module.exports = VesselService;