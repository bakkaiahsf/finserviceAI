import { db } from './drizzle';
import { 
  users, 
  teams, 
  plans, 
  companies, 
  companyOfficers, 
  aiProcessingJobs, 
  searchHistory, 
  quotaCounters,
  auditLogs,
  type User,
  type Company,
  type CompanyOfficer,
  type AIProcessingJob,
  type SearchHistory,
  type QuotaCounter,
  type Plan,
  type NewUser,
  type NewCompany,
  type NewCompanyOfficer,
  type NewAIProcessingJob,
  type NewSearchHistory,
  type NewQuotaCounter,
} from './schema-nexus';
import { eq, and, desc, count, gte, lte, ilike, or, isNull } from 'drizzle-orm';

// User operations
export async function createUser(userData: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(userData).returning();
  return user;
}

export async function getUserById(id: number): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user || null;
}

export async function updateUser(id: number, userData: Partial<NewUser>): Promise<User | null> {
  const [user] = await db
    .update(users)
    .set({ ...userData, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user || null;
}

// Plan operations
export async function getPlans(): Promise<Plan[]> {
  return await db.select().from(plans).where(eq(plans.isActive, true));
}

export async function getPlanBySlug(slug: string): Promise<Plan | null> {
  const [plan] = await db.select().from(plans).where(eq(plans.slug, slug));
  return plan || null;
}

// Company operations
export async function createCompany(companyData: NewCompany): Promise<Company> {
  const [company] = await db.insert(companies).values(companyData).returning();
  return company;
}

export async function getCompanyByNumber(companyNumber: string): Promise<Company | null> {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.companyNumber, companyNumber));
  return company || null;
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const [company] = await db.select().from(companies).where(eq(companies.id, id));
  return company || null;
}

export async function searchCompanies(query: string, limit: number = 10): Promise<Company[]> {
  return await db
    .select()
    .from(companies)
    .where(
      or(
        ilike(companies.companyName, `%${query}%`),
        ilike(companies.companyNumber, `%${query}%`)
      )
    )
    .limit(limit)
    .orderBy(desc(companies.createdAt));
}

export async function updateCompanyAIData(
  companyId: string, 
  aiSummary: string, 
  aiRiskScore: number, 
  aiInsights: any
): Promise<Company | null> {
  const [company] = await db
    .update(companies)
    .set({
      aiSummary,
      aiRiskScore: aiRiskScore.toString(),
      aiInsights,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, companyId))
    .returning();
  return company || null;
}

// Company officers operations
export async function createCompanyOfficer(officerData: NewCompanyOfficer): Promise<CompanyOfficer> {
  const [officer] = await db.insert(companyOfficers).values(officerData).returning();
  return officer;
}

export async function getCompanyOfficers(companyId: string): Promise<CompanyOfficer[]> {
  return await db
    .select()
    .from(companyOfficers)
    .where(eq(companyOfficers.companyId, companyId))
    .orderBy(companyOfficers.appointedOn);
}

export async function getActiveOfficers(companyId: string): Promise<CompanyOfficer[]> {
  return await db
    .select()
    .from(companyOfficers)
    .where(
      and(
        eq(companyOfficers.companyId, companyId),
        isNull(companyOfficers.resignedOn)
      )
    )
    .orderBy(companyOfficers.appointedOn);
}

// AI processing jobs operations
export async function createAIJob(jobData: NewAIProcessingJob): Promise<AIProcessingJob> {
  const [job] = await db.insert(aiProcessingJobs).values(jobData).returning();
  return job;
}

export async function getAIJobById(id: string): Promise<AIProcessingJob | null> {
  const [job] = await db.select().from(aiProcessingJobs).where(eq(aiProcessingJobs.id, id));
  return job || null;
}

export async function updateAIJobStatus(
  id: string, 
  status: 'pending' | 'processing' | 'completed' | 'failed',
  aiResponse?: any,
  providerUsage?: any
): Promise<AIProcessingJob | null> {
  const updateData: any = { status };
  
  if (aiResponse) updateData.aiResponse = aiResponse;
  if (providerUsage) updateData.providerUsage = providerUsage;
  if (status === 'completed' || status === 'failed') {
    updateData.completedAt = new Date();
  }

  const [job] = await db
    .update(aiProcessingJobs)
    .set(updateData)
    .where(eq(aiProcessingJobs.id, id))
    .returning();
  return job || null;
}

export async function getUserAIJobs(userId: number, limit: number = 10): Promise<AIProcessingJob[]> {
  return await db
    .select()
    .from(aiProcessingJobs)
    .where(eq(aiProcessingJobs.createdBy, userId))
    .orderBy(desc(aiProcessingJobs.createdAt))
    .limit(limit);
}

// Search history operations
export async function createSearchHistory(searchData: NewSearchHistory): Promise<SearchHistory> {
  const [search] = await db.insert(searchHistory).values(searchData).returning();
  return search;
}

export async function getUserSearchHistory(userId: number, limit: number = 20): Promise<SearchHistory[]> {
  return await db
    .select()
    .from(searchHistory)
    .where(eq(searchHistory.userId, userId))
    .orderBy(desc(searchHistory.createdAt))
    .limit(limit);
}

// Quota operations
export async function getCurrentMonthQuota(userId: number): Promise<QuotaCounter | null> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [quota] = await db
    .select()
    .from(quotaCounters)
    .where(
      and(
        eq(quotaCounters.userId, userId),
        eq(quotaCounters.periodStart, periodStart.toISOString().split('T')[0]),
        eq(quotaCounters.periodEnd, periodEnd.toISOString().split('T')[0])
      )
    );

  return quota || null;
}

export async function incrementSearchQuota(userId: number): Promise<QuotaCounter> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Try to update existing quota first
  const [existingQuota] = await db
    .update(quotaCounters)
    .set({ 
      searchesUsed: quotaCounters.searchesUsed + 1,
      lastResetAt: new Date()
    })
    .where(
      and(
        eq(quotaCounters.userId, userId),
        eq(quotaCounters.periodStart, periodStart.toISOString().split('T')[0]),
        eq(quotaCounters.periodEnd, periodEnd.toISOString().split('T')[0])
      )
    )
    .returning();

  if (existingQuota) {
    return existingQuota;
  }

  // Create new quota counter if doesn't exist
  const [newQuota] = await db
    .insert(quotaCounters)
    .values({
      userId,
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0],
      searchesUsed: 1,
      aiTokensUsed: 0,
    })
    .returning();

  return newQuota;
}

export async function incrementAITokenQuota(userId: number, tokens: number): Promise<QuotaCounter> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Try to update existing quota first
  const [existingQuota] = await db
    .update(quotaCounters)
    .set({ 
      aiTokensUsed: quotaCounters.aiTokensUsed + tokens,
      lastResetAt: new Date()
    })
    .where(
      and(
        eq(quotaCounters.userId, userId),
        eq(quotaCounters.periodStart, periodStart.toISOString().split('T')[0]),
        eq(quotaCounters.periodEnd, periodEnd.toISOString().split('T')[0])
      )
    )
    .returning();

  if (existingQuota) {
    return existingQuota;
  }

  // Create new quota counter if doesn't exist
  const [newQuota] = await db
    .insert(quotaCounters)
    .values({
      userId,
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0],
      searchesUsed: 0,
      aiTokensUsed: tokens,
    })
    .returning();

  return newQuota;
}

// Analytics queries
export async function getCompaniesNeedingSync(hours: number = 24): Promise<Company[]> {
  const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return await db
    .select()
    .from(companies)
    .where(
      or(
        isNull(companies.lastChSync),
        lte(companies.lastChSync, cutoffDate)
      )
    )
    .limit(100);
}

export async function getTopSearchQueries(limit: number = 10): Promise<{ query: string; count: number }[]> {
  return await db
    .select({
      query: searchHistory.query,
      count: count(),
    })
    .from(searchHistory)
    .groupBy(searchHistory.query)
    .orderBy(desc(count()))
    .limit(limit);
}

export async function getUserStats(userId: number): Promise<{
  totalSearches: number;
  totalCompaniesViewed: number;
  totalAIJobs: number;
}> {
  const [searchCount] = await db
    .select({ count: count() })
    .from(searchHistory)
    .where(eq(searchHistory.userId, userId));

  const [aiJobCount] = await db
    .select({ count: count() })
    .from(aiProcessingJobs)
    .where(eq(aiProcessingJobs.createdBy, userId));

  return {
    totalSearches: searchCount.count,
    totalCompaniesViewed: searchCount.count, // Assuming each search leads to a view
    totalAIJobs: aiJobCount.count,
  };
}

// Complex relationship queries
export async function getCompanyWithOfficers(companyId: string) {
  const company = await getCompanyById(companyId);
  if (!company) return null;

  const officers = await getCompanyOfficers(companyId);
  
  return {
    ...company,
    officers,
  };
}

export async function getCompanyNetwork(companyId: string, depth: number = 2): Promise<{
  company: Company;
  officers: CompanyOfficer[];
  relatedCompanies: Company[];
}> {
  const company = await getCompanyById(companyId);
  if (!company) throw new Error('Company not found');

  const officers = await getCompanyOfficers(companyId);
  
  // Get related companies through shared officers (simplified for MVP)
  const officerNames = officers.map(o => o.name);
  const relatedCompanies = officerNames.length > 0 
    ? await db
        .select()
        .from(companies)
        .innerJoin(companyOfficers, eq(companies.id, companyOfficers.companyId))
        .where(
          and(
            or(...officerNames.map(name => eq(companyOfficers.name, name))),
            // ne(companies.id, companyId) // Exclude the original company
          )
        )
        .limit(20)
    : [];

  return {
    company,
    officers,
    relatedCompanies: relatedCompanies.map(r => r.companies),
  };
}