const { Storage } = require('@google-cloud/storage');
const path = require('path');
const admin = require('firebase-admin');

class CargoTransloadingService {
    constructor(db) {
        this.db = db;
        this.storage = new Storage({
            projectId: 'your-project-id',
            keyFilename: path.join(__dirname, '../../config/serviceAccountKey.json')
        });
        this.bucket = this.storage.bucket('pmis-47493.appspot.com');
    }

    async fetchTransloadingRequestById(id) {
        try {
            const doc = await this.db.collection('transloadingRequests').doc(id).get();
            if (!doc.exists) {
                return null;
            }

            const data = doc.data();
            const formattedData = {
                ...data,
                transloadingTimeWindow: {
                    startDate: data.transloadingTimeWindow?.startDate ? {
                        _seconds: data.transloadingTimeWindow.startDate.seconds,
                        _nanoseconds: data.transloadingTimeWindow.startDate.nanoseconds
                    } : null,
                    endDate: data.transloadingTimeWindow?.endDate ? {
                        _seconds: data.transloadingTimeWindow.endDate.seconds,
                        _nanoseconds: data.transloadingTimeWindow.endDate.nanoseconds
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
            console.error('Error in fetchTransloadingRequestById:', error);
            throw error;
        }
    }

    async createTransloadingRequest(requestData, files) {
        try {
            const documentUrls = await this.uploadDocuments(files);

            const formattedTimeWindow = {
                startDate: requestData.transloadingTimeWindow.startDate ?
                    admin.firestore.Timestamp.fromDate(new Date(requestData.transloadingTimeWindow.startDate)) : null,
                endDate: requestData.transloadingTimeWindow.endDate ?
                    admin.firestore.Timestamp.fromDate(new Date(requestData.transloadingTimeWindow.endDate)) : null
            };

            const transloadingRequest = {
                ...requestData,
                transloadingTimeWindow: formattedTimeWindow,
                documents: documentUrls,
                status: 'Pending',
                createdAt: admin.firestore.Timestamp.now(),
                updatedAt: admin.firestore.Timestamp.now()
            };

            const docRef = await this.db.collection('transloadingRequests').add(transloadingRequest);
            return { id: docRef.id, ...transloadingRequest };
        } catch (error) {
            console.error('Error in createTransloadingRequest:', error);
            throw error;
        }
    }

    async fetchTransloadingRequests(filters) {
        try {
            let query = this.db.collection('transloadingRequests');

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
            console.error('Error in fetchTransloadingRequests:', error);
            throw error;
        }
    }

    async updateTransloadingRequest(id, requestData, files) {
        try {
            const documentUrls = await this.uploadDocuments(files);

            const formattedTimeWindow = {
                startDate: requestData.transloadingTimeWindow.startDate ?
                    admin.firestore.Timestamp.fromDate(new Date(requestData.transloadingTimeWindow.startDate)) : null,
                endDate: requestData.transloadingTimeWindow.endDate ?
                    admin.firestore.Timestamp.fromDate(new Date(requestData.transloadingTimeWindow.endDate)) : null
            };

            const updateData = {
                ...requestData,
                transloadingTimeWindow: formattedTimeWindow,
                updatedAt: admin.firestore.Timestamp.now()
            };

            if (Object.keys(documentUrls).length > 0) {
                updateData.documents = documentUrls;
            }

            await this.db.collection('transloadingRequests').doc(id).update(updateData);
        } catch (error) {
            console.error('Error in updateTransloadingRequest:', error);
            throw error;
        }
    }

    async deleteTransloadingRequest(id) {
        try {
            await this.db.collection('transloadingRequests').doc(id).delete();
        } catch (error) {
            console.error('Error in deleteTransloadingRequest:', error);
            throw error;
        }
    }

    async uploadDocuments(files) {
        const documentUrls = {};

        if (files.transloadingSheet) {
            const file = files.transloadingSheet;
            const fileName = `transloadingRequests/tsheet_${Date.now()}_${file.originalname}`;
            const fileRef = this.bucket.file(fileName);
            await fileRef.save(file.buffer, {
                metadata: { contentType: file.mimetype }
            });
            await fileRef.makePublic();
            documentUrls.transloadingSheet = `https://storage.googleapis.com/${this.bucket.name}/${fileName}`;
        }

        if (files.additionalDocs) {
            documentUrls.additionalDocs = await Promise.all(
                files.additionalDocs.map(async (file) => {
                    const fileName = `transloadingRequests/additional_${Date.now()}_${file.originalname}`;
                    const fileRef = this.bucket.file(fileName);
                    await fileRef.save(file.buffer, {
                        metadata: { contentType: file.mimetype }
                    });
                    await fileRef.makePublic();
                    return `https://storage.googleapis.com/${this.bucket.name}/${fileName}`;
                })
            );
        }

        return documentUrls;
    }
}

module.exports = CargoTransloadingService;