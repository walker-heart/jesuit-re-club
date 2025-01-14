import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, log } from "./vite.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Essential middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS configuration
app.use(cors());

// Logging middleware
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
        const logJson = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${logJson.length > 100 ? logJson.slice(0, 100) + '...' : logJson}`;
      }
      log(logLine);
    }
  });

  next();
});

console.log('Starting server initialization...');

(async () => {
  try {
    console.log('Registering routes...');
    // Register API routes
    const server = registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ 
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined 
      });
    });

    console.log('Setting up Vite or static file serving...');
    // Setup Vite or serve static files based on environment
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      // In production, serve static files from the client/dist directory
      const clientDistPath = path.join(__dirname, '../client/dist');
      console.log('Serving static files from:', clientDistPath);
      app.use(express.static(clientDistPath));

      // Handle client-side routing by serving index.html for all non-API routes
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
          return next();
        }
        res.sendFile(path.join(clientDistPath, 'index.html'));
      });
    }

    // Start server
    const PORT = Number(process.env.PORT || 5000);
    server.listen(PORT, '0.0.0.0', () => {
      log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();