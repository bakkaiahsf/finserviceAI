import { NextRequest, NextResponse } from 'next/server'
import { companiesHouseAPI } from '@/lib/apis/companies-house'

export async function GET(
  request: NextRequest,
  { params }: { params: { companyNumber: string } }
) {
  try {
    const companyNumber = params.companyNumber
    const { searchParams } = new URL(request.url)
    const itemsPerPage = parseInt(searchParams.get('items_per_page') || '25')
    const startIndex = parseInt(searchParams.get('start_index') || '0')
    const category = searchParams.get('category')

    if (!companyNumber) {
      return NextResponse.json(
        { error: 'Company number is required' },
        { status: 400 }
      )
    }

    const filingHistory = await companiesHouseAPI.getFilingHistory(companyNumber, {
      itemsPerPage: Math.min(itemsPerPage, 100),
      startIndex: Math.max(0, startIndex),
      ...(category && { category }),
    })

    return NextResponse.json(filingHistory)
  } catch (error) {
    console.error('Companies House filing history API error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        return NextResponse.json(
          { error: 'Company not found or no filing history available' },
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