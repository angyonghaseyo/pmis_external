const { db } = require('../config/firebase');

class TrainingService {
    async fetchTrainingPrograms() {
        const programsRef = db.collection('training_programs');
        const programsSnapshot = await programsRef.get();
        return programsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                startDate: data.startDate ? data.startDate.toDate() : null, // Convert Firestore Timestamp to JavaScript Date
                endDate: data.endDate ? data.endDate.toDate() : null // Convert Firestore Timestamp to JavaScript Date
            };
        });
    }
}

module.exports = TrainingService;