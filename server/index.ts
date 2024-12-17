import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { createServer } from "http";
import path from "path";

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
  });
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`${req.method} ${req.path} - Request started`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - Request completed in ${duration}ms`);
  });

  next();
});

// Create HTTP server
const server = createServer(app);

// API routes - make sure these are registered BEFORE Vite middleware
app.use('/api', (req, res, next) => {
  console.log('API request:', req.method, req.path);
  next();
});

registerRoutes(app);

// Error handling middleware for API routes
app.use('/api', (err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('API error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ 
    success: false,
    message,
    error: err.code || 'unknown_error'
  });
});

// Setup Vite in development mode
const isDev = process.env.NODE_ENV !== 'production';
if (isDev) {
  console.log('Starting server in development mode...');
  setupVite(app, server).catch(error => {
    console.error('Error setting up Vite:', error);
    process.exit(1);
  });
} else {
  console.log('Starting server in production mode...');
  // Serve static files from the client build directory
  const clientBuildPath = path.resolve(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));
  
  // Serve index.html for all non-API routes (SPA fallback)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      next();
    } else {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    }
  });
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log('API routes initialized');
  console.log('Environment:', isDev ? 'development' : 'production');
});
