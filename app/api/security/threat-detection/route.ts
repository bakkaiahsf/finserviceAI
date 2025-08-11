// Advanced Security Threat Detection API
// /api/security/threat-detection

import { NextRequest, NextResponse } from 'next/server';
import { securityMonitor } from '@/lib/security/advanced-security-monitor';
import { auditLogger } from '@/lib/audit/audit-logger';

interface ThreatDetectionRequest {
  time_window_hours?: number;
  include_system_threats?: boolean;
  minimum_risk_score?: number;
  threat_types?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ThreatDetectionRequest = await request.json();
    const sessionId = request.headers.get('x-session-id') || 'security-scan-session';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

    // Set default parameters
    const timeWindowHours = body.time_window_hours || 1;
    const includeSystemThreats = body.include_system_threats !== false;
    const minimumRiskScore = body.minimum_risk_score || 0;

    // Log security scan initiation
    await auditLogger.logEvent({
      user_id: 'security-system',
      action: 'security_scan_initiated',
      resource_type: 'security_system',
      resource_id: 'threat_detection',
      details: {
        scan_type: 'threat_detection',
        time_window_hours: timeWindowHours,
        minimum_risk_score: minimumRiskScore,
        include_system_threats: includeSystemThreats,
        initiated_by: 'api_request'
      },
      ip_address: clientIP,
      user_agent: userAgent,
      session_id: sessionId,
      success: true,
    });

    // Perform threat detection
    const detectedThreats = await securityMonitor.detectThreats(timeWindowHours);

    // Filter threats based on criteria
    let filteredThreats = detectedThreats.filter(threat => 
      threat.risk_score >= minimumRiskScore
    );

    if (!includeSystemThreats) {
      filteredThreats = filteredThreats.filter(threat => 
        threat.user_id !== 'system'
      );
    }

    if (body.threat_types && body.threat_types.length > 0) {
      filteredThreats = filteredThreats.filter(threat => 
        body.threat_types!.includes(threat.threat_type)
      );
    }

    // Generate security alerts for high-priority threats
    const securityAlerts = await securityMonitor.generateSecurityAlerts(
      filteredThreats.filter(threat => threat.severity_level === 'high' || threat.severity_level === 'critical')
    );

    // Calculate threat statistics
    const threatStats = {
      total_threats: filteredThreats.length,
      by_severity: {
        critical: filteredThreats.filter(t => t.severity_level === 'critical').length,
        high: filteredThreats.filter(t => t.severity_level === 'high').length,
        medium: filteredThreats.filter(t => t.severity_level === 'medium').length,
        low: filteredThreats.filter(t => t.severity_level === 'low').length,
        info: filteredThreats.filter(t => t.severity_level === 'info').length
      },
      by_type: filteredThreats.reduce((acc, threat) => {
        acc[threat.threat_type] = (acc[threat.threat_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      average_risk_score: filteredThreats.length > 0 
        ? filteredThreats.reduce((sum, t) => sum + t.risk_score, 0) / filteredThreats.length 
        : 0,
      highest_risk_score: filteredThreats.length > 0 
        ? Math.max(...filteredThreats.map(t => t.risk_score)) 
        : 0
    };

    // Log successful threat detection completion
    await auditLogger.logEvent({
      user_id: 'security-system',
      action: 'security_scan_complete',
      resource_type: 'security_system',
      resource_id: 'threat_detection',
      details: {
        scan_completed: true,
        threats_detected: filteredThreats.length,
        alerts_generated: securityAlerts.length,
        highest_risk_score: threatStats.highest_risk_score,
        critical_threats: threatStats.by_severity.critical,
        scan_duration_hours: timeWindowHours,
        system_security_status: threatStats.by_severity.critical > 0 ? 'high_risk' : 
                               threatStats.by_severity.high > 0 ? 'medium_risk' : 'secure'
      },
      ip_address: clientIP,
      session_id: sessionId,
      success: true
    });

    return NextResponse.json({
      success: true,
      scan_results: {
        scan_timestamp: new Date().toISOString(),
        time_window_hours: timeWindowHours,
        threats_detected: filteredThreats,
        threat_statistics: threatStats,
        security_alerts: securityAlerts,
        scan_parameters: {
          minimum_risk_score: minimumRiskScore,
          include_system_threats: includeSystemThreats,
          threat_types_filter: body.threat_types || 'all'
        }
      },
      security_assessment: {
        overall_risk_level: threatStats.by_severity.critical > 0 ? 'critical' :
                           threatStats.by_severity.high > 0 ? 'high' :
                           threatStats.by_severity.medium > 0 ? 'medium' : 'low',
        immediate_action_required: threatStats.by_severity.critical > 0 || securityAlerts.length > 0,
        recommended_actions: generateRecommendations(threatStats, securityAlerts),
        next_scan_recommended: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
      }
    });

  } catch (error) {
    console.error('Security threat detection error:', error);

    // Log the security scan failure
    try {
      await auditLogger.logEvent({
        user_id: 'security-system',
        action: 'security_scan_complete',
        resource_type: 'security_system',
        resource_id: 'threat_detection',
        details: {
          scan_failed: true,
          error: error instanceof Error ? error.message : 'Unknown error',
          security_system_status: 'impaired'
        },
        success: false,
        error_message: error instanceof Error ? error.message : 'Security scan failed',
      });
    } catch (logError) {
      console.error('Failed to log security scan error:', logError);
    }

    return NextResponse.json(
      { 
        error: 'Security threat detection failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        security_note: 'Security monitoring may be compromised - manual review required'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for quick security status check
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'security-status-session';
    
    // Quick 15-minute security scan
    const recentThreats = await securityMonitor.detectThreats(0.25); // 15 minutes
    const securityMetrics = await securityMonitor.calculateSecurityMetrics(1); // 1 day
    
    const criticalThreats = recentThreats.filter(t => t.severity_level === 'critical').length;
    const highThreats = recentThreats.filter(t => t.severity_level === 'high').length;
    
    return NextResponse.json({
      security_status: {
        overall_status: criticalThreats > 0 ? 'critical' :
                       highThreats > 0 ? 'elevated' : 'secure',
        recent_threats: recentThreats.length,
        critical_threats: criticalThreats,
        high_risk_threats: highThreats,
        security_score: securityMetrics.security_score,
        last_scan: new Date().toISOString()
      },
      quick_metrics: {
        total_threats_24h: securityMetrics.total_threats_detected,
        threat_trend: securityMetrics.total_threats_detected > 10 ? 'increasing' : 
                     securityMetrics.total_threats_detected > 5 ? 'moderate' : 'low',
        system_health: 'operational'
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        security_status: {
          overall_status: 'unknown',
          error: 'Security status check failed'
        }
      },
      { status: 500 }
    );
  }
}

// Helper function to generate security recommendations
function generateRecommendations(stats: any, alerts: any[]): string[] {
  const recommendations: string[] = [];
  
  if (stats.by_severity.critical > 0) {
    recommendations.push('IMMEDIATE: Review and mitigate critical security threats');
    recommendations.push('Consider temporary service restrictions for affected accounts');
  }
  
  if (stats.by_severity.high > 0) {
    recommendations.push('HIGH PRIORITY: Investigate high-risk security events');
    recommendations.push('Review access controls and authentication mechanisms');
  }
  
  if (alerts.length > 0) {
    recommendations.push('Process all security alerts according to incident response plan');
  }
  
  if (stats.total_threats > 10) {
    recommendations.push('Consider implementing additional security controls');
    recommendations.push('Review and update security monitoring rules');
  }
  
  recommendations.push('Continue regular security monitoring and threat detection');
  
  return recommendations;
}