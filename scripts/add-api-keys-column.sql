-- ADD API KEYS METADATA COLUMN - Smart developer's final database enhancement
-- Execute this in Supabase Dashboard > SQL Editor for Phase 7.5 completion

BEGIN;

-- Add API keys metadata column to user_quotas table
ALTER TABLE user_quotas ADD COLUMN IF NOT EXISTS api_keys_metadata JSONB DEFAULT '{}';

-- Add API keys management tracking columns
ALTER TABLE user_quotas ADD COLUMN IF NOT EXISTS api_keys_count INTEGER DEFAULT 0;
ALTER TABLE user_quotas ADD COLUMN IF NOT EXISTS api_keys_last_generated TIMESTAMPTZ;

-- Create index for API key lookups
CREATE INDEX IF NOT EXISTS idx_user_quotas_api_keys ON user_quotas USING GIN (api_keys_metadata);

-- Add helpful comments
COMMENT ON COLUMN user_quotas.api_keys_metadata IS 'JSONB storage for API key information and metadata';
COMMENT ON COLUMN user_quotas.api_keys_count IS 'Number of active API keys for the user';
COMMENT ON COLUMN user_quotas.api_keys_last_generated IS 'Timestamp of last API key generation';

-- Insert test data to verify
INSERT INTO user_quotas (user_id, subscription_tier, api_keys_metadata) 
VALUES ('api-test-user', 'pro', '{"test": "api_keys_ready"}')
ON CONFLICT (user_id) DO UPDATE SET api_keys_metadata = '{"test": "api_keys_ready"}';

COMMIT;

-- Verify the schema change
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_quotas' AND column_name LIKE '%api%'
ORDER BY ordinal_position;

SELECT '🎉 API Keys Column Added Successfully - Ready for Phase 7.5 Final Test! 🔑' as status;