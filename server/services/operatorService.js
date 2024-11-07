const { db, admin } = require('../config/firebase');

class OperatorService {
    async fetchOperatorRequisitions(userId) {
        const q = db.collection('operator_requisitions').where('email', '==', userId);
        const querySnapshot = await q.get();
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async createOperatorRequisition(requisitionData) {
        const docRef = await db.collection('operator_requisitions').add({
            ...requisitionData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'Pending'
        });
        return docRef;
    }

    async updateOperatorRequisition(id, updateData) {
        const requisitionRef = db.collection('operator_requisitions').doc(id);
        await requisitionRef.update(updateData);
    }

    async deleteOperatorRequisition(id) {
        const requisitionRef = db.collection('operator_requisitions').doc(id);
        await requisitionRef.delete();
    }
}

module.exports = OperatorService;