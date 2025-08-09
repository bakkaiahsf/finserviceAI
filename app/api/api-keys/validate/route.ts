// API Key Validation and Rate Limiting Endpoint
// /api/api-keys/validate - Enterprise security by supreme developer

import { NextRequest, NextResponse } from 'next/server';
import { apiManager, type APIScope } from '@/lib/api-keys/enterprise-api-manager';
import { auditLogger } from '@/lib/audit/audit-logger';

interface ValidateAPIKeyBody {
  api_key: string;
  required_scopes?: APIScope[];
  endpoint?: string;
}

interface RateLimitCheckBody {
  api_key: string;
  endpoint: string;
}

// POST - Validate API key and check permissions
export async function POST(request: NextRequest) {
  try {
    const body: ValidateAPIKeyBody = await request.json();
    const sessionId = request.headers.get('x-session-id') || 'api-validation-session';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

    if (!body.api_key) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Validate the API key
    const validation = await apiManager.validateAPIKey(
      body.api_key, 
      body.required_scopes || []
    );

    if (!validation.valid) {
      // Log failed validation attempt
      await auditLogger.logEvent({
        user_id: validation.user_id || 'unknown',
        action: 'api_key_validation_failed',
        resource_type: 'api_key',
        resource_id: body.api_key.substring(0, 20) + '...',
        details: {
          validation_failed: true,
          error: validation.error,
          required_scopes: body.required_scopes || [],
          endpoint: body.endpoint,
          security_event: true
        },
        ip_address: clientIP,
        user_agent: userAgent,
        session_id: sessionId,
        success: false,
        severity: 'warning'
      });

      return NextResponse.json(
        { 
          valid: false,
          error: validation.error,
          authentication_failed: true
        },
        { status: 401 }
      );
    }

    // Check rate limits if endpoint is provided
    let rateLimitResult = null;
    if (body.endpoint) {
      rateLimitResult = await apiManager.checkRateLimit(
        body.api_key,
        body.endpoint,
        clientIP
      );

      if (!rateLimitResult.allowed) {
        // Log rate limit violation
        await auditLogger.logEvent({
          user_id: validation.user_id!,
          action: 'rate_limit_exceeded',
          resource_type: 'api_key',
          resource_id: validation.key_info!.key_id,
          details: {
            rate_limit_exceeded: true,
            limit_type: rateLimitResult.limit_type,
            endpoint: body.endpoint,
            retry_after: rateLimitResult.retry_after,
            security_event: true
          },
          ip_address: clientIP,
          session_id: sessionId,
          success: false,
          severity: 'warning'
        });

        return NextResponse.json(
          {
            valid: true,
            rate_limited: true,
            rate_limit_info: rateLimitResult,
            message: `Rate limit exceeded: ${rateLimitResult.limit_type}`
          },
          { status: 429 }
        );
      }
    }

    // Log successful validation
    await auditLogger.logEvent({
      user_id: validation.user_id!,
      action: 'api_key_validated',
      resource_type: 'api_key',
      resource_id: validation.key_info!.key_id,
      details: {
        validation_successful: true,
        scopes_checked: body.required_scopes || [],
        endpoint_accessed: body.endpoint,
        rate_limit_status: rateLimitResult?.allowed ? 'within_limits' : 'not_checked'
      },
      ip_address: clientIP,
      session_id: sessionId,
      success: true
    });

    return NextResponse.json({
      valid: true,
      user_id: validation.user_id,
      key_info: {
        key_id: validation.key_info!.key_id,
        name: validation.key_info!.name,
        scopes: validation.key_info!.scopes,
        status: validation.key_info!.status,
        expires_at: validation.key_info!.expires_at
      },
      rate_limit_info: rateLimitResult,
      permissions: {
        granted_scopes: validation.key_info!.scopes,
        has_required_permissions: true,
        admin_access: validation.key_info!.scopes.includes('admin:all')
      }
    });

  } catch (error) {
    console.error('API key validation error:', error);

    return NextResponse.json(
      { 
        valid: false,
        error: 'API key validation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Quick rate limit check
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('api_key');
    const endpoint = searchParams.get('endpoint');
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

    if (!apiKey || !endpoint) {
      return NextResponse.json(
        { error: 'API key and endpoint are required' },
        { status: 400 }
      );
    }

    // Check rate limits
    const rateLimitResult = await apiManager.checkRateLimit(apiKey, endpoint, clientIP);

    return NextResponse.json({
      rate_limit_status: rateLimitResult.allowed ? 'allowed' : 'exceeded',
      rate_limit_info: rateLimitResult,
      quota_info: {
        remaining_requests: rateLimitResult.remaining_requests,
        reset_time: rateLimitResult.reset_time,
        limit_type: rateLimitResult.limit_type
      }
    });

  } catch (error) {
    console.error('Rate limit check error:', error);

    return NextResponse.json(
      { 
        error: 'Rate limit check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}