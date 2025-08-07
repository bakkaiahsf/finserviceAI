-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('admin', 'compliance_officer', 'analyst', 'viewer')) DEFAULT 'viewer',
    organization TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on user profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Companies table with Supabase optimizations
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_number VARCHAR(8) UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    registered_office JSONB,
    incorporation_date DATE,
    company_status VARCHAR(50),
    company_type VARCHAR(50),
    sic_codes INTEGER[],
    source_data JSONB,
    reconciliation_confidence DECIMAL(5,4),
    ai_summary TEXT,
    ai_risk_score DECIMAL(5,4),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS for companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- RLS Policy for companies
CREATE POLICY "Users can view companies based on their role" ON companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'compliance_officer', 'analyst', 'viewer')
        )
    );

-- Persons table with AI enhancements
CREATE TABLE persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name JSONB NOT NULL,
    date_of_birth DATE,
    nationality VARCHAR(50),
    address JSONB,
    source_data JSONB,
    reconciliation_confidence DECIMAL(5,4),
    is_verified BOOLEAN DEFAULT FALSE,
    ai_risk_assessment TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS for persons
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

-- Relationships table for corporate structure
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_entity_id UUID NOT NULL,
    to_entity_id UUID NOT NULL,
    from_entity_type TEXT NOT NULL,
    to_entity_type TEXT NOT NULL,
    relationship_type TEXT NOT NULL,
    ownership_percentage DECIMAL(5,2),
    voting_rights_percentage DECIMAL(5,2),
    appointment_date DATE,
    resignation_date DATE,
    source_data JSONB,
    reconciliation_confidence DECIMAL(5,4),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS for relationships
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

-- AI processing jobs table
CREATE TABLE ai_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    entity_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    input_data JSONB,
    ai_response JSONB,
    deepseek_usage JSONB,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Enable RLS for AI processing jobs
ALTER TABLE ai_processing_jobs ENABLE ROW LEVEL SECURITY;

-- Performance indexes
CREATE INDEX idx_companies_number ON companies(company_number);
CREATE INDEX idx_companies_name_gin ON companies USING gin(to_tsvector('english', company_name));
CREATE INDEX idx_companies_ai_risk ON companies(ai_risk_score) WHERE ai_risk_score IS NOT NULL;
CREATE INDEX idx_persons_name_gin ON persons USING gin(to_tsvector('english', name->>'surname'));
CREATE INDEX idx_ai_jobs_status ON ai_processing_jobs(status, created_at);
CREATE INDEX idx_relationships_from_entity ON relationships(from_entity_id, from_entity_type);
CREATE INDEX idx_relationships_to_entity ON relationships(to_entity_id, to_entity_type);

-- Supabase Edge Functions for AI processing trigger
CREATE OR REPLACE FUNCTION trigger_ai_analysis()
RETURNS trigger AS $$
BEGIN
    INSERT INTO ai_processing_jobs (job_type, entity_id, entity_type, input_data, created_by)
    VALUES ('summarize', NEW.id, 'company', to_jsonb(NEW), NEW.created_by);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic AI processing
CREATE TRIGGER company_ai_analysis_trigger
    AFTER INSERT ON companies
    FOR EACH ROW
    EXECUTE FUNCTION trigger_ai_analysis();

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE companies;
ALTER PUBLICATION supabase_realtime ADD TABLE persons;
ALTER PUBLICATION supabase_realtime ADD TABLE relationships;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_processing_jobs;