class AgencyController {
    constructor(agencyService) {
      this.agencyService = agencyService;
    }
  
    async getAgencies(req, res) {
      try {
        const agencies = await this.agencyService.getAgencies();
        res.status(200).json(agencies);
      } catch (error) {
        console.error('Error getting agencies:', error);
        res.status(500).json({ error: 'Error fetching agencies' });
      }
    }
  
    async verifyAgencyAccess(req, res) {
      try {
        const { agencyKey, documentType } = req.body;
        const result = await this.agencyService.verifyAgencyAccess(agencyKey, documentType);
        res.status(200).json(result);
      } catch (error) {
        console.error('Error verifying agency access:', error);
        res.status(401).json({ error: error.message });
      }
    }
  
    async updateDocumentStatus(req, res) {
      try {
        const { agencyKey, bookingId, cargoId, documentType, status, comments } = req.body;
        const result = await this.agencyService.updateDocumentStatus(
          agencyKey,
          bookingId,
          cargoId,
          documentType,
          status,
          comments
        );
        res.status(200).json(result);
      } catch (error) {
        console.error('Error updating document status:', error);
        res.status(500).json({ error: error.message });
      }
    }
  }
  
  module.exports = AgencyController;