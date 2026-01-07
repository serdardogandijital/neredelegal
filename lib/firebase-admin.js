import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Singleton pattern - sadece bir kez initialize et
let adminInstance = null;

function initializeFirebaseAdmin() {
  if (adminInstance) {
    return adminInstance;
  }

  if (admin.apps.length > 0) {
    adminInstance = admin;
    return adminInstance;
  }

  try {
    // Environment variables'dan credential oku
    if (process.env.FIREBASE_PROJECT_ID && 
        process.env.FIREBASE_CLIENT_EMAIL && 
        process.env.FIREBASE_PRIVATE_KEY) {
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'neredeapp-68658.firebasestorage.app',
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
      });
      
      adminInstance = admin;
      return adminInstance;
    }

    // Alternatif: Service account JSON dosyasından oku
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
      path.join(process.cwd(), '..', 'neredeapp-68658-firebase-adminsdk-fbsvc-0e21e8c922.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'neredeapp-68658.firebasestorage.app',
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
      });
      
      adminInstance = admin;
      return adminInstance;
    }

    throw new Error('Firebase Admin credentials not found. Set environment variables or provide service account JSON.');
    
  } catch (error) {
    console.error('Firebase admin initialization error:', error.message);
    throw error;
  }
}

// Initialize on module load
initializeFirebaseAdmin();

export default admin;

