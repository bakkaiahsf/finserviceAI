import { NextRequest, NextResponse } from 'next/server'
import { deepSeekService } from '@/lib/ai/deepseek-service'
import { companiesHouseAPI } from '@/lib/apis/companies-house'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { companyNumber, analysisType = 'comprehensive' } = await request.json()

    if (!companyNumber) {
      return NextResponse.json(
        { error: 'Company number is required' },
        { status: 400 }
      )
    }

    // Fetch company data
    const companyData = await companiesHouseAPI.getCompanyData(companyNumber)
    
    if (!companyData.profile) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    let analysisResults: any = {}

    switch (analysisType) {
      case 'comprehensive':
        // Run comprehensive analysis
        const [summary, riskAssessment, networkPatterns] = await Promise.allSettled([
          deepSeekService.generateCompanySummary(companyData),
          deepSeekService.assessCompanyRisk(companyData, companyData.officers || []),
          deepSeekService.analyzeNetworkPatterns([companyData])
        ])

        analysisResults = {
          summary: summary.status === 'fulfilled' ? summary.value : null,
          riskAssessment: riskAssessment.status === 'fulfilled' ? riskAssessment.value : null,
          networkPatterns: networkPatterns.status === 'fulfilled' ? networkPatterns.value : null,
        }

        // Generate executive briefing if risk assessment succeeded
        if (analysisResults.riskAssessment) {
          try {
            analysisResults.executiveBriefing = await deepSeekService.generateExecutiveBriefing(
              companyData,
              analysisResults.riskAssessment
            )
          } catch (error) {
            console.error('Executive briefing generation failed:', error)
          }
        }
        break

      case 'risk_only':
        analysisResults.riskAssessment = await deepSeekService.assessCompanyRisk(
          companyData,
          companyData.officers || []
        )
        break

      case 'summary_only':
        analysisResults.summary = await deepSeekService.generateCompanySummary(companyData)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid analysis type' },
          { status: 400 }
        )
    }

    // Store analysis results in database
    const analysisRecord = {
      company_number: companyNumber,
      company_name: companyData.profile.company_name,
      analysis_type: analysisType,
      results: analysisResults,
      ai_model: 'deepseek-chat',
      created_at: new Date().toISOString(),
      metadata: {
        officers_count: companyData.officers?.length || 0,
        pscs_count: companyData.pscs?.length || 0,
        processing_time_ms: Date.now() - Date.now(), // This would be calculated properly
      }
    }

    const { error: dbError } = await supabase
      .from('ai_processing_jobs')
      .insert([{
        job_type: 'company_analysis',
        status: 'completed',
        input_data: { companyNumber, analysisType },
        output_data: analysisRecord,
        processing_time_ms: 1000, // Mock value
        ai_model_used: 'deepseek-chat',
        cost_estimate: 0.05, // Mock cost
      }])

    if (dbError) {
      console.error('Database error:', dbError)
      // Don't fail the request if database logging fails
    }

    return NextResponse.json({
      success: true,
      companyNumber,
      analysisType,
      results: analysisResults,
      metadata: {
        generatedAt: new Date().toISOString(),
        aiModel: 'deepseek-chat',
        dataSource: 'companies-house',
      }
    })

  } catch (error: any) {
    console.error('AI analysis error:', error)
    
    // Log error to database
    await supabase
      .from('ai_processing_jobs')
      .insert([{
        job_type: 'company_analysis',
        status: 'failed',
        input_data: { companyNumber: request.body },
        error_message: error.message,
        processing_time_ms: 1000,
        ai_model_used: 'deepseek-chat',
      }])

    return NextResponse.json(
      { 
        error: 'AI analysis failed', 
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const companyNumber = searchParams.get('companyNumber')

  if (!companyNumber) {
    return NextResponse.json(
      { error: 'Company number is required' },
      { status: 400 }
    )
  }

  try {
    // Fetch previous analysis results
    const { data: analysisHistory, error } = await supabase
      .from('ai_processing_jobs')
      .select('*')
      .eq('job_type', 'company_analysis')
      .eq('input_data->>companyNumber', companyNumber)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      companyNumber,
      analysisHistory: analysisHistory || [],
      totalAnalyses: analysisHistory?.length || 0
    })

  } catch (error: any) {
    console.error('Analysis history fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analysis history', message: error.message },
      { status: 500 }
    )
  }
}