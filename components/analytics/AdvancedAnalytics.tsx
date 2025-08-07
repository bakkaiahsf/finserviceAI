'use client'

import React, { useState, useEffect } from 'react'
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
  Progress,
  Badge,
  Button,
  IconButton,
  useColorModeValue,
  ResponsiveValue,
  Flex,
  Divider,
  List,
  ListItem,
  ListIcon,
  Avatar,
} from '@chakra-ui/react'
import {
  FaArrowUp,
  FaArrowDown,
  FaArrowUp as FaTrendingUp,
  FaArrowDown as FaTrendingDown,
  FaExclamationTriangle,
  FaCheckCircle,
  FaEye,
  FaRobot,
  FaChartLine,
  FaUsers,
  FaBuilding,
  FaShieldAlt,
  FaGlobe,
  FaClock,
} from 'react-icons/fa'

interface AnalyticsData {
  overview: {
    totalCompanies: number
    totalPersons: number
    totalRelationships: number
    riskScore: number
    complianceScore: number
    lastUpdated: string
  }
  trends: {
    companiesGrowth: number
    personsGrowth: number
    relationshipsGrowth: number
    riskTrend: 'up' | 'down' | 'stable'
  }
  riskDistribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
  topRisks: Array<{
    id: string
    company: string
    riskLevel: string
    description: string
    score: number
  }>
  recentActivity: Array<{
    id: string
    type: 'analysis' | 'risk_alert' | 'compliance_check' | 'data_update'
    description: string
    timestamp: string
    severity?: 'low' | 'medium' | 'high'
  }>
  insights: Array<{
    title: string
    description: string
    impact: 'positive' | 'negative' | 'neutral'
    actionRequired: boolean
  }>
}

// Mock data for demonstration
const mockAnalyticsData: AnalyticsData = {
  overview: {
    totalCompanies: 1247,
    totalPersons: 3456,
    totalRelationships: 8732,
    riskScore: 72,
    complianceScore: 89,
    lastUpdated: new Date().toISOString(),
  },
  trends: {
    companiesGrowth: 12.5,
    personsGrowth: 8.3,
    relationshipsGrowth: 15.7,
    riskTrend: 'down',
  },
  riskDistribution: {
    low: 65,
    medium: 23,
    high: 9,
    critical: 3,
  },
  topRisks: [
    {
      id: '1',
      company: 'High Risk Holdings Ltd',
      riskLevel: 'critical',
      description: 'Multiple shell company layers detected',
      score: 95,
    },
    {
      id: '2',
      company: 'Offshore Ventures PLC',
      riskLevel: 'high',
      description: 'Complex beneficial ownership structure',
      score: 87,
    },
    {
      id: '3',
      company: 'Complex Networks Ltd',
      riskLevel: 'high',
      description: 'Circular ownership pattern identified',
      score: 82,
    },
  ],
  recentActivity: [
    {
      id: '1',
      type: 'risk_alert',
      description: 'New high-risk entity detected in network analysis',
      timestamp: '2 minutes ago',
      severity: 'high',
    },
    {
      id: '2',
      type: 'analysis',
      description: 'AI analysis completed for British Airways PLC network',
      timestamp: '15 minutes ago',
    },
    {
      id: '3',
      type: 'compliance_check',
      description: 'Monthly compliance scan completed',
      timestamp: '1 hour ago',
      severity: 'medium',
    },
    {
      id: '4',
      type: 'data_update',
      description: 'Companies House data refresh completed',
      timestamp: '3 hours ago',
    },
  ],
  insights: [
    {
      title: 'Risk Concentration',
      description: 'High risk entities are concentrated in financial services sector',
      impact: 'negative',
      actionRequired: true,
    },
    {
      title: 'Compliance Improvement',
      description: 'Overall compliance score improved by 12% this month',
      impact: 'positive',
      actionRequired: false,
    },
    {
      title: 'Network Complexity',
      description: 'Average network depth increased, suggesting more complex structures',
      impact: 'neutral',
      actionRequired: true,
    },
  ],
}

export default function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData>(mockAnalyticsData)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'red'
      case 'high': return 'orange'
      case 'medium': return 'yellow'
      case 'low': return 'green'
      default: return 'gray'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'analysis': return FaRobot
      case 'risk_alert': return FaExclamationTriangle
      case 'compliance_check': return FaShieldAlt
      case 'data_update': return FaClock
      default: return FaClock
    }
  }

  const getActivityColor = (type: string, severity?: string) => {
    if (severity) {
      switch (severity) {
        case 'high': return 'red.500'
        case 'medium': return 'orange.500'
        case 'low': return 'yellow.500'
        default: return 'blue.500'
      }
    }
    
    switch (type) {
      case 'analysis': return 'blue.500'
      case 'risk_alert': return 'red.500'
      case 'compliance_check': return 'green.500'
      case 'data_update': return 'gray.500'
      default: return 'gray.500'
    }
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <VStack align="start" spacing={1}>
          <Heading size="lg">Advanced Analytics</Heading>
          <Text color="gray.600">
            AI-powered insights and risk analysis dashboard
          </Text>
        </VStack>
        
        <HStack spacing={3}>
          {['7d', '30d', '90d', '1y'].map((timeframe) => (
            <Button
              key={timeframe}
              size="sm"
              variant={selectedTimeframe === timeframe ? 'solid' : 'outline'}
              colorScheme="brand"
              onClick={() => setSelectedTimeframe(timeframe)}
            >
              {timeframe}
            </Button>
          ))}
        </HStack>
      </Flex>

      {/* Overview Stats */}
      <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Total Companies</StatLabel>
              <StatNumber>{data.overview.totalCompanies.toLocaleString()}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                {data.trends.companiesGrowth}% from last month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Network Entities</StatLabel>
              <StatNumber>{data.overview.totalPersons.toLocaleString()}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                {data.trends.personsGrowth}% from last month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Relationships</StatLabel>
              <StatNumber>{data.overview.totalRelationships.toLocaleString()}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                {data.trends.relationshipsGrowth}% from last month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardBody>
            <VStack align="start" spacing={3}>
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Risk Score
              </Text>
              <HStack spacing={3} w="full">
                <Text fontSize="2xl" fontWeight="bold">
                  {data.overview.riskScore}
                </Text>
                <Box flex="1">
                  <Progress
                    value={data.overview.riskScore}
                    colorScheme={data.overview.riskScore > 80 ? 'red' : data.overview.riskScore > 60 ? 'orange' : 'green'}
                    size="md"
                    borderRadius="full"
                  />
                </Box>
              </HStack>
              <Text fontSize="xs" color="gray.500">
                {data.trends.riskTrend === 'down' ? '↓ Improving' : data.trends.riskTrend === 'up' ? '↑ Worsening' : '→ Stable'}
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </Grid>

      {/* Main Content Grid */}
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        {/* Left Column */}
        <VStack spacing={6}>
          {/* Risk Distribution */}
          <Card bg={cardBg} w="full">
            <CardHeader>
              <Heading size="md">Risk Distribution</Heading>
            </CardHeader>
            <CardBody>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                {Object.entries(data.riskDistribution).map(([level, percentage]) => (
                  <VStack key={level} spacing={2}>
                    <Badge
                      colorScheme={getRiskColor(level)}
                      size="lg"
                      px={3}
                      py={1}
                    >
                      {level.toUpperCase()}
                    </Badge>
                    <Text fontSize="2xl" fontWeight="bold">
                      {percentage}%
                    </Text>
                    <Progress
                      value={percentage}
                      colorScheme={getRiskColor(level)}
                      size="sm"
                      w="full"
                      borderRadius="full"
                    />
                  </VStack>
                ))}
              </Grid>
            </CardBody>
          </Card>

          {/* AI Insights */}
          <Card bg={cardBg} w="full">
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">AI Insights</Heading>
                <Button leftIcon={<FaRobot />} size="sm" variant="outline">
                  Refresh Analysis
                </Button>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {data.insights.map((insight, index) => (
                  <Box key={index} p={4} border="1px" borderColor={borderColor} borderRadius="lg">
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="bold" fontSize="sm">
                        {insight.title}
                      </Text>
                      <HStack spacing={2}>
                        {insight.actionRequired && (
                          <Badge colorScheme="orange" size="sm">
                            Action Required
                          </Badge>
                        )}
                        <Badge 
                          colorScheme={
                            insight.impact === 'positive' ? 'green' : 
                            insight.impact === 'negative' ? 'red' : 'gray'
                          }
                          size="sm"
                        >
                          {insight.impact}
                        </Badge>
                      </HStack>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                      {insight.description}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </VStack>

        {/* Right Column */}
        <VStack spacing={6}>
          {/* Top Risks */}
          <Card bg={cardBg} w="full">
            <CardHeader>
              <Heading size="md">Top Risk Entities</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                {data.topRisks.map((risk) => (
                  <Box key={risk.id} p={3} border="1px" borderColor={borderColor} borderRadius="md">
                    <HStack justify="space-between" mb={1}>
                      <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                        {risk.company}
                      </Text>
                      <Badge colorScheme={getRiskColor(risk.riskLevel)} size="sm">
                        {risk.score}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="gray.600">
                      {risk.description}
                    </Text>
                    <Progress
                      value={risk.score}
                      colorScheme={getRiskColor(risk.riskLevel)}
                      size="xs"
                      mt={2}
                      borderRadius="full"
                    />
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Recent Activity */}
          <Card bg={cardBg} w="full">
            <CardHeader>
              <Heading size="md">Recent Activity</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                {data.recentActivity.map((activity) => (
                  <HStack key={activity.id} spacing={3} align="start">
                    <Avatar
                      size="sm"
                      bg={getActivityColor(activity.type, activity.severity)}
                      icon={React.createElement(getActivityIcon(activity.type))}
                      color="white"
                    />
                    <VStack align="start" spacing={1} flex="1">
                      <Text fontSize="sm" lineHeight="short">
                        {activity.description}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {activity.timestamp}
                      </Text>
                    </VStack>
                    {activity.severity && (
                      <Badge 
                        colorScheme={
                          activity.severity === 'high' ? 'red' : 
                          activity.severity === 'medium' ? 'orange' : 'yellow'
                        }
                        size="sm"
                      >
                        {activity.severity}
                      </Badge>
                    )}
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Compliance Score */}
          <Card bg={cardBg} w="full">
            <CardHeader>
              <Heading size="md">Compliance Score</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <Box textAlign="center">
                  <Text fontSize="3xl" fontWeight="bold" color="green.500">
                    {data.overview.complianceScore}%
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Overall Compliance Rating
                  </Text>
                </Box>
                
                <Progress
                  value={data.overview.complianceScore}
                  colorScheme="green"
                  size="lg"
                  borderRadius="full"
                  w="full"
                />
                
                <VStack spacing={2} w="full">
                  <HStack justify="space-between" w="full">
                    <Text fontSize="sm">KYC Compliance</Text>
                    <Text fontSize="sm" fontWeight="bold">94%</Text>
                  </HStack>
                  <HStack justify="space-between" w="full">
                    <Text fontSize="sm">AML Screening</Text>
                    <Text fontSize="sm" fontWeight="bold">87%</Text>
                  </HStack>
                  <HStack justify="space-between" w="full">
                    <Text fontSize="sm">Data Quality</Text>
                    <Text fontSize="sm" fontWeight="bold">91%</Text>
                  </HStack>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Grid>
    </VStack>
  )
}