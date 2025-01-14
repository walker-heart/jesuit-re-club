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
  type DocumentData,
  serverTimestamp,
  deleteDoc,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import type { User } from '@/lib/types';

// Check if all required environment variables are present
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required Firebase configuration: ${missingVars.join(', ')}`);
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase with better error handling
const initializeFirebaseApp = () => {
  try {
    if (!getApps().length) {
      const app = initializeApp(firebaseConfig);
      console.log('Firebase app initialized successfully');
      return app;
    }
    return getApps()[0];
  } catch (error) {
    console.error('Error initializing Firebase app:', error);
    throw error;
  }
};

// Initialize Firestore with better error handling
const initializeFirestore = () => {
  try {
    const firestore = getFirestore();

    // Enable offline persistence
    enableIndexedDbPersistence(firestore, {
      forceOwnership: true
    }).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support persistence.');
      }
    });

    console.log('Firestore initialized successfully');
    return firestore;
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    throw error;
  }
};

// Initialize app and services
const app = initializeFirebaseApp();
export const auth = getAuth(app);
export const db = initializeFirestore();

// Add initialization status check
export const isInitialized = () => {
  return !!app && !!auth && !!db;
};

// Export onAuthStateChanged for direct access
export { onAuthStateChanged };

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
      role: userData.role || 'user'
    };
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message);
  }
};

export const registerWithEmail = async (email: string, password: string, username: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    const userData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      username,
      role: 'user',
      createdAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', userCredential.user.uid), userData);
    
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      username,
      role: 'user'
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.message);
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
    const userRole = userData.role || 'user';
    
    // Store user role in localStorage for role-based permissions
    localStorage.setItem('userRole', userRole);
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      username: userData.username,
      role: userRole
    };
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};