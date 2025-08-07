import { Metadata } from 'next'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export const metadata: Metadata = {
  title: {
    template: '%s | Nexus AI Dashboard',
    default: 'Dashboard | Nexus AI - Corporate Intelligence Platform'
  },
  description: 'Access corporate intelligence tools, company search, beneficial ownership analysis, and compliance reporting.',
  keywords: 'corporate intelligence, dashboard, beneficial ownership, compliance, AML, KYC, company search',
  robots: {
    index: false, // Dashboard pages should not be indexed
    follow: false,
  },
}

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRole="viewer">
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  )
}