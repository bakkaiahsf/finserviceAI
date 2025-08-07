'use client'

import { useState, useMemo } from 'react'
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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
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
} from 'react-icons/fa'
import { useQuery } from '@tanstack/react-query'
import { companiesHouseAPI, type CompanySearchResult } from '@/lib/apis/companies-house'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

export default function CompanySearchInterface() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    companyStatus: '',
    companyType: '',
    location: '',
  })
  const [sortBy, setSortBy] = useState('relevance')
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  
  const { profile } = useAuth()
  const router = useRouter()
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure()

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')

  const itemsPerPage = 20

  // Search companies query
  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['companySearch', searchQuery, filters, currentPage, sortBy],
    queryFn: async () => {
      if (!searchQuery.trim()) return null
      
      return await companiesHouseAPI.searchCompanies(searchQuery.trim(), {
        itemsPerPage,
        startIndex: currentPage * itemsPerPage,
      })
    },
    enabled: searchQuery.trim().length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(0)
  }

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

  const getCompanyTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      'ltd': 'Private Limited Company',
      'plc': 'Public Limited Company',
      'llp': 'Limited Liability Partnership',
      'limited-partnership': 'Limited Partnership',
      'private-limited-guarant-nsc-limited-exemption': 'Private Limited by Guarantee',
    }
    return typeMap[type] || type?.replace(/-/g, ' ').toUpperCase() || 'Unknown'
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

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Box>
        <Heading size="lg" mb={2}>Company Search</Heading>
        <Text color="gray.600">
          Search UK companies using official Companies House data with AI-powered insights
        </Text>
      </Box>

      {/* Search Bar */}
      <Card bg={cardBg} shadow="sm">
        <CardBody>
          <VStack spacing={4}>
            <InputGroup size="lg">
              <InputLeftElement>
                <FaSearch color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Enter company name, number, or keywords..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                bg="white"
                border="2px"
                borderColor="gray.200"
                _focus={{
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                }}
                _hover={{ borderColor: 'gray.300' }}
              />
              <InputRightElement width="auto" pr={2}>
                <HStack spacing={2}>
                  {searchQuery && (
                    <IconButton
                      aria-label="Clear search"
                      icon={<FaTimes />}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSearch('')}
                    />
                  )}
                  <Button
                    leftIcon={<FaFilter />}
                    size="sm"
                    variant="outline"
                    onClick={onFilterOpen}
                  >
                    Filters
                  </Button>
                </HStack>
              </InputRightElement>
            </InputGroup>

            {/* Quick Search Suggestions */}
            <HStack spacing={2} w="full" overflowX="auto">
              <Text fontSize="sm" color="gray.600" flexShrink={0}>Quick search:</Text>
              {['Apple Inc', 'Google', 'Microsoft', 'Amazon', 'Tesla'].map((suggestion) => (
                <Tag
                  key={suggestion}
                  size="sm"
                  cursor="pointer"
                  _hover={{ bg: 'brand.100' }}
                  onClick={() => handleSearch(suggestion)}
                >
                  <TagLabel>{suggestion}</TagLabel>
                </Tag>
              ))}
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Search Results */}
      {searchQuery.trim().length > 0 && (
        <Box>
          {/* Results Header */}
          {searchResults && (
            <Flex justify="space-between" align="center" mb={4}>
              <Text color="gray.600">
                {searchResults.total_results.toLocaleString()} companies found
                {searchQuery && ` for "${searchQuery}"`}
              </Text>
              <HStack spacing={2}>
                <Menu>
                  <MenuButton as={Button} rightIcon={<FaChevronDown />} size="sm" variant="outline">
                    Sort by: {sortBy}
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={() => setSortBy('relevance')}>Relevance</MenuItem>
                    <MenuItem onClick={() => setSortBy('company_name')}>Company Name</MenuItem>
                    <MenuItem onClick={() => setSortBy('date_of_creation')}>Date Created</MenuItem>
                  </MenuList>
                </Menu>
                {selectedCompanies.length > 0 && (
                  <Button size="sm" leftIcon={<FaRobot />} colorScheme="brand">
                    Analyze Selected ({selectedCompanies.length})
                  </Button>
                )}
              </HStack>
            </Flex>
          )}

          {/* Loading State */}
          {isLoading && (
            <VStack spacing={4}>
              {[...Array(5)].map((_, i) => (
                <Card key={i} w="full">
                  <CardBody>
                    <VStack align="start" spacing={3}>
                      <Skeleton height="20px" width="60%" />
                      <Skeleton height="16px" width="40%" />
                      <Skeleton height="16px" width="80%" />
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          )}

          {/* Error State */}
          {error && (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">Search failed</Text>
                <Text fontSize="sm">
                  {error instanceof Error ? error.message : 'Please try again or refine your search terms.'}
                </Text>
              </VStack>
            </Alert>
          )}

          {/* No Results */}
          {searchResults && searchResults.items.length === 0 && (
            <Card>
              <CardBody textAlign="center" py={12}>
                <VStack spacing={4}>
                  <FaBuilding size={48} color="gray.300" />
                  <VStack spacing={2}>
                    <Text fontSize="lg" fontWeight="medium">No companies found</Text>
                    <Text color="gray.600">
                      Try adjusting your search terms or removing filters
                    </Text>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Results Grid */}
          {searchResults && searchResults.items.length > 0 && (
            <VStack spacing={4} align="stretch">
              {searchResults.items.map((company) => (
                <Card
                  key={company.company_number}
                  cursor="pointer"
                  _hover={{ 
                    shadow: 'md',
                    transform: 'translateY(-1px)',
                    bg: hoverBg
                  }}
                  transition="all 0.2s"
                  onClick={() => handleCompanySelect(company.company_number)}
                >
                  <CardBody>
                    <Grid templateColumns="1fr auto" gap={4} alignItems="start">
                      <GridItem>
                        <VStack align="start" spacing={3}>
                          {/* Company Header */}
                          <HStack spacing={3} align="start">
                            <Avatar
                              name={company.title}
                              size="md"
                              bg="brand.500"
                              color="white"
                            />
                            <VStack align="start" spacing={1} flex="1">
                              <Heading size="md" noOfLines={2}>
                                {company.title}
                              </Heading>
                              <HStack spacing={2}>
                                <Text fontSize="sm" color="gray.600">
                                  #{company.company_number}
                                </Text>
                                <Badge
                                  colorScheme={getStatusColor(company.company_status || '')}
                                  variant="subtle"
                                >
                                  {company.company_status || 'Unknown'}
                                </Badge>
                              </HStack>
                            </VStack>
                          </HStack>

                          {/* Company Details */}
                          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} w="full">
                            <VStack align="start" spacing={2}>
                              <HStack spacing={2} color="gray.600">
                                <FaBuilding size={14} />
                                <Text fontSize="sm">
                                  {getCompanyTypeDisplay(company.company_type || '')}
                                </Text>
                              </HStack>
                              {company.date_of_creation && (
                                <HStack spacing={2} color="gray.600">
                                  <FaCalendarAlt size={14} />
                                  <Text fontSize="sm">
                                    Founded {format(new Date(company.date_of_creation), 'MMM yyyy')}
                                  </Text>
                                </HStack>
                              )}
                            </VStack>

                            {company.address && (
                              <VStack align="start" spacing={2}>
                                <HStack spacing={2} color="gray.600" align="start">
                                  <FaMapMarkerAlt size={14} style={{ marginTop: '2px' }} />
                                  <Text fontSize="sm" lineHeight="short">
                                    {formatAddress(company.address)}
                                  </Text>
                                </HStack>
                              </VStack>
                            )}
                          </Grid>

                          {/* Description */}
                          {company.description && (
                            <Text fontSize="sm" color="gray.700" noOfLines={2}>
                              {company.description}
                            </Text>
                          )}
                        </VStack>
                      </GridItem>

                      {/* Action Buttons */}
                      <GridItem>
                        <VStack spacing={2}>
                          <Tooltip label="View Details">
                            <IconButton
                              aria-label="View company details"
                              icon={<FaEye />}
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCompanySelect(company.company_number)
                              }}
                            />
                          </Tooltip>
                          <Tooltip label={selectedCompanies.includes(company.company_number) ? "Remove from selection" : "Add to selection"}>
                            <IconButton
                              aria-label="Bookmark company"
                              icon={<FaBookmark />}
                              size="sm"
                              variant={selectedCompanies.includes(company.company_number) ? "solid" : "outline"}
                              colorScheme={selectedCompanies.includes(company.company_number) ? "brand" : "gray"}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleCompanySelection(company.company_number)
                              }}
                            />
                          </Tooltip>
                          <Tooltip label="View on Companies House">
                            <IconButton
                              aria-label="View on Companies House"
                              icon={<FaExternalLinkAlt />}
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(`https://find-and-update.company-information.service.gov.uk/company/${company.company_number}`, '_blank')
                              }}
                            />
                          </Tooltip>
                        </VStack>
                      </GridItem>
                    </Grid>
                  </CardBody>
                </Card>
              ))}

              {/* Pagination */}
              {searchResults.total_results > itemsPerPage && (
                <HStack justify="center" spacing={2} pt={4}>
                  <Button
                    isDisabled={currentPage === 0}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Text fontSize="sm" color="gray.600">
                    Page {currentPage + 1} of {Math.ceil(searchResults.total_results / itemsPerPage)}
                  </Text>
                  <Button
                    isDisabled={(currentPage + 1) * itemsPerPage >= searchResults.total_results}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    variant="outline"
                    size="sm"
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
      {!searchQuery.trim() && (
        <Card>
          <CardBody textAlign="center" py={16}>
            <VStack spacing={6}>
              <Box p={4} bg="brand.50" borderRadius="full">
                <FaSearch size={32} color="var(--chakra-colors-brand-500)" />
              </Box>
              <VStack spacing={2}>
                <Heading size="md">Search UK Companies</Heading>
                <Text color="gray.600" maxW="md">
                  Enter a company name, registration number, or keywords to search through 
                  millions of UK companies and access detailed business intelligence.
                </Text>
              </VStack>
              <HStack spacing={4}>
                <Button
                  leftIcon={<FaBuilding />}
                  variant="outline"
                  onClick={() => handleSearch('Apple')}
                >
                  Try "Apple"
                </Button>
                <Button
                  leftIcon={<FaRobot />}
                  colorScheme="brand"
                  variant="outline"
                  onClick={() => handleSearch('12345678')}
                >
                  Search by Number
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Filters Modal */}
      <Modal isOpen={isFilterOpen} onClose={onFilterClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Search Filters</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Refine your search with additional filters
              </Text>
              <Text fontSize="sm" color="blue.600">
                Advanced filters coming soon in next sprint
              </Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  )
}