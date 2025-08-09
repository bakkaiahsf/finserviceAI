import { NextRequest, NextResponse } from 'next/server';
import { companiesHouseClient } from '@/lib/companies-house/client';
import { createServerSupabaseClient } from '@/lib/auth/supabase-client';

interface RouteParams {
  params: {
    companyNumber: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate user
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { companyNumber } = params;

    if (!companyNumber) {
      return NextResponse.json(
        { error: 'Company number is required' },
        { status: 400 }
      );
    }

    // Validate company number format
    if (!/^[A-Z0-9]{2,8}$/i.test(companyNumber)) {
      return NextResponse.json(
        { error: 'Invalid company number format' },
        { status: 400 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const itemsPerPage = parseInt(searchParams.get('items_per_page') || '35');
    const startIndex = parseInt(searchParams.get('start_index') || '0');
    const orderBy = searchParams.get('order_by') as 'appointed_on' | 'resigned_on' | 'surname' | null;
    const registerView = searchParams.get('register_view') === 'true';
    const registerType = searchParams.get('register_type');

    // Validate parameters
    if (itemsPerPage > 100 || itemsPerPage < 1) {
      return NextResponse.json(
        { error: 'items_per_page must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (startIndex < 0) {
      return NextResponse.json(
        { error: 'start_index must be 0 or greater' },
        { status: 400 }
      );
    }

    if (orderBy && !['appointed_on', 'resigned_on', 'surname'].includes(orderBy)) {
      return NextResponse.json(
        { error: 'order_by must be one of: appointed_on, resigned_on, surname' },
        { status: 400 }
      );
    }

    // Use user ID for rate limiting
    const rateLimitKey = `user:${user.id}`;

    // Get company officers
    const officers = await companiesHouseClient.getCompanyOfficers(
      companyNumber.toUpperCase(),
      {
        itemsPerPage,
        startIndex,
        orderBy: orderBy || undefined,
        registerView,
        registerType: registerType || undefined,
        rateLimitKey
      }
    );

    // Get rate limit status
    const rateLimitStatus = companiesHouseClient.getRateLimitStatus(rateLimitKey);

    // Return officers with rate limit headers
    return NextResponse.json(officers, {
      headers: {
        'X-RateLimit-Limit': rateLimitStatus.limit.toString(),
        'X-RateLimit-Remaining': rateLimitStatus.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitStatus.resetTime).toISOString(),
      }
    });

  } catch (error) {
    console.error('Company officers error:', error);

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('Not Found')) {
        return NextResponse.json(
          { 
            error: 'Officers not found',
            message: `No officers found for company: ${params.companyNumber}`,
            type: 'not_found_error'
          },
          { status: 404 }
        );
      }

      if (error.message.includes('Rate limit exceeded')) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded', 
            message: 'Too many requests. Please try again later.',
            type: 'rate_limit_error'
          },
          { status: 429 }
        );
      }

      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { 
            error: 'API authentication failed',
            message: 'Invalid or expired API key',
            type: 'auth_error'
          },
          { status: 503 }
        );
      }

      if (error.message.includes('Service Unavailable')) {
        return NextResponse.json(
          { 
            error: 'Service unavailable',
            message: 'Companies House API is temporarily unavailable',
            type: 'service_error'
          },
          { status: 503 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching company officers',
        type: 'internal_error'
      },
      { status: 500 }
    );
  }
}