import { NextRequest, NextResponse } from 'next/server';
import { openRouterClient, type CompanyAnalysisRequest } from '@/lib/openrouter/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company, modelType = 'balanced' } = body as { 
      company: CompanyAnalysisRequest; 
      modelType?: 'fast' | 'balanced' | 'premium' | 'alternative' | 'haiku';
    };

    if (!company) {
      return NextResponse.json(
        { error: 'Company data is required' },
        { status: 400 }
      );
    }

    // Validate required company fields
    if (!company.company_name || !company.company_number || !company.company_status) {
      return NextResponse.json(
        { error: 'Missing required company fields: name, number, status' },
        { status: 400 }
      );
    }

    // Generate AI insights using OpenRouter
    console.log(`🤖 Generating AI insights for ${company.company_name} (${company.company_number}) using ${modelType} model...`);
    
    const insights = await openRouterClient.generateCompanyInsight(company, modelType);

    // Add metadata
    const response = {
      ...insights,
      last_updated: new Date().toISOString(),
      company_number: company.company_number,
      generated_by: 'openrouter',
      model_used: 'anthropic/claude-3-sonnet'
    };

    console.log(`✅ AI insights generated successfully for ${company.company_name}`);

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('AI insights generation error:', error);

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('Rate limit exceeded')) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            message: 'Too many AI analysis requests. Please try again later.',
            type: 'rate_limit_error'
          },
          { status: 429 }
        );
      }

      if (error.message.includes('Insufficient credits')) {
        return NextResponse.json(
          { 
            error: 'Insufficient AI credits',
            message: 'Please add credits to your OpenRouter account to continue using AI features.',
            type: 'credits_error'
          },
          { status: 402 }
        );
      }

      if (error.message.includes('Invalid OpenRouter API key')) {
        return NextResponse.json(
          { 
            error: 'AI service unavailable',
            message: 'AI analysis service is temporarily unavailable.',
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
        message: 'An unexpected error occurred while generating AI insights',
        type: 'internal_error'
      },
      { status: 500 }
    );
  }
}

// Test endpoint for checking OpenRouter connection
export async function GET(request: NextRequest) {
  try {
    const connectionTest = await openRouterClient.testConnection();
    
    return NextResponse.json({
      status: connectionTest.success ? 'connected' : 'error',
      model: connectionTest.model,
      credits: connectionTest.credits,
      error: connectionTest.error,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Connection test failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}