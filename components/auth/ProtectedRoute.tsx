'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Box, 
  Flex, 
  VStack, 
  Spinner, 
  Text, 
  Alert, 
  AlertIcon, 
  Button,
  Icon
} from '@chakra-ui/react'
import { FaLock, FaExclamationTriangle } from 'react-icons/fa'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'viewer' | 'analyst' | 'compliance_officer' | 'admin'
  fallbackPath?: string
}

export default function ProtectedRoute({ 
  children, 
  requiredRole = 'viewer',
  fallbackPath = '/auth/login' 
}: ProtectedRouteProps) {
  const { user, profile, loading, isAuthenticated, hasRole } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Store the intended destination for redirect after login
        const returnUrl = encodeURIComponent(pathname)
        router.push(`${fallbackPath}?next=${returnUrl}`)
      }
    }
  }, [isAuthenticated, loading, router, pathname, fallbackPath])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.50">
        <VStack spacing={6}>
          <Spinner 
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="brand.500"
            size="xl"
          />
          <VStack spacing={2}>
            <Text fontSize="lg" fontWeight="medium" color="gray.700">
              Authenticating...
            </Text>
            <Text fontSize="sm" color="gray.500">
              Verifying your credentials
            </Text>
          </VStack>
        </VStack>
      </Flex>
    )
  }

  // User not authenticated - will redirect via useEffect
  if (!isAuthenticated || !user) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.50">
        <VStack spacing={6}>
          <Icon as={FaLock} w={12} h={12} color="gray.400" />
          <VStack spacing={2}>
            <Text fontSize="lg" fontWeight="medium" color="gray.700">
              Authentication Required
            </Text>
            <Text fontSize="sm" color="gray.500">
              Redirecting to sign in...
            </Text>
          </VStack>
        </VStack>
      </Flex>
    )
  }

  // Check if user has required role
  if (profile && !hasRole(requiredRole)) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.50" p={4}>
        <Box maxW="md" w="full">
          <Alert 
            status="warning" 
            variant="subtle" 
            flexDirection="column" 
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
            borderRadius="lg"
            shadow="lg"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <Box mt={4} mb={2}>
              <Text fontSize="lg" fontWeight="bold">
                Insufficient Permissions
              </Text>
            </Box>
            <Text fontSize="sm" color="gray.600" mb={4}>
              You need <strong>{requiredRole}</strong> role or higher to access this page. 
              Your current role is <strong>{profile.role}</strong>.
            </Text>
            <Button 
              size="sm" 
              colorScheme="brand" 
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Return to Dashboard
            </Button>
          </Alert>
        </Box>
      </Flex>
    )
  }

  // Profile not loaded yet but user is authenticated
  if (!profile) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.50">
        <VStack spacing={6}>
          <Spinner 
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="brand.500"
            size="xl"
          />
          <VStack spacing={2}>
            <Text fontSize="lg" fontWeight="medium" color="gray.700">
              Loading Profile...
            </Text>
            <Text fontSize="sm" color="gray.500">
              Setting up your workspace
            </Text>
          </VStack>
        </VStack>
      </Flex>
    )
  }

  // User authenticated and has required permissions
  return <>{children}</>
}

// HOC version for easier usage
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: 'viewer' | 'analyst' | 'compliance_officer' | 'admin'
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}