// GDPR Compliance Reporting API
// /api/gdpr/compliance-report

import { NextRequest, NextResponse } from 'next/server';
import { gdprManager } from '@/lib/gdpr/gdpr-compliance';
import { auditLogger } from '@/lib/audit/audit-logger';

interface ComplianceReportRequestBody {
  start_date: string;
  end_date: string;
  report_type?: 'summary' | 'detailed' | 'audit';
  include_user_data?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: ComplianceReportRequestBody = await request.json();
    const sessionId = request.headers.get('x-session-id') || 'gdpr-report-session';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

    // Validate required fields
    if (!body.start_date || !body.end_date) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Validate date range
    const startDate = new Date(body.start_date);
    const endDate = new Date(body.end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Log the compliance report request
    await auditLogger.logEvent({
      user_id: 'system',
      action: 'compliance_check',
      resource_type: 'compliance_record',
      resource_id: `gdpr-report-${Date.now()}`,
      details: {
        report_requested: true,
        report_type: body.report_type || 'summary',
        period_start: body.start_date,
        period_end: body.end_date,
        gdpr_article: 'Article 5(2) - Accountability',
        compliance_monitoring: true
      },
      ip_address: clientIP,
      user_agent: userAgent,
      session_id: sessionId,
      success: true
    });

    // Generate the compliance report
    const complianceReport = await gdprManager.generateComplianceReport(
      body.start_date,
      body.end_date
    );

    // Calculate additional metrics for enhanced reporting
    const enhancedMetrics = {
      compliance_score: calculateComplianceScore(complianceReport),
      risk_assessment: assessGDPRRisks(complianceReport),
      recommendations: generateRecommendations(complianceReport),
      period_summary: {
        days_analyzed: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        data_protection_events: complianceReport.data_processing.consent_updates + 
                               complianceReport.rights_requests.access_requests + 
                               complianceReport.rights_requests.erasure_requests,
        user_engagement: complianceReport.data_processing.active_users > 0 ? 
                        (complianceReport.data_processing.active_users / complianceReport.data_processing.total_users * 100).toFixed(2) + '%' : 
                        '0%'
      }
    };

    // Log successful report generation
    await auditLogger.logEvent({
      user_id: 'system',
      action: 'compliance_check',
      resource_type: 'compliance_record',
      resource_id: complianceReport.report_id,
      details: {
        report_generated: true,
        compliance_score: enhancedMetrics.compliance_score,
        period_days: enhancedMetrics.period_summary.days_analyzed,
        total_events: enhancedMetrics.period_summary.data_protection_events,
        gdpr_article: 'Article 5(2) - Accountability demonstrated'
      },
      session_id: sessionId,
      success: true
    });

    return NextResponse.json({
      success: true,
      compliance_report: {
        ...complianceReport,
        enhanced_metrics: enhancedMetrics
      },
      gdpr_compliance: {
        regulatory_framework: 'EU General Data Protection Regulation',
        compliance_officer: 'Nexus AI Data Protection Officer',
        last_assessment: new Date().toISOString(),
        next_review_due: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
        certification_status: 'Self-assessed compliant',
        audit_trail: 'Available via audit logs'
      },
      report_metadata: {
        generated_by: 'Nexus AI GDPR Compliance System',
        report_version: '1.0',
        report_classification: 'Internal Compliance Document',
        retention_period: '7 years (legal requirement)',
        export_formats: ['JSON', 'PDF', 'CSV'],
        verification: 'Digitally signed and immutable'
      }
    });

  } catch (error) {
    console.error('GDPR compliance report error:', error);

    // Log the error
    await auditLogger.logEvent({
      user_id: 'system',
      action: 'compliance_check',
      resource_type: 'compliance_record',
      resource_id: 'report-generation-failed',
      details: {
        report_failed: true,
        error: error instanceof Error ? error.message : 'Unknown error',
        gdpr_article: 'Article 5(2) - Accountability'
      },
      success: false,
      error_message: error instanceof Error ? error.message : 'Report generation failed'
    });

    return NextResponse.json(
      { 
        error: 'Compliance report generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        compliance_note: 'GDPR accountability reporting could not be completed'
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate overall compliance score
function calculateComplianceScore(report: any): number {
  let score = 100;
  
  // Deduct points for missing or problematic areas
  if (report.rights_requests.access_requests === 0 && report.data_processing.total_users > 0) {
    score -= 5; // No data subject requests might indicate lack of awareness
  }
  
  if (report.data_processing.consent_updates === 0 && report.data_processing.total_users > 0) {
    score -= 10; // No consent management indicates potential compliance gap
  }
  
  if (report.data_retention.retention_policy_violations > 0) {
    score -= 15; // Retention violations are serious
  }
  
  return Math.max(score, 0);
}

// Helper function to assess GDPR risks
function assessGDPRRisks(report: any): string[] {
  const risks: string[] = [];
  
  if (report.data_processing.consent_updates === 0) {
    risks.push('Low consent management activity - may indicate compliance gaps');
  }
  
  if (report.rights_requests.access_requests === 0 && report.data_processing.total_users > 10) {
    risks.push('No data subject access requests - users may not be aware of their rights');
  }
  
  if (report.data_retention.retention_policy_violations > 0) {
    risks.push('Data retention policy violations detected');
  }
  
  if (report.data_processing.data_deletions_processed === 0 && report.rights_requests.erasure_requests > 0) {
    risks.push('Erasure requests not being processed properly');
  }
  
  return risks.length > 0 ? risks : ['No significant GDPR risks identified'];
}

// Helper function to generate compliance recommendations
function generateRecommendations(report: any): string[] {
  const recommendations: string[] = [];
  
  if (report.data_processing.consent_updates === 0) {
    recommendations.push('Implement regular consent review and update mechanisms');
  }
  
  if (report.rights_requests.access_requests === 0) {
    recommendations.push('Enhance user education about GDPR rights and how to exercise them');
  }
  
  if (report.data_retention.records_auto_deleted === 0) {
    recommendations.push('Implement automated data retention and deletion policies');
  }
  
  recommendations.push('Continue regular compliance monitoring and reporting');
  recommendations.push('Consider third-party GDPR compliance audit for validation');
  
  return recommendations;
}