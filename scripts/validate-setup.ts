#!/usr/bin/env tsx

/**
 * Nexus AI Setup Validation Script
 * 
 * This script validates:
 * 1. Database connection
 * 2. All tables created successfully
 * 3. RLS policies are working
 * 4. Default plans are inserted
 * 5. Indexes are created
 * 6. Environment variables are set
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.example' });

import { createClient } from '@supabase/supabase-js';
import { plans } from '../lib/db/schema-nexus';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function validateEnvironment() {
  log('blue', '🔍 Validating environment variables...');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'DEEPSEEK_API_KEY',
    'COMPANIES_HOUSE_API_KEY',
    'STRIPE_SECRET_KEY',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    log('red', `❌ Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  log('green', '✅ All required environment variables are set');
  return true;
}

async function validateDatabaseConnection() {
  log('blue', '🔗 Testing database connection...');
  
  try {
    // Import here to avoid issues with env loading
    const { default: postgres } = await import('postgres');
    const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!DATABASE_URL) {
      log('red', '❌ DATABASE_URL not found in environment variables');
      return false;
    }

    const client = postgres(DATABASE_URL, { max: 1, idle_timeout: 20, connect_timeout: 10 });
    await client`SELECT 1`;
    await client.end();
    
    log('green', '✅ Database connection successful');
    return true;
  } catch (error: any) {
    log('red', `❌ Database connection error: ${error.message}`);
    return false;
  }
}

async function validateSupabaseConnection() {
  log('blue', '🔗 Testing Supabase client connection...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.from('plans').select('count').limit(1);
    
    if (error) {
      log('red', `❌ Supabase connection error: ${error.message}`);
      return false;
    }
    
    log('green', '✅ Supabase connection successful');
    return true;
  } catch (error: any) {
    log('red', `❌ Supabase connection error: ${error.message}`);
    return false;
  }
}

async function validateTables() {
  log('blue', '📄 Validating database tables...');
  
  const expectedTables = [
    'plans',
    'users', 
    'teams',
    'team_members',
    'companies',
    'company_officers',
    'ai_processing_jobs',
    'search_history',
    'quota_counters',
    'audit_logs',
    'activity_logs',
    'invitations'
  ];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', expectedTables);

    if (error) {
      log('red', `❌ Error checking tables: ${error.message}`);
      return false;
    }

    const foundTables = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(table => !foundTables.includes(table));

    if (missingTables.length > 0) {
      log('red', `❌ Missing tables: ${missingTables.join(', ')}`);
      return false;
    }

    log('green', `✅ All ${expectedTables.length} tables created successfully`);
    return true;
  } catch (error: any) {
    log('red', `❌ Table validation error: ${error.message}`);
    return false;
  }
}

async function validatePlans() {
  log('blue', '💳 Validating subscription plans...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: plansData, error } = await supabase.from('plans').select('*');
    
    if (error) {
      log('red', `❌ Error fetching plans: ${error.message}`);
      return false;
    }
    
    const expectedPlans = ['free', 'pro', 'proplus', 'expert'];
    const foundPlans = plansData.map((p: any) => p.slug);
    const missingPlans = expectedPlans.filter(plan => !foundPlans.includes(plan));

    if (missingPlans.length > 0) {
      log('red', `❌ Missing plans: ${missingPlans.join(', ')}`);
      return false;
    }

    log('green', `✅ All ${expectedPlans.length} subscription plans created`);
    
    // Show plan details
    plansData.forEach((plan: any) => {
      const price = plan.monthly_price_cents / 100;
      log('blue', `  📋 ${plan.name}: £${price.toFixed(2)}/month`);
    });
    
    return true;
  } catch (error: any) {
    log('red', `❌ Plans validation error: ${error.message}`);
    return false;
  }
}

async function validateIndexes() {
  log('blue', '📊 Validating database indexes...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: indexes, error } = await supabase
      .from('pg_indexes')
      .select('indexname')
      .eq('schemaname', 'public')
      .like('indexname', 'idx_%');

    if (error) {
      log('red', `❌ Error checking indexes: ${error.message}`);
      return false;
    }

    const indexCount = indexes.length;
    if (indexCount < 8) {
      log('yellow', `⚠️  Only ${indexCount} indexes found, expected at least 8`);
      return false;
    }

    log('green', `✅ ${indexCount} performance indexes created`);
    return true;
  } catch (error: any) {
    log('red', `❌ Index validation error: ${error.message}`);
    return false;
  }
}

async function validateRLSPolicies() {
  log('blue', '🔒 Validating Row Level Security policies...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname')
      .eq('schemaname', 'public');

    if (error) {
      log('red', `❌ Error checking RLS policies: ${error.message}`);
      return false;
    }

    const policyCount = policies.length;
    if (policyCount < 15) {
      log('yellow', `⚠️  Only ${policyCount} RLS policies found, expected at least 15`);
      return false;
    }

    log('green', `✅ ${policyCount} RLS policies active`);
    return true;
  } catch (error: any) {
    log('red', `❌ RLS validation error: ${error.message}`);
    return false;
  }
}

async function validateEnums() {
  log('blue', '📝 Validating database enums...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: enums, error } = await supabase
      .from('pg_type')
      .select('typname')
      .eq('typtype', 'e')
      .in('typname', ['user_role', 'job_status', 'subscription_status']);

    if (error) {
      log('red', `❌ Error checking enums: ${error.message}`);
      return false;
    }

    const expectedEnums = ['user_role', 'job_status', 'subscription_status'];
    const foundEnums = enums.map(e => e.typname);
    const missingEnums = expectedEnums.filter(enumName => !foundEnums.includes(enumName));

    if (missingEnums.length > 0) {
      log('red', `❌ Missing enums: ${missingEnums.join(', ')}`);
      return false;
    }

    log('green', `✅ All ${expectedEnums.length} database enums created`);
    return true;
  } catch (error: any) {
    log('red', `❌ Enum validation error: ${error.message}`);
    return false;
  }
}

async function main() {
  log('blue', '🚀 Starting Nexus AI setup validation...\n');
  
  const validations = [
    { name: 'Environment Variables', fn: validateEnvironment },
    { name: 'Database Connection', fn: validateDatabaseConnection },
    { name: 'Supabase Connection', fn: validateSupabaseConnection },
    { name: 'Database Tables', fn: validateTables },
    { name: 'Database Enums', fn: validateEnums },
    { name: 'Subscription Plans', fn: validatePlans },
    { name: 'Database Indexes', fn: validateIndexes },
    { name: 'RLS Policies', fn: validateRLSPolicies },
  ];

  let passedCount = 0;
  let failedCount = 0;

  for (const validation of validations) {
    try {
      const success = await validation.fn();
      if (success) {
        passedCount++;
      } else {
        failedCount++;
      }
    } catch (error: any) {
      log('red', `❌ ${validation.name} validation failed: ${error.message}`);
      failedCount++;
    }
    console.log(); // Add spacing
  }

  // Summary
  log('blue', '📊 Validation Summary:');
  log('green', `✅ Passed: ${passedCount}/${validations.length}`);
  
  if (failedCount > 0) {
    log('red', `❌ Failed: ${failedCount}/${validations.length}`);
    log('red', '\n❌ Setup validation failed. Please check the errors above.');
    process.exit(1);
  } else {
    log('green', '\n🎉 All validations passed! Nexus AI database setup is complete.');
    log('blue', '\n📋 Next steps:');
    log('blue', '1. Run: npm run dev');
    log('blue', '2. Visit: http://localhost:3000');
    log('blue', '3. Begin implementing authentication and dashboard');
  }
}

// Run validation
main().catch(error => {
  log('red', `❌ Validation script error: ${error.message}`);
  process.exit(1);
});