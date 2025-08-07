import { NextRequest, NextResponse } from 'next/server'
import { companiesHouseAPI } from '@/lib/apis/companies-house'

export async function GET(
  request: NextRequest,
  { params }: { params: { companyNumber: string } }
) {
  try {
    const companyNumber = params.companyNumber

    if (!companyNumber) {
      return NextResponse.json(
        { error: 'Company number is required' },
        { status: 400 }
      )
    }

    const company = await companiesHouseAPI.getCompanyProfile(companyNumber)
    return NextResponse.json(company)
  } catch (error) {
    console.error('Companies House company details API error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('Company not found')) {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        )
      }
      
      if (error.message.includes('Rate limit exceeded')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait before making more requests.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}