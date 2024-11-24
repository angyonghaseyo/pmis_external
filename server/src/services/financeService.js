const { db } = require('../config/firebase');

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

    async getBillingRequestsByMonth1(companyId, monthRange) {
        try {
            const billingRequestsRef = db.collection('billing_requests');
            const querySnapshot = await billingRequestsRef
                .where('company', '==', companyId)
                .get();
            
            const billingRequests = querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter(request => {
                    const dateCompleted = new Date(request.dateCompleted);
                    const startDate = new Date(monthRange.start);
                    const endDate = new Date(monthRange.end);
                    return dateCompleted >= startDate && dateCompleted <= endDate;
                });

            return billingRequests;
        } catch (error) {
            console.error('Error fetching billing requests by month:', error);
            throw new Error(`Failed to fetch billing requests: ${error.message}`);
        }
    }
}

module.exports = FinanceService;