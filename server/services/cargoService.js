const { db } = require('../config/firebase');

class CargoService {
    async fetchCargoManifests() {
        const manifestsRef = db.collection('cargo_manifests');
        const snapshot = await manifestsRef.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async addCargoManifest(manifestData) {
        const manifestsRef = db.collection('cargo_manifests');
        return await manifestsRef.add(manifestData);
    }

    async updateCargoManifest(id, manifestData) {
        const manifestRef = db.collection('cargo_manifests').doc(id);
        await manifestRef.update(manifestData);
    }

    async deleteCargoManifest(id) {
        const manifestRef = db.collection('cargo_manifests').doc(id);
        await manifestRef.delete();
    }
}

module.exports = CargoService;