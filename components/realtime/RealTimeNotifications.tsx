'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  Button,
  IconButton,
  Collapse,
  useColorModeValue,
  Avatar,
  Divider,
  Tooltip,
  Alert,
  AlertIcon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
} from '@chakra-ui/react'
import {
  FaBell,
  FaCheck,
  FaTimes,
  FaEye,
  FaRobot,
  FaBuilding,
  FaUsers,
  FaCog,
  FaChevronUp,
  FaChevronDown,
} from 'react-icons/fa'
import { useRealTimeUpdates, RealTimeEvent } from '@/hooks/useRealTimeUpdates'
import { format, formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
  metadata?: {
    entityId?: string
    entityType?: 'company' | 'person' | 'job'
    userId?: string
  }
}

export default function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const { profile } = useAuth()
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')

  const handleRealTimeEvent = (event: RealTimeEvent) => {
    const notification = createNotificationFromEvent(event)
    if (notification) {
      setNotifications(prev => [notification, ...prev.slice(0, 49)]) // Keep max 50 notifications
    }
  }

  const { subscriptionStatus, reconnectAll, isEnabled } = useRealTimeUpdates({
    onEvent: handleRealTimeEvent,
    enabled: true,
  })

  const createNotificationFromEvent = (event: RealTimeEvent): Notification | null => {
    const { table, eventType, new: newRecord, old: oldRecord } = event

    const baseNotification = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: event.timestamp,
      read: false,
    }

    switch (table) {
      case 'companies':
        if (eventType === 'INSERT') {
          return {
            ...baseNotification,
            type: 'success' as const,
            title: 'New Company Added',
            message: `${newRecord.company_name} has been added to the database`,
            metadata: {
              entityId: newRecord.company_number,
              entityType: 'company',
            },
          }
        } else if (eventType === 'UPDATE' && newRecord.company_status !== oldRecord?.company_status) {
          return {
            ...baseNotification,
            type: 'info' as const,
            title: 'Company Status Changed',
            message: `${newRecord.company_name} status changed from ${oldRecord?.company_status || 'unknown'} to ${newRecord.company_status}`,
            metadata: {
              entityId: newRecord.company_number,
              entityType: 'company',
            },
          }
        }
        break

      case 'ai_processing_jobs':
        if (eventType === 'UPDATE' && newRecord.status !== oldRecord?.status) {
          const jobType = newRecord.job_type || 'Processing job'
          
          if (newRecord.status === 'completed') {
            return {
              ...baseNotification,
              type: 'success' as const,
              title: 'AI Analysis Complete',
              message: `${jobType} completed successfully`,
              metadata: {
                entityId: newRecord.id,
                entityType: 'job',
              },
            }
          } else if (newRecord.status === 'failed') {
            return {
              ...baseNotification,
              type: 'error' as const,
              title: 'AI Analysis Failed',
              message: `${jobType} failed: ${newRecord.error_message || 'Unknown error'}`,
              metadata: {
                entityId: newRecord.id,
                entityType: 'job',
              },
            }
          }
        }
        break

      case 'relationships':
        if (eventType === 'INSERT') {
          return {
            ...baseNotification,
            type: 'info' as const,
            title: 'New Relationship Detected',
            message: `New ${newRecord.relationship_type} relationship discovered`,
            metadata: {
              entityId: newRecord.id,
              entityType: 'person',
            },
          }
        }
        break

      case 'user_activities':
        if (eventType === 'INSERT' && newRecord.user_id !== profile?.id) {
          const activityTypes: Record<string, string> = {
            'company_analyzed': 'analyzed a company',
            'report_generated': 'generated a report',
            'bulk_analysis': 'performed bulk analysis',
            'data_export': 'exported data',
          }
          
          const action = activityTypes[newRecord.activity_type] || newRecord.activity_type
          
          return {
            ...baseNotification,
            type: 'info' as const,
            title: 'Team Activity',
            message: `${newRecord.user_name || 'A team member'} ${action}`,
            metadata: {
              userId: newRecord.user_id,
            },
          }
        }
        break
    }

    return null
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return FaCheck
      case 'error': return FaTimes
      case 'warning': return FaCog
      default: return FaBell
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'green'
      case 'error': return 'red'
      case 'warning': return 'orange'
      default: return 'blue'
    }
  }

  // Auto-mark notifications as read after 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNotifications(prev =>
        prev.map(n => 
          !n.read && Date.now() - new Date(n.timestamp).getTime() > 10000
            ? { ...n, read: true }
            : n
        )
      )
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  return (
    <>
      <Box position="relative">
        <Tooltip label="Real-time Notifications">
          <IconButton
            aria-label="Notifications"
            icon={<FaBell />}
            variant="ghost"
            position="relative"
            onClick={() => setIsExpanded(!isExpanded)}
            color={unreadCount > 0 ? 'blue.500' : 'gray.600'}
          />
        </Tooltip>

        {unreadCount > 0 && (
          <Badge
            position="absolute"
            top="-1"
            right="-1"
            colorScheme="red"
            borderRadius="full"
            minW="20px"
            h="20px"
            fontSize="xs"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}

        <Collapse in={isExpanded} animateOpacity>
          <Card
            position="absolute"
            top="100%"
            right="0"
            mt={2}
            w="400px"
            maxH="500px"
            bg={cardBg}
            shadow="xl"
            border="1px"
            borderColor={borderColor}
            zIndex={10}
          >
            <CardBody p={0}>
              <VStack spacing={0} align="stretch">
                {/* Header */}
                <HStack justify="space-between" p={4} borderBottomWidth="1px">
                  <Text fontWeight="semibold">
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                  </Text>
                  <HStack spacing={2}>
                    {!isEnabled && (
                      <Tooltip label="Reconnect to real-time updates">
                        <IconButton
                          aria-label="Reconnect"
                          icon={<FaCog />}
                          size="xs"
                          variant="ghost"
                          colorScheme="orange"
                          onClick={reconnectAll}
                        />
                      </Tooltip>
                    )}
                    {notifications.length > 0 && (
                      <Button size="xs" variant="ghost" onClick={onOpen}>
                        View All
                      </Button>
                    )}
                    <IconButton
                      aria-label="Close notifications"
                      icon={isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      size="xs"
                      variant="ghost"
                      onClick={() => setIsExpanded(false)}
                    />
                  </HStack>
                </HStack>

                {/* Status */}
                {!isEnabled && (
                  <Alert status="warning" size="sm">
                    <AlertIcon />
                    <Text fontSize="sm">Real-time updates disconnected</Text>
                  </Alert>
                )}

                {/* Recent Notifications */}
                <Box maxH="300px" overflowY="auto">
                  {notifications.slice(0, 5).length === 0 ? (
                    <Box p={8} textAlign="center">
                      <FaBell size={32} color="gray.300" />
                      <Text mt={2} color="gray.500" fontSize="sm">
                        No notifications yet
                      </Text>
                    </Box>
                  ) : (
                    notifications.slice(0, 5).map((notification, index) => (
                      <Box
                        key={notification.id}
                        p={3}
                        borderBottomWidth={index < 4 ? "1px" : "0"}
                        _hover={{ bg: hoverBg }}
                        opacity={notification.read ? 0.7 : 1}
                        cursor="pointer"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <HStack align="start" spacing={3}>
                          <Avatar
                            size="sm"
                            bg={`${getNotificationColor(notification.type)}.500`}
                            icon={React.createElement(getNotificationIcon(notification.type))}
                            color="white"
                          />
                          <VStack align="start" spacing={1} flex="1">
                            <Text fontSize="sm" fontWeight="medium" lineHeight="shorter">
                              {notification.title}
                            </Text>
                            <Text fontSize="xs" color="gray.600" lineHeight="shorter">
                              {notification.message}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                            </Text>
                          </VStack>
                          {!notification.read && (
                            <Box w="8px" h="8px" bg="blue.500" borderRadius="full" />
                          )}
                        </HStack>
                      </Box>
                    ))
                  )}
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </Collapse>
      </Box>

      {/* Full Notifications Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent maxH="80vh">
          <ModalHeader>
            <HStack justify="space-between">
              <Text>All Notifications</Text>
              <HStack spacing={2}>
                {unreadCount > 0 && (
                  <Button size="sm" variant="ghost" onClick={markAllAsRead}>
                    Mark All Read
                  </Button>
                )}
                <Button size="sm" variant="ghost" colorScheme="red" onClick={clearNotifications}>
                  Clear All
                </Button>
              </HStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} overflowY="auto">
            <VStack spacing={3} align="stretch">
              {notifications.map((notification, index) => (
                <Card
                  key={notification.id}
                  variant={notification.read ? 'outline' : 'elevated'}
                  opacity={notification.read ? 0.8 : 1}
                >
                  <CardBody p={4}>
                    <HStack align="start" spacing={3}>
                      <Avatar
                        size="md"
                        bg={`${getNotificationColor(notification.type)}.500`}
                        icon={React.createElement(getNotificationIcon(notification.type))}
                        color="white"
                      />
                      <VStack align="start" spacing={2} flex="1">
                        <HStack justify="space-between" w="full">
                          <Text fontWeight="medium">{notification.title}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {format(new Date(notification.timestamp), 'MMM d, yyyy HH:mm')}
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          {notification.message}
                        </Text>
                        {notification.action && (
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme={getNotificationColor(notification.type)}
                            onClick={notification.action.onClick}
                          >
                            {notification.action.label}
                          </Button>
                        )}
                      </VStack>
                      {!notification.read && (
                        <IconButton
                          aria-label="Mark as read"
                          icon={<FaEye />}
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                        />
                      )}
                    </HStack>
                  </CardBody>
                </Card>
              ))}
              
              {notifications.length === 0 && (
                <Box textAlign="center" py={12}>
                  <FaBell size={48} color="gray.300" />
                  <Text mt={4} color="gray.500">
                    No notifications to display
                  </Text>
                </Box>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}