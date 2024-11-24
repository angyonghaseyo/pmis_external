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
        try {
            const q = db.collection('inquiries_feedback').where('email', '==', userId);
            const querySnapshot = await q.get();
            
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                let createdAt = null;

                if (data.createdAt) {
                    if (data.createdAt instanceof admin.firestore.Timestamp) {
                        createdAt = data.createdAt.toDate();
                    } else if (data.createdAt._seconds || data.createdAt.seconds) {
                        const seconds = data.createdAt._seconds || data.createdAt.seconds;
                        createdAt = new Date(seconds * 1000);
                    } else if (typeof data.createdAt === 'string') {
                        createdAt = new Date(data.createdAt);
                    }
                }

                return {
                    id: doc.id,
                    ...data,
                    createdAt: createdAt || new Date()
                };
            });
        } catch (error) {
            console.error('Error fetching inquiries and feedback:', error);
            throw error;
        }
    }

    async createInquiryFeedback(data, file) {
        try {
            const attachments = [];
            
            if (file) {
                const fileName = `inquiries_feedback/${Date.now()}_${file.originalname}`;
                const fileRef = bucket.file(fileName);
                
                await fileRef.save(file.buffer, {
                    metadata: { contentType: file.mimetype }
                });

                await fileRef.makePublic();
                const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                
                attachments.push({
                    name: file.originalname,
                    url: url
                });
            }

            const docData = {
                ...data,
                userId: data.email,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'Pending',
                attachments: attachments
            };

            return await db.collection('inquiries_feedback').add(docData);
        } catch (error) {
            console.error('Error in createInquiryFeedback:', error);
            throw error;
        }
    }

    async updateInquiryFeedback(id, data, file) {
        try {
            const docRef = db.collection('inquiries_feedback').doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error(`No inquiry/feedback found with ID: ${id}`);
            }

            const currentData = doc.data();
            let attachments = currentData.attachments || [];

            if (file) {
                const fileName = `inquiries_feedback/${Date.now()}_${file.originalname}`;
                const fileRef = bucket.file(fileName);
                
                await fileRef.save(file.buffer, {
                    metadata: { contentType: file.mimetype }
                });

                await fileRef.makePublic();
                const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                
                attachments.push({
                    name: file.originalname,
                    url: url
                });
            }

            const { file: fileData, ...dataWithoutFile } = data;
            const updateData = {
                ...dataWithoutFile,
                attachments: attachments,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            await docRef.update(updateData);
        } catch (error) {
            console.error('Error in updateInquiryFeedback:', error);
            throw error;
        }
    }

    async deleteInquiryFeedback(id) {
        try {
            const docRef = db.collection('inquiries_feedback').doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error(`No inquiry/feedback found with ID: ${id}`);
            }

            const docData = doc.data();

            // Delete all attachments from storage
            if (docData.attachments && docData.attachments.length > 0) {
                for (const attachment of docData.attachments) {
                    try {
                        if (attachment.url) {
                            const fileName = attachment.url.split(`${bucket.name}/`)[1];
                            const fileRef = bucket.file(fileName);
                            await fileRef.delete();
                        }
                    } catch (error) {
                        console.warn(`Error deleting file ${attachment.name}:`, error);
                        // Continue with deletion of other files
                    }
                }
            }

            // Delete the document from Firestore
            await docRef.delete();
            return { success: true, message: 'Inquiry/feedback deleted successfully' };
        } catch (error) {
            console.error('Error in deleteInquiryFeedback:', error);
            throw error;
        }
    }
}

module.exports = InquiryService;