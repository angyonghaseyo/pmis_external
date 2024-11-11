const { db, admin } = require('../config/firebase');

class FinanceService {
    async getBillingRequests(companyId, requestType) {
        console.log("Fetching billing requests for:", companyId, requestType);
        const billingRequests = [];
        try {
            const billingQuery = db.collection("billing_requests")
                .where('company', '==', companyId)
                .where('requestType', '==', requestType);
            
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

    async getBillingRequestsByMonth(companyId, month) {
        console.log("Fetching billing requests for:", companyId, "Month:", month);

        const billingRequests = [];
        try {
            const startOfMonth = new Date(month);
            startOfMonth.setUTCDate(1);
            startOfMonth.setUTCHours(0, 0, 0, 0);

            const endOfMonth = new Date(startOfMonth);
            endOfMonth.setUTCMonth(startOfMonth.getUTCMonth() + 1);

            const billingQuery = db.collection("billing_requests")
                .where('company', '==', companyId)
                .where('dateCompleted', '>=', startOfMonth)
                .where('dateCompleted', '<', endOfMonth);

            const querySnapshot = await billingQuery.get();

            querySnapshot.forEach((doc) => {
                billingRequests.push({ id: doc.id, ...doc.data() });
            });

            return billingRequests;
        } catch (error) {
            console.error('Error fetching billing requests by month:', error);
            throw new Error('Failed to fetch billing requests by month');
        }
    }
}

module.exports = FinanceService;
