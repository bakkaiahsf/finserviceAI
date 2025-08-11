import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema-nexus';
import { createClient } from '@supabase/supabase-js';

// Environment variables validation
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Lazy initialization for build-time compatibility
let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getClient() {
  if (!_client) {
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL or POSTGRES_URL environment variable is not set');
    }
    _client = postgres(DATABASE_URL, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 60,
    });
  }
  return _client;
}

function getDB() {
  if (!_db) {
    _db = drizzle(getClient(), { schema });
  }
  return _db;
}

// Export functions that return the instances when called
export function getDrizzleClient() {
  return getClient();
}

export function getDrizzleDB() {
  return getDB();
}

// Export lazy initialized instances with proper typing
type DrizzleDbType = ReturnType<typeof drizzle<typeof schema>>;

export const db = new Proxy({} as DrizzleDbType, {
  get(target, prop) {
    const dbInstance = getDB();
    const value = (dbInstance as any)[prop];
    
    if (typeof value === 'function') {
      return value.bind(dbInstance);
    }
    
    return value;
  }
}) as DrizzleDbType;

export const client = new Proxy({} as ReturnType<typeof postgres>, {
  get(target, prop) {
    const clientInstance = getClient();
    const value = (clientInstance as any)[prop];
    
    if (typeof value === 'function') {
      return value.bind(clientInstance);
    }
    
    return value;
  }
});

// Lazy Supabase clients for different use cases
let _supabase: ReturnType<typeof createClient> | null = null;
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!_supabase) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase environment variables are not set');
    }
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  }
  return _supabase;
}

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Supabase admin environment variables are not set');
    }
    _supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return _supabaseAdmin;
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop, receiver) {
    const supabaseInstance = getSupabase();
    return Reflect.get(supabaseInstance, prop, receiver);
  }
}) as ReturnType<typeof createClient>;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop, receiver) {
    const supabaseAdminInstance = getSupabaseAdmin();
    return Reflect.get(supabaseAdminInstance, prop, receiver);
  }
}) as ReturnType<typeof createClient>;

// Database connection health check
export async function checkDatabaseConnection() {
  try {
    await getClient()`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection() {
  try {
    if (_client) {
      await _client.end();
    }
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}
