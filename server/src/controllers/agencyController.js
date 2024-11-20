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
      
      if (!agencyKey || !documentType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await this.agencyService.verifyAgencyAccess(agencyKey, documentType);
      
      if (!result.isValid) {
        return res.status(403).json({ error: result.error });
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error verifying agency access:', error);
      res.status(401).json({ error: error.message });
    }
  }

  async updateDocumentStatus(req, res) {
    try {
      const { 
        agencyKey, 
        bookingId, 
        cargoId, 
        documentType, 
        status, 
        comments 
      } = req.body;

      if (!agencyKey || !bookingId || !cargoId || !documentType || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

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

  async getAgencyByKey(req, res) {
    try {
      const { agencyKey } = req.params;
      const agency = await this.agencyService.getAgencyByKey(agencyKey);
      
      if (!agency) {
        return res.status(404).json({ error: 'Agency not found' });
      }
      
      res.status(200).json(agency);
    } catch (error) {
      console.error('Error getting agency:', error);
      res.status(500).json({ error: 'Error fetching agency details' });
    }
  }

  async getDocumentRequirements(req, res) {
    try {
      const { agencyKey } = req.params;
      const { documentType } = req.query;

      if (!documentType) {
        return res.status(400).json({ error: 'Document type is required' });
      }

      const requirements = await this.agencyService.getDocumentRequirements(agencyKey, documentType);
      res.status(200).json(requirements);
    } catch (error) {
      console.error('Error getting document requirements:', error);
      res.status(500).json({ error: 'Error fetching document requirements' });
    }
  }
}

module.exports = AgencyController;