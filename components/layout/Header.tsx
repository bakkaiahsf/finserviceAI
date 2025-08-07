'use client'

import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Button,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
  IconButton,
  useColorModeValue,
  Spinner,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react'
import {
  FaUser,
  FaSignOutAlt,
  FaCog,
  FaBars,
  FaHome,
  FaSearch,
  FaSignInAlt,
  FaChartLine,
} from 'react-icons/fa'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface HeaderProps {
  onMenuOpen?: () => void
  showMobileMenu?: boolean
}

export default function Header({ onMenuOpen, showMobileMenu = true }: HeaderProps) {
  const { user, profile, signOut, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const headerBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
      router.push('/')
    } catch (error: any) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    }
  }

  const handleSignIn = () => {
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <Box
        bg={headerBg}
        borderBottom="1px"
        borderColor={borderColor}
        px={6}
        py={4}
        position="sticky"
        top={0}
        zIndex={1000}
        shadow="sm"
      >
        <Flex align="center" justify="space-between">
          <HStack spacing={4}>
            <Box w={8} h={8} bg="brand.500" borderRadius="md" />
            <Text fontSize="xl" fontWeight="bold" color="brand.600">
              Nexus AI
            </Text>
          </HStack>
          <Spinner size="sm" />
        </Flex>
      </Box>
    )
  }

  return (
    <>
      <Box
        bg={headerBg}
        borderBottom="1px"
        borderColor={borderColor}
        px={6}
        py={4}
        position="sticky"
        top={0}
        zIndex={1000}
        shadow="sm"
      >
        <Flex align="center" justify="space-between">
          {/* Left side - Logo and Navigation */}
          <HStack spacing={6}>
            {/* Mobile menu button */}
            {showMobileMenu && (
              <IconButton
                aria-label="Open menu"
                icon={<FaBars />}
                variant="ghost"
                display={{ base: 'flex', lg: 'none' }}
                onClick={onMenuOpen || onOpen}
              />
            )}

            {/* Logo */}
            <HStack spacing={3} as={Link} href="/" cursor="pointer">
              <Box w={8} h={8} bg="brand.500" borderRadius="md" />
              <VStack align="start" spacing={0}>
                <Text fontSize="xl" fontWeight="bold" color="brand.600">
                  Nexus AI
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Corporate Intelligence
                </Text>
              </VStack>
            </HStack>

            {/* Desktop Navigation - Only show if authenticated */}
            {isAuthenticated && (
              <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
                <Button
                  as={Link}
                  href="/dashboard"
                  leftIcon={<FaHome />}
                  variant="ghost"
                  size="sm"
                >
                  Dashboard
                </Button>
                <Button
                  as={Link}
                  href="/dashboard/search"
                  leftIcon={<FaSearch />}
                  variant="ghost"
                  size="sm"
                >
                  Search
                </Button>
                <Button
                  as={Link}
                  href="/dashboard/visualization"
                  leftIcon={<FaChartLine />}
                  variant="ghost"
                  size="sm"
                >
                  Network
                </Button>
              </HStack>
            )}
          </HStack>

          {/* Right side - User menu or Sign in */}
          <HStack spacing={3}>
            {isAuthenticated && user && profile ? (
              /* Authenticated User Menu */
              <Menu>
                <MenuButton>
                  <HStack
                    spacing={3}
                    cursor="pointer"
                    p={2}
                    borderRadius="lg"
                    _hover={{ bg: 'gray.100' }}
                    transition="all 0.2s"
                  >
                    <Avatar
                      size="sm"
                      src={profile.avatar_url || undefined}
                      name={profile.full_name || profile.email}
                      bg="brand.500"
                    />
                    <VStack align="start" spacing={0} display={{ base: 'none', md: 'flex' }}>
                      <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                        {profile.full_name || profile.email?.split('@')[0] || 'User'}
                      </Text>
                      <HStack spacing={1}>
                        <Badge
                          size="xs"
                          colorScheme={
                            profile.role === 'admin' ? 'red' :
                            profile.role === 'compliance_officer' ? 'orange' :
                            profile.role === 'analyst' ? 'blue' : 'gray'
                          }
                          variant="subtle"
                        >
                          {profile.role?.replace('_', ' ') || 'viewer'}
                        </Badge>
                      </HStack>
                    </VStack>
                  </HStack>
                </MenuButton>
                <MenuList>
                  <MenuItem
                    icon={<FaUser />}
                    onClick={() => router.push('/dashboard/settings/profile')}
                  >
                    Profile Settings
                  </MenuItem>
                  <MenuItem
                    icon={<FaCog />}
                    onClick={() => router.push('/dashboard/settings')}
                  >
                    Preferences
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem
                    icon={<FaSignOutAlt />}
                    onClick={handleSignOut}
                    color="red.600"
                  >
                    Sign Out
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              /* Sign In Button */
              <Button
                leftIcon={<FaSignInAlt />}
                colorScheme="brand"
                variant="solid"
                size="md"
                onClick={handleSignIn}
              >
                Sign In
              </Button>
            )}
          </HStack>
        </Flex>
      </Box>

      {/* Mobile Navigation Drawer */}
      {isAuthenticated && (
        <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <Box p={6}>
              <VStack spacing={4} align="stretch">
                <Box>
                  <HStack spacing={3}>
                    <Avatar
                      size="md"
                      src={profile?.avatar_url || undefined}
                      name={profile?.full_name || profile?.email}
                      bg="brand.500"
                    />
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">
                        {profile?.full_name || profile?.email?.split('@')[0] || 'User'}
                      </Text>
                      <Badge
                        size="sm"
                        colorScheme={
                          profile?.role === 'admin' ? 'red' :
                          profile?.role === 'compliance_officer' ? 'orange' :
                          profile?.role === 'analyst' ? 'blue' : 'gray'
                        }
                      >
                        {profile?.role?.replace('_', ' ') || 'viewer'}
                      </Badge>
                    </VStack>
                  </HStack>
                </Box>

                <VStack spacing={2} align="stretch">
                  <Button
                    as={Link}
                    href="/dashboard"
                    leftIcon={<FaHome />}
                    justifyContent="flex-start"
                    variant="ghost"
                    onClick={onClose}
                  >
                    Dashboard
                  </Button>
                  <Button
                    as={Link}
                    href="/dashboard/search"
                    leftIcon={<FaSearch />}
                    justifyContent="flex-start"
                    variant="ghost"
                    onClick={onClose}
                  >
                    Company Search
                  </Button>
                  <Button
                    as={Link}
                    href="/dashboard/visualization"
                    leftIcon={<FaChartLine />}
                    justifyContent="flex-start"
                    variant="ghost"
                    onClick={onClose}
                  >
                    Network Graph
                  </Button>
                </VStack>

                <Box pt={4}>
                  <Button
                    leftIcon={<FaSignOutAlt />}
                    onClick={handleSignOut}
                    variant="outline"
                    colorScheme="red"
                    w="full"
                  >
                    Sign Out
                  </Button>
                </Box>
              </VStack>
            </Box>
          </DrawerContent>
        </Drawer>
      )}
    </>
  )
}