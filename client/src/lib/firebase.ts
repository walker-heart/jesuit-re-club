import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  type DocumentData,
  serverTimestamp,
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager
} from "firebase/firestore";

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID'
];

for (const envVar of requiredEnvVars) {
  if (!import.meta.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('Initializing Firebase with configuration');

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() })
});

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

// Generic CRUD operations
export async function createDocument<T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> {
  try {
    // Validate collection name and data
    if (!collectionName || !data) {
      throw new Error('Collection name and data are required');
    }

    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log(`Successfully created document in ${collectionName}:`, docRef.id);
    return docRef.id;
  } catch (error) {
    console.error(`Error creating ${collectionName} document:`, error);
    throw error;
  }
}

export async function readDocument<T>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
  try {
    if (!collectionName || !documentId) {
      throw new Error('Collection name and document ID are required');
    }

    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() } as T;
      console.log(`Successfully read document from ${collectionName}:`, documentId);
      return data;
    }
    console.log(`Document not found in ${collectionName}:`, documentId);
    return null;
  } catch (error) {
    console.error(`Error reading ${collectionName} document:`, error);
    throw error;
  }
}

export async function readDocuments<T>(
  collectionName: string,
  whereClause?: { field: string; operator: "==" | ">" | "<" | ">=" | "<="; value: any }
): Promise<T[]> {
  try {
    if (!collectionName) {
      throw new Error('Collection name is required');
    }

    const collectionRef = collection(db, collectionName);
    let queryRef = collectionRef;

    if (whereClause) {
      queryRef = query(collectionRef, where(whereClause.field, whereClause.operator, whereClause.value));
    }
    
    const querySnapshot = await getDocs(queryRef);
    const documents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
    
    console.log(`Successfully read ${documents.length} documents from ${collectionName}`);
    return documents;
  } catch (error) {
    console.error(`Error reading ${collectionName} documents:`, error);
    throw error;
  }
}

export async function updateDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string,
  data: Partial<T>
): Promise<void> {
  try {
    if (!collectionName || !documentId || !data) {
      throw new Error('Collection name, document ID, and update data are required');
    }

    // Verify document exists before updating
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error(`Document ${documentId} not found in ${collectionName}`);
    }

    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    
    console.log(`Successfully updated document in ${collectionName}:`, documentId);
  } catch (error) {
    console.error(`Error updating ${collectionName} document:`, error);
    throw error;
  }
}

export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  try {
    if (!collectionName || !documentId) {
      throw new Error('Collection name and document ID are required');
    }

    // Verify document exists before deleting
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error(`Document ${documentId} not found in ${collectionName}`);
    }

    await deleteDoc(docRef);
    console.log(`Successfully deleted document from ${collectionName}:`, documentId);
  } catch (error) {
    console.error(`Error deleting ${collectionName} document:`, error);
    throw error;
  }
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
