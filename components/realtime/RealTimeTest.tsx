'use client'

import { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Button,
  Badge,
  Alert,
  AlertIcon,
  Code,
  Textarea,
  useColorModeValue,
} from '@chakra-ui/react'
import {
  FaPlay,
  FaStop,
  FaTrash,
  FaWifi,
  FaExclamationTriangle,
  FaDatabase,
} from 'react-icons/fa'
import { useRealTimeUpdates, RealTimeEvent } from '@/hooks/useRealTimeUpdates'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'

export default function RealTimeTest() {
  const [events, setEvents] = useState<RealTimeEvent[]>([])
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [testData, setTestData] = useState('')

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const handleRealTimeEvent = (event: RealTimeEvent) => {
    setEvents(prev => [event, ...prev.slice(0, 49)]) // Keep max 50 events
    toast.success(`Real-time event: ${event.table} ${event.eventType}`)
  }

  const { subscriptionStatus, reconnectAll, isEnabled, connectedTables } = useRealTimeUpdates({
    onEvent: handleRealTimeEvent,
    enabled: isTestRunning,
  })

  const simulateEvent = async () => {
    if (!testData.trim()) {
      toast.error('Please enter test data')
      return
    }

    try {
      // This would normally trigger a database change that would be picked up by real-time subscriptions
      // For testing purposes, we'll simulate by creating a mock event
      const mockEvent: RealTimeEvent = {
        table: 'companies',
        eventType: 'INSERT',
        new: JSON.parse(testData),
        old: undefined,
        timestamp: new Date().toISOString(),
      }
      
      handleRealTimeEvent(mockEvent)
      toast('Simulated real-time event')
    } catch (error) {
      toast.error('Invalid JSON data')
    }
  }

  const getConnectionStatus = () => {
    const connectedCount = connectedTables.length
    const totalTables = 5 // companies, persons, relationships, ai_processing_jobs, user_activities
    
    if (!isEnabled) return { color: 'gray', label: 'Disabled', icon: FaExclamationTriangle }
    if (connectedCount === 0) return { color: 'red', label: 'Disconnected', icon: FaExclamationTriangle }
    if (connectedCount < totalTables) return { color: 'orange', label: 'Partial', icon: FaWifi }
    return { color: 'green', label: 'Connected', icon: FaWifi }
  }

  const connectionStatus = getConnectionStatus()

  return (
    <VStack spacing={6} align="stretch">
      <Card bg={cardBg} shadow="sm">
        <CardHeader>
          <HStack justify="space-between">
            <Heading size="md">Real-Time Connection Test</Heading>
            <HStack spacing={2}>
              <Badge
                colorScheme={connectionStatus.color}
                variant="subtle"
                fontSize="sm"
                px={3}
                py={1}
              >
                <HStack spacing={1}>
                  <Box as={connectionStatus.icon} />
                  <Text>{connectionStatus.label}</Text>
                </HStack>
              </Badge>
              <Button
                size="sm"
                leftIcon={isTestRunning ? <FaStop /> : <FaPlay />}
                colorScheme={isTestRunning ? 'red' : 'green'}
                onClick={() => setIsTestRunning(!isTestRunning)}
              >
                {isTestRunning ? 'Stop Test' : 'Start Test'}
              </Button>
            </HStack>
          </HStack>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Alert status={isEnabled ? 'success' : 'warning'}>
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">
                  {isEnabled ? 'Real-time subscriptions active' : 'Real-time subscriptions inactive'}
                </Text>
                <Text fontSize="sm">
                  Connected to {connectedTables.length} tables: {connectedTables.join(', ') || 'None'}
                </Text>
              </VStack>
            </Alert>

            {/* Connection Status Details */}
            <Box>
              <Heading size="sm" mb={3}>Connection Status</Heading>
              <VStack spacing={2} align="stretch">
                {Object.entries(subscriptionStatus).map(([table, status]) => (
                  <HStack key={table} justify="space-between">
                    <Text fontSize="sm">{table}</Text>
                    <Badge
                      colorScheme={
                        status === 'SUBSCRIBED' ? 'green' :
                        status === 'CONNECTING' ? 'orange' : 'red'
                      }
                      size="sm"
                    >
                      {status}
                    </Badge>
                  </HStack>
                ))}
              </VStack>
            </Box>

            {/* Test Data Input */}
            <Box>
              <Heading size="sm" mb={2}>Simulate Event</Heading>
              <VStack spacing={2} align="stretch">
                <Textarea
                  placeholder={`Enter test JSON data, e.g.:
{
  "company_number": "12345678",
  "company_name": "Test Company Ltd",
  "company_status": "active"
}`}
                  value={testData}
                  onChange={(e) => setTestData(e.target.value)}
                  rows={6}
                  fontFamily="mono"
                  fontSize="sm"
                />
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    leftIcon={<FaDatabase />}
                    onClick={simulateEvent}
                    isDisabled={!isTestRunning}
                  >
                    Simulate Database Change
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={reconnectAll}
                  >
                    Reconnect All
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </CardBody>
      </Card>

      {/* Events Log */}
      <Card bg={cardBg} shadow="sm">
        <CardHeader>
          <HStack justify="space-between">
            <Heading size="md">Real-Time Events Log</Heading>
            <HStack spacing={2}>
              <Text fontSize="sm" color="gray.600">
                {events.length} events
              </Text>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<FaTrash />}
                onClick={() => setEvents([])}
                isDisabled={events.length === 0}
              >
                Clear
              </Button>
            </HStack>
          </HStack>
        </CardHeader>
        <CardBody>
          <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
            {events.length === 0 ? (
              <Box textAlign="center" py={8} color="gray.500">
                <FaDatabase size={48} opacity={0.3} />
                <Text mt={2}>No real-time events yet</Text>
                <Text fontSize="sm">Start the test to see live database changes</Text>
              </Box>
            ) : (
              events.map((event, index) => (
                <Card key={`${event.timestamp}-${index}`} variant="outline" size="sm">
                  <CardBody p={3}>
                    <VStack align="stretch" spacing={2}>
                      <HStack justify="space-between">
                        <HStack spacing={2}>
                          <Badge colorScheme="blue" size="sm">
                            {event.table}
                          </Badge>
                          <Badge
                            colorScheme={
                              event.eventType === 'INSERT' ? 'green' :
                              event.eventType === 'UPDATE' ? 'orange' : 'red'
                            }
                            size="sm"
                          >
                            {event.eventType}
                          </Badge>
                        </HStack>
                        <Text fontSize="xs" color="gray.500">
                          {format(new Date(event.timestamp), 'HH:mm:ss.SSS')}
                        </Text>
                      </HStack>
                      
                      {event.new && (
                        <Box>
                          <Text fontSize="xs" fontWeight="medium" mb={1}>New Data:</Text>
                          <Code fontSize="xs" p={2} borderRadius="md" display="block" whiteSpace="pre-wrap">
                            {JSON.stringify(event.new, null, 2)}
                          </Code>
                        </Box>
                      )}
                      
                      {event.old && (
                        <Box>
                          <Text fontSize="xs" fontWeight="medium" mb={1}>Old Data:</Text>
                          <Code fontSize="xs" p={2} borderRadius="md" display="block" whiteSpace="pre-wrap">
                            {JSON.stringify(event.old, null, 2)}
                          </Code>
                        </Box>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              ))
            )}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  )
}