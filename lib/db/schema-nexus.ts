import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  uuid,
  jsonb,
  numeric,
  date,
  boolean,
  index,
  pgEnum,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums for type safety
export const userRoleEnum = pgEnum('user_role', ['admin', 'compliance_officer', 'analyst', 'viewer']);
export const jobStatusEnum = pgEnum('job_status', ['pending', 'processing', 'completed', 'failed']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'canceled', 'past_due', 'unpaid']);

// Users table - core authentication and authorization
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('viewer'),
  organizationId: integer('organization_id'),
  consentFlags: jsonb('consent_flags'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// Plans table for subscription management
export const plans = pgTable('plans', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 50 }).notNull().unique(), // free, pro, proplus, expert
  name: varchar('name', { length: 100 }).notNull(),
  monthlyPriceCents: integer('monthly_price_cents').notNull().default(0),
  yearlyPriceCents: integer('yearly_price_cents').notNull().default(0),
  entitlements: jsonb('entitlements').notNull(), // { maxSearches: number, maxSeats: number, features: string[] }
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Teams/Organizations table
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planId: integer('plan_id').references(() => plans.id),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: subscriptionStatusEnum('subscription_status'),
});

// Team members relationship
export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
});

// UK Companies data from Companies House
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyNumber: varchar('company_number', { length: 20 }).notNull().unique(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }),
  type: varchar('type', { length: 100 }),
  incorporationDate: date('incorporation_date'),
  registeredOffice: jsonb('registered_office'),
  sicCodes: jsonb('sic_codes'), // array of SIC codes as integers
  lastChSync: timestamp('last_ch_sync', { withTimezone: true }),
  companiesHouseData: jsonb('companies_house_data'), // raw API response
  aiSummary: text('ai_summary'),
  aiRiskScore: numeric('ai_risk_score', { precision: 5, scale: 2 }), // 0-100
  aiInsights: jsonb('ai_insights'), // confidence, caveats, prompt_version, etc
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  companyNumberIdx: index('idx_companies_company_number').on(table.companyNumber),
  companyNameIdx: index('idx_companies_company_name').on(table.companyName),
  aiRiskScoreIdx: index('idx_companies_ai_risk_score').on(table.aiRiskScore),
}));

// Company officers and PSCs (Persons with Significant Control)
export const companyOfficers = pgTable('company_officers', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  officerRole: varchar('officer_role', { length: 100 }),
  appointedOn: date('appointed_on'),
  resignedOn: date('resigned_on'),
  address: jsonb('address'),
  dateOfBirth: jsonb('date_of_birth'), // partial DOB from Companies House
  nationality: varchar('nationality', { length: 100 }),
  natureOfControl: jsonb('nature_of_control'), // array for PSCs
  ownershipPercentage: numeric('ownership_percentage', { precision: 5, scale: 2 }),
  votingPercentage: numeric('voting_percentage', { precision: 5, scale: 2 }),
  companiesHouseData: jsonb('companies_house_data'), // raw API response
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  companyIdIdx: index('idx_company_officers_company_id').on(table.companyId),
  nameIdx: index('idx_company_officers_name').on(table.name),
}));

// AI processing jobs for DeepSeek integration
export const aiProcessingJobs = pgTable('ai_processing_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobType: varchar('job_type', { length: 50 }).notNull(), // 'company_summary', 'risk_assessment', etc
  entityId: uuid('entity_id').notNull(), // references companies.id usually
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'company', 'officer', etc
  status: jobStatusEnum('status').notNull().default('pending'),
  inputData: jsonb('input_data'), // input parameters for AI
  aiResponse: jsonb('ai_response'), // AI model response
  providerUsage: jsonb('provider_usage'), // tokens used, cost, model version, etc
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// Search history for usage analytics
export const searchHistory = pgTable('search_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').notNull().references(() => users.id),
  teamId: integer('team_id').references(() => teams.id),
  query: text('query').notNull(),
  resultCount: integer('result_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_search_history_user_id').on(table.userId, table.createdAt),
}));

// Quota counters for subscription enforcement
export const quotaCounters = pgTable('quota_counters', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').references(() => users.id),
  teamId: integer('team_id').references(() => teams.id),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  searchesUsed: integer('searches_used').notNull().default(0),
  aiTokensUsed: integer('ai_tokens_used').notNull().default(0),
  lastResetAt: timestamp('last_reset_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userPeriodIdx: unique('unique_user_period').on(table.userId, table.periodStart, table.periodEnd),
  teamPeriodIdx: unique('unique_team_period').on(table.teamId, table.periodStart, table.periodEnd),
}));

// Enhanced audit logs for compliance
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableName: varchar('table_name', { length: 100 }),
  recordId: text('record_id'),
  action: varchar('action', { length: 50 }).notNull(), // CREATE, UPDATE, DELETE, VIEW, EXPORT
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  userId: integer('user_id').references(() => users.id),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  requestId: varchar('request_id', { length: 100 }),
}, (table) => ({
  userIdTimestampIdx: index('idx_audit_logs_user_timestamp').on(table.userId, table.timestamp),
  actionTimestampIdx: index('idx_audit_logs_action_timestamp').on(table.action, table.timestamp),
}));

// Activity logs (existing from starter)
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

// Invitations (existing from starter)
export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at', { withTimezone: true }).notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  aiJobs: many(aiProcessingJobs),
  searchHistory: many(searchHistory),
  auditLogs: many(auditLogs),
}));

export const teamsRelations = relations(teams, ({ many, one }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  searchHistory: many(searchHistory),
  quotaCounters: many(quotaCounters),
  plan: one(plans, {
    fields: [teams.planId],
    references: [plans.id],
  }),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  teams: many(teams),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  officers: many(companyOfficers),
  aiJobs: many(aiProcessingJobs),
}));

export const companyOfficersRelations = relations(companyOfficers, ({ one }) => ({
  company: one(companies, {
    fields: [companyOfficers.companyId],
    references: [companies.id],
  }),
}));

export const aiProcessingJobsRelations = relations(aiProcessingJobs, ({ one }) => ({
  createdByUser: one(users, {
    fields: [aiProcessingJobs.createdBy],
    references: [users.id],
  }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, {
    fields: [searchHistory.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [searchHistory.teamId],
    references: [teams.id],
  }),
}));

export const quotaCountersRelations = relations(quotaCounters, ({ one }) => ({
  user: one(users, {
    fields: [quotaCounters.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [quotaCounters.teamId],
    references: [teams.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type CompanyOfficer = typeof companyOfficers.$inferSelect;
export type NewCompanyOfficer = typeof companyOfficers.$inferInsert;
export type AIProcessingJob = typeof aiProcessingJobs.$inferSelect;
export type NewAIProcessingJob = typeof aiProcessingJobs.$inferInsert;
export type SearchHistory = typeof searchHistory.$inferSelect;
export type NewSearchHistory = typeof searchHistory.$inferInsert;
export type QuotaCounter = typeof quotaCounters.$inferSelect;
export type NewQuotaCounter = typeof quotaCounters.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;

// Extended types for complex queries
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export type CompanyWithOfficers = Company & {
  officers: CompanyOfficer[];
};

export type CompanyWithAIInsights = Company & {
  aiJobs: AIProcessingJob[];
};

// Enums for use in application code
export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
  // Nexus AI specific activities
  COMPANY_SEARCH = 'COMPANY_SEARCH',
  COMPANY_VIEW = 'COMPANY_VIEW',
  AI_SUMMARY_GENERATED = 'AI_SUMMARY_GENERATED',
  GRAPH_EXPORTED = 'GRAPH_EXPORTED',
  REPORT_GENERATED = 'REPORT_GENERATED',
  DATA_REFRESH = 'DATA_REFRESH',
}

export enum UserRole {
  ADMIN = 'admin',
  COMPLIANCE_OFFICER = 'compliance_officer',
  ANALYST = 'analyst',
  VIEWER = 'viewer',
}

export enum PlanSlug {
  FREE = 'free',
  PRO = 'pro',
  PROPLUS = 'proplus',
  EXPERT = 'expert',
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
}