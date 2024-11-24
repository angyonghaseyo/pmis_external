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
          res.status(500).json({ 
              error: 'Failed to fetch billing requests', 
              details: error.message 
          });
      }
  }

  async getBillingRequestsByMonth(req, res) {
      const { companyId, month } = req.query;
      if (!companyId || !month) {
          return res.status(400).json({ error: 'companyId and month are required' });
      }

      try {
          const billingRequests = await this.financeService.getBillingRequestsByMonth(companyId, month);
          res.status(200).json(billingRequests);
      } catch (error) {
          console.error('Error fetching billing requests by month:', error);
          res.status(500).json({ 
              error: 'Failed to fetch billing requests', 
              details: error.message 
          });
      }
  }

  async getBillingRequestsByMonth1(req, res) {
      const { companyId, startDate, endDate } = req.query;

      if (!companyId || !startDate || !endDate) {
          return res.status(400).json({ 
              error: 'Missing required parameters. Please provide companyId, startDate and endDate' 
          });
      }

      try {
          const monthRange = {
              start: startDate,
              end: endDate
          };
          
          const billingRequests = await this.financeService.getBillingRequestsByMonth1(
              companyId, 
              monthRange
          );
          
          res.status(200).json(billingRequests);
      } catch (error) {
          console.error('Error fetching billing requests by month:', error);
          res.status(500).json({ 
              error: 'Failed to fetch billing requests',
              details: error.message 
          });
      }
  }
}

module.exports = FinanceController;