'use client'

import { useSearchParams } from 'next/navigation'
import { 
  Box, 
  Container, 
  VStack, 
  Heading, 
  Text, 
  Button, 
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Link,
  HStack
} from '@chakra-ui/react'
import { FaExclamationTriangle, FaArrowLeft, FaLifeRing } from 'react-icons/fa'
import NextLink from 'next/link'
import Head from 'next/head'

const errorMessages: Record<string, { title: string; description: string; action?: string }> = {
  'access_denied': {
    title: 'Access Denied',
    description: 'You do not have permission to access this application. Please contact your administrator if you believe this is an error.',
    action: 'Contact your system administrator to request access to Nexus AI.'
  },
  'server_error': {
    title: 'Server Error',
    description: 'An internal server error occurred during authentication. Our team has been notified.',
    action: 'Please try again in a few minutes or contact support if the issue persists.'
  },
  'temporarily_unavailable': {
    title: 'Service Temporarily Unavailable',
    description: 'The authentication service is temporarily unavailable due to maintenance or high load.',
    action: 'Please try again in a few minutes.'
  },
  'invalid_request': {
    title: 'Invalid Request',
    description: 'The authentication request was invalid or malformed.',
    action: 'Please clear your browser cache and cookies, then try signing in again.'
  },
  'session_error': {
    title: 'Session Error',
    description: 'There was an error establishing your session after successful authentication.',
    action: 'Please try signing in again. If the problem persists, contact support.'
  },
  'callback_error': {
    title: 'Authentication Callback Error',
    description: 'An error occurred while processing your authentication response from Google.',
    action: 'Please ensure you are using a supported browser and try again.'
  },
  'unauthorized': {
    title: 'Unauthorized Access',
    description: 'Your account is not authorized to access this application.',
    action: 'Contact your organization administrator to request access.'
  }
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || searchParams.get('message') || 'unknown_error'
  const errorCode = searchParams.get('error_code')
  const errorDescription = searchParams.get('error_description')

  const errorInfo = errorMessages[error] || {
    title: 'Authentication Error',
    description: 'An unexpected error occurred during authentication.',
    action: 'Please try signing in again or contact support if the issue persists.'
  }

  return (
    <>
      <Head>
        <title>Authentication Error - Nexus AI</title>
        <meta name="description" content="Authentication error occurred while signing into Nexus AI." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Box minH="100vh" bg="gray.50" py={20}>
        <Container maxW="2xl">
          <VStack spacing={8} textAlign="center">
            
            {/* Error Icon */}
            <Icon as={FaExclamationTriangle} w={16} h={16} color="red.500" />

            {/* Error Alert */}
            <Alert
              status="error"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              height="auto"
              p={8}
              borderRadius="lg"
              shadow="lg"
            >
              <AlertIcon boxSize="40px" mr={0} />
              <AlertTitle mt={4} mb={1} fontSize="xl">
                {errorInfo.title}
              </AlertTitle>
              <AlertDescription maxWidth="sm" fontSize="md" lineHeight="tall">
                {errorInfo.description}
              </AlertDescription>
              
              {errorInfo.action && (
                <Box mt={4} p={4} bg="red.50" borderRadius="md" border="1px" borderColor="red.200">
                  <Text fontSize="sm" color="red.700" fontWeight="medium">
                    What to do next:
                  </Text>
                  <Text fontSize="sm" color="red.600" mt={1}>
                    {errorInfo.action}
                  </Text>
                </Box>
              )}
            </Alert>

            {/* Technical Details (for debugging) */}
            {(errorCode || errorDescription) && (
              <Box w="full" p={4} bg="gray.100" borderRadius="md" border="1px" borderColor="gray.200">
                <VStack spacing={2} align="start">
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                    Technical Details:
                  </Text>
                  {errorCode && (
                    <HStack spacing={2}>
                      <Text fontSize="sm" color="gray.600">Error Code:</Text>
                      <Code fontSize="sm">{errorCode}</Code>
                    </HStack>
                  )}
                  {errorDescription && (
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" color="gray.600">Error Description:</Text>
                      <Code fontSize="sm" p={2} bg="gray.200" borderRadius="md">
                        {errorDescription}
                      </Code>
                    </VStack>
                  )}
                </VStack>
              </Box>
            )}

            {/* Action Buttons */}
            <HStack spacing={4} pt={4}>
              <Button
                as={NextLink}
                href="/auth/login"
                leftIcon={<Icon as={FaArrowLeft} />}
                colorScheme="brand"
                variant="solid"
                size="lg"
              >
                Try Again
              </Button>
              <Button
                as={Link}
                href="mailto:support@nexusai.com?subject=Authentication Error&body=Error: {error}"
                leftIcon={<Icon as={FaLifeRing} />}
                variant="outline"
                size="lg"
                isExternal
              >
                Contact Support
              </Button>
            </HStack>

            {/* Help Text */}
            <Box textAlign="center" pt={8} maxW="md">
              <Text fontSize="sm" color="gray.600" lineHeight="tall">
                If you continue to experience issues, please contact our support team at{' '}
                <Link 
                  href="mailto:support@nexusai.com" 
                  color="brand.600" 
                  textDecoration="underline"
                  isExternal
                >
                  support@nexusai.com
                </Link>{' '}
                and include the error details above.
              </Text>
            </Box>

            {/* Back to Home */}
            <Text fontSize="sm" color="gray.500">
              <Link as={NextLink} href="/" color="brand.600" textDecoration="underline">
                Return to homepage
              </Link>
            </Text>

          </VStack>
        </Container>
      </Box>
    </>
  )
}