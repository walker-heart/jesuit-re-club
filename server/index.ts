import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite } from "./vite.js";
import { createServer } from "http";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Content-Type': 'application/json',
  });
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    headers: req.headers,
    body: req.body,
  });
  next();
});

// Create HTTP server
const server = createServer(app);

// API routes should be registered before any static/SPA handling
registerRoutes(app);

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

// Setup Vite or static file serving
const isDev = process.env.NODE_ENV !== 'production';
if (isDev && process.env.NODE_ENV !== 'test') {
  console.log('Starting server in development mode...');
  setupVite(app, server).catch(error => {
    console.error('Error setting up Vite:', error);
    process.exit(1);
  });
} else {
  console.log('Starting server in', process.env.NODE_ENV, 'mode...');
  if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = join(__dirname, '../client/dist');
    app.use(express.static(clientBuildPath));
    
    // SPA fallback for non-API routes
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        next();
      } else {
        res.sendFile(join(clientBuildPath, 'index.html'));
      }
    });
  }
}

// Start server
const startServer = async () => {
  const PORT = Number(process.env.PORT) || 5000;
  try {
    await new Promise((resolve, reject) => {
      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          console.log(`Port ${PORT} is in use, trying alternative...`);
          server.close();
          const altPort = PORT + 1;
          server.listen(altPort, '0.0.0.0', () => {
            console.log(`Server running on alternative port ${altPort}`);
            console.log('API routes initialized');
            console.log('Environment:', process.env.NODE_ENV || 'development');
            resolve(true);
          });
        } else {
          reject(error);
        }
      });

      server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        console.log('API routes initialized');
        console.log('Environment:', process.env.NODE_ENV || 'development');
        resolve(true);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
