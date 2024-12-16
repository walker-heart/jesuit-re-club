import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

// User types
export type UserRole = 'admin' | 'editor' | 'user';

export interface User {
  id: number;
  firebaseUid: string;
  email: string;
  username: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Firebase Auth functions with session management
export const loginWithEmail = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await userCredential.user.getIdToken();
  
  // Send token to backend to create session
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({ email })
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
};

export const registerWithEmail = async (email: string, password: string, username: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const idToken = await userCredential.user.getIdToken();
  
  // Send token to backend to create user and session
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({ email, username })
  });

  if (!response.ok) {
    // Clean up: delete Firebase user if backend registration fails
    await userCredential.user.delete();
    throw new Error(await response.text());
  }

  return response.json();
};

export const logoutUser = async () => {
  // Clear backend session first
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  
  // Then sign out from Firebase
  return signOut(auth);
};

export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Helper function to get current session
export const getCurrentSession = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    const idToken = await currentUser.getIdToken();
    const response = await fetch('/api/auth/session', {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) return null;
      throw new Error(await response.text());
    }

    return response.json();
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
};
