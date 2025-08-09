## Backend Requirements — Nexus AI (APIs, Services, Webhooks)

### Runtime & Patterns
- Next.js route handlers (App Router) for API endpoints and server actions.
- Background jobs via Vercel Cron or external worker (Phase 2 with Redis/BullMQ).
- External services: Companies House API, DeepSeek API, Stripe.

### Core Endpoints (HTTP)
- GET `/api/search/companies?q=&limit=` → Proxy to Companies House search with caching, input validation, plan quota check.
- GET `/api/companies/:number/profile` → Company profile (normalized + raw JSON, provenance).
- GET `/api/companies/:number/officers` → Officers list (normalized) with pagination.
- GET `/api/companies/:number/pscs` → PSC list with nature_of_control map.
- POST `/api/ai/summary` → { companyId } returns cached or generates AI summary; respects AI cost caps and caching.
- POST `/api/reports/generate` → { companyId, types: ['pdf','csv'] } returns artifact ids; stores in storage.
- GET `/api/usage` → monthly usage for authenticated user/org (search counts, AI tokens approx).
- POST `/api/refresh/:number` → manual refresh of Companies House data (plan and rate-limit guarded).

### AuthN/AuthZ
- Use starter auth (local email/password with JWT cookies) initially; protect all APIs with session checks.
- RBAC: admin, compliance_officer/analyst, viewer; per-route authorization.

### Quota & Plan Enforcement
- Middleware validates plan and current counters before executing handler.
- Free plan: 3 searches/month; on exceed → 402-like response with upgrade metadata.
- Counters increment on successful search queries and profile fetches.

### Stripe Integration
- Webhook: `/api/stripe/webhook` handles checkout/session, subscription created/updated/canceled.
- Map Stripe price/product IDs to internal plan slugs and entitlements.
  - Plan slugs: `free`, `pro`, `proplus`, `expert`.
  - Entitlements example:
    - free: { maxSearches: 3 }
    - pro: { maxSearches: 50 }
    - proplus: { maxSearches: 100 }
    - expert: { maxSearches: null /* unlimited */ }
- Customer portal link issuance on `/settings/billing`.

### Companies House Integration
- Shared client with 600-requests/5-min window limiter and exponential backoff.
- Cache successful responses (per company number endpoint) with TTL; store normalized + raw.
- Provenance fields: source_endpoint, fetched_at, api_version, etag/hash.

### DeepSeek Integration
- Service with prompt templates (versioned), temperature, max_tokens; logs usage tokens and cost estimates.
- Cost guardrails: daily and monthly caps; degrade to cached summaries when exceeded.
- Retry on transient errors with jittered backoff; record failure in `ai_processing_jobs`.

### Reporting
- Headless rendering for PDF; CSV generated from normalized tables.
- Store artifacts with signed URLs; include provenance and prompt version in report metadata.

### Observability & Ops
- Structured logs (request id, user id, route, duration, outcome).
- Metrics: API P95 latency, cache hit ratio, CH errors, AI usage tokens, quota denials.
- Health checks `/api/health` (db, cache, external reachability quick check).

### Security
- Input validation (Zod) on all APIs; output schemas for response typing.
- Secrets via environment variables; never exposed client-side.
- Rate limiting per IP/user for expensive routes; abuse detection.

### Acceptance Criteria
- On Stripe subscription upgraded, `/api/stripe/webhook` updates plan within 2s and plan entitlements are effective on next request.
- On repeated CH 429/5xx, the client backs off and surfaces a clear UI message; no more than 3 retries.
- AI endpoint never exceeds configured daily token cost; returns cached summary when cap reached.


