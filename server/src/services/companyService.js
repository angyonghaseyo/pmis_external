const { db } = require('../config/firebase');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

class CompanyService {
    constructor(db) {
        this.db = db;
        this.storage = new Storage({
            projectId: 'your-project-id',
            keyFilename: path.join(__dirname, '../../config/serviceAccountKey.json')
        });
        this.bucket = this.storage.bucket('pmis-47493.appspot.com');
    }

    async fetchCompanyData(companyName) {
        const companyRef = this.db.collection('companies').doc(companyName);
        const companyDoc = await companyRef.get();

        if (!companyDoc.exists) {
            return null;
        }

        return companyDoc.data();
    }

    async updateCompanyData(companyName, data) {
        const companyRef = this.db.collection('companies').doc(companyName);
        await companyRef.update(data);
    }

    async uploadCompanyLogo(companyName, file) {
        try {
            const fileName = `company_logos/${companyName}_${Date.now()}${path.extname(file.originalname)}`;
            const fileRef = this.bucket.file(fileName);
            
            await fileRef.save(file.buffer, {
                metadata: { contentType: file.mimetype }
            });
            
            await fileRef.makePublic();
            const logoUrl = `https://storage.googleapis.com/${this.bucket.name}/${fileName}`;
            
            // Update company document with new logo URL
            const companyRef = this.db.collection('companies').doc(companyName);
            await companyRef.update({ logoUrl });
            
            return logoUrl;
        } catch (error) {
            console.error('Error in uploadCompanyLogo:', error);
            throw error;
        }
    }
}

module.exports = CompanyService;