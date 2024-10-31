class CargoController {
    constructor(cargoService) {
        this.cargoService = cargoService;
    }

    async getCargoManifests(req, res) {
        try {
            const manifests = await this.cargoService.fetchCargoManifests();
            res.status(200).json(manifests);
        } catch (error) {
            console.error('Error fetching cargo manifests:', error);
            res.status(500).send('Error fetching cargo manifests.');
        }
    }

    async submitCargoManifest(req, res) {
        try {
            const manifestData = req.body;
            const docRef = await this.cargoService.addCargoManifest(manifestData);
            res.status(201).json({ id: docRef.id });
        } catch (error) {
            console.error('Error submitting cargo manifest:', error);
            res.status(500).send('Error submitting cargo manifest.');
        }
    }

    async updateCargoManifest(req, res) {
        const { id } = req.params;
        const manifestData = req.body;
        try {
            await this.cargoService.updateCargoManifest(id, manifestData);
            res.status(200).send('Cargo manifest updated successfully.');
        } catch (error) {
            console.error('Error updating cargo manifest:', error);
            res.status(500).send('Error updating cargo manifest.');
        }
    }

    async deleteCargoManifest(req, res) {
        const { id } = req.params;
        try {
            await this.cargoService.deleteCargoManifest(id);
            res.status(200).send('Cargo manifest deleted successfully.');
        } catch (error) {
            console.error('Error deleting cargo manifest:', error);
            res.status(500).send('Error deleting cargo manifest.');
        }
    }
}

module.exports = CargoController;