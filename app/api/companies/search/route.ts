import { NextRequest, NextResponse } from 'next/server';
import { companiesHouseClient } from '@/lib/companies-house/client';
import { createServerSupabaseClient } from '@/lib/auth/supabase-client';

export async function GET(request: NextRequest) {
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

    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const itemsPerPage = parseInt(searchParams.get('items_per_page') || '20');
    const startIndex = parseInt(searchParams.get('start_index') || '0');
    const restrictions = searchParams.get('restrictions');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

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

    // Use user ID for rate limiting to provide fair usage per user
    const rateLimitKey = `user:${user.id}`;

    // Make API call
    const searchResults = await companiesHouseClient.searchCompanies(query, {
      itemsPerPage,
      startIndex,
      restrictions: restrictions || undefined,
      rateLimitKey
    });

    // Get rate limit status for response headers
    const rateLimitStatus = companiesHouseClient.getRateLimitStatus(rateLimitKey);

    // Return results with rate limit headers
    return NextResponse.json(searchResults, {
      headers: {
        'X-RateLimit-Limit': rateLimitStatus.limit.toString(),
        'X-RateLimit-Remaining': rateLimitStatus.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitStatus.resetTime).toISOString(),
      }
    });

  } catch (error) {
    console.error('Company search error:', error);

    if (error instanceof Error) {
      // Handle specific error types
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
        message: 'An unexpected error occurred while searching companies',
        type: 'internal_error'
      },
      { status: 500 }
    );
  }
}