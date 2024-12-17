import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, query, where, getDocs, deleteDoc, setDoc } from 'firebase/firestore';
import { loginWithEmail, registerWithEmail, logoutUser } from '../client/src/lib/firebase';

// Test user data
const testUser = {
  email: 'test@example.com',
  password: 'testPassword123!',
  username: 'testuser'
};

// Get mocked instances
const auth = getAuth();
const db = getFirestore();

describe('Firebase Authentication & Firestore Tests', () => {
  let userId: string;

  // Helper function to clean up test data
  async function cleanup() {
    if (userId) {
      try {
        // Delete user data from Firestore
        await deleteDoc(doc(db, 'users', userId));
        await deleteDoc(doc(db, 'sessions', userId));
        
        // Delete user from Firebase Auth
        const user = auth.currentUser;
        if (user) {
          await logoutUser(); // Use our custom logout function instead
        }
      } catch (error) {
        console.error('Error cleaning up test data:', error);
      }
    }
  }

  beforeAll(async () => {
    // Ensure Firebase is initialized
    expect(auth).toBeDefined();
    expect(db).toBeDefined();
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const result = await registerWithEmail(
        testUser.email,
        testUser.password,
        testUser.username
      );

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testUser.email);
      expect(result.user.username).toBe(testUser.username);
      
      userId = result.user.uid;

      // Verify user document in Firestore
      const userDoc = await getDoc(doc(db, 'users', userId));
      expect(userDoc.exists()).toBe(true);
      expect(userDoc.data()?.email).toBe(testUser.email);
    });

    it('should login existing user', async () => {
      // First sign out
      await logoutUser();

      const result = await loginWithEmail(testUser.email, testUser.password);
      
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testUser.email);
      expect(result.user.uid).toBe(userId);

      // Verify session was created
      const sessionDoc = await getDoc(doc(db, 'sessions', userId));
      expect(sessionDoc.exists()).toBe(true);
      expect(sessionDoc.data()?.userId).toBe(userId);
    });

    it('should handle logout', async () => {
      await logoutUser();
      
      // Verify user is signed out
      expect(auth.currentUser).toBeNull();

      // Verify session was deleted
      const sessionDoc = await getDoc(doc(db, 'sessions', userId));
      expect(sessionDoc.exists()).toBe(false);
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      // Ensure user is logged in before each test
      await loginWithEmail(testUser.email, testUser.password);
    });

    it('should create valid session on login', async () => {
      const sessionDoc = await getDoc(doc(db, 'sessions', userId));
      expect(sessionDoc.exists()).toBe(true);
      
      const sessionData = sessionDoc.data();
      expect(sessionData?.userId).toBe(userId);
      expect(new Date(sessionData?.expiresAt.toDate()) > new Date()).toBe(true);
    });

    it('should handle expired sessions', async () => {
      // Create an expired session
      const expiredSessionId = `${userId}-expired`;
      await setDoc(doc(db, 'sessions', expiredSessionId), {
        userId,
        token: 'expired-token',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000)  // 1 day ago
      });

      // Try to get the expired session
      const sessionDoc = await getDoc(doc(db, 'sessions', expiredSessionId));
      const sessionData = sessionDoc.data();
      
      expect(sessionDoc.exists()).toBe(true);
      expect(new Date(sessionData?.expiresAt.toDate()) < new Date()).toBe(true);

      // Clean up expired session
      await deleteDoc(doc(db, 'sessions', expiredSessionId));
    });
  });

  describe('User Data', () => {
    it('should find user by email', async () => {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', testUser.email));
      const querySnapshot = await getDocs(q);
      
      expect(querySnapshot.empty).toBe(false);
      const userDoc = querySnapshot.docs[0];
      expect(userDoc.data().email).toBe(testUser.email);
      expect(userDoc.data().username).toBe(testUser.username);
    });

    it('should find user by username', async () => {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', testUser.username));
      const querySnapshot = await getDocs(q);
      
      expect(querySnapshot.empty).toBe(false);
      const userDoc = querySnapshot.docs[0];
      expect(userDoc.data().email).toBe(testUser.email);
      expect(userDoc.id).toBe(userId);
    });
  });
}); 