class PricingController {
    constructor(pricingService) {
        this.pricingService = pricingService;
    }

    async getPricingRates(req, res) {
        try {
            const rates = await this.pricingService.fetchPricingRates();
            if (!rates) {
                return res.status(404).json({ error: 'Pricing rates not found' });
            }
            res.status(200).json(rates);
        } catch (error) {
            console.error('Error fetching pricing rates:', error);
            res.status(500).json({ error: 'Error fetching pricing rates' });
        }
    }
}

module.exports = PricingController;
