class FinanceController {
    constructor(financeService) {
        this.financeService = financeService;
    }
    async getBillingRequests(req, res) {
      const { companyId, requestType } = req.query;
  
      if (!companyId || !requestType) {
        return res.status(400).json({ error: 'companyId and requestType are required' });
      }
  
      try {
        const billingRequests = await this.financeService.getBillingRequests(companyId, requestType);
        res.status(200).json(billingRequests);
      } catch (error) {
        console.error('Error fetching billing requests:', error);
        res.status(500).json({ error: 'Failed to fetch billing requests', details: error.message });
      }
    }
  }
  
  module.exports = FinanceController;
  