// Quota management and usage tracking system

import { createAdminSupabaseClient } from '@/lib/auth/supabase-client';
import { stripeService, PRICING_TIERS, type PricingTier } from '@/lib/stripe/stripe-client';

interface QuotaUsage {
  user_id: string;
  period_start: string;
  period_end: string;
  searches: number;
  ai_analyses: number;
  network_graphs: number;
  pdf_reports: number;
  csv_exports: number;
  api_calls: number;
  last_reset: string;
  created_at: string;
  updated_at: string;
}

interface QuotaCheck {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetDate: string;
  planName: string;
  upgradeRequired?: boolean;
}

interface UsageIncrement {
  searches?: number;
  ai_analyses?: number;
  network_graphs?: number;
  pdf_reports?: number;
  csv_exports?: number;
  api_calls?: number;
}

type QuotaType = keyof Omit<UsageIncrement, 'user_id'>;

class QuotaManager {
  private static instance: QuotaManager;
  private supabase = createAdminSupabaseClient();

  static getInstance(): QuotaManager {
    if (!QuotaManager.instance) {
      QuotaManager.instance = new QuotaManager();
    }
    return QuotaManager.instance;
  }

  /**
   * Check if user can perform an action based on quota limits
   */
  async checkQuota(
    userId: string,
    quotaType: QuotaType,
    requestedAmount: number = 1
  ): Promise<QuotaCheck> {
    try {
      // Get user's current plan and usage
      const [userPlan, currentUsage] = await Promise.all([
        this.getUserPlan(userId),
        this.getCurrentUsage(userId)
      ]);

      const tier = stripeService.getPricingTier(userPlan.planId);
      if (!tier) {
        throw new Error('Invalid subscription plan');
      }

      // Get limit for this quota type
      const limit = this.getQuotaLimit(tier, quotaType);
      const currentUsed = this.getCurrentUsed(currentUsage, quotaType);
      const remaining = limit === -1 ? Infinity : Math.max(0, limit - currentUsed);

      const allowed = limit === -1 || (currentUsed + requestedAmount) <= limit;

      return {
        allowed,
        remaining: limit === -1 ? -1 : remaining,
        limit,
        resetDate: currentUsage?.period_end || this.getNextResetDate(),
        planName: tier.name,
        upgradeRequired: !allowed && tier.id !== 'expert'
      };
    } catch (error) {
      console.error('Quota check error:', error);
      
      // Fallback to free tier limits on error
      const freeTier = PRICING_TIERS.find(t => t.id === 'free')!;
      const limit = this.getQuotaLimit(freeTier, quotaType);
      
      return {
        allowed: requestedAmount <= limit,
        remaining: limit,
        limit,
        resetDate: this.getNextResetDate(),
        planName: 'Free (Error)',
        upgradeRequired: true
      };
    }
  }

  /**
   * Increment quota usage for a user
   */
  async incrementQuota(
    userId: string,
    usage: UsageIncrement
  ): Promise<void> {
    try {
      const currentUsage = await this.getCurrentUsage(userId);
      
      if (!currentUsage) {
        // Create initial usage record
        await this.createUsageRecord(userId, usage);
      } else {
        // Update existing usage record
        await this.updateUsageRecord(userId, usage);
      }

      // Log the usage increment for audit purposes
      await this.logUsageEvent(userId, usage);
    } catch (error) {
      console.error('Failed to increment quota:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive usage statistics for a user
   */
  async getUsageStats(userId: string): Promise<{
    current: QuotaUsage;
    limits: PricingTier['limits'];
    utilization: {
      searches: number; // percentage
      ai_analyses: number;
      network_graphs: number;
      pdf_reports: number;
      csv_exports: number;
      api_calls: number;
    };
    daysUntilReset: number;
    planName: string;
  }> {
    const [userPlan, currentUsage] = await Promise.all([
      this.getUserPlan(userId),
      this.getCurrentUsage(userId)
    ]);

    const tier = stripeService.getPricingTier(userPlan.planId);
    if (!tier) {
      throw new Error('Invalid subscription plan');
    }

    const defaultUsage: QuotaUsage = {
      user_id: userId,
      period_start: new Date().toISOString(),
      period_end: this.getNextResetDate(),
      searches: 0,
      ai_analyses: 0,
      network_graphs: 0,
      pdf_reports: 0,
      csv_exports: 0,
      api_calls: 0,
      last_reset: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const usage = currentUsage || defaultUsage;

    // Calculate utilization percentages
    const utilization = {
      searches: this.calculateUtilization(usage.searches, tier.limits.searchesPerMonth),
      ai_analyses: this.calculateUtilization(usage.ai_analyses, tier.limits.aiAnalysesPerMonth),
      network_graphs: this.calculateUtilization(usage.network_graphs, tier.limits.networkGraphs),
      pdf_reports: this.calculateUtilization(usage.pdf_reports, tier.limits.pdfReports),
      csv_exports: this.calculateUtilization(usage.csv_exports, tier.limits.csvExports),
      api_calls: this.calculateUtilization(usage.api_calls, tier.limits.apiCalls)
    };

    const resetDate = new Date(usage.period_end);
    const daysUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return {
      current: usage,
      limits: tier.limits,
      utilization,
      daysUntilReset,
      planName: tier.name
    };
  }

  /**
   * Reset quotas for a new billing period
   */
  async resetQuotas(userId: string): Promise<void> {
    const now = new Date().toISOString();
    const nextPeriodEnd = this.getNextResetDate();

    await this.supabase
      .from('quota_usage')
      .upsert({
        user_id: userId,
        period_start: now,
        period_end: nextPeriodEnd,
        searches: 0,
        ai_analyses: 0,
        network_graphs: 0,
        pdf_reports: 0,
        csv_exports: 0,
        api_calls: 0,
        last_reset: now,
        updated_at: now
      });
  }

  /**
   * Get quota usage history for analytics
   */
  async getUsageHistory(
    userId: string,
    months: number = 6
  ): Promise<Array<{
    period: string;
    usage: QuotaUsage;
    plan: string;
  }>> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data, error } = await this.supabase
      .from('quota_usage')
      .select('*')
      .eq('user_id', userId)
      .gte('period_start', startDate.toISOString())
      .order('period_start', { ascending: false });

    if (error) {
      console.error('Failed to fetch usage history:', error);
      return [];
    }

    // Get plan information for each period (simplified)
    return (data || []).map(usage => ({
      period: usage.period_start.split('T')[0],
      usage,
      plan: 'Current' // Would need to track historical plan changes
    }));
  }

  /**
   * Check if user is approaching quota limits
   */
  async checkQuotaAlerts(userId: string): Promise<Array<{
    quotaType: QuotaType;
    usage: number;
    limit: number;
    percentage: number;
    severity: 'warning' | 'critical';
  }>> {
    const stats = await this.getUsageStats(userId);
    const alerts: Array<{
      quotaType: QuotaType;
      usage: number;
      limit: number;
      percentage: number;
      severity: 'warning' | 'critical';
    }> = [];

    const quotaTypes: QuotaType[] = [
      'searches', 'ai_analyses', 'network_graphs', 
      'pdf_reports', 'csv_exports', 'api_calls'
    ];

    for (const quotaType of quotaTypes) {
      const utilization = stats.utilization[quotaType];
      const usage = stats.current[quotaType];
      const limit = this.getQuotaLimit({ limits: stats.limits } as PricingTier, quotaType);

      if (limit === -1) continue; // Skip unlimited quotas

      if (utilization >= 90) {
        alerts.push({
          quotaType,
          usage,
          limit,
          percentage: utilization,
          severity: 'critical'
        });
      } else if (utilization >= 75) {
        alerts.push({
          quotaType,
          usage,
          limit,
          percentage: utilization,
          severity: 'warning'
        });
      }
    }

    return alerts;
  }

  /**
   * Bulk increment quotas (for batch operations)
   */
  async bulkIncrementQuota(
    userId: string,
    operations: Array<{ type: QuotaType; amount: number }>
  ): Promise<void> {
    const totalUsage: UsageIncrement = {};

    // Aggregate all operations
    operations.forEach(op => {
      totalUsage[op.type] = (totalUsage[op.type] || 0) + op.amount;
    });

    await this.incrementQuota(userId, totalUsage);
  }

  // Private helper methods

  private async getUserPlan(userId: string): Promise<{ planId: string; stripeCustomerId?: string }> {
    // This would query the user's subscription from your database
    // For now, return free plan as default
    const { data, error } = await this.supabase
      .from('users')
      .select('subscription_plan, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { planId: 'free' };
    }

    return {
      planId: data.subscription_plan || 'free',
      stripeCustomerId: data.stripe_customer_id
    };
  }

  private async getCurrentUsage(userId: string): Promise<QuotaUsage | null> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data, error } = await this.supabase
      .from('quota_usage')
      .select('*')
      .eq('user_id', userId)
      .gte('period_start', startOfMonth)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  private async createUsageRecord(userId: string, usage: UsageIncrement): Promise<void> {
    const now = new Date().toISOString();
    const periodEnd = this.getNextResetDate();

    await this.supabase
      .from('quota_usage')
      .insert({
        user_id: userId,
        period_start: now,
        period_end: periodEnd,
        searches: usage.searches || 0,
        ai_analyses: usage.ai_analyses || 0,
        network_graphs: usage.network_graphs || 0,
        pdf_reports: usage.pdf_reports || 0,
        csv_exports: usage.csv_exports || 0,
        api_calls: usage.api_calls || 0,
        last_reset: now,
        created_at: now,
        updated_at: now
      });
  }

  private async updateUsageRecord(userId: string, usage: UsageIncrement): Promise<void> {
    const updates: any = { updated_at: new Date().toISOString() };

    if (usage.searches) updates.searches = this.supabase.raw(`searches + ${usage.searches}`);
    if (usage.ai_analyses) updates.ai_analyses = this.supabase.raw(`ai_analyses + ${usage.ai_analyses}`);
    if (usage.network_graphs) updates.network_graphs = this.supabase.raw(`network_graphs + ${usage.network_graphs}`);
    if (usage.pdf_reports) updates.pdf_reports = this.supabase.raw(`pdf_reports + ${usage.pdf_reports}`);
    if (usage.csv_exports) updates.csv_exports = this.supabase.raw(`csv_exports + ${usage.csv_exports}`);
    if (usage.api_calls) updates.api_calls = this.supabase.raw(`api_calls + ${usage.api_calls}`);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    await this.supabase
      .from('quota_usage')
      .update(updates)
      .eq('user_id', userId)
      .gte('period_start', startOfMonth);
  }

  private async logUsageEvent(userId: string, usage: UsageIncrement): Promise<void> {
    // This would integrate with your audit logging system
    console.log('Usage event:', { userId, usage, timestamp: new Date().toISOString() });
  }

  private getQuotaLimit(tier: PricingTier, quotaType: QuotaType): number {
    switch (quotaType) {
      case 'searches': return tier.limits.searchesPerMonth;
      case 'ai_analyses': return tier.limits.aiAnalysesPerMonth;
      case 'network_graphs': return tier.limits.networkGraphs;
      case 'pdf_reports': return tier.limits.pdfReports;
      case 'csv_exports': return tier.limits.csvExports;
      case 'api_calls': return tier.limits.apiCalls;
      default: return 0;
    }
  }

  private getCurrentUsed(usage: QuotaUsage | null, quotaType: QuotaType): number {
    if (!usage) return 0;
    
    switch (quotaType) {
      case 'searches': return usage.searches;
      case 'ai_analyses': return usage.ai_analyses;
      case 'network_graphs': return usage.network_graphs;
      case 'pdf_reports': return usage.pdf_reports;
      case 'csv_exports': return usage.csv_exports;
      case 'api_calls': return usage.api_calls;
      default: return 0;
    }
  }

  private calculateUtilization(used: number, limit: number): number {
    if (limit === -1) return 0; // Unlimited
    if (limit === 0) return 100; // No quota
    return Math.round((used / limit) * 100);
  }

  private getNextResetDate(): string {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString();
  }
}

export const quotaManager = QuotaManager.getInstance();
export type { QuotaUsage, QuotaCheck, UsageIncrement, QuotaType };