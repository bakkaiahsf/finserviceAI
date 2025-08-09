High-Level Product Requirements for UK Company AI SaaS (MVP leveraging Next.js SaaS Starter)
1. Product Overview
Build an AI-powered SaaS platform for exploring and visualizing UK company relationships, starting with Companies House data and DeepSeek AI for advanced analytics. Goal: Deliver actionable, deep business insights in an interactive, engaging, and compliance-led web application.

2. Unique Selling Points (USPs) & Niche Opportunities
A. Depth of Visualization
Interactive Relationship Mapping: Users can explore up to three layers deep in company networks—subsidiaries, directors, ownership, and cross-links.

AI-driven Pattern Recognition: Leverage DeepSeek AI to automatically identify influence networks, suspicious relationships, or complex directorship webs faster than traditional dashboards.

Graph-based UI: Visually render company networks using intuitive node-link graphics inspired by modern data visualization trends.

B. Real-Time & Latest Data
Integration with Free Companies House API: Access comprehensive company records, officer lists, and entity changes in real-time at no cost.

Expandability: Support for additional free APIs—e.g., convert-ixbrl.co.uk, OpenCorporates, and others listed on GOV.UK API catalogue—for more in-depth financial and compliance data.

API Augmentation (Reference): Explore and validate other public APIs for future expansion using resources like Github’s Public APIs repository.

C. AI-Powered Insights
Analysis via DeepSeek AI: Provide natural language summaries, anomaly flagging, and automated alerts for network changes or risk signals.

Advanced Search: Enable filtering by turnover, net assets, officer demographics, audit fees, and other key financial/data parameters.

Actionable Intelligence: Go beyond raw data—highlight hidden connections, compliance risks, or emerging business opportunities for users.

D. Compliance & Trust
Automated Regulatory Checks: In-MVP, cover basic FCA-relevant status checks, directorship screening, and document audit trails using publicly accessible info.

Consent-centric Data Handling: Secure, privacy-focused implementation in line with UK Smart Data and GDPR frameworks—clear consent screens, transparent AI explanations.

Up-to-date Regulatory Practice: Prepare for integration with future Open Finance and Smart Data schemes per FCA/ICO guidance.

3. MVP (Minimal Viable Product) Core Requirements
User authentication, role management, and Stripe-based subscriptions using Next.js SaaS Starter.

Landing, pricing, and dashboard pages optimized for business discovery and onboarding.

Real-time company search and relationship mapping (limited to three-depth drilldown for MVP).

Integrated DeepSeek AI for summaries and alerts.

Clean, high-impact UI/UX inspired by top data visualization websites:

Interactive visual graphs, use of white space, color for relationship types, scroll-triggered animations.

Reference “The Pudding,” “Linked Open Data Cloud,” “Driftime Impact Reports,” and curated inspiration from Awwwards/Dribbble for visual and UI design.

Extensible backend for adding new data APIs (convert-ixbrl, OpenCorporates, others).

4. Attractive UI/UX References
The Pudding, Vev, Linked Open Data Cloud: Use radial diagrams, map-based relationship graphs, and layered storytelling for relationship networks.

Driftime Impact Report: Combine bold visuals with clear narrative, sectioned layouts, and transparent compliance messaging for credibility.

Awwwards, Dribbble, Toptal Dashboards: Source dashboard and node-link visualization inspiration, with a focus on readability, responsiveness, and effortless navigation.

5. Target Customers (for MVP)
Financial services (compliance, onboarding, AML/KYC)

Accountancy & law firms (due diligence, auditing)

Corporate sales & research teams

Startups & SMEs seeking supplier/partner checks

6. Free API Expansion Ideas
Companies House (core, free)

convert-ixbrl.co.uk (financial statement JSON API)

GOV.UK API catalogue: Browse for cross-government free APIs relevant to business and regulatory data

OpenCorporates (limited tier/free access options)

DeepSeek AI (free for basic use, cheap API access)

Summary
Leverage the Next.js SaaS Starter as your technical foundation, and build your MVP around deep, AI-powered business relationship visualization and real-time compliance insights—using only free UK company data APIs and cutting-edge design. Put emphasis on actionable intelligence and regulatory trust, offering a visually stunning and user-focused experience that stands out in both data quality and UX.

## Product Requirements Document (PRD) — Nexus AI for UK Business & Corporate Banking

### 1) Executive Summary
- Objective: Deliver an AI-powered platform that aggregates UK corporate data, visualizes ownership/control relationships, and generates compliance-ready insights for business and corporate banking (KYC/CDD/EDD, onboarding, periodic review, credit review support).
- MVP Focus: UK-only, Companies House as the authoritative source, AI summaries and risk flags via DeepSeek, graph visualization up to 3 hops, role-based access, auditability.
- Primary Users: Compliance/KYC Analysts, Onboarding Operations, Relationship Managers, Credit Analysts, Internal Audit/QA.

### 2) Domain Validation (UK Banking & Corporate)
- Regulatory alignment:
  - FCA SYSC/JMLSG AML Guidance: support customer due diligence, enhanced due diligence triggers (complex structures, high-risk sectors/jurisdictions), audit trail of checks performed.
  - UK GDPR/ICO: process only necessary personal data (officers/PSCs from public sources). Provide data subject rights workflows in roadmap; surface privacy notices and AI explanations.
  - OFSI Sanctions & PEPs Screening: out-of-scope for MVP (requires licensed data). Provide placeholders and integration points; include disclaimers that screening is not performed in MVP.
  - Companies House Terms: respect API limits (600 requests/5 min), attribution, and fair usage; cache results; record last-refresh timestamps.
- Banking use-cases covered in MVP:
  - Corporate onboarding pre-checks, beneficial ownership mapping, director/PSC review, structure complexity indicators, filing history key points, basic sector flags (via SIC codes).
  - Evidence pack: AI summary + graph snapshot + data provenance.
- Explicit non-goals (MVP): Transaction monitoring, payments risk (PSD2), PEP/Sanctions screening, credit bureau data, international registries (kept to Phase 2+).

### 3) Scope & Success Criteria
- In-scope (MVP)
  - Company search, profile (status, type, address, SIC), officers, PSCs, 3-hop ownership/control map.
  - AI-generated summaries and risk flags with confidence metrics; cost controls and caching.
  - Role-based access (admin, compliance_officer/analyst, viewer), audit events, export (PDF/CSV basic).
  - Data freshness indicators; manual refresh with rate limiting.
- Out-of-scope (MVP)
  - Multi-jurisdictional data; OpenCorporates enrichment; sanctions/PEP screening; SSO/SAML; white-labelling; advanced workflow.
- KPIs
  - Time-to-insight < 2 minutes; graph render < 5s up to 1,000 nodes; API P95 < 2s (non-AI); 90% user-rated usefulness of summaries; 99% availability.

### 4) Functional Requirements
- Company Intelligence
  - Search by name/number; view profile; officers; PSCs with nature of control; SIC-based sector tagging; filing highlights (Phase 2).
  - Relationship map up to 3 hops: companies, persons, ownership/control edges with percentages when available.
- AI Insights
  - Summaries: business activity, structure complexity, risk notes, caveats; show confidence and token cost.
  - Risk score (0–100) and top 3 risk rationales; do not assert sanctions/PEP conclusions.
- Compliance Evidence
  - Exportable report (PDF) with data provenance (endpoint, timestamp, company number), AI prompt version, and change log.
  - Audit log of user actions and AI requests.
- Access & Governance
  - RBAC; RLS on all tables; session timeout; consent/notice pages; configurable data retention.

### 5) Non-Functional Requirements
- Security: RLS, encryption in transit/at rest (provider-managed), input sanitization, rate limiting, error redaction, least-privilege keys.
- Privacy: Data minimization (only public registry data + usage metadata), retention policy, subject rights workflow stubs, DPIA template in docs.
- Performance: Targets per KPIs. Caching of AI responses and Companies House data with TTLs.
- Reliability: Health checks, retries with backoff, graceful AI degradation, monitoring and alerts.
- Compliance: Documentation of controls mapped to FCA/JMLSG/ICO expectations; license compliance with Companies House API.

### 6) Data Sources & Provenance
- Primary: Companies House (search, company, officers, PSCs). Store normalized plus raw JSON. Record `last_ch_sync` and `source_endpoint`.
- Secondary (Phase 2+): OpenCorporates, iXBRL conversion services for accounts; additional GOV.UK public datasets.
- Provenance: Persist `source`, `fetched_at`, `api_version`, and `hash` for integrity.

### 7) AI Usage Policy (Banking Context)
- Use AI for summarization, structure complexity assessment, and heuristic risk hints only.
- Prohibit AI from asserting KYC pass/fail, sanctions/PEP status, or legal conclusions; require human review for risk decisions.
- Log prompts, versions, model, cost, and outputs; show confidence and caveats to users; enable re-generation with updated context.

### 8) Acceptance Criteria (MVP)
- Search → Select company → View profile → Generate AI summary → Visualize 3-hop graph → Export PDF with provenance, all in < 2 minutes.
- RBAC enforced via RLS; non-authorized updates blocked; audit log records view/generate/export events.
- P95 latency met; AI costs capped per day; Companies House rate limits never exceeded under test.

## Phased Project Plan (Functional + High-Level Technical)

### Phase 0 — Project Mobilization (Week 0–0.5)
- Functional: Stakeholder alignment, risk register, compliance assumptions, success metrics finalized.
- Technical (high level): Repo bootstrap, env scaffolding, secrets management, Supabase project creation, CI/CD skeleton.
- Deliverables: RAID log, finalized PRD (this doc), CI running on PRs, secured env variables.

### Phase 1 — Foundation & Security (Weeks 1–2)
- Functional: Auth (Google via Supabase), roles, basic dashboard shell.
- Technical: Supabase schema (companies, company_officers, ai_processing_jobs, user_profiles); RLS; audit tables; Edge Function skeleton; Vercel deploy.
- Quality gates: Lint, type-check, unit test scaffolding; secrets rotation process.
- Exit: Users can sign in; RBAC enforced; empty dashboard loads <3s.

### Phase 2 — Companies House Ingestion (Weeks 3–4)
- Functional: Company search, profile view, officers, PSCs; freshness indicators; manual refresh.
- Technical: CH client with 600/5min limiter; normalization + raw JSON storage; provenance fields; caching layer + TTL; error/retry.
- Exit: Accurate profile/officers/PSCs for top 100 test companies; rate-limit compliance; P95 API <2s.

### Phase 3 — AI Insights v1 (Weeks 5–6)
- Functional: AI company summary; risk score (0–100) with top 3 rationales; confidence and cost displayed.
- Technical: DeepSeek integration, prompt templates with versioning, cost caps, cache keys by company + prompt version; audit of requests.
- Exit: 90% analyst-rated usefulness on pilot set; daily spend cap enforced; degraded mode on AI failure.

### Phase 4 — Graph Visualization (Weeks 7–8)
- Functional: 3-hop interactive graph (companies/persons, ownership/control edges), node detail overlays, basic filtering.
- Technical: React Flow; performant transforms; progressive loading; WebGL-friendly settings; export image (PNG/SVG basic).
- Exit: Graph renders <5s for 1,000 nodes, zoom/pan smooth on mid-tier laptop.

### Phase 5 — Reporting & Evidence (Weeks 9–10)
- Functional: PDF export (summary, graph snapshot, provenance, timestamps, risk notes), CSV export (officers/PSCs), basic scheduling stub.
- Technical: Headless browser rendering, storage of artifacts with signed URLs, immutable audit link to dataset hash.
- Exit: Report generated in <15s; reproducible with same inputs; audit chain intact.

### Phase 6 — Hardening & UAT (Weeks 11–12)
- Functional: Accessibility, error states, UX polish, help and disclaimers.
- Technical: Perf tuning, load tests to 100 concurrent users, security scan, DPIA draft, logging/alerts dashboards.
- Exit: All KPIs met, zero P1 bugs, go-live checklist complete.

### Phase 7 — Launch & Pilot (Weeks 13–14)
- Functional: Beta cohort enablement, feedback capture flows, lightweight onboarding materials.
- Technical: Production toggles, incident runbooks, backups, cost dashboards.
- Exit: Stable prod with monitored SLOs; signed-off pilot results.

## Phase Playbooks (Agent-Readable Checklists)

### Phase 1 Checklist
- Build: Supabase tables + RLS; Auth routes; Admin role seeding; Audit log triggers.
- Verify: Cannot access others’ data; session timeout; basic DoS guard; CI green.

### Phase 2 Checklist
- Build: CH client, search endpoint, profile/officers/PSCs ingestion, provenance, caching.
- Verify: Rate-limit respected; 10 random companies match CH portal; errors retried with backoff.

### Phase 3 Checklist
- Build: DeepSeek service, prompt templates, cost limiter, response cache, UI badges for confidence/cost.
- Verify: Daily cap halts gracefully; prompts logged with versions; no legal assertions.

### Phase 4 Checklist
- Build: Graph renderer, data transforms, overlays, export.
- Verify: Render time and FPS within targets; memory stable on 1k nodes.

### Phase 5 Checklist
- Build: PDF/CSV export with provenance, storage, signed URLs.
- Verify: Report reproducibility; tamper-evident hashing noted in metadata.

### Phase 6 Checklist
- Build: Monitoring dashboards, alerts, perf and security tests, DPIA draft.
- Verify: P95s met, OWASP checks pass, UAT sign-off recorded.

## Controls Mapping (Condensed)
- CDD Evidence: Export includes registry data, timestamps, and source endpoints.
- Auditability: All data views and AI calls logged with user, time, and parameters.
- Data Minimization: Only public registry personal data; no sensitive categories.
- Human Oversight: Risk outputs labeled advisory; workflows require human acknowledgement.

## Strict Project Rules (Non‑negotiable)
- Scope Discipline
  - MVP is UK-only; do not add non-UK registries, sanctions/PEP screening, or advanced workflows.
  - OpenCorporates, iXBRL, and internationalization are Phase 2+ only.
- Compliance
  - Do not present AI outputs as compliance determinations. Always include caveats and provenance.
  - Respect Companies House rate limits and terms; implement caching before increasing throughput.
- Security & Privacy
  - Enable RLS on every table; service role keys never used client-side; secrets in managed vaults.
  - No storage of non-public personal data; adhere to retention configuration; provide export/delete stubs.
- Quality Gates
  - Type-check, lint, unit tests must pass on every PR; add tests with each feature.
  - Performance budgets: initial load <3s, non-AI API <2s P95, graph <5s.
- Change Control
  - Any scope change requires product + compliance triage and PRD update. No silent changes.

## Glossary
- CDD/EDD: Customer/Enhanced Due Diligence.
- PSC: Person with Significant Control (Companies House construct).
- RLS: Row-Level Security in PostgreSQL/Supabase.
- Provenance: Recorded origin and integrity context of data (source, time, hash).

## References
- Companies House API guidance (rate limits, endpoints)
- FCA SYSC & JMLSG guidance (CDD/EDD best practices)
- ICO UK GDPR guidance (lawful basis, minimization, rights)

This PRD supersedes earlier high-level notes and aligns the MVP to UK business banking and corporate use-cases with enforceable scope, controls, and deliverables.
