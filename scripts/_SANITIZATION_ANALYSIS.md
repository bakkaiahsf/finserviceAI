# INTELLIGENT PROJECT SANITIZATION ANALYSIS
# Smart categorization by the most intelligent developer

## 🎯 PRODUCTION REQUIRED (KEEP):
### Database Setup:
- init-database-supabase.sql (FINAL - contains complete schema)
- add-api-keys-column.sql (Required for API key management)

### Deployment Validation:
- phase-9-production-deployment.js (Final deployment validation)

## 🧪 DEVELOPMENT ONLY (REMOVE):
### Duplicate Database Scripts:
- init-database.sql (superseded by supabase version)  
- init-database-fixed.sql (development iteration)
- init-database-final.sql (superseded by supabase version)
- COMPLETE-audit-schema.sql (merged into main schema)
- MANUAL-audit-schema.sql (development helper)
- fix-audit-schema.sql (development fix)
- fix-audit-schema.ts (duplicate of sql)

### Phase Development Scripts (Remove):
- phase-7-1-final-validation.js (development phase)
- phase-7-2-success.js (development validation)
- phase-7-3-gdpr.js (development validation) 
- phase-7-4-security.js (development validation)
- phase-7-5-final.js (development validation)
- phase-8-testing-performance.js (superseded by optimized version)

### Duplicate RLS Scripts:
- PHASE-7-2-COMPLETE-IMPLEMENTATION.sql (development)
- PHASE-7-2-SUPABASE-COMPATIBLE.sql (development)
- implement-rls-policies.sql (merged into main schema)

### Development Validation Scripts:
- check-rls-prerequisites.js (development helper)
- check-table-structure.js (development helper)
- comprehensive-api-audit.js (development audit)
- test-audit-logger-service.js (development test)
- test-schema-validation.js (development test)
- verify-sql-execution.js (development helper)

### Duplicate Setup Scripts:
- setup-supabase.js (duplicate)
- setup-supabase.ts (TypeScript version - keep this one)

### Duplicate Validation Scripts:
- validate-reports.ts (keep simple version)
- validate-subscription.ts (keep simple version)
- test-all-systems.ts (superseded by phase validations)

## 🚀 OPTIMIZATION REQUIRED (CONSOLIDATE):
### Component Validation:
- Keep: validate-companies-house.ts, validate-deepseek.ts, validate-graph.ts
- Keep: validate-reports-simple.ts, validate-subscription-simple.ts, validate-setup.ts  
- Keep: phase-8-optimized-final.js (best performance test)

## 📊 SANITIZATION IMPACT:
BEFORE: 40+ scripts (many duplicates)
AFTER: ~12 essential scripts (production-ready)
SPACE SAVED: ~70% reduction in script files
CLARITY: Clear purpose for each remaining script