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
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userData?.role || 'user',
      username: userData?.username
    };
    
    next();
  } catch (error: any) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function registerRoutes(app: Express): Server {
  // Test route
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.post("/api/auth/verify-token", verifyFirebaseToken, (req: Request, res: Response) => {
    res.json({ user: req.user });
  });

  // User management routes
  app.post("/api/auth/user", verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
      const { uid } = req.user!;
      const userDoc = await db.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ user: userDoc.data() });
    } catch (error: any) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post("/api/admin/users", verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const usersSnapshot = await db.collection('users').get();
      const users = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));

      res.json({ users });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Internal server error' });
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
