// Comprehensive audit logging and provenance tracking system

import { createAdminSupabaseClient } from '@/lib/auth/supabase-client';

interface AuditEvent {
  id?: string;
  user_id: string;
  session_id?: string;
  action: AuditAction;
  resource_type: ResourceType;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  duration_ms?: number;
  metadata?: {
    api_version?: string;
    feature_flags?: string[];
    client_version?: string;
    request_id?: string;
  };
  created_at?: string;
}

type AuditAction = 
  | 'login' | 'logout' | 'signup' | 'password_reset'
  | 'company_search' | 'company_view' | 'officer_view' | 'psc_view'
  | 'ai_analysis_request' | 'ai_analysis_complete' | 'ai_cost_tracking'
  | 'network_generate' | 'network_view' | 'network_export'
  | 'report_generate' | 'report_download' | 'csv_export'
  | 'user_create' | 'user_update' | 'user_delete'
  | 'subscription_create' | 'subscription_update' | 'subscription_cancel'
  | 'api_key_create' | 'api_key_revoke' | 'rate_limit_exceeded'
  | 'data_export' | 'data_import' | 'backup_create'
  | 'settings_update' | 'profile_update' | 'team_invite'
  | 'compliance_check' | 'gdpr_request' | 'data_deletion';

type ResourceType = 
  | 'user' | 'company' | 'officer' | 'psc' | 'report' | 'export'
  | 'network' | 'ai_analysis' | 'subscription' | 'team' | 'api_key'
  | 'session' | 'setting' | 'backup' | 'compliance_record';

interface AuditQuery {
  user_id?: string;
  action?: AuditAction;
  resource_type?: ResourceType;
  resource_id?: string;
  start_date?: string;
  end_date?: string;
  success?: boolean;
  ip_address?: string;
  limit?: number;
  offset?: number;
  include_details?: boolean;
}

interface AuditSummary {
  total_events: number;
  unique_users: number;
  success_rate: number;
  most_common_actions: Array<{ action: AuditAction; count: number }>;
  error_rate_by_action: Array<{ action: AuditAction; error_rate: number }>;
  daily_activity: Array<{ date: string; events: number }>;
  top_resources: Array<{ resource_type: ResourceType; count: number }>;
}

interface ComplianceReport {
  report_id: string;
  generated_at: string;
  period: { start: string; end: string };
  user_activity: {
    total_users: number;
    active_users: number;
    new_users: number;
    deleted_users: number;
  };
  data_access: {
    companies_accessed: number;
    searches_performed: number;
    reports_generated: number;
    exports_created: number;
  };
  ai_usage: {
    analyses_requested: number;
    tokens_consumed: number;
    cost_incurred: number;
  };
  security_events: {
    failed_logins: number;
    rate_limit_violations: number;
    suspicious_activities: number;
  };
  gdpr_compliance: {
    data_requests: number;
    deletions_processed: number;
    consent_updates: number;
  };
}

class AuditLogger {
  private static instance: AuditLogger;
  private supabase = createAdminSupabaseClient();

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log an audit event
   */
  async logEvent(event: Omit<AuditEvent, 'id' | 'created_at'>): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        ...event,
        created_at: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('audit_logs')
        .insert([auditEvent]);

      if (error) {
        console.error('Failed to log audit event:', error);
        // Fallback to local logging if database fails
        this.logToFile(auditEvent);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
      this.logToFile(event);
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(
    action: 'login' | 'logout' | 'signup' | 'password_reset',
    userId: string,
    success: boolean,
    details: Record<string, any> = {},
    request?: { ip?: string; userAgent?: string }
  ): Promise<void> {
    await this.logEvent({
      user_id: userId,
      action,
      resource_type: 'user',
      resource_id: userId,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      ip_address: request?.ip,
      user_agent: request?.userAgent,
      success
    });
  }

  /**
   * Log company data access
   */
  async logDataAccess(
    action: 'company_search' | 'company_view' | 'officer_view' | 'psc_view',
    userId: string,
    resourceId: string,
    details: Record<string, any> = {},
    duration?: number
  ): Promise<void> {
    await this.logEvent({
      user_id: userId,
      action,
      resource_type: action.includes('company') ? 'company' : 
                    action.includes('officer') ? 'officer' : 'psc',
      resource_id: resourceId,
      details: {
        ...details,
        search_query: details.query,
        results_count: details.count,
        filters_applied: details.filters
      },
      success: true,
      duration_ms: duration
    });
  }

  /**
   * Log AI analysis events
   */
  async logAIAnalysis(
    userId: string,
    companyNumber: string,
    success: boolean,
    details: {
      tokens_used?: number;
      cost_usd?: number;
      confidence?: number;
      risk_score?: number;
      analysis_type?: string[];
      error?: string;
    },
    duration?: number
  ): Promise<void> {
    await this.logEvent({
      user_id: userId,
      action: success ? 'ai_analysis_complete' : 'ai_analysis_request',
      resource_type: 'ai_analysis',
      resource_id: `${companyNumber}-${Date.now()}`,
      details: {
        company_number: companyNumber,
        tokens_used: details.tokens_used || 0,
        cost_usd: details.cost_usd || 0,
        confidence: details.confidence,
        risk_score: details.risk_score,
        analysis_type: details.analysis_type,
        timestamp: new Date().toISOString()
      },
      success,
      error_message: details.error,
      duration_ms: duration
    });

    // Log cost tracking separately
    if (details.tokens_used && details.cost_usd) {
      await this.logEvent({
        user_id: userId,
        action: 'ai_cost_tracking',
        resource_type: 'ai_analysis',
        resource_id: userId,
        details: {
          tokens_used: details.tokens_used,
          cost_usd: details.cost_usd,
          running_total: await this.getUserAICosts(userId)
        },
        success: true
      });
    }
  }

  /**
   * Log export and report generation
   */
  async logExport(
    action: 'report_generate' | 'report_download' | 'csv_export' | 'network_export',
    userId: string,
    details: {
      format?: string;
      file_size?: number;
      record_count?: number;
      export_type?: string;
      company_numbers?: string[];
    }
  ): Promise<void> {
    const exportId = `${action}-${userId}-${Date.now()}`;
    
    await this.logEvent({
      user_id: userId,
      action,
      resource_type: 'export',
      resource_id: exportId,
      details: {
        ...details,
        export_timestamp: new Date().toISOString()
      },
      success: true
    });
  }

  /**
   * Log security events
   */
  async logSecurity(
    action: 'rate_limit_exceeded' | 'api_key_create' | 'api_key_revoke',
    userId: string,
    details: Record<string, any>,
    request?: { ip?: string; userAgent?: string }
  ): Promise<void> {
    await this.logEvent({
      user_id: userId,
      action,
      resource_type: 'session',
      details: {
        ...details,
        security_event: true,
        requires_review: action === 'rate_limit_exceeded'
      },
      ip_address: request?.ip,
      user_agent: request?.userAgent,
      success: true
    });
  }

  /**
   * Query audit logs with filtering and pagination
   */
  async queryLogs(query: AuditQuery): Promise<{
    events: AuditEvent[];
    total_count: number;
    has_more: boolean;
  }> {
    let dbQuery = this.supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (query.user_id) dbQuery = dbQuery.eq('user_id', query.user_id);
    if (query.action) dbQuery = dbQuery.eq('action', query.action);
    if (query.resource_type) dbQuery = dbQuery.eq('resource_type', query.resource_type);
    if (query.resource_id) dbQuery = dbQuery.eq('resource_id', query.resource_id);
    if (query.success !== undefined) dbQuery = dbQuery.eq('success', query.success);
    if (query.ip_address) dbQuery = dbQuery.eq('ip_address', query.ip_address);
    if (query.start_date) dbQuery = dbQuery.gte('created_at', query.start_date);
    if (query.end_date) dbQuery = dbQuery.lte('created_at', query.end_date);

    // Apply pagination
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    // Order by id descending (will switch to created_at after schema update)
    dbQuery = dbQuery.order('id', { ascending: false });

    const { data, error, count } = await dbQuery;

    if (error) {
      throw new Error(`Failed to query audit logs: ${error.message}`);
    }

    return {
      events: data || [],
      total_count: count || 0,
      has_more: (count || 0) > offset + limit
    };
  }

  /**
   * Generate audit summary for a time period
   */
  async generateSummary(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<AuditSummary> {
    let query = this.supabase
      .from('audit_logs')
      .select('action, resource_type, success, user_id');

    if (userId) query = query.eq('user_id', userId);
    // Note: Date filtering disabled until created_at column is added
    // query = query.gte('created_at', startDate).lte('created_at', endDate);

    const { data, error } = await query;

    if (error || !data) {
      throw new Error(`Failed to generate audit summary: ${error?.message}`);
    }

    // Calculate metrics
    const totalEvents = data.length;
    const uniqueUsers = new Set(data.map(e => e.user_id)).size;
    const successfulEvents = data.filter(e => e.success).length;
    const successRate = totalEvents > 0 ? successfulEvents / totalEvents : 0;

    // Most common actions
    const actionCounts = data.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonActions = Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action: action as AuditAction, count }));

    // Error rates by action
    const errorRates = Object.entries(actionCounts).map(([action, total]) => {
      const errors = data.filter(e => e.action === action && !e.success).length;
      return { action: action as AuditAction, error_rate: total > 0 ? errors / total : 0 };
    });

    // Daily activity
    const dailyActivity = data.reduce((acc, event) => {
      const date = event.created_at.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dailyActivityArray = Object.entries(dailyActivity)
      .map(([date, events]) => ({ date, events }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top resources
    const resourceCounts = data.reduce((acc, event) => {
      acc[event.resource_type] = (acc[event.resource_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topResources = Object.entries(resourceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([resource_type, count]) => ({ resource_type: resource_type as ResourceType, count }));

    return {
      total_events: totalEvents,
      unique_users: uniqueUsers,
      success_rate: successRate,
      most_common_actions: mostCommonActions,
      error_rate_by_action: errorRates,
      daily_activity: dailyActivityArray,
      top_resources: topResources
    };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: string,
    endDate: string
  ): Promise<ComplianceReport> {
    const reportId = `compliance-${Date.now()}`;
    
    // Get all events in period
    const { events } = await this.queryLogs({
      start_date: startDate,
      end_date: endDate,
      limit: 10000 // Large limit for comprehensive report
    });

    // Calculate metrics
    const userEvents = events.filter(e => e.resource_type === 'user');
    const dataAccessEvents = events.filter(e => 
      ['company_search', 'company_view', 'officer_view', 'psc_view'].includes(e.action)
    );
    const aiEvents = events.filter(e => e.action.startsWith('ai_'));
    const securityEvents = events.filter(e => 
      ['rate_limit_exceeded', 'login'].includes(e.action) && !e.success
    );
    const gdprEvents = events.filter(e => 
      ['gdpr_request', 'data_deletion'].includes(e.action)
    );

    // Generate report
    const report: ComplianceReport = {
      report_id: reportId,
      generated_at: new Date().toISOString(),
      period: { start: startDate, end: endDate },
      user_activity: {
        total_users: new Set(events.map(e => e.user_id)).size,
        active_users: new Set(dataAccessEvents.map(e => e.user_id)).size,
        new_users: userEvents.filter(e => e.action === 'signup').length,
        deleted_users: userEvents.filter(e => e.action === 'user_delete').length
      },
      data_access: {
        companies_accessed: new Set(
          dataAccessEvents
            .filter(e => e.resource_type === 'company')
            .map(e => e.resource_id)
        ).size,
        searches_performed: dataAccessEvents.filter(e => e.action === 'company_search').length,
        reports_generated: events.filter(e => e.action === 'report_generate').length,
        exports_created: events.filter(e => e.action.includes('export')).length
      },
      ai_usage: {
        analyses_requested: aiEvents.filter(e => e.action === 'ai_analysis_request').length,
        tokens_consumed: aiEvents.reduce((sum, e) => sum + (e.details.tokens_used || 0), 0),
        cost_incurred: aiEvents.reduce((sum, e) => sum + (e.details.cost_usd || 0), 0)
      },
      security_events: {
        failed_logins: securityEvents.filter(e => e.action === 'login').length,
        rate_limit_violations: securityEvents.filter(e => e.action === 'rate_limit_exceeded').length,
        suspicious_activities: securityEvents.filter(e => e.details.requires_review).length
      },
      gdpr_compliance: {
        data_requests: gdprEvents.filter(e => e.action === 'gdpr_request').length,
        deletions_processed: gdprEvents.filter(e => e.action === 'data_deletion').length,
        consent_updates: userEvents.filter(e => e.action === 'profile_update').length
      }
    };

    // Log the compliance report generation
    await this.logEvent({
      user_id: 'system',
      action: 'compliance_check',
      resource_type: 'compliance_record',
      resource_id: reportId,
      details: {
        period: report.period,
        total_events_analyzed: events.length
      },
      success: true
    });

    return report;
  }

  /**
   * Get user's AI costs for budget tracking
   */
  private async getUserAICosts(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('details')
      .eq('user_id', userId)
      .eq('action', 'ai_cost_tracking')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) return 0;

    return data.reduce((sum, log) => sum + (log.details.cost_usd || 0), 0);
  }

  /**
   * Fallback logging to file system
   */
  private logToFile(event: Partial<AuditEvent>): void {
    // In production, this would write to a log file or external logging service
    console.log('AUDIT_LOG:', JSON.stringify(event));
  }

  /**
   * Cleanup old audit logs (data retention)
   */
  async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const { count, error } = await this.supabase
      .from('audit_logs')
      .delete({ count: 'exact' })
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      throw new Error(`Failed to cleanup old logs: ${error.message}`);
    }

    // Log the cleanup activity
    await this.logEvent({
      user_id: 'system',
      action: 'data_deletion',
      resource_type: 'audit_logs',
      details: {
        retention_days: retentionDays,
        records_deleted: count || 0,
        cutoff_date: cutoffDate.toISOString()
      },
      success: true
    });

    return count || 0;
  }
}

export const auditLogger = AuditLogger.getInstance();
export type { 
  AuditEvent, 
  AuditAction, 
  ResourceType, 
  AuditQuery, 
  AuditSummary, 
  ComplianceReport 
};