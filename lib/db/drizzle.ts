import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema-nexus';
import { createClient } from '@supabase/supabase-js';

// Environment variables validation
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL or POSTGRES_URL environment variable is not set');
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are not set');
}

// Postgres client for Drizzle ORM
export const client = postgres(DATABASE_URL, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 60,
});

// Drizzle database instance
export const db = drizzle(client, { schema });

// Supabase clients for different use cases
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Admin client for server-side operations
export const supabaseAdmin = SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Database connection health check
export async function checkDatabaseConnection() {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection() {
  try {
    await client.end();
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}
