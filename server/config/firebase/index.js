import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;
let auth = null;

const initializeFirebase = () => {
  try {
    // Only initialize if not already initialized
    if (!admin.apps.length) {
      console.log('🔥 Initializing Firebase Admin SDK...');
      
      // Read credentials from environment or file
      let serviceAccount;
      
      if (process.env.FIREBASE_CREDENTIALS) {
        // Use credentials from environment variable (for production)
        serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
        console.log('📄 Using Firebase credentials from environment variable');
      } else {
        // Use credentials from local file (for development)
        const credentialsPath = join(__dirname, 'credentials.json');
        serviceAccount = JSON.parse(readFileSync(credentialsPath, 'utf8'));
        console.log('📄 Using Firebase credentials from local file');
      }

      // Initialize Firebase Admin
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });

      console.log(`✅ Firebase Admin SDK initialized for project: ${serviceAccount.project_id}`);
    }

    // Get Firestore database instance
    db = admin.firestore();
    
    // Get Firebase Auth instance
    auth = admin.auth();

    // Configure Firestore settings
    db.settings({
      timestampsInSnapshots: true,
    });

    console.log('🗄️  Firestore database connected');
    console.log('🔐 Firebase Auth connected');
    
    return { db, auth };
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error.message);
    throw error;
  }
};

// Initialize Firebase and export instances
const { db: firestore, auth: firebaseAuth } = initializeFirebase();

// Export the initialized instances
export { firestore as db, firebaseAuth as auth };
export default { db: firestore, auth: firebaseAuth };