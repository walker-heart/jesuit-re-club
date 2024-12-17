import type { Express, Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import { createServer, type Server } from "http";

// Initialize Firebase Admin with better error handling
try {
  if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.VITE_FIREBASE_PROJECT_ID) {
    throw new Error('Missing Firebase Admin credentials - check your environment variables');
  }

  // Only initialize if not already initialized
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  throw error;
}

// Get Firestore instance
const db = admin.firestore();

// Middleware to verify Firebase token and add user data
async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      role: userData?.role || 'user',
      username: userData?.username || decodedToken.email?.split('@')[0] || 'user'
    };
    
    next();
  } catch (error: any) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Invalid token',
      error: error.message 
    });
  }
}

export function registerRoutes(app: Express): Server {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.post("/api/auth/verify-token", verifyFirebaseToken, (req: Request, res: Response) => {
    res.json({ success: true, user: req.user });
  });

  // User management routes
  app.post("/api/auth/user", verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
      const { uid } = req.user!;
      const userDoc = await db.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      res.json({ 
        success: true,
        user: userDoc.data() 
      });
    } catch (error: any) {
      console.error('Error fetching user:', error);
      res.status(500).json({ 
        success: false,
        message: 'Internal server error',
        error: error.message 
      });
    }
  });

  // Admin routes
  app.post("/api/admin/users", verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: 'Unauthorized - Admin access required' 
        });
      }

      const usersSnapshot = await db.collection('users').get();
      const users = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));

      res.json({ 
        success: true,
        users 
      });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json({ 
        success: false,
        message: 'Internal server error',
        error: error.message 
      });
    }
  });

  // Update user (admin only)
  app.put("/api/admin/users/:uid/update", verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
      // Check admin role
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: 'Unauthorized - Admin access required' 
        });
      }

      const { uid } = req.params;
      const { firstName, lastName, username, email, role, password } = req.body;

      // Validate role
      if (role && !['admin', 'editor', 'user'].includes(role)) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid role' 
        });
      }

      // Update user in Firebase Auth
      const updateAuthData: any = {
        displayName: `${firstName} ${lastName}`
      };
      if (email) updateAuthData.email = email;
      if (password) updateAuthData.password = password;

      try {
        await admin.auth().updateUser(uid, updateAuthData);
      } catch (error: any) {
        console.error('Error updating Firebase Auth:', error);
        return res.status(400).json({ 
          success: false,
          message: error.message 
        });
      }

      // Update user document in Firestore
      const updateData = {
        firstName,
        lastName,
        username,
        email,
        role,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: req.user.uid
      };

      await db.collection('users').doc(uid).update(updateData);

      // Return success response
      return res.json({
        success: true,
        message: 'User updated successfully',
        user: {
          uid,
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('Error updating user:', error);
      return res.status(500).json({ 
        success: false,
        message: error.message || 'Failed to update user' 
      });
    }
  });
  // Delete user (admin only)
  app.delete("/api/admin/users/:uid/delete", verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
      // Check admin role
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: 'Unauthorized - Admin access required' 
        });
      }

      const { uid } = req.params;

      // Delete user from Firebase Auth
      try {
        await admin.auth().deleteUser(uid);
      } catch (error: any) {
        console.error('Error deleting user from Firebase Auth:', error);
        return res.status(400).json({ 
          success: false,
          message: error.message || 'Failed to delete user from Firebase Auth'
        });
      }

      // Delete user document from Firestore
      try {
        await db.collection('users').doc(uid).delete();
      } catch (error: any) {
        console.error('Error deleting user from Firestore:', error);
        // Even if Firestore delete fails, Auth deletion succeeded
        return res.status(500).json({ 
          success: false,
          message: 'User deleted from Auth but failed to delete from Firestore'
        });
      }

      return res.json({
        success: true,
        message: 'User successfully deleted from both Auth and Firestore'
      });
    } catch (error: any) {
      console.error('Error in delete user endpoint:', error);
      return res.status(500).json({ 
        success: false,
        message: error.message || 'Failed to delete user'
      });
    }
  });
  // Create user (admin only)
  app.post("/api/admin/users/create", verifyFirebaseToken, async (req: Request, res: Response) => {
    console.log('Create user request received:', JSON.stringify(req.body, null, 2));
    
    try {
      // Check admin role
      if (req.user?.role !== 'admin') {
        console.log('Unauthorized: User role is', req.user?.role);
        return res.status(403).json({ 
          success: false,
          message: 'Unauthorized - Admin access required' 
        });
      }

      const { email, password, username, role, firstName, lastName } = req.body;
      console.log('Parsed request data:', { email, username, firstName, lastName, role });

      // Validate required fields
      const requiredFields = {
        firstName,
        lastName,
        username,
        email,
        password,
        role
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([field]) => field);

      if (missingFields.length > 0) {
        console.log('Missing fields:', missingFields);
        return res.status(400).json({ 
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }

      // Validate role
      if (!['admin', 'editor', 'user'].includes(role)) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid role' 
        });
      }

      let userRecord;
      try {
        console.log('Creating user in Firebase Auth...');
        // Create user in Firebase Auth
        userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: `${firstName} ${lastName}`,
        });
        console.log('User created in Firebase Auth:', userRecord.uid);

        console.log('Creating user document in Firestore...');
        const userData = {
          email,
          firstName,
          lastName,
          username,
          role,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: req.user.uid,
        };
        
        // Create user document in Firestore
        await db.collection('users').doc(userRecord.uid).set(userData);
        console.log('User document created in Firestore');

        // Return success response
        return res.status(201)
          .set({ 'Content-Type': 'application/json' })
          .json({
            success: true,
            message: 'User created successfully',
            user: {
              uid: userRecord.uid,
              ...userData
            },
          });
      } catch (error: any) {
        console.error('Error creating user:', error);
        
        // Clean up Firebase Auth user if Firestore creation failed
        if (userRecord && error.code !== 'auth/email-already-exists') {
          try {
            await admin.auth().deleteUser(userRecord.uid);
            console.log('Cleaned up Firebase Auth user after Firestore error');
          } catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError);
          }
        }

        // Return appropriate error message
        if (error.code === 'auth/email-already-exists') {
          return res.status(400).json({ 
            success: false,
            message: 'Email already exists' 
          });
        } else if (error.code === 'auth/invalid-password') {
          return res.status(400).json({ 
            success: false,
            message: 'Password must be at least 6 characters' 
          });
        } else if (error.code === 'auth/invalid-email') {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid email format' 
          });
        }
        
        throw error; // Re-throw for general error handling
      }
    } catch (error: any) {
      console.error('Error in user creation endpoint:', error);
      return res.status(500)
        .set({ 'Content-Type': 'application/json' })
        .json({ 
          success: false,
          message: 'Failed to create user', 
          error: error.message || 'Unknown error'
        });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}

// Add custom properties to Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string | null;
        role: string;
        username: string;
      };
    }
  }
}
