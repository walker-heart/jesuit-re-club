import type { Express, Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import { createServer, type Server } from "http";
import * as dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin with better error handling
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  console.error('Missing or invalid Firebase credentials');
  process.exit(1);
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

  // Resources routes for admin
  app.get("/api/admin/resources", verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
      console.log('Fetching resources for admin...');
      const resourcesRef = db.collection('resources');
      const resourcesSnapshot = await resourcesRef.get();
      
      const resources = await Promise.all(resourcesSnapshot.docs.map(async doc => {
        const data = doc.data();
        console.log('Resource data:', data);
        
        // Get creator's display name from Firebase Auth
        let creatorName = data.userCreated || 'Unknown';
        if (data.userCreated && data.userCreated.includes('@')) {
          try {
            const userRecord = await admin.auth().getUserByEmail(data.userCreated);
            creatorName = userRecord.displayName || data.userCreated;
          } catch (error) {
            console.error('Error fetching user data for resource:', error);
          }
        }
        
        return {
          id: doc.id,
          ...data,
          userCreated: creatorName
        };
      }));
      
      // Sort by creation date, newest first
      resources.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      console.log('Returning resources:', resources);
      return res.json({
        success: true,
        resources
      });
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      return res.status(500).json({ 
        success: false,
        message: error.message || 'Failed to fetch resources'
      });
    }
  });

  app.post("/api/resources", verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
      // Check if user has permission to create resources (admin or editor)
      if (!['admin', 'editor'].includes(req.user?.role || '')) {
        return res.status(403).json({ 
          success: false,
          message: 'Unauthorized - Admin or Editor access required' 
        });
      }

      const { title, description, numberOfTexts, textFields } = req.body;

      // Validate required fields
      const requiredFields = { title, description, numberOfTexts, textFields };
      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([field]) => field);

      if (missingFields.length > 0) {
        return res.status(400).json({ 
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }

      // Create resource document in Firestore
      const resourceDoc = {
        title,
        description,
        numberOfTexts: parseInt(numberOfTexts),
        textFields: Array.isArray(textFields) ? textFields : [textFields],
        userCreated: req.user?.username || 'Unknown',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: req.user?.username || 'Unknown'
      };

      // Use title + timestamp as document ID for better organization
      const docId = `${title}-${Date.now()}`.replace(/[/:\\]/g, '-');
      await db.collection('resources').doc(docId).set(resourceDoc);

      return res.status(201).json({
        success: true,
        message: 'Resource created successfully',
        resource: {
          id: docId,
          ...resourceDoc,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('Error creating resource:', error);
      return res.status(500).json({ 
        success: false,
        message: error.message || 'Failed to create resource' 
      });
    }
  });

  app.get("/api/resources", async (_req, res) => {
    try {
      const resourcesRef = db.collection('resources');
      const resourcesSnapshot = await resourcesRef.get();
      const resources = resourcesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return res.json({
        success: true,
        resources
      });
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      return res.status(500).json({ 
        success: false,
        message: error.message || 'Failed to fetch resources'
      });
    }
  });

  app.get("/api/resources/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const resourceDoc = await db.collection('resources').doc(id).get();
      
      if (!resourceDoc.exists) {
        return res.status(404).json({ 
          success: false,
          message: 'Resource not found'
        });
      }

      return res.json({
        success: true,
        resource: {
          id: resourceDoc.id,
          ...resourceDoc.data()
        }
      });
    } catch (error: any) {
      console.error('Error fetching resource:', error);
      return res.status(500).json({ 
        success: false,
        message: error.message || 'Failed to fetch resource'
      });
    }
  });

  // Admin routes
  // Events routes
  app.post("/api/events/create", verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
      // Check if user has permission to create events (admin or editor)
      if (!['admin', 'editor'].includes(req.user?.role || '')) {
        return res.status(403).json({ 
          success: false,
          message: 'Unauthorized - Admin or Editor access required' 
        });
      }

      const { title, date, time, location, speaker, speakerDescription, agenda } = req.body;

      // Validate required fields
      const requiredFields = { title, date, time, location, speaker, speakerDescription, agenda };
      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([field]) => field);

      if (missingFields.length > 0) {
        return res.status(400).json({ 
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }

      // Create event document in Firestore
      const eventDoc = {
        title,
        date,
        time,
        location,
        speaker,
        speakerDescription,
        agenda,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        userCreated: req.user?.username || req.user?.email || 'Unknown'
      };

      // Use Speaker + Date as document ID
      const docId = `${speaker} ${date} - ${time}`.replace(/[/:\\]/g, '-');
      await db.collection('events').doc(docId).set(eventDoc);

      return res.status(201).json({
        success: true,
        message: 'Event created successfully',
        event: {
          id: docId,
          ...eventDoc,
          createdAt: new Date().toLocaleString()
        }
      });
    } catch (error: any) {
      console.error('Error creating event:', error);
      return res.status(500).json({ 
        success: false,
        message: error.message || 'Failed to create event'
      });
    }
  });

  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const eventsRef = admin.firestore().collection('events');
      const eventsSnapshot = await eventsRef.get();
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return res.json({
        success: true,
        events
      });
    } catch (error: any) {
      console.error('Error fetching events:', error);
      return res.status(500).json({ 
        success: false,
        message: error.message || 'Failed to fetch events'
      });
    }
  });
  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const eventDoc = await admin.firestore().collection('events').doc(id).get();
      
      if (!eventDoc.exists) {
        return res.status(404).json({ 
          success: false,
          message: 'Event not found'
        });
      }

      return res.json({
        success: true,
        event: {
          id: eventDoc.id,
          ...eventDoc.data()
        }
      });
    } catch (error: any) {
      console.error('Error fetching event:', error);
      return res.status(500).json({ 
        success: false,
        message: error.message || 'Failed to fetch event'
      });
    }
  });
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
      if (!['admin', 'editor', 'user', 'test'].includes(role)) {
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
