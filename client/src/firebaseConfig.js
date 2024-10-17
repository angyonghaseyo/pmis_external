import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB0kg9HEplw-6zC_65DMktzi2sipbeDk3g",
  authDomain: "pmis-47493.firebaseapp.com",
  projectId: "pmis-47493",
  storageBucket: "pmis-47493.appspot.com",
  messagingSenderId: "820094914524",
  appId: "1:820094914524:web:6a8ebfff7c5b0983614919"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };