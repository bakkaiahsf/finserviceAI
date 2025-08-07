import { Metadata } from 'next'
import DashboardOverview from '@/components/dashboard/DashboardOverview'

export const metadata: Metadata = {
  title: 'Dashboard Overview',
  description: 'View your corporate intelligence dashboard with key metrics, recent activities, and system status.',
}

export default function DashboardPage() {
  return <DashboardOverview />
}