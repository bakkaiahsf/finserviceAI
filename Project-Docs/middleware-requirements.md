## Middleware Requirements — Auth, RBAC, Quota, Rate Limiting

### Next.js Middleware (middleware.ts)
- Protect all `/dashboard`, `/search`, `/company`, `/reports`, `/settings` routes; redirect unauthenticated to `/sign-in`.
- Attach request context (userId, plan, role) to request headers for downstream handlers.

### RBAC Guard
- Roles: admin, compliance_officer/analyst, viewer.
- Route-level checks:
  - Mutations (refresh, AI generate, report generate): analyst+.
  - Admin-only: plan overrides, user role assignments.

### Plan/Quota Guard
- Resolve current plan from subscription; fallback to Free.
- Load current monthly `quota_counters` for user/org.
- For search/profile endpoints: If `searches_used` ≥ plan entitlement (`maxSearches`), block with upgrade payload `{ allowed: false, reason: 'quota_exceeded', plans: [...] }`.
- Increment counters only on successful calls; ensure idempotency with a request-id header.

### Rate Limiting
- Per-IP and per-user limits for search and AI endpoints (e.g., 30 req/min user; 60 req/min IP).
- Use a stateless strategy (Upstash/Redis) or edge-safe token bucket.

### Input Validation
- Zod schemas for query/body; reject invalid early with 400 and developer-friendly messages.

### Error Handling
- Normalize error shapes `{ code, message, details?, retryAfter? }`.
- Distinguish between quota_exceeded (402-ish), rate_limited (429), external_source_error (503), invalid_request (400).

### Observability
- Correlate requests with `x-request-id`.
- Emit counters for denials (quota, rate-limit) and latencies to metrics backend.

### Acceptance Criteria
- Free user exceeding monthly quota receives a deterministic upgrade payload and cannot call search/profile endpoints.
- Rate limiters prevent more than configured requests per window and return standard 429 with `Retry-After`.


