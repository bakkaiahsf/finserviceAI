'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Card,
  CardBody,
  Badge,
  Avatar,
  Heading,
  IconButton,
  Skeleton,
  Alert,
  AlertIcon,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Flex,
  Grid,
  GridItem,
  Divider,
  Tag,
  TagLabel,
  Tooltip,
  useColorModeValue,
  Spinner,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Container,
} from '@chakra-ui/react'
import {
  FaSearch,
  FaBuilding,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
  FaFileAlt,
  FaEye,
  FaBookmark,
  FaFilter,
  FaSort,
  FaTimes,
  FaChevronDown,
  FaExternalLinkAlt,
  FaRobot,
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowRight,
  FaClock,
  FaChartLine,
} from 'react-icons/fa'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { debounce } from 'lodash'

interface SearchResult {
  company_number: string
  title: string
  company_status?: string
  company_type?: string
  date_of_creation?: string
  address?: {
    premises?: string
    address_line_1?: string
    address_line_2?: string
    locality?: string
    region?: string
    postal_code?: string
    country?: string
  }
  description?: string
  snippet?: string
}

interface SearchResponse {
  total_results: number
  items: SearchResult[]
  start_index: number
  items_per_page: number
}

export default function ModernCompanySearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('relevance')
  const [currentPage, setCurrentPage] = useState(0)
  
  const { profile, isAuthenticated } = useAuth()
  const router = useRouter()

  // Theme colors
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  const accentColor = useColorModeValue('blue.500', 'blue.400')

  const itemsPerPage = 20

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setDebouncedQuery(query)
      setCurrentPage(0)
    }, 500),
    []
  )

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    debouncedSearch(value)
  }

  // Search companies query with better error handling
  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['modernCompanySearch', debouncedQuery, currentPage, sortBy],
    queryFn: async (): Promise<SearchResponse> => {
      if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) {
        return {
          total_results: 0,
          items: [],
          start_index: 0,
          items_per_page: itemsPerPage,
        }
      }

      const params = new URLSearchParams({
        q: debouncedQuery.trim(),
        items_per_page: itemsPerPage.toString(),
        start_index: (currentPage * itemsPerPage).toString(),
      })

      const response = await fetch(`/api/companies-house/search?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Search failed: ${response.status}`)
      }

      return response.json()
    },
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('429')) return false // Don't retry rate limits
      return failureCount < 2
    },
  })

  const handleCompanySelect = (companyNumber: string) => {
    router.push(`/dashboard/companies/${companyNumber}`)
  }

  const toggleCompanySelection = (companyNumber: string) => {
    setSelectedCompanies(prev => 
      prev.includes(companyNumber)
        ? prev.filter(id => id !== companyNumber)
        : [...prev, companyNumber]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'green'
      case 'liquidation': return 'red'
      case 'dissolved': return 'gray'
      case 'administration': return 'orange'
      default: return 'blue'
    }
  }

  const getRiskScore = () => Math.floor(Math.random() * 40) + 60 // Mock risk score 60-100

  const getCompanyTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      'ltd': 'Private Limited',
      'plc': 'Public Limited',
      'llp': 'Limited Liability Partnership',
      'limited-partnership': 'Limited Partnership',
      'private-limited-guarant-nsc-limited-exemption': 'Private Limited by Guarantee',
    }
    return typeMap[type?.toLowerCase()] || type?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
  }

  const formatAddress = (address: any) => {
    if (!address) return 'Address not available'
    
    const parts = [
      address.premises,
      address.address_line_1,
      address.address_line_2,
      address.locality,
      address.region,
      address.postal_code,
    ].filter(Boolean)
    
    return parts.join(', ')
  }

  const searchSuggestions = [
    { label: 'Apple Inc', type: 'name' },
    { label: '12345678', type: 'number' },
    { label: 'Microsoft Corporation', type: 'name' },
    { label: 'banking services', type: 'keyword' },
    { label: 'technology consulting', type: 'keyword' },
  ]

  return (
    <Container maxW="8xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="xl" mb={4} bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
            Corporate Intelligence Search
          </Heading>
          <Text color="gray.600" fontSize="lg" maxW="2xl" mx="auto">
            Search millions of UK companies with AI-powered insights, compliance data, and real-time intelligence
          </Text>
        </Box>

        {/* Enhanced Search Bar */}
        <Card bg={cardBg} shadow="lg" borderRadius="2xl">
          <CardBody p={8}>
            <VStack spacing={6}>
              <InputGroup size="lg">
                <InputLeftElement>
                  <FaSearch color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search by company name, number, or keywords..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  bg="white"
                  border="2px"
                  borderColor="gray.200"
                  borderRadius="xl"
                  fontSize="lg"
                  py={6}
                  _focus={{
                    borderColor: accentColor,
                    boxShadow: `0 0 0 1px ${accentColor}`,
                  }}
                  _hover={{ borderColor: 'gray.300' }}
                />
                <InputRightElement width="auto" pr={4}>
                  <HStack spacing={2}>
                    {searchQuery && (
                      <IconButton
                        aria-label="Clear search"
                        icon={<FaTimes />}
                        size="sm"
                        variant="ghost"
                        borderRadius="full"
                        onClick={() => handleSearchChange('')}
                      />
                    )}
                    {isLoading && <Spinner size="sm" color={accentColor} />}
                  </HStack>
                </InputRightElement>
              </InputGroup>

              {/* Search Options */}
              <Flex direction={{ base: 'column', md: 'row' }} gap={6} w="full" align="start">
                <VStack align="start" spacing={3} flex={1}>
                  <Text fontSize="sm" color="gray.600" fontWeight="semibold">Search Options</Text>
                  <HStack spacing={2} wrap="wrap">
                    <Badge colorScheme="blue" variant="outline" px={3} py={1}>Company Name</Badge>
                    <Badge colorScheme="green" variant="outline" px={3} py={1}>Registration Number</Badge>
                    <Badge colorScheme="purple" variant="outline" px={3} py={1}>Business Keywords</Badge>
                  </HStack>
                </VStack>
                
                <VStack align="start" spacing={3} flex={1}>
                  <Text fontSize="sm" color="gray.600" fontWeight="semibold">Quick Examples</Text>
                  <HStack spacing={2} wrap="wrap">
                    {searchSuggestions.map((suggestion, index) => (
                      <Tag
                        key={index}
                        size="md"
                        cursor="pointer"
                        colorScheme={suggestion.type === 'name' ? 'blue' : suggestion.type === 'number' ? 'green' : 'purple'}
                        variant="subtle"
                        borderRadius="full"
                        _hover={{ 
                          transform: 'translateY(-1px)',
                          shadow: 'md'
                        }}
                        onClick={() => handleSearchChange(suggestion.label)}
                        transition="all 0.2s"
                      >
                        <TagLabel>{suggestion.label}</TagLabel>
                      </Tag>
                    ))}
                  </HStack>
                </VStack>
              </Flex>
            </VStack>
          </CardBody>
        </Card>

        {/* Search Results */}
        {debouncedQuery.trim().length > 0 && (
          <Box>
            {/* Results Header */}
            {searchResults && searchResults.items.length > 0 && (
              <Flex justify="space-between" align="center" mb={6}>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xl" fontWeight="semibold">
                    {searchResults.total_results.toLocaleString()} companies found
                  </Text>
                  <Text color="gray.600" fontSize="sm">
                    Searching for "{debouncedQuery}"
                  </Text>
                </VStack>
                <HStack spacing={3}>
                  {selectedCompanies.length > 0 && (
                    <Button 
                      leftIcon={<FaRobot />} 
                      colorScheme="blue"
                      variant="solid"
                      borderRadius="xl"
                    >
                      Analyze Selected ({selectedCompanies.length})
                    </Button>
                  )}
                  <Menu>
                    <MenuButton as={Button} rightIcon={<FaChevronDown />} variant="outline" borderRadius="xl">
                      Sort: {sortBy}
                    </MenuButton>
                    <MenuList>
                      <MenuItem onClick={() => setSortBy('relevance')}>Relevance</MenuItem>
                      <MenuItem onClick={() => setSortBy('name')}>Company Name</MenuItem>
                      <MenuItem onClick={() => setSortBy('date')}>Date Created</MenuItem>
                    </MenuList>
                  </Menu>
                </HStack>
              </Flex>
            )}

            {/* Loading State */}
            {isLoading && (
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                {[...Array(6)].map((_, i) => (
                  <Card key={i} bg={cardBg} borderRadius="xl">
                    <CardBody p={6}>
                      <VStack align="start" spacing={4}>
                        <HStack spacing={4}>
                          <Skeleton borderRadius="full" width="60px" height="60px" />
                          <VStack align="start" spacing={2} flex={1}>
                            <Skeleton height="20px" width="80%" />
                            <Skeleton height="16px" width="60%" />
                          </VStack>
                        </HStack>
                        <Skeleton height="16px" width="90%" />
                        <Skeleton height="16px" width="70%" />
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            )}

            {/* Error State */}
            {error && (
              <Alert status="error" borderRadius="xl" bg="red.50" border="1px" borderColor="red.200">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="medium">Search Error</Text>
                  <Text fontSize="sm">
                    {error instanceof Error ? error.message : 'Failed to search companies. Please try again.'}
                  </Text>
                </VStack>
              </Alert>
            )}

            {/* No Results */}
            {searchResults && searchResults.items.length === 0 && !isLoading && (
              <Card bg={cardBg} borderRadius="xl">
                <CardBody textAlign="center" py={16}>
                  <VStack spacing={6}>
                    <Box p={4} bg="gray.100" borderRadius="full">
                      <FaSearch size={32} color="gray.400" />
                    </Box>
                    <VStack spacing={2}>
                      <Text fontSize="xl" fontWeight="medium">No companies found</Text>
                      <Text color="gray.600">
                        Try adjusting your search terms or check for typos
                      </Text>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Results Grid */}
            {searchResults && searchResults.items.length > 0 && (
              <VStack spacing={6} align="stretch">
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  {searchResults.items.map((company) => {
                    const riskScore = getRiskScore()
                    const isSelected = selectedCompanies.includes(company.company_number)
                    
                    return (
                      <Card
                        key={company.company_number}
                        bg={cardBg}
                        borderRadius="xl"
                        border="1px"
                        borderColor={isSelected ? 'blue.300' : borderColor}
                        cursor="pointer"
                        _hover={{ 
                          shadow: 'lg',
                          transform: 'translateY(-2px)',
                          borderColor: 'blue.300'
                        }}
                        transition="all 0.3s"
                        onClick={() => handleCompanySelect(company.company_number)}
                        position="relative"
                        overflow="hidden"
                      >
                        {isSelected && (
                          <Box
                            position="absolute"
                            top={0}
                            left={0}
                            right={0}
                            height="3px"
                            bg="blue.500"
                          />
                        )}
                        
                        <CardBody p={6}>
                          <VStack align="start" spacing={4}>
                            {/* Company Header */}
                            <HStack spacing={4} align="start" w="full">
                              <Avatar
                                name={company.title}
                                size="lg"
                                bg="blue.500"
                                color="white"
                                fontWeight="bold"
                              />
                              <VStack align="start" spacing={2} flex={1}>
                                <VStack align="start" spacing={1}>
                                  <Heading size="md" noOfLines={2} color="gray.800">
                                    {company.title}
                                  </Heading>
                                  <HStack spacing={2}>
                                    <Text fontSize="sm" color="gray.600">
                                      #{company.company_number}
                                    </Text>
                                    <Badge
                                      colorScheme={getStatusColor(company.company_status || '')}
                                      variant="solid"
                                      borderRadius="full"
                                    >
                                      {company.company_status || 'Unknown'}
                                    </Badge>
                                  </HStack>
                                </VStack>
                              </VStack>
                              
                              <VStack spacing={2}>
                                <IconButton
                                  aria-label={isSelected ? "Remove from watchlist" : "Add to watchlist"}
                                  icon={<FaBookmark />}
                                  size="sm"
                                  variant={isSelected ? "solid" : "outline"}
                                  colorScheme={isSelected ? "blue" : "gray"}
                                  borderRadius="full"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleCompanySelection(company.company_number)
                                  }}
                                />
                              </VStack>
                            </HStack>

                            {/* Company Details Grid */}
                            <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4} w="full">
                              <VStack align="start" spacing={3}>
                                <HStack spacing={2}>
                                  <FaBuilding color="gray.500" />
                                  <Text fontSize="sm" color="gray.700">
                                    {getCompanyTypeDisplay(company.company_type || '')}
                                  </Text>
                                </HStack>
                                
                                {company.date_of_creation && (
                                  <HStack spacing={2}>
                                    <FaCalendarAlt color="gray.500" />
                                    <Text fontSize="sm" color="gray.700">
                                      Founded {format(parseISO(company.date_of_creation), 'MMM yyyy')}
                                    </Text>
                                  </HStack>
                                )}

                                {company.address && (
                                  <HStack spacing={2} align="start">
                                    <FaMapMarkerAlt color="gray.500" style={{ marginTop: '2px' }} />
                                    <Text fontSize="sm" color="gray.700" lineHeight="short">
                                      {formatAddress(company.address)}
                                    </Text>
                                  </HStack>
                                )}
                              </VStack>

                              {/* Intelligence Panel */}
                              <VStack align="start" spacing={3} bg="gray.50" p={4} borderRadius="lg">
                                <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                                  <FaShieldAlt style={{ display: 'inline', marginRight: '8px' }} />
                                  Intelligence Summary
                                </Text>
                                
                                <VStack align="start" spacing={2} w="full">
                                  <HStack justify="space-between" w="full">
                                    <Text fontSize="xs" color="gray.600">Risk Score</Text>
                                    <HStack spacing={1}>
                                      <Text fontSize="xs" fontWeight="bold" color={riskScore >= 80 ? 'green.600' : riskScore >= 60 ? 'orange.500' : 'red.500'}>
                                        {riskScore}/100
                                      </Text>
                                      {riskScore >= 80 ? <FaCheckCircle color="green" size={12} /> : <FaExclamationTriangle color="orange" size={12} />}
                                    </HStack>
                                  </HStack>
                                  <Progress
                                    value={riskScore}
                                    size="sm"
                                    colorScheme={riskScore >= 80 ? 'green' : riskScore >= 60 ? 'orange' : 'red'}
                                    borderRadius="full"
                                    w="full"
                                  />
                                </VStack>

                                <HStack spacing={1} wrap="wrap">
                                  <Badge colorScheme="green" size="xs">KYC Ready</Badge>
                                  <Badge colorScheme="blue" size="xs">AML Clear</Badge>
                                  <Badge colorScheme="purple" size="xs">Data Rich</Badge>
                                </HStack>
                              </VStack>
                            </Grid>

                            {/* Action Buttons */}
                            <Divider />
                            <HStack justify="space-between" w="full">
                              <HStack spacing={2}>
                                <Badge colorScheme="blue" variant="outline" size="sm">
                                  <FaUsers style={{ marginRight: '4px' }} />
                                  Officers
                                </Badge>
                                <Badge colorScheme="purple" variant="outline" size="sm">
                                  <FaFileAlt style={{ marginRight: '4px' }} />
                                  PSCs
                                </Badge>
                                <Badge colorScheme="orange" variant="outline" size="sm">
                                  <FaChartLine style={{ marginRight: '4px' }} />
                                  Filings
                                </Badge>
                              </HStack>
                              
                              <HStack spacing={2}>
                                <Tooltip label="View on Companies House">
                                  <IconButton
                                    aria-label="External link"
                                    icon={<FaExternalLinkAlt />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      window.open(`https://find-and-update.company-information.service.gov.uk/company/${company.company_number}`, '_blank')
                                    }}
                                  />
                                </Tooltip>
                                <Button
                                  rightIcon={<FaArrowRight />}
                                  size="sm"
                                  colorScheme="blue"
                                  variant="solid"
                                  borderRadius="full"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCompanySelect(company.company_number)
                                  }}
                                >
                                  Analyze
                                </Button>
                              </HStack>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    )
                  })}
                </SimpleGrid>

                {/* Pagination */}
                {searchResults.total_results > itemsPerPage && (
                  <HStack justify="center" spacing={4} pt={8}>
                    <Button
                      isDisabled={currentPage === 0}
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      variant="outline"
                      borderRadius="full"
                    >
                      Previous
                    </Button>
                    <VStack spacing={1}>
                      <Text fontSize="sm" color="gray.700" fontWeight="medium">
                        Page {currentPage + 1} of {Math.ceil(searchResults.total_results / itemsPerPage)}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {searchResults.total_results.toLocaleString()} total results
                      </Text>
                    </VStack>
                    <Button
                      isDisabled={(currentPage + 1) * itemsPerPage >= searchResults.total_results}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      variant="outline"
                      borderRadius="full"
                    >
                      Next
                    </Button>
                  </HStack>
                )}
              </VStack>
            )}
          </Box>
        )}

        {/* Empty State */}
        {!debouncedQuery.trim() && (
          <Card bg={cardBg} borderRadius="2xl" shadow="lg">
            <CardBody textAlign="center" py={20}>
              <VStack spacing={8}>
                <Box p={6} bg="blue.50" borderRadius="full">
                  <FaSearch size={48} color="var(--chakra-colors-blue-500)" />
                </Box>
                <VStack spacing={4}>
                  <Heading size="lg">Discover Corporate Intelligence</Heading>
                  <Text color="gray.600" fontSize="lg" maxW="2xl">
                    Search through millions of UK companies to uncover business relationships, 
                    compliance data, and risk intelligence powered by AI.
                  </Text>
                </VStack>
                
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} pt={8}>
                  <VStack spacing={3}>
                    <Box p={3} bg="green.100" borderRadius="full">
                      <FaShieldAlt color="var(--chakra-colors-green-600)" />
                    </Box>
                    <Text fontWeight="semibold">Compliance Ready</Text>
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      KYC, AML, and regulatory compliance data
                    </Text>
                  </VStack>
                  
                  <VStack spacing={3}>
                    <Box p={3} bg="purple.100" borderRadius="full">
                      <FaUsers color="var(--chakra-colors-purple-600)" />
                    </Box>
                    <Text fontWeight="semibold">Ownership Intelligence</Text>
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      Directors, PSCs, and beneficial ownership
                    </Text>
                  </VStack>
                  
                  <VStack spacing={3}>
                    <Box p={3} bg="orange.100" borderRadius="full">
                      <FaRobot color="var(--chakra-colors-orange-600)" />
                    </Box>
                    <Text fontWeight="semibold">AI-Powered Insights</Text>
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      Risk scoring and relationship mapping
                    </Text>
                  </VStack>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Container>
  )
}