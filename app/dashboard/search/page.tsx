import { Metadata } from 'next'
import CompanySearchInterface from '@/components/search/CompanySearchInterface'

export const metadata: Metadata = {
  title: 'Company Search',
  description: 'Search UK companies using Companies House data with AI-powered insights and analysis.',
  keywords: 'company search, UK companies, Companies House, corporate intelligence, beneficial ownership',
}

export default function SearchPage() {
  return <CompanySearchInterface />
}