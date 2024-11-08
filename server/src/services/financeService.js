const { db } = require('../config/firebase');

class FinanceService {
    async getBillingRequests(companyId, requestType) {
        const billingRequests = [];
        try {
            const billingCollection = collection(db, 'billing_requests');
            const billingQuery = query(
                billingCollection,
                where('company', '==', companyId),
                where('resourceType', '==', requestType)
            );
            const querySnapshot = await getDocs(billingQuery);

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