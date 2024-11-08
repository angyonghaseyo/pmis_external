const path = require('path');
const { Storage } = require('@google-cloud/storage');

class BookingService {
    constructor(db) {
        this.db = db;
        this.storage = new Storage({
            projectId: 'your-project-id',
            keyFilename: path.join(__dirname, '../../config/serviceAccountKey.json')
        });
        this.bucket = this.storage.bucket('pmis-47493.appspot.com');
    }

    async fetchBookings() {
        try {
            const snapshot = await this.db.collection('bookings').get();
            return snapshot.docs.map(doc => ({
                bookingId: doc.data().bookingId || doc.id, // Use existing bookingId or fallback to doc.id
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error in fetchBookings:', error);
            throw error;
        }
    }

    async createBooking(bookingData) {
        try {
            const docRef = await this.db.collection('bookings').add({
                ...bookingData,
                createdAt: new Date().toISOString()
            });
            
            await docRef.update({ bookingId: docRef.id });
            
            return {
                id: docRef.id,
                ...bookingData
            };
        } catch (error) {
            console.error('Error in createBooking:', error);
            throw error;
        }
    }

    async updateBooking(id, bookingData) {
        try {
            const bookingRef = this.db.collection('bookings').doc(id);
            await bookingRef.update({
                ...bookingData,
                updatedAt: new Date().toISOString()
            });
            
            const doc = await bookingRef.get();
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('Error in updateBooking:', error);
            throw error;
        }
    }

    async deleteBooking(id) {
        try {
            await this.db.collection('bookings').doc(id).delete();
            return true;
        } catch (error) {
            console.error('Error in deleteBooking:', error);
            throw error;
        }
    }

    async uploadDocument(bookingId, cargoId, documentType, file) {
        try {
            const fileName = `${Date.now()}_${file.originalname}`;
            const filePath = `documents/${bookingId}/${cargoId}/${documentType}/${fileName}`;
            const fileRef = this.bucket.file(filePath);
            
            await fileRef.save(file.buffer, {
                metadata: { contentType: file.mimetype }
            });

            await fileRef.makePublic();
            const downloadURL = `https://storage.googleapis.com/${this.bucket.name}/${filePath}`;

            const bookingRef = this.db.collection('bookings').doc(bookingId);
            const booking = await bookingRef.get();
            const bookingData = booking.data();

            const updatedCargo = {
                ...bookingData.cargo[cargoId],
                documents: {
                    ...bookingData.cargo[cargoId].documents,
                    [documentType]: downloadURL
                }
            };

            await bookingRef.update({
                [`cargo.${cargoId}`]: updatedCargo
            });

            return { url: downloadURL };
        } catch (error) {
            console.error('Error in uploadDocument:', error);
            throw error;
        }
    }
}

module.exports = BookingService;