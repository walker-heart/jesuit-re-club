import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { auth, loginWithEmail } from './lib/firebase';
import admin from 'firebase-admin';
import { setupTestEnvironment, cleanupTestEnvironment } from './setup';
import fetch from 'node-fetch';

describe('User Creation Flow', () => {
  let adminToken: string;
  let createdUserId: string;
  const baseUrl = process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : 'http://localhost:3000';

  // Test data
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'Test123!',
    username: `testuser${Date.now()}`,
    role: 'user'
  };

  beforeAll(async () => {
    try {
      // Setup test environment
      await setupTestEnvironment();
      console.log('Test environment setup complete');

      // Sign in as admin
      const adminUser = await loginWithEmail('admin@example.com', 'adminpass');
      if (!auth.currentUser) {
        throw new Error('Failed to sign in as admin');
      }
      adminToken = await auth.currentUser.getIdToken();
      console.log('Admin signed in successfully');

      // Log the base URL being used
      console.log('Using base URL:', baseUrl);

      // Verify server is running
      try {
        const healthCheck = await fetch(`${baseUrl}/api/health`);
        if (!healthCheck.ok) {
          throw new Error(`Server health check failed: ${healthCheck.status}`);
        }
        console.log('Server health check passed');
      } catch (error) {
        console.error('Server health check failed:', error);
        throw new Error('Server is not running or not accessible');
      }
    } catch (error) {
      console.error('Test setup error:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Clean up created test user
      if (createdUserId) {
        await admin.auth().deleteUser(createdUserId);
        await admin.firestore().collection('users').doc(createdUserId).delete();
        console.log('Test user cleaned up successfully');
      }

      // Sign out admin
      await auth.signOut();
      console.log('Admin signed out');

      // Clean up test environment
      await cleanupTestEnvironment();
      console.log('Test environment cleanup complete');
    } catch (error) {
      console.error('Test cleanup error:', error);
      throw error;
    }
  });

  it('should create a new user successfully', async () => {
    console.log('Testing user creation...');
    const response = await fetch(`${baseUrl}/api/admin/users/create`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(testUser)
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response text:', responseText);

    expect(response.ok).toBe(true);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = JSON.parse(responseText);
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testUser.email);
    expect(data.user.username).toBe(testUser.username);
    expect(data.user.role).toBe(testUser.role);

    createdUserId = data.user.uid;
    console.log('User created with ID:', createdUserId);

    // Verify user exists in Firebase Auth
    const authUser = await admin.auth().getUser(createdUserId);
    expect(authUser).toBeDefined();
    expect(authUser.email).toBe(testUser.email);
    expect(authUser.displayName).toBe(testUser.username);
    console.log('User verified in Firebase Auth');

    // Verify user document exists in Firestore
    const userDoc = await admin.firestore().collection('users').doc(createdUserId).get();
    expect(userDoc.exists).toBe(true);
    const userData = userDoc.data();
    expect(userData).toBeDefined();
    expect(userData?.email).toBe(testUser.email);
    expect(userData?.username).toBe(testUser.username);
    expect(userData?.role).toBe(testUser.role);
    console.log('User verified in Firestore');
  });

  it('should handle validation errors', async () => {
    console.log('Testing validation errors...');
    const invalidUser = {
      email: 'invalid-email',
      password: '123', // Too short
      username: '',
      role: 'invalid-role'
    };

    const response = await fetch(`${baseUrl}/api/admin/users/create`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(invalidUser)
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response text:', responseText);

    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = JSON.parse(responseText);
    expect(data.success).toBe(false);
    expect(data.message).toBeDefined();
    console.log('Validation error test passed');
  });

  it('should prevent unauthorized user creation', async () => {
    console.log('Testing unauthorized access...');
    // Sign out admin
    await auth.signOut();
    
    const response = await fetch(`${baseUrl}/api/admin/users/create`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response text:', responseText);

    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = JSON.parse(responseText);
    expect(data.success).toBe(false);
    expect(data.message).toBe('No token provided');
    console.log('Unauthorized access test passed');
  });
}); 