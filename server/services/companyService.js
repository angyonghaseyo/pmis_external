const { db } = require('../config/firebase');

class CompanyService {
    async fetchCompanyData(companyName) {
        const companyRef = db.collection('companies').doc(companyName);
        const companyDoc = await companyRef.get();

        if (!companyDoc.exists) {
            return null;
        }

        return companyDoc.data();
    }

    async updateCompanyData(companyName, data) {
        const companyRef = db.collection('companies').doc(companyName);
        await companyRef.update(data);
    }
}

module.exports = CompanyService;