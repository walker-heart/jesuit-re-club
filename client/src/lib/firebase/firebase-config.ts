import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc,
  setDoc,
  serverTimestamp,
  deleteDoc,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import type { User } from '@/lib/types';

// Check if all required environment variables are present
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required Firebase configuration: ${missingVars.join(', ')}`);
}

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: `${projectId}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
let app;
let auth;
let db;

try {
  // Only initialize if no apps exist
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  db = getFirestore(app);

  // Enable offline persistence
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support persistence.');
    }
  });
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

// Export initialized instances
export { auth, db };

// Auth functions
export const loginWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }

    const userData = userDoc.data();
    return {
      uid: userDoc.id,
      email: userCredential.user.email,
      username: userData.username,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      role: userData.role || 'user'
    };
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, password: string, username: string, firstName: string = '', lastName: string = ''): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    const userData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      username,
      firstName,
      lastName,
      role: 'user',
      createdAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', userCredential.user.uid), userData);
    
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      username,
      firstName,
      lastName,
      role: 'user'
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const getCurrentUser = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (!userDoc.exists()) return null;

    const userData = userDoc.data();
    const userRole = userData?.role || 'user';
    const firstName = userData?.firstName || '';
    const lastName = userData?.lastName || '';

    // Store user role in localStorage for role-based permissions
    localStorage.setItem('userRole', userRole);

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      username: userData?.username || '',
      firstName,
      lastName,
      role: userRole
    };
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Add initialization status check
export const isInitialized = () => {
  return !!app && !!auth && !!db;
};

// Export onAuthStateChanged for direct access
export { onAuthStateChanged };