'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Heading, 
  Text, 
  Button, 
  Icon,
  Alert,
  AlertIcon,
  Flex,
  Image,
  Card,
  CardBody,
  Divider,
  useColorModeValue
} from '@chakra-ui/react'
import { FaGoogle, FaLock, FaChartLine, FaUsers } from 'react-icons/fa'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'
import Head from 'next/head'

export default function LoginPage() {
  const { signInWithGoogle, isAuthenticated, loading } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')
  const next = searchParams.get('next')

  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50, pink.50)',
    'linear(to-br, blue.900, purple.900, pink.900)'
  )
  const cardBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.push(next || '/dashboard')
    }
  }, [isAuthenticated, loading, router, next])

  useEffect(() => {
    if (error) {
      const errorMessages: Record<string, string> = {
        'access_denied': 'Access denied. Please try signing in again.',
        'server_error': 'Server error occurred. Please try again later.',
        'temporarily_unavailable': 'Service temporarily unavailable. Please try again.',
        'invalid_request': 'Invalid request. Please clear your browser cache and try again.',
        'session_error': 'Session error. Please try signing in again.',
        'callback_error': 'Authentication error. Please try again.',
      }
      toast.error(errorMessages[error] || 'Authentication failed. Please try again.')
    }
  }, [error])

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true)
      await signInWithGoogle()
      toast.success('Redirecting to your dashboard...')
    } catch (error: any) {
      console.error('Sign in error:', error)
      toast.error(error.message || 'Failed to sign in. Please try again.')
    } finally {
      setIsSigningIn(false)
    }
  }

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <VStack spacing={4}>
          <Box className="animate-spin">
            <Icon as={FaLock} w={8} h={8} color="brand.500" />
          </Box>
          <Text>Loading...</Text>
        </VStack>
      </Flex>
    )
  }

  return (
    <>
      <Head>
        <title>Sign In - Nexus AI | Corporate Intelligence Platform</title>
        <meta name="description" content="Sign in to Nexus AI, the AI-powered corporate intelligence platform for financial institutions. Secure access with Google OAuth." />
        <meta name="keywords" content="corporate intelligence, beneficial ownership, compliance, financial services, login" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`} />
      </Head>

      <Box minH="100vh" bgGradient={bgGradient}>
        <Container maxW="6xl" py={20}>
          <VStack spacing={12} align="center">
            
            {/* Header Section */}
            <VStack spacing={6} textAlign="center" maxW="2xl">
              <HStack spacing={3} align="center">
                <Icon as={FaLock} w={10} h={10} color="brand.500" />
                <Heading size="xl" bgGradient="linear(to-r, brand.600, brand.800)" bgClip="text">
                  Nexus AI
                </Heading>
              </HStack>
              <Heading size="lg" color={textColor} fontWeight="medium">
                Welcome to Corporate Intelligence Platform
              </Heading>
              <Text fontSize="lg" color={textColor} lineHeight="tall">
                Secure access to AI-powered beneficial ownership verification and corporate structure analysis for financial institutions.
              </Text>
            </VStack>

            {/* Error Alert */}
            {message && (
              <Alert status="error" borderRadius="lg" maxW="md">
                <AlertIcon />
                <Text fontSize="sm">
                  {message === 'session_error' && 'Session expired. Please sign in again.'}
                  {message === 'callback_error' && 'Authentication failed. Please try again.'}
                  {message === 'access_denied' && 'Access denied. Contact your administrator.'}
                </Text>
              </Alert>
            )}

            {/* Login Card */}
            <Card maxW="md" w="full" shadow="2xl" bg={cardBg}>
              <CardBody p={8}>
                <VStack spacing={8}>
                  <VStack spacing={4} textAlign="center">
                    <Heading size="md" color="gray.700">
                      Sign in to your account
                    </Heading>
                    <Text color={textColor} fontSize="sm">
                      Use your corporate Google account to access the platform
                    </Text>
                  </VStack>

                  <Button
                    leftIcon={<Icon as={FaGoogle} />}
                    onClick={handleGoogleSignIn}
                    isLoading={isSigningIn}
                    loadingText="Signing in..."
                    size="lg"
                    w="full"
                    colorScheme="brand"
                    variant="solid"
                    shadow="md"
                    _hover={{
                      transform: 'translateY(-1px)',
                      shadow: 'lg',
                    }}
                    transition="all 0.2s"
                  >
                    Continue with Google
                  </Button>

                  <VStack spacing={2} pt={4}>
                    <Text fontSize="xs" color={textColor} textAlign="center" lineHeight="tall">
                      By signing in, you agree to our{' '}
                      <Text as="span" color="brand.600" cursor="pointer" textDecor="underline">
                        Terms of Service
                      </Text>{' '}
                      and{' '}
                      <Text as="span" color="brand.600" cursor="pointer" textDecor="underline">
                        Privacy Policy
                      </Text>
                    </Text>
                    <HStack spacing={1} fontSize="xs" color={textColor}>
                      <Icon as={FaLock} w={3} h={3} />
                      <Text>Enterprise-grade security & GDPR compliant</Text>
                    </HStack>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Features Section */}
            <Box w="full" maxW="4xl" mt={12}>
              <VStack spacing={8}>
                <Heading size="md" color={textColor} textAlign="center">
                  Trusted by Financial Institutions
                </Heading>
                
                <HStack spacing={8} justify="center" flexWrap="wrap">
                  <FeatureItem
                    icon={FaLock}
                    title="Bank-Grade Security"
                    description="SOC 2 compliant with end-to-end encryption"
                  />
                  <FeatureItem
                    icon={FaChartLine}
                    title="AI-Powered Analysis"
                    description="Advanced algorithms for risk assessment"
                  />
                  <FeatureItem
                    icon={FaUsers}
                    title="Compliance Ready"
                    description="Built for AML/KYC and regulatory requirements"
                  />
                </HStack>
              </VStack>
            </Box>

          </VStack>
        </Container>
      </Box>
    </>
  )
}

function FeatureItem({ icon, title, description }: {
  icon: any
  title: string
  description: string
}) {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  
  return (
    <VStack 
      spacing={3} 
      maxW="xs" 
      textAlign="center"
      p={4}
      borderRadius="lg"
      _hover={{ bg: useColorModeValue('white', 'gray.700'), shadow: 'md' }}
      transition="all 0.2s"
    >
      <Icon as={icon} w={6} h={6} color="brand.500" />
      <Text fontWeight="semibold" color="gray.700">
        {title}
      </Text>
      <Text fontSize="sm" color={textColor} lineHeight="short">
        {description}
      </Text>
    </VStack>
  )
}