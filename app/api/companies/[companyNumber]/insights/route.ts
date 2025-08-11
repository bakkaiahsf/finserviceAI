import { NextRequest, NextResponse } from 'next/server';
import { companiesHouseClient } from '@/lib/companies-house/client';
import { deepSeekClient } from '@/lib/ai/deepseek-client';
import { createServerSupabaseClient } from '@/lib/auth/supabase-client';

interface RouteParams {
  params: Promise<{
    companyNumber: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { companyNumber } = await params;
  
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

    // Get request options
    const body = await request.json();
    const {
      includeRiskAnalysis = true,
      includeFinancialInsights = true,
      includeCompetitiveAnalysis = false,
      maxTokens = 2000,
      temperature = 0.3
    } = body;

    // Use user ID for rate limiting
    const rateLimitKey = `user:${user.id}`;

    try {
      // Get company data from Companies House
      const [companyProfile, officers] = await Promise.all([
        companiesHouseClient.getCompanyProfile(companyNumber.toUpperCase(), { rateLimitKey }),
        companiesHouseClient.getCompanyOfficers(companyNumber.toUpperCase(), { 
          rateLimitKey,
          itemsPerPage: 10 // Limit officers for AI analysis
        }).catch(() => ({ items: [] })) // Fallback if officers not available
      ]);

      // Generate AI insights
      const insights = await deepSeekClient.analyzeCompany(
        companyProfile,
        officers.items || [],
        {
          includeRiskAnalysis,
          includeFinancialInsights,
          includeCompetitiveAnalysis,
          maxTokens,
          temperature,
          userId: user.id
        }
      );

      // Get cost tracking info
      const costInfo = deepSeekClient.getCostTracking(user.id);

      // Return insights with metadata
      return NextResponse.json({
        insights,
        company: {
          name: companyProfile.company_name,
          number: companyProfile.company_number,
          status: companyProfile.company_status
        },
        metadata: {
          tokensUsed: insights.tokensUsed,
          costTracking: costInfo,
          analysisOptions: {
            includeRiskAnalysis,
            includeFinancialInsights,
            includeCompetitiveAnalysis
          }
        }
      });

    } catch (companiesHouseError) {
      console.error('Companies House API error:', companiesHouseError);
      
      if (companiesHouseError instanceof Error && companiesHouseError.message.includes('Not Found')) {
        return NextResponse.json(
          { 
            error: 'Company not found',
            message: `No company found with number: ${companyNumber}`,
            type: 'not_found_error'
          },
          { status: 404 }
        );
      }

      throw companiesHouseError; // Re-throw for general error handling
    }

  } catch (error) {
    console.error('AI insights error:', error);

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('DeepSeek API Error')) {
        return NextResponse.json(
          { 
            error: 'AI analysis failed',
            message: 'The AI analysis service is temporarily unavailable',
            type: 'ai_service_error'
          },
          { status: 503 }
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
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred while generating AI insights',
        type: 'internal_error'
      },
      { status: 500 }
    );
  }
}