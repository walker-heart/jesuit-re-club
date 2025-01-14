import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from "ws";
import * as schema from "./schema.js";

console.log('Initializing database connection...');

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Define database instance outside the try block
let db;

try {
  // Configure WebSocket for Neon serverless
  neonConfig.webSocketConstructor = ws;
  console.log('WebSocket configured for Neon serverless');

  // Create the database connection
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  console.log('Database pool created successfully');

  db = drizzle(pool, { schema });
  console.log('Drizzle ORM initialized');
} catch (error) {
  console.error('Failed to initialize database:', error);
  throw error;
}

// Export the database instance
export { db };