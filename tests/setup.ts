import { vi } from 'vitest';

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