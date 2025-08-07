'use client'

import { useState } from 'react'
import { 
  Box, 
  Flex, 
  VStack, 
  HStack, 
  Text, 
  Button, 
  Icon, 
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
  useColorModeValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  IconButton,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Container
} from '@chakra-ui/react'
import { 
  FaHome, 
  FaSearch, 
  FaBuilding, 
  FaUsers, 
  FaChartBar, 
  FaCog, 
  FaFileAlt,
  FaSignOutAlt,
  FaUser,
  FaBars,
  FaChevronRight
} from 'react-icons/fa'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import RealTimeNotifications from '@/components/realtime/RealTimeNotifications'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigationItems = [
  { 
    icon: FaHome, 
    label: 'Overview', 
    href: '/dashboard',
    description: 'Dashboard home and metrics'
  },
  { 
    icon: FaSearch, 
    label: 'Company Search', 
    href: '/dashboard/search',
    description: 'Search UK companies and entities'
  },
  { 
    icon: FaBuilding, 
    label: 'Companies', 
    href: '/dashboard/companies',
    description: 'Manage company profiles'
  },
  { 
    icon: FaUsers, 
    label: 'Officers & PSCs', 
    href: '/dashboard/officers',
    description: 'People with significant control'
  },
  { 
    icon: FaChartBar, 
    label: 'Network Graph', 
    href: '/dashboard/visualization',
    description: 'Interactive corporate structure visualization'
  },
  { 
    icon: FaChartBar, 
    label: 'Analytics', 
    href: '/dashboard/analytics',
    description: 'Business intelligence and insights',
    requiredRole: 'analyst' as const
  },
  { 
    icon: FaFileAlt, 
    label: 'Reports', 
    href: '/dashboard/reports',
    description: 'Generate compliance reports'
  },
  { 
    icon: FaCog, 
    label: 'Settings', 
    href: '/dashboard/settings',
    description: 'Account and system settings'
  }
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, profile, signOut, hasRole } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const sidebarBg = useColorModeValue('white', 'gray.800')
  const sidebarBorder = useColorModeValue('gray.200', 'gray.700')
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const headerBg = useColorModeValue('white', 'gray.800')
  
  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error: any) {
      toast.error('Failed to sign out')
    }
  }

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs = [{ label: 'Dashboard', href: '/dashboard' }]
    
    let currentPath = '/dashboard'
    for (let i = 1; i < segments.length; i++) {
      currentPath += `/${segments[i]}`
      const navItem = navigationItems.find(item => item.href === currentPath)
      breadcrumbs.push({
        label: navItem?.label || segments[i].charAt(0).toUpperCase() + segments[i].slice(1),
        href: currentPath
      })
    }
    
    return breadcrumbs
  }

  const SidebarContent = () => (
    <VStack spacing={6} align="stretch" h="full">
      {/* Logo and Brand */}
      <Box px={6} py={4}>
        <HStack spacing={3}>
          <Box w={8} h={8} bg="brand.500" borderRadius="md" />
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold" color="brand.600">
              Nexus AI
            </Text>
            <Text fontSize="xs" color="gray.500">
              Corporate Intelligence
            </Text>
          </VStack>
        </HStack>
      </Box>

      {/* Navigation */}
      <Box flex="1" px={3}>
        <VStack spacing={1} align="stretch">
          {navigationItems.map((item) => {
            if (item.requiredRole && !hasRole(item.requiredRole)) {
              return null
            }

            const isActive = pathname === item.href || 
                           (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <Button
                key={item.href}
                as={Link}
                href={item.href}
                leftIcon={<Icon as={item.icon} />}
                justifyContent="flex-start"
                variant={isActive ? 'solid' : 'ghost'}
                colorScheme={isActive ? 'brand' : 'gray'}
                size="md"
                fontWeight="medium"
                borderRadius="lg"
                px={4}
                py={3}
                h="auto"
                onClick={onClose}
                _hover={{
                  bg: isActive ? 'brand.600' : 'gray.100',
                  transform: 'translateX(2px)'
                }}
                transition="all 0.2s"
                position="relative"
              >
                <VStack align="start" spacing={1} flex="1">
                  <Text fontSize="sm">{item.label}</Text>
                  <Text fontSize="xs" color="gray.500" fontWeight="normal">
                    {item.description}
                  </Text>
                </VStack>
                {isActive && (
                  <Box
                    position="absolute"
                    right={-3}
                    top="50%"
                    transform="translateY(-50%)"
                    w={1}
                    h={8}
                    bg="brand.500"
                    borderRadius="full"
                  />
                )}
              </Button>
            )
          })}
        </VStack>
      </Box>

      {/* User Profile Section */}
      <Box px={3} pb={4}>
        <Box bg="gray.50" borderRadius="lg" p={4}>
          <HStack spacing={3}>
            <Avatar
              size="sm"
              src={profile?.avatar_url || undefined}
              name={profile?.full_name || profile?.email}
            />
            <VStack align="start" spacing={0} flex="1">
              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                {profile?.full_name || 'User'}
              </Text>
              <HStack spacing={1}>
                <Badge 
                  size="xs" 
                  colorScheme={
                    profile?.role === 'admin' ? 'red' :
                    profile?.role === 'compliance_officer' ? 'orange' :
                    profile?.role === 'analyst' ? 'blue' : 'gray'
                  }
                >
                  {profile?.role?.replace('_', ' ') || 'viewer'}
                </Badge>
              </HStack>
            </VStack>
          </HStack>
        </Box>
      </Box>
    </VStack>
  )

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Mobile drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent bg={sidebarBg}>
          <DrawerCloseButton />
          <SidebarContent />
        </DrawerContent>
      </Drawer>

      {/* Desktop sidebar */}
      <Box
        pos="fixed"
        left={0}
        top={0}
        w={80}
        h="100vh"
        bg={sidebarBg}
        borderRight="1px"
        borderColor={sidebarBorder}
        shadow="sm"
        zIndex={10}
        display={{ base: 'none', lg: 'block' }}
      >
        <SidebarContent />
      </Box>

      {/* Main content area */}
      <Box ml={{ base: 0, lg: 80 }}>
        {/* Header */}
        <Box
          bg={headerBg}
          borderBottom="1px"
          borderColor={sidebarBorder}
          px={6}
          py={4}
          position="sticky"
          top={0}
          zIndex={5}
          shadow="sm"
        >
          <Flex align="center" justify="space-between">
            <HStack spacing={4}>
              {/* Mobile menu button */}
              <IconButton
                aria-label="Open menu"
                icon={<FaBars />}
                variant="ghost"
                display={{ base: 'flex', lg: 'none' }}
                onClick={onOpen}
              />

              {/* Breadcrumbs */}
              <Breadcrumb 
                separator={<Icon as={FaChevronRight} color="gray.400" w={3} h={3} />}
                fontSize="sm"
              >
                {getBreadcrumbs().map((crumb, index) => (
                  <BreadcrumbItem key={crumb.href} isCurrentPage={index === getBreadcrumbs().length - 1}>
                    <BreadcrumbLink 
                      as={index === getBreadcrumbs().length - 1 ? Text : Link}
                      href={index === getBreadcrumbs().length - 1 ? undefined : crumb.href}
                      color={index === getBreadcrumbs().length - 1 ? "gray.700" : "gray.500"}
                      fontWeight={index === getBreadcrumbs().length - 1 ? "medium" : "normal"}
                    >
                      {crumb.label}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                ))}
              </Breadcrumb>
            </HStack>

            <HStack spacing={3}>
              {/* Real-time Notifications */}
              <RealTimeNotifications />

              {/* User menu */}
              <Menu>
                <MenuButton>
                  <HStack spacing={2} cursor="pointer" p={1} borderRadius="md" _hover={{ bg: 'gray.100' }}>
                    <Avatar
                      size="sm"
                      src={profile?.avatar_url || undefined}
                      name={profile?.full_name || profile?.email}
                    />
                    <VStack align="start" spacing={0} display={{ base: 'none', md: 'flex' }}>
                      <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                        {profile?.full_name || 'User'}
                      </Text>
                      <Text fontSize="xs" color="gray.500" noOfLines={1}>
                        {profile?.email}
                      </Text>
                    </VStack>
                  </HStack>
                </MenuButton>
                <MenuList>
                  <MenuItem icon={<FaUser />} onClick={() => router.push('/dashboard/settings/profile')}>
                    Profile Settings
                  </MenuItem>
                  <MenuItem onClick={() => router.push('/dashboard/settings')}>
                    Preferences
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem icon={<FaSignOutAlt />} onClick={handleSignOut} color="red.600">
                    Sign Out
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
        </Box>

        {/* Page content */}
        <Box p={6}>
          <Container maxW="8xl">
            {children}
          </Container>
        </Box>
      </Box>
    </Box>
  )
}