-- Nexus AI Database Schema for Supabase (Supabase-Compatible)
-- Run this in the Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'compliance_officer', 'analyst', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Plans table
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

-- Users table - using UUID to match Supabase auth
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT,
    role user_role NOT NULL DEFAULT 'viewer',
    organization_id UUID,
    consent_flags JSONB,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Teams table - using UUID
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Team members - using UUID references
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    team_id UUID NOT NULL REFERENCES teams(id),
    role VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UK Companies from Companies House
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

-- Company officers and PSCs
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

-- AI processing jobs - using UUID for user reference
CREATE TABLE IF NOT EXISTS ai_processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL, 
    entity_type VARCHAR(50) NOT NULL,
    status job_status NOT NULL DEFAULT 'pending',
    input_data JSONB,
    ai_response JSONB,
    provider_usage JSONB,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Search history - using UUID for user/team reference
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    query TEXT NOT NULL,
    result_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quota counters for subscription enforcement - using UUID
CREATE TABLE IF NOT EXISTS quota_counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    searches_used INTEGER NOT NULL DEFAULT 0,
    ai_tokens_used INTEGER NOT NULL DEFAULT 0,
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs for compliance - using UUID
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100),
    record_id TEXT,
    action VARCHAR(50) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_id VARCHAR(100)
);

-- Activity logs - using UUID
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45)
);

-- Invitations - using UUID
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    invited_by UUID NOT NULL REFERENCES users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_company_number ON companies(company_number);
CREATE INDEX IF NOT EXISTS idx_companies_company_name ON companies USING GIN(to_tsvector('english', company_name));
CREATE INDEX IF NOT EXISTS idx_companies_ai_risk_score ON companies(ai_risk_score) WHERE ai_risk_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_company_officers_company_id ON company_officers(company_id);
CREATE INDEX IF NOT EXISTS idx_company_officers_name ON company_officers USING GIN(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_search_history_user_created ON search_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quota_counters_user_period ON quota_counters(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_quota_counters_team_period ON quota_counters(team_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_timestamp ON audit_logs(action, timestamp);

-- Add unique constraints for quota_counters
DO $$ BEGIN
    ALTER TABLE quota_counters ADD CONSTRAINT unique_user_period UNIQUE (user_id, period_start, period_end);
EXCEPTION
    WHEN duplicate_table THEN null;
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE quota_counters ADD CONSTRAINT unique_team_period UNIQUE (team_id, period_start, period_end);
EXCEPTION
    WHEN duplicate_table THEN null;
    WHEN duplicate_object THEN null;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY; 
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Fixed to work with Supabase's UUID auth system

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE 
USING (auth.uid() = id);

-- Admins can view all users
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users FOR SELECT 
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Team policies
DROP POLICY IF EXISTS "Team members can view their teams" ON teams;
CREATE POLICY "Team members can view their teams" ON teams FOR SELECT 
USING (EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = teams.id AND team_members.user_id = auth.uid()));

-- Companies policies - authenticated users can view
DROP POLICY IF EXISTS "Authenticated users can view companies" ON companies;
CREATE POLICY "Authenticated users can view companies" ON companies FOR SELECT 
USING (auth.role() = 'authenticated');

-- Analysts can create/update companies
DROP POLICY IF EXISTS "Analysts can create companies" ON companies;
CREATE POLICY "Analysts can create companies" ON companies FOR INSERT 
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'compliance_officer', 'analyst')));

DROP POLICY IF EXISTS "Analysts can update companies" ON companies;
CREATE POLICY "Analysts can update companies" ON companies FOR UPDATE 
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'compliance_officer', 'analyst')));

-- Company officers policies
DROP POLICY IF EXISTS "Authenticated users can view officers" ON company_officers;
CREATE POLICY "Authenticated users can view officers" ON company_officers FOR SELECT 
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Analysts can create officers" ON company_officers;
CREATE POLICY "Analysts can create officers" ON company_officers FOR INSERT 
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'compliance_officer', 'analyst')));

-- AI jobs policies
DROP POLICY IF EXISTS "Users can view own AI jobs" ON ai_processing_jobs;
CREATE POLICY "Users can view own AI jobs" ON ai_processing_jobs FOR SELECT 
USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can create AI jobs" ON ai_processing_jobs;
CREATE POLICY "Users can create AI jobs" ON ai_processing_jobs FOR INSERT 
USING (created_by = auth.uid());

-- Search history policies
DROP POLICY IF EXISTS "Users can view own search history" ON search_history;
CREATE POLICY "Users can view own search history" ON search_history FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create search history" ON search_history;
CREATE POLICY "Users can create search history" ON search_history FOR INSERT 
USING (user_id = auth.uid());

-- Quota counter policies
DROP POLICY IF EXISTS "Users can view own quota" ON quota_counters;
CREATE POLICY "Users can view own quota" ON quota_counters FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role manages quotas" ON quota_counters;
CREATE POLICY "Service role manages quotas" ON quota_counters FOR ALL 
USING (auth.role() = 'service_role');

-- Audit log policies
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
CREATE POLICY "Admins can view all audit logs" ON audit_logs FOR SELECT 
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Service role creates audit logs" ON audit_logs;
CREATE POLICY "Service role creates audit logs" ON audit_logs FOR INSERT 
USING (auth.role() = 'service_role');

-- Insert default subscription plans
INSERT INTO plans (slug, name, monthly_price_cents, yearly_price_cents, entitlements, is_active) VALUES
('free', 'Free', 0, 0, '{"maxSearches": 3, "maxSeats": 1, "features": ["basic_search", "basic_ai", "watermarked_reports"]}', true),
('pro', 'Pro', 4900, 4900, '{"maxSearches": 50, "maxSeats": 1, "features": ["advanced_search", "full_ai", "clean_reports"]}', true),
('proplus', 'Pro Plus', 9900, 9900, '{"maxSearches": 100, "maxSeats": 3, "features": ["advanced_search", "full_ai", "clean_reports", "team_collaboration"]}', true),
('expert', 'Expert', 19900, 19900, '{"maxSearches": null, "maxSeats": 10, "features": ["unlimited_search", "premium_ai", "priority_support", "enterprise_sso"]}', true)
ON CONFLICT (slug) DO NOTHING;

-- Create audit logging function - now works with UUID
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    record_id_text TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        record_id_text := OLD.id::text;
        INSERT INTO audit_logs (table_name, record_id, action, old_data, user_id)
        VALUES (TG_TABLE_NAME, record_id_text, 'DELETE', to_jsonb(OLD), auth.uid());
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        record_id_text := NEW.id::text;
        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, user_id)
        VALUES (TG_TABLE_NAME, record_id_text, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        record_id_text := NEW.id::text;
        INSERT INTO audit_logs (table_name, record_id, action, new_data, user_id)
        VALUES (TG_TABLE_NAME, record_id_text, 'CREATE', to_jsonb(NEW), auth.uid());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for critical tables
DROP TRIGGER IF EXISTS companies_audit_trigger ON companies;
CREATE TRIGGER companies_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON companies
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS company_officers_audit_trigger ON company_officers;
CREATE TRIGGER company_officers_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON company_officers
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS ai_processing_jobs_audit_trigger ON ai_processing_jobs;
CREATE TRIGGER ai_processing_jobs_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON ai_processing_jobs
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Function to reset monthly quotas
CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS void AS $$
DECLARE
    current_month_start DATE := date_trunc('month', CURRENT_DATE);
    current_month_end DATE := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
BEGIN
    -- Reset user quotas
    INSERT INTO quota_counters (user_id, period_start, period_end, searches_used, ai_tokens_used)
    SELECT id, current_month_start, current_month_end, 0, 0
    FROM users
    WHERE deleted_at IS NULL
    ON CONFLICT (user_id, period_start, period_end) DO UPDATE SET
        searches_used = 0,
        ai_tokens_used = 0,
        last_reset_at = NOW();
        
    -- Reset team quotas
    INSERT INTO quota_counters (team_id, period_start, period_end, searches_used, ai_tokens_used)
    SELECT id, current_month_start, current_month_end, 0, 0
    FROM teams
    ON CONFLICT (team_id, period_start, period_end) DO UPDATE SET
        searches_used = 0,
        ai_tokens_used = 0,
        last_reset_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Add comments for documentation  
COMMENT ON TABLE companies IS 'UK company data from Companies House API with AI insights';
COMMENT ON TABLE company_officers IS 'Company officers and PSCs (Persons with Significant Control)';
COMMENT ON TABLE ai_processing_jobs IS 'AI processing jobs for DeepSeek integration and other AI services';
COMMENT ON TABLE quota_counters IS 'Monthly usage quotas for subscription enforcement';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance and security';

SELECT 'Nexus AI database schema setup completed!' as status;