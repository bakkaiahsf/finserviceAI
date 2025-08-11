// GDPR Consent Management API
// /api/gdpr/consent

import { NextRequest, NextResponse } from 'next/server';
import { gdprManager, type GDPRConsentRecord } from '@/lib/gdpr/gdpr-compliance';
import { auditLogger } from '@/lib/audit/audit-logger';

interface ConsentRequestBody {
  user_id: string;
  consent_type: 'data_processing' | 'marketing_communications' | 'analytics_tracking' | 'third_party_sharing' | 'ai_analysis' | 'data_retention';
  consent_given: boolean;
  consent_version: string;
  consent_method?: 'explicit' | 'implied' | 'updated';
}

interface ConsentWithdrawalBody {
  user_id: string;
  consent_types: string[];
  withdrawal_reason?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ConsentRequestBody = await request.json();
    const sessionId = request.headers.get('x-session-id') || 'gdpr-consent-session';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

    // Validate required fields
    if (!body.user_id || !body.consent_type || body.consent_given === undefined || !body.consent_version) {
      return NextResponse.json(
        { error: 'User ID, consent type, consent decision, and version are required' },
        { status: 400 }
      );
    }

    // Prepare GDPR consent record
    const consentRecord: GDPRConsentRecord = {
      user_id: body.user_id,
      consent_type: body.consent_type as any,
      consent_given: body.consent_given,
      consent_version: body.consent_version,
      consent_timestamp: new Date().toISOString(),
      consent_method: body.consent_method || 'explicit',
      ip_address: clientIP,
      user_agent: userAgent
    };

    // Record the consent
    await gdprManager.recordConsent(consentRecord);

    // Additional audit logging for consent management
    await auditLogger.logEvent({
      user_id: body.user_id,
      action: 'consent_update',
      resource_type: 'user',
      resource_id: body.user_id,
      details: {
        consent_action: body.consent_given ? 'granted' : 'withdrawn',
        consent_type: body.consent_type,
        consent_version: body.consent_version,
        consent_method: consentRecord.consent_method,
        gdpr_article: 'Article 6(1)(a) - Consent',
        legal_basis: 'Explicit user consent',
        compliance_verified: true
      },
      ip_address: clientIP,
      user_agent: userAgent,
      session_id: sessionId,
      success: true,
    });

    return NextResponse.json({
      success: true,
      consent: {
        user_id: body.user_id,
        consent_type: body.consent_type,
        consent_given: body.consent_given,
        consent_timestamp: consentRecord.consent_timestamp,
        consent_version: body.consent_version,
        consent_method: consentRecord.consent_method
      },
      compliance: {
        gdpr_article: 'Article 6(1)(a) - Consent',
        legal_basis: body.consent_given ? 'Consent granted' : 'Consent withdrawn',
        withdrawal_rights: 'Consent can be withdrawn at any time',
        data_controller: 'Nexus AI Platform'
      },
      next_steps: body.consent_given ? {
        data_processing: 'Will begin according to privacy policy',
        opt_out: 'Can be withdrawn at any time via account settings'
      } : {
        data_processing: 'Will cease for this specific purpose',
        existing_data: 'May be retained under other legal bases',
        reactivation: 'Can be re-granted at any time'
      }
    });

  } catch (error) {
    console.error('GDPR consent management error:', error);

    // Log the error
    try {
      const body = await request.json();
      await auditLogger.logEvent({
        user_id: body.user_id || 'unknown',
        action: 'consent_update',
        resource_type: 'user',
        resource_id: body.user_id || 'unknown',
        details: {
          consent_action: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          gdpr_article: 'Article 6(1)(a) - Consent'
        },
        success: false,
        error_message: error instanceof Error ? error.message : 'Consent processing failed',
      });
    } catch (logError) {
      console.error('Failed to log GDPR consent error:', logError);
    }

    return NextResponse.json(
      { 
        error: 'Consent management request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        compliance_note: 'GDPR consent requirements could not be processed due to technical error'
      },
      { status: 500 }
    );
  }
}

// Handle consent withdrawal requests
export async function DELETE(request: NextRequest) {
  try {
    const body: ConsentWithdrawalBody = await request.json();
    const sessionId = request.headers.get('x-session-id') || 'gdpr-withdrawal-session';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

    if (!body.user_id || !body.consent_types || body.consent_types.length === 0) {
      return NextResponse.json(
        { error: 'User ID and consent types are required for withdrawal' },
        { status: 400 }
      );
    }

    // Process withdrawal for each consent type
    const withdrawalResults = [];
    
    for (const consentType of body.consent_types) {
      const consentRecord: GDPRConsentRecord = {
        user_id: body.user_id,
        consent_type: consentType as any,
        consent_given: false,
        consent_version: '1.0', // Would track actual version
        consent_timestamp: new Date().toISOString(),
        consent_method: 'explicit',
        ip_address: clientIP,
        user_agent: userAgent
      };

      await gdprManager.recordConsent(consentRecord);
      withdrawalResults.push({
        consent_type: consentType,
        withdrawn_at: consentRecord.consent_timestamp,
        status: 'withdrawn'
      });
    }

    // Log the mass withdrawal
    await auditLogger.logEvent({
      user_id: body.user_id,
      action: 'consent_update',
      resource_type: 'user',
      resource_id: body.user_id,
      details: {
        consent_action: 'mass_withdrawal',
        consent_types_withdrawn: body.consent_types,
        withdrawal_reason: body.withdrawal_reason || 'user_request',
        gdpr_article: 'Article 7(3) - Right to withdraw consent',
        legal_basis: 'User right to withdraw consent',
        compliance_verified: true
      },
      ip_address: clientIP,
      user_agent: userAgent,
      session_id: sessionId,
      success: true,
    });

    return NextResponse.json({
      success: true,
      withdrawal: {
        user_id: body.user_id,
        withdrawn_consents: withdrawalResults,
        withdrawal_timestamp: new Date().toISOString(),
        withdrawal_reason: body.withdrawal_reason || 'user_request'
      },
      compliance: {
        gdpr_article: 'Article 7(3) - Right to withdraw consent',
        legal_basis: 'User withdrawal of consent',
        effect: 'Data processing will cease for withdrawn purposes',
        data_controller: 'Nexus AI Platform'
      },
      data_processing_impact: {
        immediate_effect: 'Processing stops for withdrawn consent types',
        existing_data: 'May be retained under other legal bases',
        service_impact: 'Some features may become unavailable',
        reactivation: 'Consent can be re-granted at any time'
      }
    });

  } catch (error) {
    console.error('GDPR consent withdrawal error:', error);
    
    return NextResponse.json(
      { 
        error: 'Consent withdrawal request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        compliance_note: 'GDPR consent withdrawal could not be processed'
      },
      { status: 500 }
    );
  }
}