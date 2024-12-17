import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { auth } from "firebase-admin";
import { db } from "@db";
import { eq, and, or, gt, lt } from "drizzle-orm";
import { users, sessions } from "@db/schema";
import admin from "firebase-admin";

// Extend Express Request type to include Firebase user
declare global {
  namespace Express {
    interface Request {
      user?: auth.DecodedIdToken;
      session?: any; // TODO: Type this properly
    }
  }
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    if (!process.env.VITE_FIREBASE_PROJECT_ID ||
        !process.env.FIREBASE_CLIENT_EMAIL ||
        !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('Missing Firebase admin configuration');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

// Middleware to verify Firebase token
async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // For registration and login endpoints, skip session check
    if (req.path === '/api/auth/register' || req.path === '/api/auth/login') {
      req.user = decodedToken;
      return next();
    }

    try {
      // Check for valid session
      const [session] = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.firebaseUid, decodedToken.uid),
            gt(sessions.expiresAt, new Date())
          )
        );

      // Clean up expired sessions
      await db
        .delete(sessions)
        .where(
          and(
            eq(sessions.firebaseUid, decodedToken.uid),
            lt(sessions.expiresAt, new Date())
          )
        );

      if (!session) {
        // Create new session if none exists
        const [newSession] = await db
          .insert(sessions)
          .values({
            firebaseUid: decodedToken.uid,
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          })
          .returning();

        req.user = decodedToken;
        req.session = newSession;
        return next();
      }

      // Existing valid session
      req.user = decodedToken;
      req.session = session;
      next();
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ message: 'Error verifying session' });
    }
  } catch (error: any) {
    console.error('Error verifying token:', error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Session expired, please login again' });
    } else if (error.code === 'auth/argument-error') {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
    res.status(401).json({ message: 'Authentication failed' });
  }
}

export function registerRoutes(app: Express): Server {
  // Auth routes
  app.post("/api/auth/register", verifyFirebaseToken, async (req, res) => {
    try {
      const { email, username } = req.body;
      if (!req.user?.uid) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const firebaseUid = req.user.uid;

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.email, email),
            eq(users.username, username),
            eq(users.firebaseUid, firebaseUid)
          )
        );

      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create new user
      const [user] = await db
        .insert(users)
        .values({
          email,
          username,
          firebaseUid,
          role: 'user',
        })
        .returning();

      // Create session
      await db.insert(sessions).values({
        userId: user.id,
        firebaseUid,
        token: req.headers.authorization!.split('Bearer ')[1],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      res.json(user);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", verifyFirebaseToken, async (req, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const firebaseUid = req.user.uid;

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, firebaseUid));

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove expired sessions
      await db
        .delete(sessions)
        .where(
          and(
            eq(sessions.firebaseUid, firebaseUid),
            lt(sessions.expiresAt, new Date())
          )
        );

      // Create new session
      const [session] = await db
        .insert(sessions)
        .values({
          userId: user.id,
          firebaseUid,
          token: req.headers.authorization!.split('Bearer ')[1],
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        })
        .returning();

      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", verifyFirebaseToken, async (req, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const firebaseUid = req.user.uid;

      // Remove all sessions
      await db
        .delete(sessions)
        .where(eq(sessions.firebaseUid, firebaseUid));

      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  app.get("/api/auth/session", verifyFirebaseToken, async (req, res) => {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const firebaseUid = req.user.uid;

      // Find valid session
      const [session] = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.firebaseUid, firebaseUid),
            gt(sessions.expiresAt, new Date())
          )
        );

      if (!session) {
        return res.status(401).json({ message: "No valid session found" });
      }

      // Get user data
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId));

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error('Session verification error:', error);
      res.status(500).json({ message: "Session verification failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
