const { Storage } = require('@google-cloud/storage');
const path = require('path');
const admin = require('firebase-admin');

class CargoRepackingService {
    constructor(db) {
        this.db = db;
        this.storage = new Storage({
            projectId: 'your-project-id',
            keyFilename: path.join(__dirname, '../../config/serviceAccountKey.json')
        });
        this.bucket = this.storage.bucket('pmis-47493.appspot.com');
    }

    async fetchRepackingRequestById(id) {
        try {
            const doc = await this.db.collection('repackingRequests').doc(id).get();
            if (!doc.exists) {
                return null;
            }

            const data = doc.data();
            // Ensure timestamps are properly formatted in the response
            const formattedData = {
                ...data,
                schedule: {
                    startDate: data.schedule?.startDate ? {
                        _seconds: data.schedule.startDate.seconds,
                        _nanoseconds: data.schedule.startDate.nanoseconds
                    } : null,
                    endDate: data.schedule?.endDate ? {
                        _seconds: data.schedule.endDate.seconds,
                        _nanoseconds: data.schedule.endDate.nanoseconds
                    } : null
                },
                createdAt: data.createdAt ? {
                    _seconds: data.createdAt.seconds,
                    _nanoseconds: data.createdAt.nanoseconds
                } : null,
                updatedAt: data.updatedAt ? {
                    _seconds: data.updatedAt.seconds,
                    _nanoseconds: data.updatedAt.nanoseconds
                } : null
            };

            return { id: doc.id, ...formattedData };
        } catch (error) {
            console.error('Error in fetchRepackingRequestById:', error);
            throw error;
        }
    }

    async createRepackingRequest(requestData, files) {
        try {
            const documentUrls = await this.uploadDocuments(files);

            // Convert dates to Firestore Timestamps
            const formattedSchedule = {
                ...requestData.schedule,
                startDate: requestData.schedule.startDate ?
                    admin.firestore.Timestamp.fromDate(new Date(requestData.schedule.startDate)) : null,
                endDate: requestData.schedule.endDate ?
                    admin.firestore.Timestamp.fromDate(new Date(requestData.schedule.endDate)) : null
            };

            const repackingRequest = {
                ...requestData,
                schedule: formattedSchedule,
                documents: documentUrls,
                status: 'Pending',
                createdAt: admin.firestore.Timestamp.now(),
                updatedAt: admin.firestore.Timestamp.now()
            };

            const docRef = await this.db.collection('repackingRequests').add(repackingRequest);
            await this.db.collection('repackingRequests').doc(docRef.id).update({ id: docRef.id });

            return { id: docRef.id, ...repackingRequest };
        } catch (error) {
            console.error('Error in createRepackingRequest:', error);
            throw error;
        }
    }

    async fetchRepackingRequests(filters) {
        try {
            let query = this.db.collection('repackingRequests');

            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }

            if (filters.dateRange && filters.dateRange !== 'all') {
                const dateRanges = {
                    'today': [new Date().setHours(0, 0, 0, 0), new Date().setHours(23, 59, 59, 999)],
                    'week': [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()],
                    'month': [new Date(new Date().setDate(1)), new Date()]
                };
                const [start, end] = dateRanges[filters.dateRange];
                query = query.where('createdAt', '>=', admin.firestore.Timestamp.fromDate(new Date(start)))
                    .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(new Date(end)));
            }

            const snapshot = await query.get();
            let requests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            if (filters.searchQuery) {
                const searchLower = filters.searchQuery.toLowerCase();
                requests = requests.filter(request =>
                    request.cargoDetails.cargoNumber.toLowerCase().includes(searchLower) ||
                    request.cargoDetails.cargoType.toLowerCase().includes(searchLower)
                );
            }

            return requests;
        } catch (error) {
            console.error('Error in fetchRepackingRequests:', error);
            throw error;
        }
    }

    async updateRepackingRequest(id, requestData, files) {
        try {
            const documentUrls = await this.uploadDocuments(files);

            // Convert dates to Firestore Timestamps
            const formattedSchedule = {
                ...requestData.schedule,
                startDate: requestData.schedule.startDate ?
                    admin.firestore.Timestamp.fromDate(new Date(requestData.schedule.startDate)) : null,
                endDate: requestData.schedule.endDate ?
                    admin.firestore.Timestamp.fromDate(new Date(requestData.schedule.endDate)) : null
            };

            const updateData = {
                ...requestData,
                schedule: formattedSchedule,
                updatedAt: admin.firestore.Timestamp.now()
            };

            if (Object.keys(documentUrls).length > 0) {
                updateData.documents = documentUrls;
            }

            await this.db.collection('repackingRequests').doc(id).update(updateData);
        } catch (error) {
            console.error('Error in updateRepackingRequest:', error);
            throw error;
        }
    }

    async deleteRepackingRequest(id) {
        try {
            await this.db.collection('repackingRequests').doc(id).delete();
        } catch (error) {
            console.error('Error in deleteRepackingRequest:', error);
            throw error;
        }
    }

    async uploadDocuments(files) {
        const documentUrls = {};

        if (files.repackagingChecklist) {
            const file = files.repackagingChecklist;
            const fileName = `repackingRequests/checklist_${Date.now()}_${file.originalname}`;
            const fileRef = this.bucket.file(fileName);
            await fileRef.save(file.buffer, {
                metadata: { contentType: file.mimetype }
            });
            await fileRef.makePublic();
            documentUrls.repackagingChecklist = `https://storage.googleapis.com/${this.bucket.name}/${fileName}`;
        }

        return documentUrls;
    }
}

module.exports = CargoRepackingService;