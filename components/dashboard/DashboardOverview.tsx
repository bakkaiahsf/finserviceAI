'use client'

import React from 'react'
import {
  Box,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Badge,
  Avatar,
  Progress,
  Button,
  IconButton,
  useColorModeValue,
  Skeleton,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react'
import {
  FaBuilding,
  FaUsers,
  FaRobot,
  FaChartLine,
  FaSearch,
  FaFileAlt,
  FaClock,
  FaExternalLinkAlt,
  FaSync,
  FaNetworkWired,
  FaChartPie,
} from 'react-icons/fa'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useDashboardRealTimeUpdates } from '@/hooks/useRealTimeUpdates'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import AdvancedAnalytics from '@/components/analytics/AdvancedAnalytics'

interface DashboardStats {
  totalCompanies: number
  companiesThisMonth: number
  totalOfficers: number
  officersThisMonth: number
  aiJobsCompleted: number
  aiJobsInProgress: number
  searchesThisMonth: number
  reportsGenerated: number
}

interface RecentActivity {
  id: string
  type: 'search' | 'analysis' | 'report' | 'company_added'
  description: string
  timestamp: string
  user: {
    name: string
    avatar?: string
  }
  metadata?: {
    companyName?: string
    companyNumber?: string
  }
}

// Mock data for demonstration (replace with actual API calls)
const mockStats: DashboardStats = {
  totalCompanies: 1247,
  companiesThisMonth: 89,
  totalOfficers: 3456,
  officersThisMonth: 234,
  aiJobsCompleted: 156,
  aiJobsInProgress: 3,
  searchesThisMonth: 567,
  reportsGenerated: 23,
}

const mockActivities: RecentActivity[] = [
  {
    id: '1',
    type: 'analysis',
    description: 'AI analysis completed for Apple Inc',
    timestamp: new Date().toISOString(),
    user: { name: 'System', avatar: undefined },
    metadata: { companyName: 'Apple Inc', companyNumber: '12345678' }
  },
  {
    id: '2',
    type: 'search',
    description: 'Searched for "Google"',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    user: { name: 'John Smith', avatar: undefined },
  },
  {
    id: '3',
    type: 'company_added',
    description: 'New company Microsoft Corp added to database',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    user: { name: 'Sarah Johnson', avatar: undefined },
    metadata: { companyName: 'Microsoft Corp', companyNumber: '87654321' }
  },
]

export default function DashboardOverview() {
  const { profile } = useAuth()
  const router = useRouter()
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Enable real-time updates for dashboard
  useDashboardRealTimeUpdates()

  // Mock queries (replace with actual API calls)
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      return mockStats
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: recentActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['recentActivities'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      return mockActivities
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'search': return FaSearch
      case 'analysis': return FaRobot
      case 'report': return FaFileAlt
      case 'company_added': return FaBuilding
      default: return FaClock
    }
  }

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'search': return 'blue'
      case 'analysis': return 'green'
      case 'report': return 'purple'
      case 'company_added': return 'orange'
      default: return 'gray'
    }
  }

  return (
    <VStack spacing={8} align="stretch">
      {/* Welcome Section */}
      <Box>
        <Heading size="lg" mb={2}>
          Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}! 👋
        </Heading>
        <Text color="gray.600">
          Here's what's happening with your corporate intelligence platform today.
        </Text>
      </Box>

      {/* Dashboard Tabs */}
      <Tabs colorScheme="brand">
        <TabList>
          <Tab>
            <HStack spacing={2}>
              <FaChartLine />
              <Text>Overview</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={2}>
              <FaChartPie />
              <Text>Advanced Analytics</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <VStack spacing={8} align="stretch">

      {/* Quick Actions */}
      <Card bg={cardBg} shadow="sm">
        <CardHeader>
          <Heading size="md">Quick Actions</Heading>
        </CardHeader>
        <CardBody>
          <HStack spacing={4} wrap="wrap">
            <Button
              leftIcon={<FaSearch />}
              colorScheme="brand"
              onClick={() => router.push('/dashboard/search')}
            >
              Search Companies
            </Button>
            <Button
              leftIcon={<FaNetworkWired />}
              colorScheme="purple"
              variant="outline"
              onClick={() => router.push('/dashboard/visualization')}
            >
              Network Graph
            </Button>
            <Button
              leftIcon={<FaRobot />}
              variant="outline"
              onClick={() => router.push('/dashboard/analytics')}
            >
              AI Analysis
            </Button>
            <Button
              leftIcon={<FaFileAlt />}
              variant="outline"
              onClick={() => router.push('/dashboard/reports')}
            >
              Generate Report
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {/* Statistics Grid */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
        <GridItem>
          <Card bg={cardBg} shadow="sm">
            <CardBody>
              {statsLoading ? (
                <VStack align="stretch" spacing={3}>
                  <Skeleton height="20px" />
                  <Skeleton height="30px" width="60%" />
                  <Skeleton height="16px" width="40%" />
                </VStack>
              ) : (
                <Stat>
                  <HStack justify="space-between">
                    <StatLabel color="gray.600">Total Companies</StatLabel>
                    <Box p={2} bg="blue.100" borderRadius="lg">
                      <FaBuilding color="blue.600" />
                    </Box>
                  </HStack>
                  <StatNumber color="blue.600">{stats?.totalCompanies.toLocaleString()}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    {stats?.companiesThisMonth} this month
                  </StatHelpText>
                </Stat>
              )}
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card bg={cardBg} shadow="sm">
            <CardBody>
              {statsLoading ? (
                <VStack align="stretch" spacing={3}>
                  <Skeleton height="20px" />
                  <Skeleton height="30px" width="60%" />
                  <Skeleton height="16px" width="40%" />
                </VStack>
              ) : (
                <Stat>
                  <HStack justify="space-between">
                    <StatLabel color="gray.600">Officers & PSCs</StatLabel>
                    <Box p={2} bg="green.100" borderRadius="lg">
                      <FaUsers color="green.600" />
                    </Box>
                  </HStack>
                  <StatNumber color="green.600">{stats?.totalOfficers.toLocaleString()}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    {stats?.officersThisMonth} this month
                  </StatHelpText>
                </Stat>
              )}
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card bg={cardBg} shadow="sm">
            <CardBody>
              {statsLoading ? (
                <VStack align="stretch" spacing={3}>
                  <Skeleton height="20px" />
                  <Skeleton height="30px" width="60%" />
                  <Skeleton height="16px" width="40%" />
                </VStack>
              ) : (
                <Stat>
                  <HStack justify="space-between">
                    <StatLabel color="gray.600">AI Jobs Completed</StatLabel>
                    <Box p={2} bg="purple.100" borderRadius="lg">
                      <FaRobot color="purple.600" />
                    </Box>
                  </HStack>
                  <StatNumber color="purple.600">{stats?.aiJobsCompleted}</StatNumber>
                  <StatHelpText>
                    {stats?.aiJobsInProgress} in progress
                  </StatHelpText>
                </Stat>
              )}
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card bg={cardBg} shadow="sm">
            <CardBody>
              {statsLoading ? (
                <VStack align="stretch" spacing={3}>
                  <Skeleton height="20px" />
                  <Skeleton height="30px" width="60%" />
                  <Skeleton height="16px" width="40%" />
                </VStack>
              ) : (
                <Stat>
                  <HStack justify="space-between">
                    <StatLabel color="gray.600">Monthly Activity</StatLabel>
                    <Box p={2} bg="orange.100" borderRadius="lg">
                      <FaChartLine color="orange.600" />
                    </Box>
                  </HStack>
                  <StatNumber color="orange.600">{stats?.searchesThisMonth}</StatNumber>
                  <StatHelpText>
                    searches this month
                  </StatHelpText>
                </Stat>
              )}
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Main Content Grid */}
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
        {/* System Status */}
        <GridItem>
          <Card bg={cardBg} shadow="sm">
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">System Status</Heading>
                <IconButton
                  aria-label="Refresh stats"
                  icon={<FaSync />}
                  size="sm"
                  variant="ghost"
                  onClick={() => refetchStats()}
                  isLoading={statsLoading}
                />
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Alert status="success" borderRadius="lg">
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="medium">All systems operational</Text>
                    <Text fontSize="sm">
                      Real-time updates active • Companies House API connected • AI processing running
                    </Text>
                  </VStack>
                </Alert>

                <VStack spacing={4} align="stretch">
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm" fontWeight="medium">API Rate Limit Usage</Text>
                      <Text fontSize="sm" color="gray.600">432/600 requests</Text>
                    </HStack>
                    <Progress value={72} colorScheme="green" size="sm" borderRadius="full" />
                  </Box>

                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm" fontWeight="medium">Database Storage</Text>
                      <Text fontSize="sm" color="gray.600">2.4GB/10GB</Text>
                    </HStack>
                    <Progress value={24} colorScheme="blue" size="sm" borderRadius="full" />
                  </Box>

                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm" fontWeight="medium">AI Processing Queue</Text>
                      <Text fontSize="sm" color="gray.600">3 jobs pending</Text>
                    </HStack>
                    <Progress value={15} colorScheme="orange" size="sm" borderRadius="full" />
                  </Box>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>

        {/* Recent Activity */}
        <GridItem>
          <Card bg={cardBg} shadow="sm">
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">Recent Activity</Heading>
                <Button
                  size="sm"
                  variant="ghost"
                  rightIcon={<FaExternalLinkAlt />}
                  onClick={() => router.push('/dashboard/activities')}
                >
                  View All
                </Button>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {activitiesLoading ? (
                  [...Array(3)].map((_, i) => (
                    <HStack key={i} spacing={3}>
                      <Skeleton borderRadius="full" width="40px" height="40px" />
                      <VStack align="start" spacing={1} flex="1">
                        <Skeleton height="16px" width="80%" />
                        <Skeleton height="14px" width="60%" />
                      </VStack>
                    </HStack>
                  ))
                ) : recentActivities ? (
                  recentActivities.map((activity) => (
                    <HStack key={activity.id} spacing={3} align="start">
                      <Avatar
                        size="sm"
                        name={activity.user.name}
                        src={activity.user.avatar}
                        bg={`${getActivityColor(activity.type)}.500`}
                        icon={React.createElement(getActivityIcon(activity.type))}
                        color="white"
                      />
                      <VStack align="start" spacing={1} flex="1">
                        <Text fontSize="sm" lineHeight="short">
                          <Text as="span" fontWeight="medium">
                            {activity.user.name}
                          </Text>{' '}
                          {activity.description}
                        </Text>
                        <HStack spacing={2}>
                          <Badge
                            size="xs"
                            colorScheme={getActivityColor(activity.type)}
                            variant="subtle"
                          >
                            {activity.type.replace('_', ' ')}
                          </Badge>
                          <Text fontSize="xs" color="gray.500">
                            {format(new Date(activity.timestamp), 'MMM d, HH:mm')}
                          </Text>
                        </HStack>
                      </VStack>
                    </HStack>
                  ))
                ) : (
                  <Text color="gray.500" textAlign="center" py={4}>
                    No recent activity
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
            </VStack>
          </TabPanel>

          <TabPanel px={0}>
            <AdvancedAnalytics />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  )
}