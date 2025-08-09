## Frontend Requirements — Nexus AI (UK Business/Corporate Banking)

### Objectives
- Deliver fast, accessible UIs for corporate search, profile review, ownership visualization (3 hops), AI summaries, evidence export, and plan upgrades.

### Stack & Conventions
- Framework: Next.js 14+ (App Router, Server Actions), TypeScript strict.
- UI: shadcn/ui + Tailwind CSS; icons: lucide-react.
- Graph: React Flow for interactive 3-hop ownership/control maps.
- State: React Query for server state, minimal Zustand for local cross-page state.
- Charts: lightweight (e.g., Recharts) for usage metrics.
- I18n: en-GB only (MVP).

### Pages & Routes
- Marketing
  - `/` landing; `/pricing` plans & feature matrix; `/privacy`, `/terms`.
- Auth
  - `/sign-in`, `/sign-up`, `/reset-password` (if local auth) and provider callback.
- App (protected)
  - `/dashboard` summary KPIs, recent activity, usage/quota banner, upgrade CTA.
  - `/search` company search with debounce, results table, plan gating banner when quota reached.
  - `/company/[companyId]` profile: registry facts, officers, PSCs, AI summary panel, graph (3 hops), provenance.
  - `/reports` list of generated PDFs/CSVs with download links.
  - `/settings/billing` Stripe customer portal; plan management.
  - `/settings/profile` user details; org/team (phase 2+).

### Core Components
- SearchBar: debounced input, inline quota indicator, disabled state when quota exceeded.
- SearchResultsTable: sortable, pagination, click-through to profile.
- CompanyHeader: name, number, status, SIC tags, last refresh timestamp.
- OfficersList and PSCList: collapsible sections with filters.
- AISummaryPanel: displays model, confidence, caveats, token cost; regenerate with same prompt version.
- CorporateGraph: React Flow with nodes (company/person) and edges (ownership/control). Toolbar: zoom, fit, export.
- ProvenanceCard: API endpoints, fetched_at, hash.
- UsageBanner: monthly searches used/remaining; upgrade CTA.
- ReportExportModal: PDF (summary+graph+provenance), CSV (officers/PSCs).

### Interactions & Flows
- Search flow: query → results → select company → profile
  - On select: prefetch company, officers, PSCs, AI cache status; show skeletons.
  - On view: automatically enqueue AI summary if not cached and quota allows; otherwise show cached result.
- Graph flow: lazy-build graph (progressive) up to 3 hops; node click reveals overlay with details.
- Export flow: choose format → server action generates artifact → toast + link.
- Upgrade flow: hitting quota shows modal with plans (Free/Starter/Pro/Business, Enterprise contact), links to Stripe Checkout or contact.
 - Upgrade flow: hitting quota shows modal with plans (Free/Pro/ProPlus/Expert, Enterprise contact), links to Stripe Checkout or contact.

### Performance & UX Targets
- Initial page load < 3s (3G fast), P95 navigation < 1s.
- Graph render < 5s for up to 1,000 nodes; 60fps interactions target.
- Lighthouse: PWA not required; a11y/performance/best practices ≥ 90.
- Debounce inputs (250–400ms), optimistic UI where safe.

### Accessibility
- Keyboard navigation for graph toolbar and node detail overlays.
- Color-contrast compliant; non-color indicators for risk levels.
- Announce loading/error states; focus management on dialogs.

### Error & Empty States
- Show clear causes (rate limit, quota exceeded, source unavailable).
- Provide retry/backoff hints; link to support.

### Telemetry
- Client metrics: page load, API durations (redacted), graph render time, AI panel open rate.
- Respect Do Not Track; aggregate only; no sensitive content in logs.

### Branding & Deploy
- Deploy on Vercel; production domain via Vercel project.
- Supabase is the managed Postgres host; keys provided in `.env.example`.

### Feature Flags
- Toggle: AI panel, Graph export, Filing highlights (phase 2).

### Acceptance Criteria (Representative)
- Given Free plan user with 3/3 searches used, when typing search and pressing submit, then UI blocks search and shows upgrade modal.
- Given a company profile with cached AI summary, the panel renders in < 300ms and shows the prompt version and fetched_at.
- Given a 3-hop graph with 800–1,000 nodes, initial render under 5s and pan/zoom remains responsive.


