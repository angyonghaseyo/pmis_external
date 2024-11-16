const { Storage } = require('@google-cloud/storage');
const path = require('path');
const { Timestamp } = require('firebase-admin/firestore');

class CargoSamplingService {
    constructor(db) {
        this.db = db;
        this.storage = new Storage({
            projectId: 'your-project-id',
            keyFilename: path.join(__dirname, '../../config/serviceAccountKey.json')
        });
        this.bucket = this.storage.bucket('pmis-47493.appspot.com');
    }

    // Helper method to convert Firestore document
    convertDocument(doc) {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
            schedule: data.schedule ? {
                startDate: data.schedule.startDate?.toDate?.() || data.schedule.startDate,
                endDate: data.schedule.endDate?.toDate?.() || data.schedule.endDate
            } : null
        };
    }

    async getSamplingRequests(status) {
        try {
            const samplingRef = this.db.collection('samplingRequests');
            let query = samplingRef;

            if (status) {
                query = query.where('status', '==', status);
            }

            const snapshot = await query.orderBy('createdAt', 'desc').get();
            return snapshot.docs.map(doc => this.convertDocument(doc));
        } catch (error) {
            console.error('Error fetching sampling requests:', error);
            throw error;
        }
    }

    async createSamplingRequest(requestData) {
        try {
            // Ensure proper Timestamp objects are created for dates
            const timestamp = Timestamp.now();

            // Convert schedule dates to Timestamps if they exist
            const schedule = requestData.schedule ? {
                startDate: Timestamp.fromDate(new Date(requestData.schedule.startDate)),
                endDate: Timestamp.fromDate(new Date(requestData.schedule.endDate))
            } : null;

            const docRef = await this.db.collection('samplingRequests').add({
                ...requestData,
                schedule,
                status: 'Pending',
                createdAt: timestamp,
                updatedAt: timestamp
            });

            await docRef.update({ id: docRef.id });

            const newDoc = await docRef.get();
            return this.convertDocument(newDoc);
        } catch (error) {
            console.error('Error creating sampling request:', error);
            throw error;
        }
    }

    async updateSamplingRequest(id, updateData) {
        try {
            const docRef = this.db.collection('samplingRequests').doc(id);

            // Convert schedule dates to Timestamps if they exist in updateData
            if (updateData.schedule) {
                updateData.schedule = {
                    startDate: Timestamp.fromDate(new Date(updateData.schedule.startDate)),
                    endDate: Timestamp.fromDate(new Date(updateData.schedule.endDate))
                };
            }

            await docRef.update({
                ...updateData,
                updatedAt: Timestamp.now()
            });

            const updatedDoc = await docRef.get();
            return this.convertDocument(updatedDoc);
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
                updatedAt: Timestamp.now()
            });

            return { documentUrl: downloadUrl };
        } catch (error) {
            console.error('Error uploading sampling document:', error);
            throw error;
        }
    }
}

module.exports = CargoSamplingService;