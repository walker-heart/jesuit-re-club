import { vi } from 'vitest';
import admin from 'firebase-admin';

// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
    signOut: vi.fn(),
  })),
  signInWithEmailAndPassword: vi.fn(() => Promise.resolve({
    user: {
      uid: 'test-uid',
      email: 'test@example.com',
      getIdToken: () => Promise.resolve('test-token'),
    },
  })),
  createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({
    user: {
      uid: 'test-uid',
      email: 'test@example.com',
      getIdToken: () => Promise.resolve('test-token'),
    },
  })),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({
      email: 'test@example.com',
      username: 'testuser',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    id: 'test-uid',
  })),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({
    empty: false,
    docs: [{
      data: () => ({
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      id: 'test-uid',
    }],
  })),
  query: vi.fn(),
  where: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
}));

export async function setupTestEnvironment() {
  try {
    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.VITE_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }

    // Create admin user if it doesn't exist
    const adminEmail = 'admin@example.com';
    try {
      await admin.auth().getUserByEmail(adminEmail);
      console.log('Admin user already exists');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        const adminUser = await admin.auth().createUser({
          email: adminEmail,
          password: 'adminpass',
          displayName: 'Admin User',
        });

        // Set custom claims for admin role
        await admin.auth().setCustomUserClaims(adminUser.uid, { role: 'admin' });

        // Create admin document in Firestore
        await admin.firestore().collection('users').doc(adminUser.uid).set({
          email: adminEmail,
          username: 'Admin User',
          role: 'admin',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log('Admin user created successfully');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Test setup error:', error);
    throw error;
  }
}

export async function cleanupTestEnvironment() {
  try {
    // Add any cleanup logic here
    await admin.app().delete();
    console.log('Test environment cleaned up');
  } catch (error) {
    console.error('Test cleanup error:', error);
    throw error;
  }
}