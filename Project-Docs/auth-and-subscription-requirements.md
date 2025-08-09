## Authentication, Authorization, and Subscription Requirements

### Authentication
- Starter path: Local email/password with JWT cookies (from Next.js SaaS Starter).
- Optional Phase 2: Google OAuth (NextAuth or Supabase Auth) for SSO readiness.
- Sessions in httpOnly secure cookies; CSRF protection on mutations; password reset and email verification enabled.

### Authorization
- RBAC roles: admin, compliance_officer/analyst, viewer.
- Enforce in middleware and per-route guards; admin-only endpoints for role and plan overrides.

### Subscription Plans (Stripe)
- Free (default)
  - Searches/month: 3
  - AI summaries: allowed; prefer cached when available
  - Graph: up to 3 hops
  - Reports: PDF basic with watermark "BRITSAI"
  - Support: community
- Pro
  - Searches/month: 50
  - Seats: 1
  - Reports: watermark removed
- ProPlus
  - Searches/month: 100
  - Seats: 3
  - Reports: watermark removed
- Expert
  - Searches/month: Unlimited
  - Seats: 10
  - Priority support
  - Enterprise SSO optional (Phase 2)
  
Notes
- Plan slugs: `free`, `pro`, `proplus`, `expert`.
- Pricing TBD; maintain mapping table plan_slug → stripe_price_id (monthly/yearly) and entitlements jsonb.

### Stripe Placeholder IDs (Development)
- Use these env vars during development/testing; replace before production deploy:
  - `STRIPE_PRICE_ID_PRO_MONTHLY=price_pro_monthly_test`
  - `STRIPE_PRICE_ID_PRO_YEARLY=price_pro_yearly_test`
  - `STRIPE_PRICE_ID_PROPLUS_MONTHLY=price_proplus_monthly_test`
  - `STRIPE_PRICE_ID_PROPLUS_YEARLY=price_proplus_yearly_test`
  - `STRIPE_PRICE_ID_EXPERT_MONTHLY=price_expert_monthly_test`
  - `STRIPE_PRICE_ID_EXPERT_YEARLY=price_expert_yearly_test`
  - `STRIPE_WEBHOOK_SECRET=whsec_test`
  - `STRIPE_SECRET_KEY=sk_test_xxx`

### Enforcement
- For search/profile: check `quota_counters` in current month; if usage ≥ plan.maxSearches, block with upgrade payload including Checkout URLs.
- On upgrade/downgrade: Stripe webhook updates `subscriptions` and plan; entitlements effective on next request.
- Quota increments on successful operations only; idempotent via request-id.

### Billing UX
- `/pricing` shows matrix with features; `/settings/billing` uses Stripe Customer Portal.

### Compliance & Legal
- Display privacy and AI caveats; do not claim sanctions/PEP screening.
- Include Companies House terms attribution and acceptable use notes.

### Acceptance Criteria
- Free user at 3/3 monthly searches is prevented from further searches and sees upgrade CTA.
- Stripe webhook transitions plan and reflects in middleware within 2 seconds.


