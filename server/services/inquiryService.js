const { db, admin } = require('../config/firebase');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage({
    projectId: 'your-project-id',
    keyFilename: path.join(__dirname, '../../config/serviceAccountKey.json')
});

const bucket = storage.bucket('pmis-47493.appspot.com');

class InquiryService {
    async fetchInquiriesFeedback(userId) {
        const q = db.collection('inquiries_feedback').where('email', '==', userId);
        const querySnapshot = await q.get();
        return querySnapshot.docs.map(doc => {
            const data = doc.data();

            let formattedCreatedAt = null;
            if (data.createdAt) {
                if (data.createdAt instanceof admin.firestore.Timestamp) {
                    formattedCreatedAt = data.createdAt.toDate();
                } else if (data.createdAt._seconds || data.createdAt.seconds) {
                    const seconds = data.createdAt._seconds || data.createdAt.seconds;
                    formattedCreatedAt = new Date(seconds * 1000);
                } else if (typeof data.createdAt === 'string') {
                    formattedCreatedAt = new Date(data.createdAt);
                }
            }

            return {
                id: doc.id,
                ...data,
                createdAt: formattedCreatedAt || new Date()
            };
        });
    }

    async updateInquiryFeedback(incrementalId, data, file) {
        const inquiriesRef = db.collection('inquiries_feedback');
        const querySnapshot = await inquiriesRef.get();
        let docId = null;

        querySnapshot.forEach((doc) => {
            const inquiryData = doc.data();
            if (inquiryData.incrementalId.toString() === incrementalId) {
                docId = doc.id;
            }
        });

        if (!docId) {
            throw new Error(`No inquiry/feedback found with incremental ID: ${incrementalId}`);
        }

        let fileURL = data.fileURL || null;
        if (file) {
            const fileExtension = file.originalname.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
            const fileRef = bucket.file(`inquiries_feedback/${fileName}`);
            await fileRef.save(file.buffer, {
                metadata: { contentType: file.mimetype },
            });
            fileURL = `https://storage.googleapis.com/${bucket.name}/inquiries_feedback/${fileName}`;
        }

        const { file: fileData, ...dataWithoutFile } = data;
        const updateData = {
            ...dataWithoutFile,
            fileURL: fileURL,
        };

        const docRef = db.collection('inquiries_feedback').doc(docId);
        await docRef.update(updateData);
    }

    async createInquiryFeedback(data, file) {
        let fileURL = null;

        if (file) {
            const fileExtension = file.originalname.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
            const fileRef = bucket.file(`inquiries_feedback/${fileName}`);
            await fileRef.save(file.buffer, {
                metadata: { contentType: file.mimetype },
            });
            fileURL = `https://storage.googleapis.com/${bucket.name}/inquiries_feedback/${fileName}`;
        }

        const { file: fileData, ...dataWithoutFile } = data;
        const inquiriesRef = db.collection('inquiries_feedback');
        const snapshot = await inquiriesRef.get();
        const newIncrementalId = snapshot.size + 1;

        const docData = {
            ...dataWithoutFile,
            incrementalId: newIncrementalId,
            userId: data.email,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'Pending',
            fileURL: fileURL,
        };

        return await inquiriesRef.add(docData);
    }
}

module.exports = InquiryService;