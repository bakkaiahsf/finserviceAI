'use client'

import { useEffect } from 'react'
import { Box, Container } from '@chakra-ui/react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import DashboardOverview from '@/components/dashboard/DashboardOverview'
import Header from '@/components/layout/Header'

export default function DashboardPage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login?next=/dashboard')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <Box>
        <Header />
        <Container maxW="8xl" py={8}>
          <DashboardOverview />
        </Container>
      </Box>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Header />
      <Container maxW="8xl" py={8}>
        <DashboardOverview />
      </Container>
    </Box>
  )
}