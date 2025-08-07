'use client'

import { useEffect } from 'react'
import { Box, Container } from '@chakra-ui/react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import ModernCompanySearch from '@/components/search/ModernCompanySearch'
import Header from '@/components/layout/Header'

export default function SearchPage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login?next=/dashboard/search')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <Box>
        <Header />
        <Container maxW="8xl" py={8}>
          <ModernCompanySearch />
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
      <ModernCompanySearch />
    </Box>
  )
}