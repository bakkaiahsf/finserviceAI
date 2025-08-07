import { NextRequest, NextResponse } from 'next/server'
import { companiesHouseAPI } from '@/lib/apis/companies-house'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const itemsPerPage = parseInt(searchParams.get('items_per_page') || '20')
    const startIndex = parseInt(searchParams.get('start_index') || '0')

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required and must be at least 2 characters' },
        { status: 400 }
      )
    }

    const results = await companiesHouseAPI.searchCompanies(query.trim(), {
      itemsPerPage: Math.min(itemsPerPage, 100),
      startIndex: Math.max(0, startIndex),
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error('Companies House search API error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Rate limit exceeded')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait before making more requests.' },
          { status: 429 }
        )
      }
      
      if (error.message.includes('404')) {
        return NextResponse.json(
          { error: 'No companies found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}