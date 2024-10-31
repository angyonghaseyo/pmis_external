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
}

module.exports = VesselService;