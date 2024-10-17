const admin = require('firebase-admin');
const serviceAccount = require('../config/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com"
});

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

const firebaseUtils = {
  // User management
  async createUser(userData) {
    const userRecord = await auth.createUser(userData);
    await db.collection('users').doc(userRecord.uid).set(userData);
    return userRecord;
  },

  async getUser(uid) {
    const userRecord = await auth.getUser(uid);
    const userDoc = await db.collection('users').doc(uid).get();
    return { ...userRecord, ...userDoc.data() };
  },

  async updateUser(uid, userData) {
    await auth.updateUser(uid, userData);
    await db.collection('users').doc(uid).update(userData);
  },

  async deleteUser(uid) {
    await auth.deleteUser(uid);
    await db.collection('users').doc(uid).delete();
  },

  // Document operations
  async getDocument(collection, docId) {
    const docRef = db.collection(collection).doc(docId);
    const doc = await docRef.get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async getDocuments(collection, queryParams = []) {
    let query = db.collection(collection);
    queryParams.forEach(param => {
      query = query.where(param.field, param.operator, param.value);
    });
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async addDocument(collection, data) {
    const docRef = await db.collection(collection).add(data);
    return docRef.id;
  },

  async updateDocument(collection, docId, data) {
    await db.collection(collection).doc(docId).update(data);
  },

  async deleteDocument(collection, docId) {
    await db.collection(collection).doc(docId).delete();
  },

  // Storage operations
  async uploadFile(bucket, filePath, fileBuffer) {
    const file = storage.bucket(bucket).file(filePath);
    await file.save(fileBuffer);
    return file.publicUrl();
  },

  async deleteFile(bucket, filePath) {
    await storage.bucket(bucket).file(filePath).delete();
  },

  // Custom claims
  async setCustomUserClaims(uid, claims) {
    await auth.setCustomUserClaims(uid, claims);
  },

  // Transactions
  async runTransaction(updateFunction) {
    return db.runTransaction(updateFunction);
  }
};

module.exports = firebaseUtils;