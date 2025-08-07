'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  Avatar,
  Flex,
  useColorModeValue,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  List,
  ListItem,
  ListIcon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from '@chakra-ui/react'
import {
  FaSearch,
  FaNetworkWired,
  FaChartBar,
  FaExclamationTriangle,
  FaCheckCircle,
  FaRobot,
  FaDownload,
  FaEye,
  FaCog,
} from 'react-icons/fa'
import { Node } from 'reactflow'
import CorporateGraph from './CorporateGraph'
import { deepSeekService } from '@/lib/ai/deepseek-service'
import { companiesHouseAPI } from '@/lib/apis/companies-house'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

interface AnalysisResult {
  summary: any
  riskAssessment: any
  networkPatterns: any
  executiveBriefing: any
}

export default function CorporateVisualizationInterface() {
  const [selectedCompany, setSelectedCompany] = useState('07765187') // Default to test company
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  const { isOpen: isNodeDetailsOpen, onOpen: onNodeDetailsOpen, onClose: onNodeDetailsClose } = useDisclosure()
  const { isOpen: isAIAnalysisOpen, onOpen: onAIAnalysisOpen, onClose: onAIAnalysisClose } = useDisclosure()

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Fetch company data for the graph
  const { data: companyData, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['companyVisualization', selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return null
      return await companiesHouseAPI.getCompanyData(selectedCompany)
    },
    enabled: !!selectedCompany,
    staleTime: 5 * 60 * 1000,
  })

  const handleCompanySearch = useCallback((company: string) => {
    setSelectedCompany(company)
    setSearchQuery('')
    setAnalysisResults(null)
  }, [])

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node)
    onNodeDetailsOpen()
  }, [onNodeDetailsOpen])

  const handleNodeDoubleClick = useCallback((node: Node) => {
    if (node.type === 'company' && node.data.company_number) {
      handleCompanySearch(node.data.company_number)
    }
  }, [handleCompanySearch])

  const runAIAnalysis = useCallback(async () => {
    if (!companyData) {
      toast.error('No company data available for analysis')
      return
    }

    setIsAnalyzing(true)
    
    try {
      // Run AI analysis in parallel
      const [summary, riskAssessment, networkPatterns] = await Promise.allSettled([
        deepSeekService.generateCompanySummary(companyData),
        deepSeekService.assessCompanyRisk(companyData),
        deepSeekService.analyzeNetworkPatterns([companyData])
      ])

      const results: AnalysisResult = {
        summary: summary.status === 'fulfilled' ? summary.value : null,
        riskAssessment: riskAssessment.status === 'fulfilled' ? riskAssessment.value : null,
        networkPatterns: networkPatterns.status === 'fulfilled' ? networkPatterns.value : null,
        executiveBriefing: null
      }

      // Generate executive briefing if risk assessment succeeded
      if (results.riskAssessment) {
        const briefing = await deepSeekService.generateExecutiveBriefing(
          companyData, 
          results.riskAssessment
        )
        results.executiveBriefing = briefing
      }

      setAnalysisResults(results)
      onAIAnalysisOpen()
      toast.success('AI analysis completed successfully')
      
    } catch (error) {
      console.error('AI analysis failed:', error)
      toast.error('AI analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }, [companyData, onAIAnalysisOpen])

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'green'
      case 'medium': return 'yellow'
      case 'high': return 'orange'
      case 'critical': return 'red'
      default: return 'gray'
    }
  }

  return (
    <VStack spacing={6} align="stretch" h="calc(100vh - 200px)">
      {/* Header and Search */}
      <Card bg={cardBg} shadow="sm">
        <CardBody>
          <Flex justify="space-between" align="center" mb={4}>
            <VStack align="start" spacing={1}>
              <Heading size="lg">Corporate Network Visualization</Heading>
              <Text color="gray.600">
                Interactive analysis of corporate structures and beneficial ownership
              </Text>
            </VStack>
            
            <HStack spacing={3}>
              <Button
                leftIcon={<FaRobot />}
                colorScheme="brand"
                onClick={runAIAnalysis}
                isLoading={isAnalyzing}
                loadingText="Analyzing..."
                size="sm"
              >
                AI Analysis
              </Button>
              <Button
                leftIcon={<FaDownload />}
                variant="outline"
                size="sm"
              >
                Export Report
              </Button>
            </HStack>
          </Flex>

          <HStack spacing={4}>
            <InputGroup maxW="400px">
              <InputLeftElement>
                <FaSearch color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Enter company number (e.g., 07765187)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    handleCompanySearch(searchQuery.trim())
                  }
                }}
              />
            </InputGroup>
            <Button
              colorScheme="brand"
              onClick={() => searchQuery.trim() && handleCompanySearch(searchQuery.trim())}
              isDisabled={!searchQuery.trim()}
            >
              Visualize
            </Button>
          </HStack>

          {isLoadingCompany && (
            <Alert status="info" mt={4}>
              <AlertIcon />
              Loading company data for visualization...
            </Alert>
          )}
        </CardBody>
      </Card>

      {/* Main Content */}
      <Grid templateColumns="1fr 300px" gap={6} flex="1">
        {/* Graph Visualization */}
        <GridItem>
          <CorporateGraph
            companyNumber={selectedCompany}
            data={companyData}
            height="100%"
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
          />
        </GridItem>

        {/* Side Panel */}
        <GridItem>
          <VStack spacing={4} h="full">
            {/* Quick Stats */}
            <Card bg={cardBg} w="full">
              <CardHeader>
                <Heading size="sm">Network Overview</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <Stat textAlign="center">
                    <StatLabel>Companies</StatLabel>
                    <StatNumber>3</StatNumber>
                    <StatHelpText>Active entities</StatHelpText>
                  </Stat>
                  <Stat textAlign="center">
                    <StatLabel>Connections</StatLabel>
                    <StatNumber>5</StatNumber>
                    <StatHelpText>Relationships</StatHelpText>
                  </Stat>
                  <Stat textAlign="center">
                    <StatLabel>Depth</StatLabel>
                    <StatNumber>3</StatNumber>
                    <StatHelpText>Levels analyzed</StatHelpText>
                  </Stat>
                </VStack>
              </CardBody>
            </Card>

            {/* Risk Assessment Summary */}
            {analysisResults?.riskAssessment && (
              <Card bg={cardBg} w="full">
                <CardHeader>
                  <Heading size="sm">Risk Assessment</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3}>
                    <Badge
                      colorScheme={getRiskColor(analysisResults.riskAssessment.overallRisk)}
                      size="lg"
                      p={2}
                    >
                      {analysisResults.riskAssessment.overallRisk.toUpperCase()} RISK
                    </Badge>
                    
                    <Progress
                      value={analysisResults.riskAssessment.riskScore}
                      colorScheme={getRiskColor(analysisResults.riskAssessment.overallRisk)}
                      size="lg"
                      w="full"
                      borderRadius="full"
                    />
                    
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      Risk Score: {analysisResults.riskAssessment.riskScore}/100
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Key Insights */}
            <Card bg={cardBg} w="full" flex="1">
              <CardHeader>
                <Heading size="sm">Key Insights</Heading>
              </CardHeader>
              <CardBody>
                {analysisResults?.summary ? (
                  <VStack spacing={3} align="start">
                    {analysisResults.summary.keyInsights?.slice(0, 4).map((insight: string, index: number) => (
                      <HStack key={index} align="start" spacing={2}>
                        <ListIcon as={FaCheckCircle} color="green.400" mt={0.5} />
                        <Text fontSize="sm" lineHeight="short">
                          {insight}
                        </Text>
                      </HStack>
                    ))}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="brand"
                      onClick={onAIAnalysisOpen}
                      w="full"
                      mt={2}
                    >
                      View Full Analysis
                    </Button>
                  </VStack>
                ) : (
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    Run AI analysis to see insights
                  </Text>
                )}
              </CardBody>
            </Card>
          </VStack>
        </GridItem>
      </Grid>

      {/* Node Details Modal */}
      <Modal isOpen={isNodeDetailsOpen} onClose={onNodeDetailsClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedNode?.type === 'company' ? 'Company Details' : 'Person Details'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedNode && (
              <VStack spacing={4} align="start">
                <HStack spacing={3}>
                  <Avatar
                    name={selectedNode.data.company_name || selectedNode.data.name}
                    size="lg"
                    bg={selectedNode.type === 'company' ? 'blue.500' : 'purple.500'}
                  />
                  <VStack align="start" spacing={1}>
                    <Heading size="md">
                      {selectedNode.data.company_name || selectedNode.data.name}
                    </Heading>
                    {selectedNode.data.company_number && (
                      <Text fontSize="sm" color="gray.500" fontFamily="mono">
                        Reg: {selectedNode.data.company_number}
                      </Text>
                    )}
                    {selectedNode.data.role && (
                      <Badge colorScheme="purple" size="sm">
                        {selectedNode.data.role}
                      </Badge>
                    )}
                  </VStack>
                </HStack>

                <Divider />

                {selectedNode.type === 'company' ? (
                  <VStack spacing={3} align="start" w="full">
                    <HStack justify="space-between" w="full">
                      <Text fontWeight="medium">Status:</Text>
                      <Badge
                        colorScheme={selectedNode.data.company_status === 'active' ? 'green' : 'red'}
                      >
                        {selectedNode.data.company_status}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between" w="full">
                      <Text fontWeight="medium">Type:</Text>
                      <Text>{selectedNode.data.company_type?.toUpperCase()}</Text>
                    </HStack>
                    <HStack justify="space-between" w="full">
                      <Text fontWeight="medium">Connections:</Text>
                      <Text>{selectedNode.data.connectionCount || 0}</Text>
                    </HStack>
                  </VStack>
                ) : (
                  <VStack spacing={3} align="start" w="full">
                    <HStack justify="space-between" w="full">
                      <Text fontWeight="medium">Role:</Text>
                      <Text>{selectedNode.data.role}</Text>
                    </HStack>
                    {selectedNode.data.nationality && (
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="medium">Nationality:</Text>
                        <Text>{selectedNode.data.nationality}</Text>
                      </HStack>
                    )}
                    {selectedNode.data.ownership_percentage && (
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="medium">Ownership:</Text>
                        <Text>{selectedNode.data.ownership_percentage}%</Text>
                      </HStack>
                    )}
                  </VStack>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onNodeDetailsClose}>
              Close
            </Button>
            {selectedNode?.type === 'company' && selectedNode.data.company_number && (
              <Button 
                colorScheme="brand" 
                ml={3}
                onClick={() => {
                  handleCompanySearch(selectedNode.data.company_number)
                  onNodeDetailsClose()
                }}
              >
                Center Graph
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* AI Analysis Results Modal */}
      <Modal isOpen={isAIAnalysisOpen} onClose={onAIAnalysisClose} size="4xl">
        <ModalOverlay />
        <ModalContent maxH="80vh">
          <ModalHeader>AI Analysis Results</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto">
            {analysisResults && (
              <Tabs>
                <TabList>
                  <Tab>Executive Summary</Tab>
                  <Tab>Risk Assessment</Tab>
                  <Tab>Network Patterns</Tab>
                  <Tab>Recommendations</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel>
                    {analysisResults.executiveBriefing ? (
                      <VStack spacing={4} align="start">
                        <Heading size="md">{analysisResults.executiveBriefing.title}</Heading>
                        <Text>{analysisResults.executiveBriefing.summary}</Text>
                        
                        <Heading size="sm">Key Findings</Heading>
                        <List spacing={2}>
                          {analysisResults.executiveBriefing.keyFindings?.map((finding: string, index: number) => (
                            <ListItem key={index}>
                              <ListIcon as={FaCheckCircle} color="green.400" />
                              {finding}
                            </ListItem>
                          ))}
                        </List>
                      </VStack>
                    ) : (
                      <Text color="gray.500">Executive briefing not available</Text>
                    )}
                  </TabPanel>

                  <TabPanel>
                    {analysisResults.riskAssessment ? (
                      <VStack spacing={4} align="start">
                        <HStack spacing={4}>
                          <Badge
                            colorScheme={getRiskColor(analysisResults.riskAssessment.overallRisk)}
                            size="lg"
                            p={3}
                          >
                            {analysisResults.riskAssessment.overallRisk.toUpperCase()} RISK
                          </Badge>
                          <Text fontSize="lg" fontWeight="bold">
                            Score: {analysisResults.riskAssessment.riskScore}/100
                          </Text>
                        </HStack>

                        <Heading size="sm">Risk Categories</Heading>
                        <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                          {Object.entries(analysisResults.riskAssessment.categories).map(([category, score]) => (
                            <Card key={category} size="sm">
                              <CardBody>
                                <Stat>
                                  <StatLabel>{category.charAt(0).toUpperCase() + category.slice(1)}</StatLabel>
                                  <StatNumber fontSize="lg">{String(score)}/100</StatNumber>
                                  <Progress value={Number(score)} size="sm" colorScheme={getRiskColor(
                                    Number(score) > 70 ? 'high' : Number(score) > 40 ? 'medium' : 'low'
                                  )} />
                                </Stat>
                              </CardBody>
                            </Card>
                          ))}
                        </Grid>
                      </VStack>
                    ) : (
                      <Text color="gray.500">Risk assessment not available</Text>
                    )}
                  </TabPanel>

                  <TabPanel>
                    {analysisResults.networkPatterns ? (
                      <VStack spacing={4} align="start">
                        <Heading size="sm">Identified Patterns</Heading>
                        {analysisResults.networkPatterns.patterns?.map((pattern: any, index: number) => (
                          <Card key={index} w="full">
                            <CardBody>
                              <HStack justify="space-between" mb={2}>
                                <Text fontWeight="bold">{pattern.type}</Text>
                                <Badge colorScheme={getRiskColor(pattern.riskLevel)}>
                                  {pattern.riskLevel} risk
                                </Badge>
                              </HStack>
                              <Text fontSize="sm">{pattern.description}</Text>
                              <Text fontSize="xs" color="gray.500" mt={1}>
                                Confidence: {Math.round(pattern.confidence * 100)}%
                              </Text>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    ) : (
                      <Text color="gray.500">Network pattern analysis not available</Text>
                    )}
                  </TabPanel>

                  <TabPanel>
                    {analysisResults.riskAssessment?.recommendations ? (
                      <VStack spacing={3} align="start">
                        <List spacing={2}>
                          {analysisResults.riskAssessment.recommendations.map((rec: string, index: number) => (
                            <ListItem key={index}>
                              <ListIcon as={FaExclamationTriangle} color="orange.400" />
                              {rec}
                            </ListItem>
                          ))}
                        </List>
                      </VStack>
                    ) : (
                      <Text color="gray.500">Recommendations not available</Text>
                    )}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onAIAnalysisClose}>
              Close
            </Button>
            <Button colorScheme="brand" ml={3}>
              Export Analysis
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
}