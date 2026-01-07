import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA2pRWYsAMaidVLxcI8pVQRcdBMWbSx9FI",
  authDomain: "neredeapp-68658.firebaseapp.com",
  projectId: "neredeapp-68658",
  storageBucket: "neredeapp-68658.firebasestorage.app",
  messagingSenderId: "56710940923",
  appId: "1:56710940923:web:a828e411face1cfecec85e",
  measurementId: "G-88YW0XQ890"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

