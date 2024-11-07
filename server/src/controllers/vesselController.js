class VesselController {
    constructor(vesselService) {
        this.vesselService = vesselService;
    }

    async getVesselVisits(req, res) {
        try {
            const visitsArray = await this.vesselService.fetchVesselVisits();
            res.status(200).json(visitsArray);
        } catch (error) {
            console.error('Error fetching vessel visits:', error);
            res.status(500).send('Error fetching vessel visits.');
        }
    }

    async getConfirmedVesselVisitsWithoutManifests(req, res) {
        try {
            const vesselVisitsData = await this.vesselService.fetchConfirmedVesselVisitsWithoutManifests();
            res.status(200).json(vesselVisitsData);
        } catch (error) {
            console.error('Error fetching vessel visits:', error);
            res.status(500).send('Error fetching vessel visits.');
        }
    }
    
    async getVesselVisitsAdHocRequests(req, res) {
        try {
          const vesselVisitsData = await this.vesselService.fetchVesselVisitsAdHocRequests();
          res.status(200).json(vesselVisitsData);
        } catch (error) {
          console.error('Error fetching vessel visits:', error);
          res.status(500).send('Error fetching vessel visits.');
        }
      }

      async getActiveVesselVisits(req, res) {
        try {
          const activeVisits = await this.vesselService.fetchActiveVesselVisits();
          res.status(200).json(activeVisits);
        } catch (error) {
          console.error('Error fetching active vessel visits:', error);
          res.status(500).send('Error fetching active vessel visits.');
        }
      }
}

module.exports = VesselController;