import Link from 'next/link'
import { Button, Container, Heading, Text, VStack, HStack, Box, Icon } from '@chakra-ui/react'
import { FaRocket, FaLock, FaCog, FaChartLine } from 'react-icons/fa'

export default function HomePage() {
  return (
    <Container maxW="6xl" py={20}>
      <VStack spacing={12} textAlign="center">
        {/* Hero Section */}
        <VStack spacing={6}>
          <Heading
            as="h1"
            size="2xl"
            bgGradient="linear(to-r, brand.600, brand.800)"
            bgClip="text"
            fontWeight="bold"
          >
            Nexus AI
          </Heading>
          <Heading as="h2" size="lg" color="gray.600" maxW="2xl">
            AI-Powered Corporate Intelligence Platform
          </Heading>
          <Text fontSize="xl" color="gray.500" maxW="3xl">
            Streamline beneficial ownership verification and corporate structure analysis
            with advanced AI processing and real-time insights.
          </Text>
        </VStack>

        {/* CTA Buttons */}
        <HStack spacing={4}>
          <Button as={Link} href="/auth/login" size="lg" colorScheme="brand">
            Get Started
          </Button>
          <Button as={Link} href="/demo" variant="outline" size="lg">
            View Demo
          </Button>
        </HStack>

        {/* Features Grid */}
        <Box w="full" mt={20}>
          <VStack spacing={12}>
            <Heading as="h3" size="lg">
              Why Choose Nexus AI?
            </Heading>
            
            <HStack spacing={8} w="full" justify="center" flexWrap="wrap">
              <FeatureCard
                icon={FaRocket}
                title="AI-Powered Analysis"
                description="Advanced AI processes corporate data to provide intelligent insights and risk assessments"
              />
              <FeatureCard
                icon={FaLock}
                title="Compliance Ready"
                description="Built for financial institutions with GDPR compliance and audit trails"
              />
              <FeatureCard
                icon={FaCog}
                title="Real-time Processing"
                description="Live data updates and instant analysis with modern cloud infrastructure"
              />
              <FeatureCard
                icon={FaChartLine}
                title="Interactive Visualizations"
                description="Dynamic corporate hierarchy graphs and comprehensive reporting tools"
              />
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: any
  title: string
  description: string
}) {
  return (
    <VStack
      spacing={4}
      p={6}
      maxW="sm"
      textAlign="center"
      bg="white"
      shadow="md"
      borderRadius="lg"
      _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
      transition="all 0.2s"
    >
      <Icon as={icon} w={8} h={8} color="brand.500" />
      <Heading as="h4" size="md">
        {title}
      </Heading>
      <Text color="gray.600">
        {description}
      </Text>
    </VStack>
  )
}