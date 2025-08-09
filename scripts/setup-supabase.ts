#!/usr/bin/env tsx

/**
 * Supabase Database Setup Script for Nexus AI
 * 
 * This script initializes the Supabase database with:
 * 1. All required tables for the UK business intelligence platform
 * 2. Row Level Security (RLS) policies  
 * 3. Indexes for performance
 * 4. Audit triggers
 * 5. Default data (plans, etc.)
 * 
 * Usage: npm run db:setup-supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.example' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');  
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      if (error.message.includes('already exists') || 
          error.message.includes('does not exist') ||
          error.message.includes('duplicate key')) {
        return true; // Non-critical errors
      }
      console.warn(`⚠️  SQL Warning: ${error.message}`);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn(`⚠️  SQL Error: ${err.message}`);
    return false;
  }
}

async function setupDatabase() {
  console.log('🚀 Starting Nexus AI Supabase database setup...');
  console.log(`📡 Supabase URL: ${supabaseUrl}`);
  
  try {
    // First, create the exec_sql function
    console.log('🔧 Creating helper functions...');
    await executeSQL(`
      CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$;
    `);

    // Enable necessary extensions
    console.log('🔌 Enabling database extensions...');
    await executeSQL('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await executeSQL('ALTER DATABASE postgres SET row_security = on;');

    // Create enums
    console.log('📋 Creating database enums...');
    await executeSQL(`CREATE TYPE user_role AS ENUM ('admin', 'compliance_officer', 'analyst', 'viewer');`);
    await executeSQL(`CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');`);
    await executeSQL(`CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid');`);

    // Create core tables
    console.log('📄 Creating database tables...');
    
    // Plans table
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        monthly_price_cents INTEGER NOT NULL DEFAULT 0,
        yearly_price_cents INTEGER NOT NULL DEFAULT 0,
        entitlements JSONB NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Users table (extending existing if needed)
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role user_role NOT NULL DEFAULT 'viewer',
        organization_id INTEGER,
        consent_flags JSONB,
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // Teams table
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        stripe_customer_id TEXT UNIQUE,
        stripe_subscription_id TEXT UNIQUE,
        stripe_product_id TEXT,
        plan_id INTEGER REFERENCES plans(id),
        plan_name VARCHAR(50),
        subscription_status subscription_status
      );
    `);

    // Companies table - core business data
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_number VARCHAR(20) NOT NULL UNIQUE,
        company_name VARCHAR(255) NOT NULL,
        status VARCHAR(50),
        type VARCHAR(100),
        incorporation_date DATE,
        registered_office JSONB,
        sic_codes JSONB,
        last_ch_sync TIMESTAMP WITH TIME ZONE,
        companies_house_data JSONB,
        ai_summary TEXT,
        ai_risk_score NUMERIC(5,2),
        ai_insights JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Company officers table
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS company_officers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        officer_role VARCHAR(100),
        appointed_on DATE,
        resigned_on DATE,
        address JSONB,
        date_of_birth JSONB,
        nationality VARCHAR(100),
        nature_of_control JSONB,
        ownership_percentage NUMERIC(5,2),
        voting_percentage NUMERIC(5,2),
        companies_house_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // AI processing jobs
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS ai_processing_jobs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        job_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        status job_status NOT NULL DEFAULT 'pending',
        input_data JSONB,
        ai_response JSONB,
        provider_usage JSONB,
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // Search history
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS search_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id INTEGER NOT NULL REFERENCES users(id),
        team_id INTEGER REFERENCES teams(id),
        query TEXT NOT NULL,
        result_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Quota counters
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS quota_counters (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id INTEGER REFERENCES users(id),
        team_id INTEGER REFERENCES teams(id),
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        searches_used INTEGER NOT NULL DEFAULT 0,
        ai_tokens_used INTEGER NOT NULL DEFAULT 0,
        last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, period_start, period_end),
        UNIQUE(team_id, period_start, period_end)
      );
    `);

    // Audit logs
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        table_name VARCHAR(100),
        record_id TEXT,
        action VARCHAR(50) NOT NULL,
        old_data JSONB,
        new_data JSONB,
        user_id INTEGER REFERENCES users(id),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ip_address VARCHAR(45),
        user_agent TEXT,
        request_id VARCHAR(100)
      );
    `);

    // Supporting tables
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        team_id INTEGER NOT NULL REFERENCES teams(id),
        role VARCHAR(50) NOT NULL,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await executeSQL(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id),
        user_id INTEGER REFERENCES users(id),
        action TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ip_address VARCHAR(45)
      );
    `);

    await executeSQL(`
      CREATE TABLE IF NOT EXISTS invitations (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id),
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        invited_by INTEGER NOT NULL REFERENCES users(id),
        invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(20) NOT NULL DEFAULT 'pending'
      );
    `);

    // Create indexes for performance
    console.log('🚀 Creating performance indexes...');
    await executeSQL('CREATE INDEX IF NOT EXISTS idx_companies_company_number ON companies(company_number);');
    await executeSQL('CREATE INDEX IF NOT EXISTS idx_companies_company_name ON companies USING GIN(to_tsvector(\'english\', company_name));');
    await executeSQL('CREATE INDEX IF NOT EXISTS idx_companies_ai_risk_score ON companies(ai_risk_score) WHERE ai_risk_score IS NOT NULL;');
    await executeSQL('CREATE INDEX IF NOT EXISTS idx_company_officers_company_id ON company_officers(company_id);');
    await executeSQL('CREATE INDEX IF NOT EXISTS idx_company_officers_name ON company_officers USING GIN(to_tsvector(\'english\', name));');
    await executeSQL('CREATE INDEX IF NOT EXISTS idx_search_history_user_created ON search_history(user_id, created_at DESC);');
    await executeSQL('CREATE INDEX IF NOT EXISTS idx_quota_counters_user_period ON quota_counters(user_id, period_start, period_end);');
    await executeSQL('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp);');

    // Enable RLS on all tables
    console.log('🔒 Enabling Row Level Security (RLS)...');
    const tables = ['users', 'teams', 'team_members', 'companies', 'company_officers', 'ai_processing_jobs', 'search_history', 'quota_counters', 'audit_logs', 'activity_logs', 'invitations'];
    
    for (const table of tables) {
      await executeSQL(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
    }

    // Create RLS policies
    console.log('📋 Creating RLS policies...');
    
    // Users policies
    await executeSQL(`
      CREATE POLICY "Users can view own profile" ON users FOR SELECT 
      USING (auth.uid()::text = id::text);
    `);
    
    await executeSQL(`
      CREATE POLICY "Admins can view all users" ON users FOR SELECT 
      USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::integer AND role = 'admin'));
    `);

    // Companies policies - core business data
    await executeSQL(`
      CREATE POLICY "Authenticated users can view companies" ON companies FOR SELECT 
      USING (auth.role() = 'authenticated');
    `);

    await executeSQL(`
      CREATE POLICY "Analysts can modify companies" ON companies FOR INSERT 
      USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::integer AND role IN ('admin', 'compliance_officer', 'analyst')));
    `);

    // Officers policies
    await executeSQL(`
      CREATE POLICY "Authenticated users can view officers" ON company_officers FOR SELECT 
      USING (auth.role() = 'authenticated');
    `);

    // AI jobs policies
    await executeSQL(`
      CREATE POLICY "Users can view own AI jobs" ON ai_processing_jobs FOR SELECT 
      USING (created_by = auth.uid()::integer);
    `);

    // Search history policies
    await executeSQL(`
      CREATE POLICY "Users can view own search history" ON search_history FOR SELECT 
      USING (user_id = auth.uid()::integer);
    `);

    // Insert default subscription plans
    console.log('💳 Setting up default subscription plans...');
    const plansData = [
      {
        slug: 'free',
        name: 'Free',
        monthly_price_cents: 0,
        yearly_price_cents: 0,
        entitlements: JSON.stringify({
          maxSearches: 3,
          maxSeats: 1,
          features: ['basic_search', 'basic_ai', 'watermarked_reports']
        })
      },
      {
        slug: 'pro',
        name: 'Pro',
        monthly_price_cents: 4900,
        yearly_price_cents: 4900,
        entitlements: JSON.stringify({
          maxSearches: 50,
          maxSeats: 1,
          features: ['advanced_search', 'full_ai', 'clean_reports']
        })
      },
      {
        slug: 'proplus',
        name: 'Pro Plus',
        monthly_price_cents: 9900,
        yearly_price_cents: 9900,
        entitlements: JSON.stringify({
          maxSearches: 100,
          maxSeats: 3,
          features: ['advanced_search', 'full_ai', 'clean_reports', 'team_collaboration']
        })
      },
      {
        slug: 'expert',
        name: 'Expert',
        monthly_price_cents: 19900,
        yearly_price_cents: 19900,
        entitlements: JSON.stringify({
          maxSearches: null,
          maxSeats: 10,
          features: ['unlimited_search', 'premium_ai', 'priority_support', 'enterprise_sso']
        })
      }
    ];

    for (const plan of plansData) {
      await executeSQL(`
        INSERT INTO plans (slug, name, monthly_price_cents, yearly_price_cents, entitlements, is_active) 
        VALUES ('${plan.slug}', '${plan.name}', ${plan.monthly_price_cents}, ${plan.yearly_price_cents}, '${plan.entitlements}', true)
        ON CONFLICT (slug) DO NOTHING;
      `);
    }

    // Create audit trigger function
    console.log('🔍 Setting up audit logging...');
    await executeSQL(`
      CREATE OR REPLACE FUNCTION log_audit_event()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'DELETE' THEN
          INSERT INTO audit_logs (table_name, record_id, action, old_data, user_id)
          VALUES (TG_TABLE_NAME, OLD.id::text, 'DELETE', to_jsonb(OLD), auth.uid()::integer);
          RETURN OLD;
        ELSIF TG_OP = 'UPDATE' THEN
          INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, user_id)
          VALUES (TG_TABLE_NAME, NEW.id::text, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid()::integer);
          RETURN NEW;
        ELSIF TG_OP = 'INSERT' THEN
          INSERT INTO audit_logs (table_name, record_id, action, new_data, user_id)
          VALUES (TG_TABLE_NAME, NEW.id::text, 'CREATE', to_jsonb(NEW), auth.uid()::integer);
          RETURN NEW;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // Create audit triggers
    await executeSQL(`
      DROP TRIGGER IF EXISTS companies_audit_trigger ON companies;
      CREATE TRIGGER companies_audit_trigger
        AFTER INSERT OR UPDATE OR DELETE ON companies
        FOR EACH ROW EXECUTE FUNCTION log_audit_event();
    `);

    console.log('✅ Database setup completed successfully!');
    
    // Verify setup
    console.log('🔍 Verifying setup...');
    const { data: plansCheck } = await supabase.from('plans').select('slug, name');
    const { data: tablesCheck } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    console.log(`📋 Plans created: ${plansCheck?.length || 0}`);
    console.log(`📄 Tables created: ${tablesCheck?.length || 0}`);
    
    if (plansCheck && plansCheck.length > 0) {
      console.log('💳 Available plans:', plansCheck.map(p => p.slug).join(', '));
    }

    console.log('\n🎉 Nexus AI Supabase setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update .env.local with your database password');
    console.log('2. Run: npm run dev to start development server');
    console.log('3. Access Supabase dashboard: https://supabase.com/dashboard/project/qpqvyxpsylaadpqwrafh');

  } catch (error: any) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupDatabase().catch(console.error);