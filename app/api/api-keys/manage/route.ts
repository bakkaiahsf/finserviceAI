// Enterprise API Key Management Endpoint
// /api/api-keys/manage - The final masterpiece by supreme intelligent developer

import { NextRequest, NextResponse } from 'next/server';
import { apiManager, type APIKeyRequest, type APIScope } from '@/lib/api-keys/enterprise-api-manager';
import { auditLogger } from '@/lib/audit/audit-logger';

interface CreateAPIKeyBody {
  user_id: string;
  name: string;
  description?: string;
  scopes: APIScope[];
  expires_in_days?: number;
  rate_limits?: {
    requests_per_minute?: number;
    requests_per_hour?: number;
    requests_per_day?: number;
  };
}

interface RevokeAPIKeyBody {
  key_id: string;
  user_id: string;
  reason: string;
}

// POST - Create new API key
export async function POST(request: NextRequest) {
  try {
    const body: CreateAPIKeyBody = await request.json();
    const sessionId = request.headers.get('x-session-id') || 'api-key-creation-session';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

    // Validate required fields
    if (!body.user_id || !body.name || !body.scopes || body.scopes.length === 0) {
      return NextResponse.json(
        { error: 'User ID, name, and scopes are required' },
        { status: 400 }
      );
    }

    // Validate scopes
    const validScopes: APIScope[] = [
      'companies:read', 'companies:search', 'companies:insights',
      'ai:analyze', 'ai:cost_tracking',
      'subscriptions:read', 'subscriptions:manage',
      'reports:generate', 'reports:export',
      'network:generate', 'network:export',
      'user:read', 'user:manage',
      'gdpr:export', 'gdpr:delete',
      'security:read', 'admin:all'
    ];

    const invalidScopes = body.scopes.filter(scope => !validScopes.includes(scope));
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid scopes provided',
          invalid_scopes: invalidScopes,
          valid_scopes: validScopes
        },
        { status: 400 }
      );
    }

    // Log API key creation request
    await auditLogger.logEvent({
      user_id: body.user_id,
      action: 'api_key_create',
      resource_type: 'api_key',
      resource_id: 'pending',
      details: {
        api_key_name: body.name,
        scopes_requested: body.scopes,
        expires_in_days: body.expires_in_days,
        rate_limits_custom: !!body.rate_limits,
        enterprise_api_management: true
      },
      ip_address: clientIP,
      user_agent: userAgent,
      session_id: sessionId,
      success: true
    });

    // Generate API key
    const apiKeyRequest: APIKeyRequest = {
      user_id: body.user_id,
      name: body.name,
      description: body.description,
      scopes: body.scopes,
      rate_limits: body.rate_limits,
      expires_in_days: body.expires_in_days
    };

    const result = await apiManager.generateAPIKey(apiKeyRequest);

    // Log successful creation
    await auditLogger.logEvent({
      user_id: body.user_id,
      action: 'api_key_create',
      resource_type: 'api_key',
      resource_id: result.key_info.key_id,
      details: {
        api_key_generated: true,
        key_id: result.key_info.key_id,
        scopes_granted: result.key_info.scopes,
        rate_limits: result.key_info.rate_limits,
        expires_at: result.key_info.expires_at,
        enterprise_grade: true
      },
      ip_address: clientIP,
      session_id: sessionId,
      success: true
    });

    return NextResponse.json({
      success: true,
      api_key: result.api_key,
      key_info: {
        key_id: result.key_info.key_id,
        name: result.key_info.name,
        description: result.key_info.description,
        scopes: result.key_info.scopes,
        rate_limits: result.key_info.rate_limits,
        created_at: result.key_info.created_at,
        expires_at: result.key_info.expires_at,
        status: result.key_info.status
      },
      security_info: {
        key_format: 'Bearer token authentication',
        usage_header: 'Authorization: Bearer <your_api_key>',
        rate_limiting: 'Multi-tier rate limiting applied',
        scopes_info: 'Granular permission system',
        monitoring: 'Full audit trail and analytics'
      },
      important_notes: [
        'Store this API key securely - it will not be shown again',
        'Use HTTPS only for all API requests',
        'Monitor your usage through the analytics dashboard',
        'Rate limits are enforced per minute, hour, and day',
        'Revoke immediately if compromised'
      ]
    });

  } catch (error) {
    console.error('API key creation error:', error);

    // Log the error
    try {
      const body = await request.json();
      await auditLogger.logEvent({
        user_id: body.user_id || 'unknown',
        action: 'api_key_create',
        resource_type: 'api_key',
        resource_id: 'failed',
        details: {
          api_key_creation_failed: true,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        success: false,
        error_message: error instanceof Error ? error.message : 'API key creation failed'
      });
    } catch (logError) {
      console.error('Failed to log API key creation error:', logError);
    }

    return NextResponse.json(
      { 
        error: 'API key creation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Revoke API key
export async function DELETE(request: NextRequest) {
  try {
    const body: RevokeAPIKeyBody = await request.json();
    const sessionId = request.headers.get('x-session-id') || 'api-key-revocation-session';
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

    if (!body.key_id || !body.user_id || !body.reason) {
      return NextResponse.json(
        { error: 'Key ID, user ID, and reason are required' },
        { status: 400 }
      );
    }

    // Log revocation request
    await auditLogger.logEvent({
      user_id: body.user_id,
      action: 'api_key_revoke',
      resource_type: 'api_key',
      resource_id: body.key_id,
      details: {
        revocation_requested: true,
        reason: body.reason,
        security_action: true
      },
      ip_address: clientIP,
      session_id: sessionId,
      success: true
    });

    // Revoke the API key
    await apiManager.revokeAPIKey(body.key_id, body.user_id, body.reason);

    return NextResponse.json({
      success: true,
      message: 'API key successfully revoked',
      revocation_info: {
        key_id: body.key_id,
        revoked_at: new Date().toISOString(),
        reason: body.reason,
        immediate_effect: 'All requests using this key will be denied'
      },
      security_note: 'Revocation is immediate and cannot be undone'
    });

  } catch (error) {
    console.error('API key revocation error:', error);

    return NextResponse.json(
      { 
        error: 'API key revocation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - List user's API keys and analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const keyId = searchParams.get('key_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get API key analytics
    const analytics = await apiManager.getAPIKeyAnalytics(userId, keyId || undefined);

    return NextResponse.json({
      success: true,
      api_key_analytics: analytics,
      usage_summary: {
        total_requests_24h: analytics.total_requests_24h,
        bandwidth_used_mb: analytics.total_bandwidth_mb,
        rate_limit_violations: analytics.rate_limit_violations,
        active_keys: analytics.keys.filter(k => k.status === 'active').length,
        total_keys: analytics.keys.length
      },
      top_endpoints: analytics.top_endpoints,
      recommendations: generateUsageRecommendations(analytics)
    });

  } catch (error) {
    console.error('API key analytics error:', error);

    return NextResponse.json(
      { 
        error: 'Failed to retrieve API key analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to generate usage recommendations
function generateUsageRecommendations(analytics: any): string[] {
  const recommendations: string[] = [];
  
  if (analytics.total_requests_24h > 1000) {
    recommendations.push('Consider upgrading rate limits for high-volume usage');
  }
  
  if (analytics.rate_limit_violations > 0) {
    recommendations.push('Review rate limit violations and optimize request patterns');
  }
  
  if (analytics.keys.length > 5) {
    recommendations.push('Consider consolidating unused API keys for better security');
  }
  
  recommendations.push('Regular monitoring of API usage is recommended for optimal performance');
  
  return recommendations;
}