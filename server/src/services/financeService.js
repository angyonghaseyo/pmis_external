const { db, admin } = require('../config/firebase');

class FinanceService {
    async getBillingRequests(companyId, requestType) {
        console.log("Fetching billing requests for:", companyId, requestType);
        const billingRequests = [];
        try {
            const billingQuery = db.collection("billing_requests")
                                 .where('company', '==', companyId)
                                 .where('resourceType', '==', requestType);
            
            const querySnapshot = await billingQuery.get();
            
            querySnapshot.forEach((doc) => {
                billingRequests.push({ id: doc.id, ...doc.data() });
            });

            return billingRequests;
        } catch (error) {
            console.error('Error fetching billing requests:', error);
            throw new Error('Failed to fetch billing requests');
        }
    }
}

module.exports = FinanceService;