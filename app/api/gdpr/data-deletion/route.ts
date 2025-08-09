// GDPR Article 17: Right to Erasure (Right to be Forgotten) API
// /api/gdpr/data-deletion

import { NextRequest, NextResponse } from 'next/server';
import { gdprManager, type GDPRDataDeletionRequest } from '@/lib/gdpr/gdpr-compliance';
import { auditLogger } from '@/lib/audit/audit-logger';

interface DataDeletionRequestBody {
  user_id: string;
  deletion_type?: 'soft_delete' | 'hard_delete' | 'anonymize';
  retain_legal_data?: boolean;
  deletion_reason: string;
  confirmation_token?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DataDeletionRequestBody = await request.json();
    const sessionId = request.headers.get('x-session-id') || 'gdpr-deletion-session';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

    // Validate required fields
    if (!body.user_id || !body.deletion_reason) {
      return NextResponse.json(
        { error: 'User ID and deletion reason are required' },
        { status: 400 }
      );
    }

    // Validate deletion reason meets GDPR requirements
    const validReasons = [
      'withdrawal_of_consent',
      'data_no_longer_necessary',
      'unlawful_processing',
      'legal_compliance',
      'user_request'
    ];

    if (!validReasons.some(reason => body.deletion_reason.includes(reason))) {
      return NextResponse.json(
        { 
          error: 'Invalid deletion reason',
          valid_reasons: validReasons,
          gdpr_note: 'Article 17 requires valid grounds for erasure'
        },
        { status: 400 }
      );
    }

    // Prepare GDPR deletion request
    const deletionRequest: GDPRDataDeletionRequest = {
      user_id: body.user_id,
      deletion_type: body.deletion_type || 'anonymize', // Default to anonymize for compliance
      retain_legal_data: body.retain_legal_data !== false, // Default to retaining legal data
      deletion_reason: body.deletion_reason,
      session_id: sessionId
    };

    // Log the GDPR deletion request initiation
    await auditLogger.logEvent({
      user_id: body.user_id,
      action: 'gdpr_request',
      resource_type: 'user',
      resource_id: body.user_id,
      details: {
        request_type: 'data_deletion_initiated',
        deletion_type: deletionRequest.deletion_type,
        retain_legal_data: deletionRequest.retain_legal_data,
        reason: deletionRequest.deletion_reason,
        gdpr_article: 'Article 17 - Right to Erasure',
        compliance_trigger: 'user_request'
      },
      ip_address: clientIP,
      user_agent: userAgent,
      session_id: sessionId,
      success: true,
      severity: 'warning' // Deletion requests are significant events
    });

    // Process the data deletion
    const deletionResult = await gdprManager.requestDataDeletion(deletionRequest);

    // Log successful completion
    await auditLogger.logEvent({
      user_id: body.user_id,
      action: 'data_deletion',
      resource_type: 'user',
      resource_id: deletionResult.deletion_id,
      details: {
        deletion_completed: true,
        records_affected: deletionResult.records_affected,
        completion_status: deletionResult.completion_status,
        retained_data_categories: deletionResult.retained_data || [],
        gdpr_compliance: 'Article 17 fulfilled',
        legal_basis: deletionRequest.retain_legal_data ? 'Legal obligation retention' : 'User right to erasure'
      },
      ip_address: clientIP,
      session_id: sessionId,
      success: true,
      severity: 'critical' // Data deletion is a critical security event
    });

    return NextResponse.json({
      success: true,
      deletion: {
        deletion_id: deletionResult.deletion_id,
        completion_status: deletionResult.completion_status,
        records_affected: deletionResult.records_affected,
        retained_data_categories: deletionResult.retained_data || [],
        processed_at: new Date().toISOString()
      },
      compliance: {
        gdpr_article: 'Article 17 - Right to Erasure',
        legal_basis: deletionRequest.retain_legal_data 
          ? 'Erasure with legal data retention under Art. 17(3)' 
          : 'Complete erasure under Art. 17(1)',
        retention_note: deletionRequest.retain_legal_data 
          ? 'Some data retained for legal compliance (tax, audit records)' 
          : 'All personal data erased',
        data_controller: 'Nexus AI Platform'
      },
      next_steps: {
        verification_period: '30 days',
        appeal_process: 'Contact data protection officer if needed',
        confirmation_available: true
      }
    });

  } catch (error) {
    console.error('GDPR data deletion error:', error);

    // Log the error
    try {
      const body = await request.json();
      await auditLogger.logEvent({
        user_id: body.user_id || 'unknown',
        action: 'gdpr_request',
        resource_type: 'user',
        resource_id: body.user_id || 'unknown',
        details: {
          request_type: 'data_deletion_failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          gdpr_article: 'Article 17 - Right to Erasure'
        },
        success: false,
        error_message: error instanceof Error ? error.message : 'Deletion processing failed',
        severity: 'critical'
      });
    } catch (logError) {
      console.error('Failed to log GDPR deletion error:', logError);
    }

    return NextResponse.json(
      { 
        error: 'Data deletion request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        compliance_note: 'GDPR Article 17 request could not be fulfilled due to technical error',
        support_contact: 'Contact system administrator for manual processing'
      },
      { status: 500 }
    );
  }
}