import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { createServer } from "http";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize express app
const app = express();

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add security and CORS headers
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  });
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Request logging middleware for development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
      query: req.query,
      body: req.body,
    });
    next();
  });
}

// Initialize the application components
(async () => {
  try {
    // Create HTTP server
    const server = createServer(app);
    
    // Initialize routes first
    try {
      registerRoutes(app);
      console.log('Routes registered successfully');
    } catch (error) {
      console.error('Failed to register routes:', error);
      process.exit(1);
    }

    // API error handling middleware
    app.use('/api', (err: any, req: Request, res: Response, _next: NextFunction) => {
      console.error('API error:', err);
      if (!res.headersSent) {
        res.status(err.status || 500).json({
          success: false,
          message: err.message || 'Internal Server Error',
          error: err.code || 'unknown_error'
        });
      }
    });

    // Setup Vite in development or serve static files in production
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev && process.env.NODE_ENV !== 'test') {
      console.log('Starting server in development mode...');
      await setupVite(app, server);
    } else {
      console.log('Starting server in', process.env.NODE_ENV, 'mode...');
      if (process.env.NODE_ENV === 'production') {
        const clientBuildPath = join(__dirname, '../client/dist');
        app.use(express.static(clientBuildPath));
        
        app.get('*', (req, res, next) => {
          if (req.path.startsWith('/api')) {
            next();
          } else {
            res.sendFile(join(clientBuildPath, 'index.html'));
          }
        });
      }
    }

    // Start the server
    const PORT = Number(process.env.PORT) || 5000;
    
    // Find an available port
    const startServer = async (port: number): Promise<void> => {
      try {
        await new Promise<void>((resolve, reject) => {
          server.once('error', (error: any) => {
            if (error.code === 'EADDRINUSE') {
              console.log(`Port ${port} is in use, trying port ${port + 1}`);
              server.close();
              startServer(port + 1).then(resolve).catch(reject);
            } else {
              reject(error);
            }
          });

          server.listen(port, '0.0.0.0', () => {
            console.log(`Server running on port ${port}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            resolve();
          });
        });
      } catch (error) {
        console.error('Server startup error:', error);
        throw error;
      }
    };

    await startServer(PORT);
  } catch (error) {
    console.error('Application initialization failed:', error);
    process.exit(1);
  }
})();
