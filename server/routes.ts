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
    }
  }
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

// Middleware to verify Firebase token
async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check if a valid session exists and update last activity
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.firebaseUid, decodedToken.uid),
          gt(sessions.expiresAt, new Date())
        )
      );

    if (!session) {
      // If no valid session exists, create a new one
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, decodedToken.uid));

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const [newSession] = await db
        .insert(sessions)
        .values({
          userId: user.id,
          firebaseUid: decodedToken.uid,
          token: token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          lastActivity: new Date(),
        })
        .returning();

      req.user = decodedToken;
      req.session = newSession;
      return next();
    }

    // Update last activity for existing session
    await db
      .update(sessions)
      .set({ 
        lastActivity: new Date(),
        token: token, // Update token in case it's refreshed
      })
      .where(eq(sessions.id, session.id));

    // Attach both Firebase user and session to request
    req.user = decodedToken;
    req.session = {
      ...session,
      lastActivity: new Date(),
      token: token,
    };
    
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
}

export function registerRoutes(app: Express): Server {
  // Auth routes
  app.post("/api/auth/register", verifyFirebaseToken, async (req, res) => {
    try {
      const { email, username } = req.body;
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
      const firebaseUid = req.user.uid;

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, firebaseUid));

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove any expired sessions for this user
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

      res.json({ user, session });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", verifyFirebaseToken, async (req, res) => {
    try {
      const firebaseUid = req.user.uid;

      // Remove session
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
