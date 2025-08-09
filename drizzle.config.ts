import type { Config } from 'drizzle-kit';
import { loadEnvConfig } from '@next/env';

// Load environment variables
loadEnvConfig(process.cwd());

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL or POSTGRES_URL environment variable is not set');
}

export default {
  schema: './lib/db/schema-nexus.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;
