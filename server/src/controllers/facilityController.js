class FacilityController {
    constructor(facilityService) {
        this.facilityService = facilityService;
    }

    async checkFacilityAvailability(req, res) {
        try {
            const vesselVisitRequest = req.body;
            const result = await this.facilityService.checkFacilityAvailability(vesselVisitRequest);
            res.status(200).json(result);
        } catch (error) {
            console.error("Error checking facility availability:", error);
            res.status(500).json({
                success: false,
                assignedBerth: "",
                adjustedEta: vesselVisitRequest.eta,
                adjustedEtd: vesselVisitRequest.etd,
            });
        }
    }
}

module.exports = FacilityController;