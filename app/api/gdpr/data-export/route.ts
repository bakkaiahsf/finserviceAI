// GDPR Article 15: Right of Access - Data Export API
// /api/gdpr/data-export

import { NextRequest, NextResponse } from 'next/server';
import { gdprManager, type GDPRDataExportRequest } from '@/lib/gdpr/gdpr-compliance';
import { auditLogger } from '@/lib/audit/audit-logger';

interface DataExportRequestBody {
  user_id: string;
  request_type?: 'full_export' | 'specific_data' | 'data_summary';
  data_categories?: string[];
  format?: 'json' | 'csv' | 'pdf';
  include_metadata?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: DataExportRequestBody = await request.json();
    const sessionId = request.headers.get('x-session-id') || 'gdpr-export-session';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

    // Validate required fields
    if (!body.user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prepare GDPR export request
    const exportRequest: GDPRDataExportRequest = {
      user_id: body.user_id,
      request_type: body.request_type || 'full_export',
      data_categories: body.data_categories as any,
      format: body.format || 'json',
      include_metadata: body.include_metadata || true,
      session_id: sessionId
    };

    // Log the GDPR request initiation
    await auditLogger.logEvent({
      user_id: body.user_id,
      action: 'gdpr_request',
      resource_type: 'user',
      resource_id: body.user_id,
      details: {
        request_type: 'data_export_initiated',
        format: exportRequest.format,
        categories: exportRequest.data_categories?.join(',') || 'all',
        gdpr_article: 'Article 15 - Right of Access',
        compliance_trigger: 'user_request'
      },
      ip_address: clientIP,
      user_agent: userAgent,
      session_id: sessionId,
      success: true
    });

    // Process the data export
    const exportResult = await gdprManager.requestDataExport(exportRequest);

    // Log successful completion
    await auditLogger.logEvent({
      user_id: body.user_id,
      action: 'data_export',
      resource_type: 'export',
      resource_id: exportResult.export_id,
      details: {
        export_completed: true,
        record_count: exportResult.record_count,
        format: exportResult.format,
        size_category: exportResult.record_count > 1000 ? 'large' : 'standard',
        retention_expires: exportResult.retention_expires_at,
        gdpr_compliance: 'Article 15 fulfilled'
      },
      ip_address: clientIP,
      session_id: sessionId,
      success: true,
      duration_ms: Date.now() - Date.parse(exportResult.generated_at)
    });

    return NextResponse.json({
      success: true,
      export: {
        export_id: exportResult.export_id,
        generated_at: exportResult.generated_at,
        format: exportResult.format,
        record_count: exportResult.record_count,
        data_categories: exportResult.data_categories,
        retention_expires_at: exportResult.retention_expires_at,
        download_available: true
      },
      data: exportResult.data,
      compliance: {
        gdpr_article: 'Article 15 - Right of Access',
        legal_basis: 'User data subject rights request',
        retention_period: '30 days from generation',
        data_controller: 'Nexus AI Platform'
      }
    });

  } catch (error) {
    console.error('GDPR data export error:', error);

    // Log the error
    try {
      const body = await request.json();
      await auditLogger.logEvent({
        user_id: body.user_id || 'unknown',
        action: 'gdpr_request',
        resource_type: 'user',
        resource_id: body.user_id || 'unknown',
        details: {
          request_type: 'data_export_failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          gdpr_article: 'Article 15 - Right of Access'
        },
        success: false,
        error_message: error instanceof Error ? error.message : 'Export processing failed'
      });
    } catch (logError) {
      console.error('Failed to log GDPR export error:', logError);
    }

    return NextResponse.json(
      { 
        error: 'Data export request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        compliance_note: 'GDPR Article 15 request could not be fulfilled due to technical error'
      },
      { status: 500 }
    );
  }
}