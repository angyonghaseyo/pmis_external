const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const serviceAccount = require('../config/serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com" // Replace with your Firebase project's database URL
});

// Initialize Firebase App for client SDK
const firebaseConfig = {
  apiKey: "AIzaSyB0kg9HEplw-6zC_65DMktzi2sipbeDk3g",
  authDomain: "pmis-47493.firebaseapp.com",
  projectId: "pmis-47493",
  storageBucket: "pmis-47493.appspot.com",
  messagingSenderId: "820094914524",
  appId: "1:820094914524:web:6a8ebfff7c5b0983614919"
};

const firebaseApp = initializeApp(firebaseConfig);

const db = admin.firestore();
const auth = getAuth(firebaseApp);
const storage = admin.storage();

const firebaseUtils = {
  // User management
  async createUser(userData) {
    const userRecord = await admin.auth().createUser(userData);
    await db.collection('users').doc(userRecord.uid).set(userData);
    return userRecord;
  },

  async getUser(uid) {
    const userRecord = await admin.auth().getUser(uid);
    const userDoc = await db.collection('users').doc(uid).get();
    return { ...userRecord, ...userDoc.data() };
  },

  async updateUser(uid, userData) {
    await admin.auth().updateUser(uid, userData);
    await db.collection('users').doc(uid).update(userData);
  },

  async deleteUser(uid) {
    await admin.auth().deleteUser(uid);
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
    await admin.auth().setCustomUserClaims(uid, claims);
  },

  // Transactions
  async runTransaction(updateFunction) {
    return db.runTransaction(updateFunction);
  },

  // Authentication
  async signInWithEmailAndPassword(email, password) {
    console.log('Attempting to sign in with email:', email);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful for email:', email);
      return result;
    } catch (error) {
      console.error('Error in signInWithEmailAndPassword:', error.code, error.message);
      throw error;
    }
  },

  async sendPasswordResetEmail(email) {
    return admin.auth().generatePasswordResetLink(email);
  },

  async verifyIdToken(idToken) {
    return admin.auth().verifyIdToken(idToken);
  },

  async createCustomToken(uid) {
    return admin.auth().createCustomToken(uid);
  },

  async verifyPasswordResetCode(oobCode) {
    return admin.auth().verifyPasswordResetCode(oobCode);
  },

  async confirmPasswordReset(oobCode, newPassword) {
    return admin.auth().confirmPasswordReset(oobCode, newPassword);
  }
};

module.exports = firebaseUtils;