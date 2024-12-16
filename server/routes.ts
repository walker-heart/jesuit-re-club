import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { db } from "@db";
import { eq } from "drizzle-orm";
import { users, type SelectUser } from "@db/schema";
import bcrypt from "bcrypt";

// Configure passport local strategy
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    // Find user by username
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      return done(null, false, { message: "Invalid username or password" });
    }

    // Compare password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return done(null, false, { message: "Invalid username or password" });
    }

    // Remove password from user object before serializing
    const { password: _password, ...userWithoutPassword } = user;
    return done(null, userWithoutPassword as Express.User);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return done(null, false);
    }

    done(null, user as Express.User);
  } catch (err) {
    done(err);
  }
});

export function registerRoutes(app: Express): Server {
  // Auth routes
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }

      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }

        // Save session before sending response
        req.session.save((err) => {
          if (err) {
            return next(err);
          }

          // Only send non-sensitive user data
          const { createdAt, updatedAt, ...userResponse } = user;
          res.json(userResponse);
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    req.logout((err) => {
      if (err) {
        return next(err);
      }

      req.session.destroy((err) => {
        if (err) {
          return next(err);
        }

        res.clearCookie("sid", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        });
        res.json({ message: "Logged out successfully" });
      });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Only send non-sensitive user data
    const user = req.user as Express.User;
    const { createdAt, updatedAt, ...userResponse } = user;
    res.json(userResponse);
  });

  const httpServer = createServer(app);
  return httpServer;
}