// PHASE 7.3: Comprehensive GDPR Compliance System
// Enterprise-grade data protection and privacy management for Nexus AI

import { createAdminSupabaseClient } from '@/lib/auth/supabase-client';
import { auditLogger } from '@/lib/audit/audit-logger';

interface GDPRDataExportRequest {
  user_id: string;
  request_type: 'full_export' | 'specific_data' | 'data_summary';
  data_categories?: DataCategory[];
  format: 'json' | 'csv' | 'pdf';
  include_metadata?: boolean;
  session_id?: string;
}

interface GDPRDataDeletionRequest {
  user_id: string;
  deletion_type: 'soft_delete' | 'hard_delete' | 'anonymize';
  retain_legal_data?: boolean;
  deletion_reason: string;
  session_id?: string;
}

interface GDPRConsentRecord {
  user_id: string;
  consent_type: ConsentType;
  consent_given: boolean;
  consent_version: string;
  consent_timestamp: string;
  consent_method: 'explicit' | 'implied' | 'updated';
  ip_address?: string;
  user_agent?: string;
}

type DataCategory = 
  | 'profile_data' | 'search_history' | 'ai_analysis_data' 
  | 'subscription_data' | 'usage_analytics' | 'audit_logs'
  | 'export_history' | 'network_data' | 'payment_data';

type ConsentType = 
  | 'data_processing' | 'marketing_communications' | 'analytics_tracking'
  | 'third_party_sharing' | 'ai_analysis' | 'data_retention';

interface UserDataExport {
  export_id: string;
  user_id: string;
  generated_at: string;
  data_categories: DataCategory[];
  format: string;
  file_size_bytes?: number;
  record_count: number;
  retention_expires_at: string;
  download_url?: string;
  data: {
    profile?: any;
    searches?: any[];
    ai_analyses?: any[];
    subscriptions?: any[];
    usage_data?: any[];
    audit_trails?: any[];
    exports?: any[];
    network_analyses?: any[];
  };
}

interface GDPRComplianceReport {
  report_id: string;
  generated_at: string;
  period: { start: string; end: string };
  data_processing: {
    total_users: number;
    active_users: number;
    data_exports_requested: number;
    data_deletions_processed: number;
    consent_updates: number;
  };
  legal_basis: {
    consent_based_processing: number;
    legitimate_interest_processing: number;
    contractual_processing: number;
    legal_obligation_processing: number;
  };
  data_retention: {
    records_auto_deleted: number;
    records_archived: number;
    retention_policy_violations: number;
  };
  rights_requests: {
    access_requests: number;
    rectification_requests: number;
    erasure_requests: number;
    portability_requests: number;
    objection_requests: number;
  };
}

class GDPRComplianceManager {
  private static instance: GDPRComplianceManager;
  private supabase = createAdminSupabaseClient();

  static getInstance(): GDPRComplianceManager {
    if (!GDPRComplianceManager.instance) {
      GDPRComplianceManager.instance = new GDPRComplianceManager();
    }
    return GDPRComplianceManager.instance;
  }

  /**
   * GDPR Article 15: Right of Access - Export user data
   */
  async requestDataExport(request: GDPRDataExportRequest): Promise<UserDataExport> {
    const exportId = `gdpr-export-${request.user_id}-${Date.now()}`;
    
    await auditLogger.logEvent({
      user_id: request.user_id,
      action: 'gdpr_request',
      resource_type: 'user',
      resource_id: request.user_id,
      details: {
        request_type: 'data_export',
        export_format: request.format,
        data_categories: request.data_categories || 'all',
        gdpr_article: 'Article 15 - Right of Access'
      },
      session_id: request.session_id,
      success: true
    });

    // Collect user data across all categories
    const userData: UserDataExport['data'] = {};

    try {
      // Profile and subscription data
      if (!request.data_categories || request.data_categories.includes('profile_data')) {
        const { data: quotas } = await this.supabase
          .from('user_quotas')
          .select('*')
          .eq('user_id', request.user_id);
        userData.profile = quotas?.[0] || null;
      }

      if (!request.data_categories || request.data_categories.includes('subscription_data')) {
        const { data: subscriptions } = await this.supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', request.user_id);
        userData.subscriptions = subscriptions || [];
      }

      // Audit logs and usage data
      if (!request.data_categories || request.data_categories.includes('audit_logs')) {
        const { data: auditLogs } = await this.supabase
          .from('audit_logs')
          .select('*')
          .eq('user_id', request.user_id)
          .order('created_at', { ascending: false })
          .limit(1000);
        userData.audit_trails = auditLogs || [];
      }

      // Search and AI analysis history
      if (!request.data_categories || request.data_categories.includes('search_history')) {
        const searchLogs = userData.audit_trails?.filter(log => 
          log.action === 'company_search' || log.action === 'company_view'
        ) || [];
        userData.searches = searchLogs;
      }

      if (!request.data_categories || request.data_categories.includes('ai_analysis_data')) {
        const aiLogs = userData.audit_trails?.filter(log => 
          log.action.startsWith('ai_')
        ) || [];
        userData.ai_analyses = aiLogs;
      }

      // Export and network data
      if (!request.data_categories || request.data_categories.includes('export_history')) {
        const exportLogs = userData.audit_trails?.filter(log => 
          log.action.includes('export') || log.action.includes('report')
        ) || [];
        userData.exports = exportLogs;
      }

      if (!request.data_categories || request.data_categories.includes('network_data')) {
        const networkLogs = userData.audit_trails?.filter(log => 
          log.action.includes('network')
        ) || [];
        userData.network_analyses = networkLogs;
      }

      // Calculate export metadata
      const recordCount = Object.values(userData).reduce((total, category) => {
        if (Array.isArray(category)) return total + category.length;
        if (category && typeof category === 'object') return total + 1;
        return total;
      }, 0);

      const exportData: UserDataExport = {
        export_id: exportId,
        user_id: request.user_id,
        generated_at: new Date().toISOString(),
        data_categories: request.data_categories || ['profile_data', 'audit_logs', 'subscription_data'],
        format: request.format,
        record_count: recordCount,
        retention_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        data: userData
      };

      // Log successful export
      await auditLogger.logEvent({
        user_id: request.user_id,
        action: 'data_export',
        resource_type: 'export',
        resource_id: exportId,
        details: {
          export_size: recordCount,
          format: request.format,
          categories: request.data_categories?.length || 'all',
          compliance: 'GDPR Article 15'
        },
        session_id: request.session_id,
        success: true
      });

      return exportData;

    } catch (error) {
      await auditLogger.logEvent({
        user_id: request.user_id,
        action: 'gdpr_request',
        resource_type: 'user',
        resource_id: request.user_id,
        details: {
          request_type: 'data_export_failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          gdpr_article: 'Article 15 - Right of Access'
        },
        session_id: request.session_id,
        success: false,
        error_message: error instanceof Error ? error.message : 'Export failed'
      });

      throw new Error(`GDPR data export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * GDPR Article 17: Right to Erasure (Right to be Forgotten)
   */
  async requestDataDeletion(request: GDPRDataDeletionRequest): Promise<{
    deletion_id: string;
    records_affected: number;
    completion_status: 'completed' | 'partial' | 'failed';
    retained_data?: string[];
  }> {
    const deletionId = `gdpr-deletion-${request.user_id}-${Date.now()}`;
    
    await auditLogger.logEvent({
      user_id: request.user_id,
      action: 'gdpr_request',
      resource_type: 'user',
      resource_id: request.user_id,
      details: {
        request_type: 'data_deletion',
        deletion_type: request.deletion_type,
        retain_legal_data: request.retain_legal_data || false,
        reason: request.deletion_reason,
        gdpr_article: 'Article 17 - Right to Erasure'
      },
      session_id: request.session_id,
      success: true
    });

    let recordsAffected = 0;
    const retainedData: string[] = [];

    try {
      if (request.deletion_type === 'soft_delete' || request.deletion_type === 'anonymize') {
        // Anonymize user data instead of hard delete
        const anonymizedId = `anon-${Date.now()}`;

        if (request.deletion_type === 'anonymize') {
          // Anonymize audit logs
          const { count: auditCount } = await this.supabase
            .from('audit_logs')
            .update({ 
              user_id: anonymizedId,
              ip_address: null,
              user_agent: null,
              details: {}
            })
            .eq('user_id', request.user_id);
          recordsAffected += auditCount || 0;

          // Remove personal identifiers from quotas/subscriptions if not retained
          if (!request.retain_legal_data) {
            const { count: quotaCount } = await this.supabase
              .from('user_quotas')
              .update({ user_id: anonymizedId })
              .eq('user_id', request.user_id);
            recordsAffected += quotaCount || 0;

            const { count: subCount } = await this.supabase
              .from('user_subscriptions')
              .update({ user_id: anonymizedId })
              .eq('user_id', request.user_id);
            recordsAffected += subCount || 0;
          } else {
            retainedData.push('subscription_data', 'billing_data');
          }
        }

      } else if (request.deletion_type === 'hard_delete') {
        // Hard delete - remove all user data
        if (!request.retain_legal_data) {
          // Delete audit logs
          const { count: auditCount } = await this.supabase
            .from('audit_logs')
            .delete()
            .eq('user_id', request.user_id);
          recordsAffected += auditCount || 0;

          // Delete quotas
          const { count: quotaCount } = await this.supabase
            .from('user_quotas')
            .delete()
            .eq('user_id', request.user_id);
          recordsAffected += quotaCount || 0;

          // Delete subscriptions (if legally allowed)
          const { count: subCount } = await this.supabase
            .from('user_subscriptions')
            .delete()
            .eq('user_id', request.user_id);
          recordsAffected += subCount || 0;
        } else {
          retainedData.push('financial_records', 'legal_compliance_data');
        }
      }

      // Log successful deletion
      await auditLogger.logEvent({
        user_id: request.user_id,
        action: 'data_deletion',
        resource_type: 'user',
        resource_id: deletionId,
        details: {
          deletion_type: request.deletion_type,
          records_affected: recordsAffected,
          retained_categories: retainedData,
          compliance: 'GDPR Article 17',
          legal_basis: request.retain_legal_data ? 'Legal obligation' : 'User request'
        },
        session_id: request.session_id,
        success: true
      });

      return {
        deletion_id: deletionId,
        records_affected: recordsAffected,
        completion_status: 'completed',
        retained_data: retainedData.length > 0 ? retainedData : undefined
      };

    } catch (error) {
      await auditLogger.logEvent({
        user_id: request.user_id,
        action: 'gdpr_request',
        resource_type: 'user',
        resource_id: request.user_id,
        details: {
          request_type: 'data_deletion_failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          gdpr_article: 'Article 17 - Right to Erasure'
        },
        session_id: request.session_id,
        success: false,
        error_message: error instanceof Error ? error.message : 'Deletion failed'
      });

      throw new Error(`GDPR data deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * GDPR Consent Management
   */
  async recordConsent(consent: GDPRConsentRecord): Promise<void> {
    try {
      // Store consent record (would typically be in a separate consent table)
      await auditLogger.logEvent({
        user_id: consent.user_id,
        action: 'consent_update',
        resource_type: 'user',
        resource_id: consent.user_id,
        details: {
          consent_type: consent.consent_type,
          consent_given: consent.consent_given,
          consent_version: consent.consent_version,
          consent_method: consent.consent_method,
          gdpr_compliance: true,
          legal_basis: 'Article 6(1)(a) - Consent'
        },
        ip_address: consent.ip_address,
        user_agent: consent.user_agent,
        success: true
      });

    } catch (error) {
      throw new Error(`Consent recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * GDPR Compliance Reporting
   */
  async generateComplianceReport(
    startDate: string,
    endDate: string
  ): Promise<GDPRComplianceReport> {
    const reportId = `gdpr-compliance-${Date.now()}`;

    try {
      // Get all GDPR-related audit logs for the period
      const { data: gdprLogs } = await this.supabase
        .from('audit_logs')
        .select('*')
        .in('action', ['gdpr_request', 'data_export', 'data_deletion', 'consent_update'])
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const logs = gdprLogs || [];

      // Calculate metrics
      const dataExports = logs.filter(l => l.action === 'data_export').length;
      const dataDeletions = logs.filter(l => l.action === 'data_deletion').length;
      const consentUpdates = logs.filter(l => l.action === 'consent_update').length;
      
      const accessRequests = logs.filter(l => 
        l.action === 'gdpr_request' && 
        l.details.request_type === 'data_export'
      ).length;

      const erasureRequests = logs.filter(l => 
        l.action === 'gdpr_request' && 
        l.details.request_type === 'data_deletion'
      ).length;

      // Get user statistics
      const { data: allUsers } = await this.supabase
        .from('user_quotas')
        .select('user_id, created_at');

      const totalUsers = allUsers?.length || 0;
      const activeUsers = new Set(logs.map(l => l.user_id)).size;

      const report: GDPRComplianceReport = {
        report_id: reportId,
        generated_at: new Date().toISOString(),
        period: { start: startDate, end: endDate },
        data_processing: {
          total_users: totalUsers,
          active_users: activeUsers,
          data_exports_requested: dataExports,
          data_deletions_processed: dataDeletions,
          consent_updates: consentUpdates
        },
        legal_basis: {
          consent_based_processing: consentUpdates,
          legitimate_interest_processing: 0, // Would need additional tracking
          contractual_processing: 0, // Would need additional tracking
          legal_obligation_processing: 0 // Would need additional tracking
        },
        data_retention: {
          records_auto_deleted: 0, // Would need retention policy implementation
          records_archived: 0,
          retention_policy_violations: 0
        },
        rights_requests: {
          access_requests: accessRequests,
          rectification_requests: 0, // Would need additional implementation
          erasure_requests: erasureRequests,
          portability_requests: dataExports, // Data export serves as portability
          objection_requests: 0 // Would need additional implementation
        }
      };

      // Log the compliance report generation
      await auditLogger.logEvent({
        user_id: 'system',
        action: 'compliance_check',
        resource_type: 'compliance_record',
        resource_id: reportId,
        details: {
          report_type: 'gdpr_compliance',
          period: report.period,
          total_events_analyzed: logs.length,
          compliance_metrics: report
        },
        success: true
      });

      return report;

    } catch (error) {
      throw new Error(`GDPR compliance report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Automated data retention cleanup
   */
  async performDataRetentionCleanup(retentionDays: number = 2555): Promise<{ // 7 years default
    deleted_records: number;
    anonymized_records: number;
    retained_records: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      // Find old audit logs for cleanup
      const { data: oldLogs } = await this.supabase
        .from('audit_logs')
        .select('id, user_id, action')
        .lt('created_at', cutoffDate.toISOString())
        .not('action', 'in', '(data_deletion,compliance_check,gdpr_request)'); // Retain compliance records

      const recordsToClean = oldLogs?.length || 0;

      // Anonymize old records instead of deleting (better for analytics)
      const { count: anonymizedCount } = await this.supabase
        .from('audit_logs')
        .update({ 
          user_id: 'anonymized',
          ip_address: null,
          user_agent: null
        })
        .lt('created_at', cutoffDate.toISOString())
        .not('action', 'in', '(data_deletion,compliance_check,gdpr_request)');

      // Log retention cleanup
      await auditLogger.logEvent({
        user_id: 'system',
        action: 'data_deletion',
        resource_type: 'user',
        resource_id: 'retention_cleanup',
        details: {
          cleanup_type: 'automated_retention',
          retention_days: retentionDays,
          records_anonymized: anonymizedCount || 0,
          cutoff_date: cutoffDate.toISOString(),
          gdpr_compliance: true
        },
        success: true
      });

      return {
        deleted_records: 0, // We anonymize instead of delete
        anonymized_records: anonymizedCount || 0,
        retained_records: recordsToClean - (anonymizedCount || 0)
      };

    } catch (error) {
      throw new Error(`Data retention cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const gdprManager = GDPRComplianceManager.getInstance();
export type { 
  GDPRDataExportRequest, 
  GDPRDataDeletionRequest, 
  GDPRConsentRecord,
  UserDataExport,
  GDPRComplianceReport,
  DataCategory,
  ConsentType 
};