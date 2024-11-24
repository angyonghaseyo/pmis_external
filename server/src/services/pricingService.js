const { db } = require('../config/firebase');

class PricingService {
    async fetchPricingRates() {
        try {
            const ratesDoc = await db.collection('pricing').doc('rates').get();
            if (ratesDoc.exists) {
                return ratesDoc.data();
            }
            return null;
        } catch (error) {
            console.error('Error in fetchPricingRates:', error);
            throw error;
        }
    }
}

module.exports = PricingService;