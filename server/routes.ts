import express from 'express';
import { Express, Request, Response } from 'express';
import { Server, createServer } from 'http';
import admin from 'firebase-admin';
import { db } from './firebase';
import { verifyFirebaseToken } from './middleware';

export function registerRoutes(app: Express): Server {
  const server = createServer(app);

  // Middleware to parse JSON bodies
  app.use(express.json());

  // Admin routes for user management
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

  // Password update route must come before the general update route
  app.post("/api/admin/users/:uid/update-password", verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
      // Check admin role
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: 'Unauthorized - Admin access required' 
        });
      }

      const { uid } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required'
        });
      }

      try {
        // First get the user's email
        const userRecord = await admin.auth().getUser(uid);
        if (!userRecord.email) {
          throw new Error('User has no email address');
        }

        // Update the user's password directly
        await admin.auth().updateUser(uid, {
          password: password,
          emailVerified: true // Keep email verified status
        });

        console.log('Successfully updated password for user:', uid);
        
        return res.json({
          success: true,
          message: 'Password updated successfully'
        });
      } catch (error: any) {
        console.error('Error updating password:', error);
        
        // Return specific error messages for common cases
        if (error.code === 'auth/invalid-password') {
          return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters'
          });
        } else if (error.code === 'auth/user-not-found') {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
        
        return res.status(400).json({
          success: false,
          message: error.message || 'Failed to update password'
        });
      }
    } catch (error: any) {
      console.error('Error in password update endpoint:', error);
      return res.status(500).json({ 
        success: false,
        message: error.message || 'Failed to update password' 
      });
    }
  });

  // General update route comes after password route
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
      const { firstName, lastName, username, email, role } = req.body;

      // Validate role
      if (role && !['admin', 'editor', 'user'].includes(role)) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid role' 
        });
      }

      // First update user in Firebase Auth
      const updateAuthData: admin.auth.UpdateRequest = {};
      
      // Only include fields that are provided
      if (firstName || lastName) {
        updateAuthData.displayName = `${firstName} ${lastName}`.trim();
      }
      if (email) {
        updateAuthData.email = email;
      }

      try {
        await admin.auth().updateUser(uid, updateAuthData);
      } catch (error: any) {
        console.error('Error updating Firebase Auth:', error);
        return res.status(400).json({ 
          success: false,
          message: error.message 
        });
      }

      // Then update user document in Firestore
      const updateData: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: req.user.uid
      };

      // Only include fields that are provided
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (role) updateData.role = role;

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

  return server;
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