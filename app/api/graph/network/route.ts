import { NextRequest, NextResponse } from 'next/server';
import { networkBuilder } from '@/lib/graph/network-builder';
import { createServerSupabaseClient } from '@/lib/auth/supabase-client';
import type { GraphFilters } from '@/lib/graph/types';

export async function POST(request: NextRequest) {
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

    // Get request body
    const body = await request.json();
    const { companyNumber, maxHops = 2, filters } = body;

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

    // Validate maxHops
    if (maxHops < 1 || maxHops > 3) {
      return NextResponse.json(
        { error: 'maxHops must be between 1 and 3' },
        { status: 400 }
      );
    }

    // Set default filters
    const graphFilters: GraphFilters = {
      showOfficers: filters?.showOfficers ?? true,
      showPSCs: filters?.showPSCs ?? true,
      showAddresses: filters?.showAddresses ?? false,
      showInactive: filters?.showInactive ?? false,
      showResigned: filters?.showResigned ?? false,
      maxHops,
      ...filters
    };

    // Use user ID for rate limiting
    const rateLimitKey = `user:${user.id}:graph`;

    try {
      // Generate network graph
      const graphData = await networkBuilder.buildNetwork(
        companyNumber.toUpperCase(),
        maxHops,
        graphFilters,
        rateLimitKey
      );

      // Analyze the network
      const networkAnalysis = networkBuilder.analyzeNetwork();

      // Return the graph data and analysis
      return NextResponse.json({
        graph: graphData,
        analysis: networkAnalysis,
        metadata: {
          companyNumber: companyNumber.toUpperCase(),
          maxHops,
          filters: graphFilters,
          generatedAt: new Date().toISOString(),
          nodeCount: graphData.nodes.length,
          edgeCount: graphData.edges.length
        }
      });

    } catch (networkError) {
      console.error('Network building error:', networkError);
      
      if (networkError instanceof Error) {
        if (networkError.message.includes('Not Found')) {
          return NextResponse.json(
            { 
              error: 'Company not found',
              message: `No company found with number: ${companyNumber}`,
              type: 'not_found_error'
            },
            { status: 404 }
          );
        }

        if (networkError.message.includes('Rate limit exceeded')) {
          return NextResponse.json(
            { 
              error: 'Rate limit exceeded', 
              message: 'Too many requests. Please try again later.',
              type: 'rate_limit_error'
            },
            { status: 429 }
          );
        }
      }

      throw networkError; // Re-throw for general error handling
    }

  } catch (error) {
    console.error('Graph generation error:', error);

    if (error instanceof Error) {
      // Handle specific error types
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
        message: 'An unexpected error occurred while generating the network graph',
        type: 'internal_error'
      },
      { status: 500 }
    );
  }
}