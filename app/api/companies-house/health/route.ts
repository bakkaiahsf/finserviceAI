import { NextResponse } from 'next/server'
import { companiesHouseAPI } from '@/lib/apis/companies-house'

export async function GET() {
  try {
    // Check API health by getting rate limit info
    const rateLimitInfo = companiesHouseAPI.getRateLimitInfo()
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      rateLimit: rateLimitInfo,
      apiVersion: '1.0',
      endpoints: {
        search: '/api/companies-house/search',
        company: '/api/companies-house/company/[companyNumber]',
        officers: '/api/companies-house/company/[companyNumber]/officers',
        psc: '/api/companies-house/company/[companyNumber]/psc',
        filingHistory: '/api/companies-house/company/[companyNumber]/filing-history',
      }
    })
  } catch (error) {
    console.error('Companies House health check error:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Service unavailable',
      },
      { status: 503 }
    )
  }
}