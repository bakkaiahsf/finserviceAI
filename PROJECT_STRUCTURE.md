# Nexus AI - Project Structure
## File Organization & Architecture Overview

```
nexus-ai/
├── 📁 app/                          # Next.js App Router (Pages & Layouts)
│   ├── 📄 globals.css              # Global styles with Tailwind CSS
│   ├── 📄 layout.tsx               # Root layout with providers
│   ├── 📄 page.tsx                 # Landing page
│   ├── 📄 providers.tsx            # Global providers (Chakra, React Query)
│   ├── 📁 (auth)/                  # Authentication routes
│   │   ├── 📁 login/
│   │   │   └── 📄 page.tsx         # Login page with Google OAuth
│   │   └── 📁 callback/
│   │       └── 📄 page.tsx         # Auth callback handler
│   ├── 📁 dashboard/               # Protected dashboard routes
│   │   ├── 📄 layout.tsx           # Dashboard layout with navigation
│   │   ├── 📄 page.tsx             # Main dashboard
│   │   ├── 📁 search/              # Company search interface
│   │   ├── 📁 companies/           # Company management
│   │   ├── 📁 officers/            # Officers & PSCs
│   │   ├── 📁 analytics/           # Analytics dashboard
│   │   ├── 📁 reports/             # Report generation
│   │   └── 📁 settings/            # User & system settings
│   └── 📁 api/                     # API routes
│       ├── 📁 auth/                # Authentication endpoints
│       ├── 📁 companies/           # Company data endpoints
│       ├── 📁 persons/             # Person data endpoints
│       └── 📁 ai/                  # AI processing endpoints
│
├── 📁 components/                   # Reusable UI Components
│   ├── 📁 ui/                      # Base UI components
│   │   ├── 📄 Button.tsx           # Custom button component
│   │   ├── 📄 Card.tsx             # Card component
│   │   ├── 📄 Modal.tsx            # Modal component
│   │   ├── 📄 Table.tsx            # Data table component
│   │   └── 📄 LoadingSpinner.tsx   # Loading indicator
│   ├── 📁 auth/                    # Authentication components
│   │   ├── 📄 LoginForm.tsx        # Google OAuth login form
│   │   ├── 📄 UserProfile.tsx      # User profile dropdown
│   │   └── 📄 ProtectedRoute.tsx   # Route protection wrapper
│   ├── 📁 dashboard/               # Dashboard-specific components
│   │   ├── 📄 DashboardNav.tsx     # Navigation sidebar
│   │   ├── 📄 MetricCard.tsx       # KPI metric cards
│   │   └── 📄 ActivityFeed.tsx     # Recent activity feed
│   ├── 📁 search/                  # Search functionality
│   │   ├── 📄 SearchForm.tsx       # Advanced search form
│   │   ├── 📄 SearchResults.tsx    # Search results display
│   │   ├── 📄 SearchFilters.tsx    # Filter sidebar
│   │   └── 📄 SavedSearches.tsx    # Saved searches management
│   ├── 📁 visualization/           # Graph & visualization components
│   │   ├── 📄 CorporateGraph.tsx   # React Flow graph component
│   │   ├── 📄 NodeComponent.tsx    # Custom graph nodes
│   │   ├── 📄 EdgeComponent.tsx    # Custom graph edges
│   │   └── 📄 GraphControls.tsx    # Graph interaction controls
│   ├── 📁 company/                 # Company-related components
│   │   ├── 📄 CompanyCard.tsx      # Company summary card
│   │   ├── 📄 CompanyDetails.tsx   # Detailed company view
│   │   ├── 📄 OfficersList.tsx     # Officers display
│   │   └── 📄 AISummary.tsx        # AI-generated insights
│   └── 📁 reports/                 # Report generation components
│       ├── 📄 ReportBuilder.tsx    # Report configuration
│       ├── 📄 ReportPreview.tsx    # Report preview
│       └── 📄 ExportOptions.tsx    # Export format options
│
├── 📁 lib/                         # Core Libraries & Utilities
│   ├── 📁 supabase/                # Supabase integration
│   │   ├── 📄 client.ts            # ✅ Supabase client setup
│   │   ├── 📄 auth.ts              # Authentication helpers
│   │   ├── 📄 database.ts          # Database query helpers
│   │   └── 📄 realtime.ts          # Real-time subscriptions
│   ├── 📁 deepseek/                # AI Integration
│   │   ├── 📄 client.ts            # ✅ DeepSeek API client
│   │   ├── 📄 summarization.ts     # Company summarization
│   │   ├── 📄 analysis.ts          # Ownership analysis
│   │   └── 📄 cost-tracking.ts     # Usage monitoring
│   ├── 📁 chakra/                  # Chakra UI configuration
│   │   ├── 📄 theme.ts             # ✅ Custom theme
│   │   └── 📄 components.ts        # Component overrides
│   ├── 📁 apis/                    # External API integrations
│   │   ├── 📄 companies-house.ts   # Companies House API
│   │   ├── 📄 opencorporates.ts    # OpenCorporates API
│   │   └── 📄 rate-limiter.ts      # Rate limiting utilities
│   ├── 📁 utils/                   # Utility functions
│   │   ├── 📄 validation.ts        # Data validation schemas
│   │   ├── 📄 formatting.ts        # Data formatting helpers
│   │   ├── 📄 constants.ts         # Application constants
│   │   └── 📄 helpers.ts           # General helper functions
│   ├── 📁 matching/                # Entity matching algorithms
│   │   ├── 📄 fuzzy-match.ts       # Fuzzy matching logic
│   │   ├── 📄 confidence.ts        # Confidence scoring
│   │   └── 📄 reconciliation.ts    # Data reconciliation
│   └── 📁 exports/                 # Export functionality
│       ├── 📄 pdf-generator.ts     # PDF report generation
│       ├── 📄 excel-exporter.ts    # Excel export utilities
│       └── 📄 templates.ts         # Report templates
│
├── 📁 hooks/                       # Custom React Hooks
│   ├── 📄 useAuth.ts               # ✅ Authentication state
│   ├── 📄 useCompanies.ts          # Company data management
│   ├── 📄 useSearch.ts             # Search functionality
│   ├── 📄 useGraph.ts              # Graph visualization state
│   ├── 📄 useAI.ts                 # AI processing hooks
│   └── 📄 useReports.ts            # Report generation hooks
│
├── 📁 types/                       # TypeScript Type Definitions
│   ├── 📄 supabase.ts              # ✅ Supabase database types
│   ├── 📄 auth.ts                  # Authentication types
│   ├── 📄 company.ts               # Company entity types
│   ├── 📄 person.ts                # Person entity types
│   ├── 📄 relationship.ts          # Relationship types
│   ├── 📄 ai.ts                    # AI response types
│   ├── 📄 api.ts                   # API request/response types
│   └── 📄 index.ts                 # Type exports
│
├── 📁 stores/                      # State Management (Zustand/Context)
│   ├── 📄 auth-store.ts            # Authentication state
│   ├── 📄 search-store.ts          # Search state management
│   ├── 📄 graph-store.ts           # Graph visualization state
│   └── 📄 ui-store.ts              # UI state (modals, sidebar)
│
├── 📁 supabase/                    # Supabase Configuration
│   ├── 📄 config.toml              # ✅ Supabase local config
│   ├── 📁 migrations/              # Database migrations
│   │   └── 📄 20240806_initial_schema.sql # ✅ Initial database schema
│   ├── 📁 functions/               # Supabase Edge Functions
│   │   ├── 📁 ai-company-analysis/ # AI processing function
│   │   ├── 📁 data-sync/           # Data synchronization
│   │   └── 📁 webhooks/            # Webhook handlers
│   └── 📁 seed/                    # Database seed data
│       ├── 📄 sic-codes.sql        # Standard Industrial Classifications
│       └── 📄 sample-data.sql      # Development sample data
│
├── 📁 tests/                       # Test Files
│   ├── 📁 unit/                    # Unit tests
│   │   ├── 📁 components/          # Component tests
│   │   ├── 📁 hooks/               # Hook tests
│   │   └── 📁 utils/               # Utility function tests
│   ├── 📁 integration/             # Integration tests
│   │   ├── 📁 api/                 # API endpoint tests
│   │   └── 📁 database/            # Database tests
│   ├── 📁 e2e/                     # End-to-end tests
│   │   ├── 📄 auth.spec.ts         # Authentication flows
│   │   ├── 📄 search.spec.ts       # Search functionality
│   │   └── 📄 dashboard.spec.ts    # Dashboard interactions
│   └── 📁 fixtures/                # Test data and fixtures
│       ├── 📄 companies.json       # Sample company data
│       └── 📄 users.json           # Sample user data
│
├── 📁 public/                      # Static Assets
│   ├── 📁 images/                  # Image assets
│   │   ├── 📄 logo.svg             # Application logo
│   │   ├── 📄 favicon.ico          # Favicon
│   │   └── 📁 icons/               # UI icons
│   ├── 📁 documents/               # Static documents
│   │   ├── 📄 privacy-policy.pdf   # Privacy policy
│   │   └── 📄 terms-of-service.pdf # Terms of service
│   └── 📄 manifest.json            # PWA manifest
│
├── 📁 docs/                        # Documentation
│   ├── 📄 API.md                   # API documentation
│   ├── 📄 DEPLOYMENT.md            # Deployment guide
│   ├── 📄 DEVELOPMENT.md           # Development setup
│   ├── 📄 SECURITY.md              # Security guidelines
│   └── 📁 diagrams/                # Architecture diagrams
│       ├── 📄 system-architecture.png
│       └── 📄 database-schema.png
│
├── 📁 .github/                     # GitHub Configuration
│   ├── 📁 workflows/               # CI/CD workflows
│   │   └── 📄 ci-cd.yml            # ✅ Main CI/CD pipeline
│   ├── 📄 CONTRIBUTING.md          # Contribution guidelines
│   └── 📁 ISSUE_TEMPLATE/          # Issue templates
│       ├── 📄 bug_report.md        # Bug report template
│       └── 📄 feature_request.md   # Feature request template
│
├── 📁 scripts/                     # Utility Scripts
│   ├── 📄 setup.sh                 # Project setup script
│   ├── 📄 deploy.sh                # Deployment script
│   ├── 📄 backup-db.sh             # Database backup
│   └── 📄 migrate.js               # Data migration utilities
│
├── 📁 backup/                      # Backup Files (gitignored)
│   └── 📄 nexus-ai-*.md            # Original requirement documents
│
├── 📄 package.json                 # ✅ Node.js dependencies
├── 📄 tsconfig.json                # ✅ TypeScript configuration
├── 📄 next.config.js               # ✅ Next.js configuration
├── 📄 tailwind.config.js           # ✅ Tailwind CSS configuration
├── 📄 postcss.config.js            # ✅ PostCSS configuration
├── 📄 .eslintrc.json               # ✅ ESLint configuration
├── 📄 .prettierrc                  # ✅ Prettier configuration
├── 📄 .gitignore                   # ✅ Git ignore rules
├── 📄 .env.example                 # ✅ Environment variables template
├── 📄 .env.local                   # Local environment (gitignored)
├── 📄 README.md                    # ✅ Project documentation
├── 📄 TASKMASTER.md                # ✅ Comprehensive task tracking
├── 📄 PROJECT_STRUCTURE.md         # ✅ This file
├── 📄 CHANGELOG.md                 # Version change history
├── 📄 LICENSE                      # Project license
└── 📄 next-env.d.ts                # ✅ Next.js type definitions

```

## 🎯 **Key Architecture Decisions**

### **Frontend Architecture**
- **Framework**: Next.js 14 with App Router for modern React patterns
- **UI Framework**: Chakra UI for consistent design system
- **Styling**: Tailwind CSS for utility-first styling approach
- **State Management**: React Query for server state, Zustand for client state
- **Authentication**: Supabase Auth with Google OAuth integration

### **Backend Architecture**
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **API**: Next.js API routes with Supabase integration
- **Real-time**: Supabase real-time subscriptions for live updates
- **File Storage**: Supabase Storage for documents and exports
- **Edge Functions**: Supabase Edge Functions for serverless processing

### **AI Integration**
- **Provider**: DeepSeek API for cost-effective AI processing
- **Processing**: Edge Functions for AI analysis and summarization
- **Caching**: Intelligent caching to minimize API costs
- **Monitoring**: Usage tracking and cost optimization

### **External Integrations**
- **Companies House**: UK company data via REST API
- **OpenCorporates**: International company data for cross-reference
- **Rate Limiting**: Intelligent rate limiting and request queuing
- **Data Quality**: Confidence scoring and validation

## 📊 **File Status Legend**

- ✅ **Created and Configured** - File exists and is properly set up
- 🔄 **In Development** - File structure exists but needs implementation
- ⏳ **Planned** - File planned but not yet created
- 📋 **Template** - Template file that needs customization

## 🔄 **Development Workflow**

### **Phase 1: Foundation Complete** ✅
- Project setup and configuration
- Database schema and Supabase integration  
- AI service integration with DeepSeek
- CI/CD pipeline with GitHub Actions

### **Phase 2: Core Development** (Next Priority)
1. **Authentication UI** - Login components and protected routes
2. **Companies House API** - UK company data integration
3. **Search Interface** - Company search and results display
4. **Graph Visualization** - Corporate hierarchy with React Flow

### **Phase 3: Advanced Features**
1. **AI Summarization** - Company insights and risk assessment
2. **Report Generation** - PDF and Excel export capabilities
3. **User Management** - Role-based access and permissions
4. **Mobile Optimization** - Responsive design and PWA features

### **Phase 4: Production Ready**
1. **Security Implementation** - RLS policies and security testing
2. **Performance Optimization** - Caching and database optimization
3. **Testing Suite** - Unit, integration, and E2E testing
4. **Deployment** - Production setup and monitoring

## 🛠️ **Development Commands**

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Quality Assurance  
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking
npm test               # Run unit tests
npm run test:e2e       # Run E2E tests

# Database
npm run db:generate    # Generate TypeScript types
npm run db:migrate     # Run database migrations
npm run db:seed        # Seed database with sample data

# Deployment
npm run deploy:staging # Deploy to staging
npm run deploy:prod    # Deploy to production
```

## 📈 **Next Development Steps**

1. **Complete Authentication System** - Finish Google OAuth integration
2. **Implement Companies House API** - Core data source integration
3. **Build Search Interface** - Primary user interaction component
4. **Create Graph Visualization** - Key differentiating feature
5. **Add AI Processing** - Leverage DeepSeek for insights

---

*This project structure is designed for scalability, maintainability, and enterprise-grade development practices. Regular updates ensure it stays current with development progress.*