import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";
import type { Server } from "http";
import type { Socket } from "net";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Function to find an available port
async function findAvailablePort(startPort: number, maxAttempts = 10): Promise<number> {
  let attempts = 0;
  let currentPort = startPort;

  while (attempts < maxAttempts) {
    try {
      await new Promise<void>((resolve, reject) => {
        const testServer = createServer();
        testServer.once('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE') {
            testServer.close();
            currentPort++;
            resolve();
          } else {
            reject(err);
          }
        });
        testServer.once('listening', () => {
          testServer.close();
          resolve();
        });
        testServer.listen(currentPort, '0.0.0.0');
      });
      return currentPort;
    } catch (err) {
      attempts++;
      currentPort++;
    }
  }
  throw new Error(`Could not find available port after ${maxAttempts} attempts`);
}

// Graceful shutdown handler
function setupGracefulShutdown(server: Server) {
  const connections = new Set<Socket>();

  server.on('connection', (conn: Socket) => {
    connections.add(conn);
    conn.on('close', () => connections.delete(conn));
  });

  function shutdown() {
    log('Received kill signal, shutting down gracefully');

    // Stop accepting new connections
    server.close(() => {
      log('Closed out remaining connections');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      log('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);

    // Close all existing connections
    connections.forEach(conn => {
      try {
        conn.end();
        setTimeout(() => conn.destroy(), 5000);
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    });
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return {
    shutdown,
    connections
  };
}

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  throw err;
});

(async () => {
  try {
    const server = registerRoutes(app);

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Set up graceful shutdown
    const { shutdown } = setupGracefulShutdown(server);

    // Find an available port starting from 5000
    try {
      const port = await findAvailablePort(5000);
      server.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port}`);
      });

      // Set up error handling for the server
      server.on('error', async (error: NodeJS.ErrnoException) => {
        console.error('Server error:', error);
        if (error.code === 'EADDRINUSE') {
          log(`Port is in use, attempting to find another port...`);
          try {
            const newPort = await findAvailablePort(5001);
            server.close();
            server.listen(newPort, '0.0.0.0');
          } catch (err) {
            console.error('Failed to recover from port conflict:', err);
            shutdown();
          }
        } else {
          console.error('Unrecoverable server error:', error);
          shutdown();
        }
      });

    } catch (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();