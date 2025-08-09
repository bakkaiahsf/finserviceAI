## Database Requirements — Nexus AI (Postgres via Drizzle; optional Supabase host)

### Core Entities
- users (id, email, password_hash? or provider_id, created_at)
- user_profiles (user_id, full_name, avatar_url, role, organization_id?, consent_flags, created_at, updated_at)
- plans (id, slug, name, monthly_price_cents, yearly_price_cents, entitlements jsonb, is_active)
 - plans (id, slug, name, monthly_price_cents, yearly_price_cents, entitlements jsonb, is_active)
   - Slugs: `free`, `pro`, `proplus`, `expert`
- subscriptions (id, user_id or organization_id, plan_id, stripe_customer_id, stripe_subscription_id, status, period_end, cancel_at_period_end)
- companies (id uuid, company_number unique, company_name, status, type, incorporation_date, registered_office jsonb, sic_codes int[], last_ch_sync, companies_house_data jsonb, ai_summary, ai_risk_score numeric, ai_insights jsonb, created_at, updated_at)
- company_officers (id uuid, company_id, name, officer_role, appointed_on, resigned_on, address jsonb, date_of_birth jsonb, nationality, nature_of_control text[], ownership_percentage numeric, voting_percentage numeric, companies_house_data jsonb, created_at, updated_at)
- ai_processing_jobs (id, job_type, entity_id, entity_type, status, input_data jsonb, ai_response jsonb, provider_usage jsonb, created_by, created_at, completed_at)
- search_history (id, user_id, query, result_count, created_at)
- quota_counters (id, user_id or organization_id, period_start, period_end, searches_used int, ai_tokens_used int, last_reset_at)
- audit_logs (id, table_name, record_id, action, old_data jsonb, new_data jsonb, user_id, timestamp, ip_address, user_agent)

### Indexing
- companies: (company_number), GIN on to_tsvector(company_name), partial index on ai_risk_score where not null
- company_officers: (company_id), GIN on to_tsvector(name)
- search_history: (user_id, created_at desc)
- quota_counters: (user_id, period_start, period_end)

### Integrity & Constraints
- Foreign keys with ON DELETE CASCADE for children (officers) when company removed.
- Enum/Check constraints for roles and subscription statuses.
- Unique constraints: (user_id, period_start, period_end) in quota_counters; company_number in companies.

### Provenance & Lineage
- Store raw Companies House responses in `companies_house_data` and officer rows; persist `source_endpoint`, `fetched_at`.
- Hash of payload for tamper-evidence in reports (store in ai_insights.provenance.hash or separate column).

### Security
- If on Supabase: enable RLS on all tables; policies for SELECT by authenticated users and writes by analysts/admins.
- Else: enforce RBAC in app layer and restrict DB credentials; separate read/write DB users.

### Migrations
- Drizzle migrations checked in; repeatable seed for test data; plan/product mapping seeded from env or script.

### Retention & Privacy
- Define retention for audit_logs and ai_processing_jobs (e.g., 24 months configurable).
- Subject rights support: data export and deletion flows referencing user-created content.

### Reporting Branding
- PDF watermark for Free plan: "BRITSAI" on each page; remove for paid plans.

### Acceptance Criteria
- Company search across name and number returns results within 500ms for indexed queries.
- A single company profile read incurs ≤ 3 indexed queries (company + officers + psc subset).
- Quota counter increments are atomic and idempotent per request id.


