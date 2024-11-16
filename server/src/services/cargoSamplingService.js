const { Storage } = require('@google-cloud/storage');
const path = require('path');

class CargoSamplingService {
    constructor(db) {
        this.db = db;
        this.storage = new Storage({
            projectId: 'your-project-id',
            keyFilename: path.join(__dirname, '../../config/serviceAccountKey.json')
        });
        this.bucket = this.storage.bucket('pmis-47493.appspot.com');
    }

    async getSamplingRequests(status) {
        try {
            const samplingRef = this.db.collection('samplingRequests');
            let query = samplingRef;

            if (status) {
                query = query.where('status', '==', status);
            }

            const snapshot = await query.orderBy('createdAt', 'desc').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching sampling requests:', error);
            throw error;
        }
    }

    async createSamplingRequest(requestData) {
        try {
            const docRef = await this.db.collection('samplingRequests').add({
                ...requestData,
                status: 'Pending',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            await docRef.update({ id: docRef.id });

            const newDoc = await docRef.get();
            return { id: docRef.id, ...newDoc.data() };
        } catch (error) {
            console.error('Error creating sampling request:', error);
            throw error;
        }
    }

    async updateSamplingRequest(id, updateData) {
        try {
            const docRef = this.db.collection('samplingRequests').doc(id);
            await docRef.update({
                ...updateData,
                updatedAt: new Date()
            });

            const updatedDoc = await docRef.get();
            return { id, ...updatedDoc.data() };
        } catch (error) {
            console.error('Error updating sampling request:', error);
            throw error;
        }
    }

    async deleteSamplingRequest(id) {
        try {
            await this.db.collection('samplingRequests').doc(id).delete();
            return true;
        } catch (error) {
            console.error('Error deleting sampling request:', error);
            throw error;
        }
    }

    async uploadSamplingDocument(requestId, file) {
        try {
            const fileExtension = file.originalname.split('.').pop();
            const fileName = `sampling_requests/${requestId}_${Date.now()}.${fileExtension}`;
            const fileRef = this.bucket.file(fileName);

            await fileRef.save(file.buffer, {
                metadata: { contentType: file.mimetype },
            });

            await fileRef.makePublic();
            const downloadUrl = `https://storage.googleapis.com/${this.bucket.name}/${fileName}`;

            const docRef = this.db.collection('samplingRequests').doc(requestId);
            await docRef.update({
                documentUrl: downloadUrl,
                updatedAt: new Date()
            });

            return { documentUrl: downloadUrl };
        } catch (error) {
            console.error('Error uploading sampling document:', error);
            throw error;
        }
    }
}

module.exports = CargoSamplingService;