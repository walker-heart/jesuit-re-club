import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from "ws";
import * as schema from "./schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

// Create the database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });