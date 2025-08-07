'use client'

import React, { useCallback, useEffect, useState, useMemo } from 'react'
import {
  Box,
  VStack,
  HStack,
  Button,
  IconButton,
  Flex,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  Alert,
  AlertIcon,
  Progress,
  Spinner,
} from '@chakra-ui/react'
import {
  FaDownload,
  FaExpand,
  FaCompress,
  FaRedo,
  FaCog,
  FaFilter,
  FaSearch,
  FaChevronDown,
  FaUsers,
  FaBuilding,
  FaCrown,
  FaExclamationTriangle,
} from 'react-icons/fa'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  Position,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'

// Custom Node Types
const CompanyNode = ({ data }: { data: any }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const bgColor = useColorModeValue('white', 'gray.800')
  
  const getNodeColor = (type: string, status?: string) => {
    switch (type) {
      case 'plc': return 'blue.500'
      case 'ltd': return 'green.500'
      case 'llp': return 'purple.500'
      default: 
        if (status === 'dissolved') return 'red.500'
        return 'gray.500'
    }
  }

  return (
    <Box
      bg={bgColor}
      border="2px solid"
      borderColor={data.isSelected ? 'brand.500' : borderColor}
      borderRadius="lg"
      p={4}
      minW="250px"
      maxW="350px"
      shadow="md"
      position="relative"
      _hover={{ 
        shadow: 'lg',
        transform: 'translateY(-2px)',
        borderColor: 'brand.400'
      }}
      transition="all 0.2s"
    >
      {/* Node Type Icon */}
      <Box position="absolute" top={-2} left={-2}>
        <Box 
          bg={getNodeColor(data.company_type, data.company_status)}
          color="white"
          borderRadius="full"
          p={2}
          shadow="md"
        >
          <FaBuilding size={12} />
        </Box>
      </Box>

      <VStack align="start" spacing={2}>
        {/* Company Name */}
        <Text fontWeight="bold" fontSize="md" lineHeight="shorter" noOfLines={2}>
          {data.company_name || data.title}
        </Text>
        
        {/* Company Number */}
        <Text fontSize="xs" color="gray.500" fontFamily="mono">
          Reg: {data.company_number}
        </Text>
        
        {/* Company Type Badge */}
        <Badge
          colorScheme={data.company_type === 'plc' ? 'blue' : 'green'}
          variant="subtle"
          size="sm"
        >
          {data.company_type?.toUpperCase() || 'COMPANY'}
        </Badge>

        {/* Status Indicator */}
        {data.company_status && (
          <HStack spacing={1}>
            <Box 
              w={2} 
              h={2} 
              borderRadius="full" 
              bg={data.company_status === 'active' ? 'green.400' : 'red.400'} 
            />
            <Text fontSize="xs" color="gray.600">
              {data.company_status}
            </Text>
          </HStack>
        )}

        {/* Connection Count */}
        {data.connectionCount && (
          <Text fontSize="xs" color="gray.500">
            {data.connectionCount} connections
          </Text>
        )}
      </VStack>

      {/* Risk Indicator */}
      {data.riskLevel && data.riskLevel !== 'low' && (
        <Box position="absolute" top={2} right={2}>
          <FaExclamationTriangle 
            color={data.riskLevel === 'high' ? '#E53E3E' : '#DD6B20'} 
            size={14}
          />
        </Box>
      )}
    </Box>
  )
}

const PersonNode = ({ data }: { data: any }) => {
  const borderColor = useColorModeValue('purple.200', 'purple.400')
  const bgColor = useColorModeValue('purple.50', 'purple.900')

  return (
    <Box
      bg={bgColor}
      border="2px solid"
      borderColor={data.isSelected ? 'purple.500' : borderColor}
      borderRadius="lg"
      p={3}
      minW="200px"
      maxW="280px"
      shadow="md"
      position="relative"
      _hover={{ 
        shadow: 'lg',
        transform: 'translateY(-2px)',
        borderColor: 'purple.500'
      }}
      transition="all 0.2s"
    >
      {/* Person Icon */}
      <Box position="absolute" top={-2} left={-2}>
        <Box 
          bg="purple.500"
          color="white"
          borderRadius="full"
          p={2}
          shadow="md"
        >
          {data.role?.includes('director') ? <FaCrown size={10} /> : <FaUsers size={10} />}
        </Box>
      </Box>

      <VStack align="start" spacing={2}>
        {/* Person Name */}
        <Text fontWeight="bold" fontSize="sm" lineHeight="shorter" noOfLines={1}>
          {data.name}
        </Text>
        
        {/* Role */}
        <Text fontSize="xs" color="purple.600" fontWeight="medium">
          {data.role || 'Officer'}
        </Text>

        {/* Additional Info */}
        {data.nationality && (
          <Text fontSize="xs" color="gray.600">
            {data.nationality}
          </Text>
        )}

        {data.ownership_percentage && (
          <Badge colorScheme="purple" size="sm">
            {data.ownership_percentage}% ownership
          </Badge>
        )}
      </VStack>
    </Box>
  )
}

const nodeTypes: NodeTypes = {
  company: CompanyNode,
  person: PersonNode,
}

const edgeTypes: EdgeTypes = {
  // Custom edge types can be added here
}

interface CorporateGraphProps {
  companyNumber?: string
  data?: any
  height?: string
  onNodeClick?: (node: Node) => void
  onNodeDoubleClick?: (node: Node) => void
}

const CorporateGraphInner: React.FC<CorporateGraphProps> = ({
  companyNumber,
  data,
  height = '600px',
  onNodeClick,
  onNodeDoubleClick,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedLayout, setSelectedLayout] = useState('hierarchical')
  const [filterOptions, setFilterOptions] = useState({
    showInactive: true,
    showPersons: true,
    showOwnership: true,
  })

  const { fitView, getViewport, setViewport } = useReactFlow()

  // Generate sample network data (replace with real API calls)
  const generateNetworkData = useCallback(async (centerCompany: string) => {
    setIsLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Sample data structure based on the reference image
    const sampleNodes: Node[] = [
      // Level 1: Main Company (Center)
      {
        id: centerCompany,
        type: 'company',
        position: { x: 500, y: 300 },
        data: {
          company_name: 'British Airways Plc',
          company_number: '01777777',
          company_type: 'plc',
          company_status: 'active',
          connectionCount: 5,
          riskLevel: 'low',
          level: 1,
        },
      },
      
      // Level 2: Subsidiaries and Holdings
      {
        id: 'ba-holdings',
        type: 'company',
        position: { x: 200, y: 500 },
        data: {
          company_name: 'BA Holdings Ltd',
          company_number: '02345815',
          company_type: 'ltd',
          company_status: 'active',
          connectionCount: 3,
          level: 2,
        },
      },
      {
        id: 'iag-group',
        type: 'company',
        position: { x: 800, y: 500 },
        data: {
          company_name: 'International Consolidated Airlines Group',
          company_number: '06648088',
          company_type: 'plc',
          company_status: 'active',
          connectionCount: 4,
          level: 2,
        },
      },

      // Level 3: Directors and PSCs
      {
        id: 'luis-gallego',
        type: 'person',
        position: { x: 100, y: 700 },
        data: {
          name: 'Luis Gallego Martin',
          role: 'CEO & Director',
          nationality: 'Spanish',
          level: 3,
        },
      },
      {
        id: 'stephen-gunning',
        type: 'person',
        position: { x: 300, y: 700 },
        data: {
          name: 'Stephen Gunning',
          role: 'CFO & Director',
          nationality: 'British',
          level: 3,
        },
      },
      {
        id: 'antonio-vazquez',
        type: 'person',
        position: { x: 900, y: 700 },
        data: {
          name: 'Antonio Vazquez',
          role: 'Chairman',
          ownership_percentage: 75,
          nationality: 'Spanish',
          level: 3,
        },
      },
    ]

    const sampleEdges: Edge[] = [
      // Level 1 to Level 2 connections
      {
        id: 'ba-to-holdings',
        source: centerCompany,
        target: 'ba-holdings',
        type: 'smoothstep',
        label: '100% owned by',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2, stroke: '#3B82F6' },
      },
      {
        id: 'ba-to-iag',
        source: 'iag-group',
        target: centerCompany,
        type: 'smoothstep',
        label: 'Parent company',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2, stroke: '#3B82F6' },
      },

      // Level 2 to Level 3 connections  
      {
        id: 'holdings-to-luis',
        source: 'ba-holdings',
        target: 'luis-gallego',
        type: 'smoothstep',
        label: 'Director of',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 1.5, stroke: '#8B5CF6' },
      },
      {
        id: 'holdings-to-stephen',
        source: 'ba-holdings',
        target: 'stephen-gunning',
        type: 'smoothstep',
        label: 'Director of',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 1.5, stroke: '#8B5CF6' },
      },
      {
        id: 'iag-to-antonio',
        source: 'iag-group',
        target: 'antonio-vazquez',
        type: 'smoothstep',
        label: 'PSC of',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2, stroke: '#10B981' },
      },
    ]

    setNodes(sampleNodes)
    setEdges(sampleEdges)
    setIsLoading(false)
  }, [setNodes, setEdges])

  // Initialize graph with data
  useEffect(() => {
    if (companyNumber) {
      generateNetworkData(companyNumber)
    }
  }, [companyNumber, generateNetworkData])

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds))
  }, [setEdges])

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Update selection state
    setNodes((nodes) =>
      nodes.map((n) => ({
        ...n,
        data: { ...n.data, isSelected: n.id === node.id },
      }))
    )
    
    onNodeClick?.(node)
  }, [setNodes, onNodeClick])

  const handleNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeDoubleClick?.(node)
  }, [onNodeDoubleClick])

  // Layout algorithms
  const applyLayout = useCallback((layoutType: string) => {
    setSelectedLayout(layoutType)
    
    switch (layoutType) {
      case 'hierarchical':
        // Apply hierarchical layout (top-down)
        setNodes((nodes) =>
          nodes.map((node) => {
            const level = node.data.level || 1
            const nodesAtLevel = nodes.filter(n => n.data.level === level)
            const index = nodesAtLevel.findIndex(n => n.id === node.id)
            const spacing = 300
            const startX = 500 - ((nodesAtLevel.length - 1) * spacing) / 2
            
            return {
              ...node,
              position: {
                x: startX + (index * spacing),
                y: level * 200,
              },
            }
          })
        )
        break
        
      case 'circular':
        // Apply circular layout
        setNodes((nodes) =>
          nodes.map((node, index) => {
            const angle = (index / nodes.length) * 2 * Math.PI
            const radius = 250
            return {
              ...node,
              position: {
                x: 500 + Math.cos(angle) * radius,
                y: 300 + Math.sin(angle) * radius,
              },
            }
          })
        )
        break
        
      default:
        // Keep current positions
        break
    }
    
    setTimeout(() => fitView(), 100)
  }, [setNodes, fitView])

  // Export functions
  const exportToPNG = useCallback(async () => {
    // Implementation for PNG export
    const viewport = getViewport()
    console.log('Exporting to PNG...', viewport)
    // Use html2canvas or similar library
  }, [getViewport])

  const exportToSVG = useCallback(async () => {
    // Implementation for SVG export
    console.log('Exporting to SVG...')
  }, [])

  const exportToJSON = useCallback(() => {
    const data = {
      nodes: nodes.map(node => ({ ...node, position: node.position })),
      edges,
      viewport: getViewport(),
      metadata: {
        companyNumber,
        exportedAt: new Date().toISOString(),
        nodeCount: nodes.length,
        edgeCount: edges.length,
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `corporate-structure-${companyNumber || 'graph'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [nodes, edges, getViewport, companyNumber])

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <Card h={height} bg={cardBg} shadow="lg">
      <CardHeader>
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="md">Corporate Structure</Heading>
            <Text fontSize="sm" color="gray.600">
              Beneficial ownership and control relationships
            </Text>
          </VStack>
          
          <HStack spacing={2}>
            {/* Layout Options */}
            <Menu>
              <MenuButton as={Button} size="sm" leftIcon={<FaCog />} variant="outline">
                Layout
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => applyLayout('hierarchical')}>
                  Hierarchical
                </MenuItem>
                <MenuItem onClick={() => applyLayout('circular')}>
                  Circular
                </MenuItem>
                <MenuItem onClick={() => applyLayout('force')}>
                  Force Directed
                </MenuItem>
              </MenuList>
            </Menu>

            {/* Export Options */}
            <Menu>
              <MenuButton as={Button} size="sm" leftIcon={<FaDownload />} variant="outline">
                Export
              </MenuButton>
              <MenuList>
                <MenuItem onClick={exportToPNG}>Export as PNG</MenuItem>
                <MenuItem onClick={exportToSVG}>Export as SVG</MenuItem>
                <MenuItem onClick={exportToJSON}>Export as JSON</MenuItem>
              </MenuList>
            </Menu>

            {/* Fullscreen Toggle */}
            <IconButton
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              icon={isFullscreen ? <FaCompress /> : <FaExpand />}
              size="sm"
              variant="outline"
              onClick={() => setIsFullscreen(!isFullscreen)}
            />
          </HStack>
        </Flex>

        {/* Loading Progress */}
        {isLoading && (
          <Progress
            size="xs"
            isIndeterminate
            colorScheme="brand"
            mt={3}
            borderRadius="full"
          />
        )}
      </CardHeader>

      <CardBody p={0} position="relative">
        {isLoading ? (
          <Flex align="center" justify="center" h="full">
            <VStack spacing={4}>
              <Spinner size="xl" color="brand.500" />
              <Text>Building corporate network...</Text>
            </VStack>
          </Flex>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            minZoom={0.1}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          >
            <Controls position="top-left" />
            <MiniMap position="top-right" />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            
            {/* Custom Panel */}
            <Panel position="bottom-right">
              <Card size="sm" bg={cardBg}>
                <CardBody p={3}>
                  <VStack spacing={2} align="start">
                    <Text fontSize="xs" fontWeight="bold">Legend</Text>
                    <HStack spacing={2}>
                      <Box w={3} h={3} bg="blue.500" borderRadius="sm" />
                      <Text fontSize="xs">Company</Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Box w={3} h={3} bg="purple.500" borderRadius="sm" />
                      <Text fontSize="xs">Person</Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Box w={3} h={1} bg="green.500" />
                      <Text fontSize="xs">Ownership</Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </Panel>
          </ReactFlow>
        )}
      </CardBody>
    </Card>
  )
}

const CorporateGraph: React.FC<CorporateGraphProps> = (props) => {
  return (
    <ReactFlowProvider>
      <CorporateGraphInner {...props} />
    </ReactFlowProvider>
  )
}

export default CorporateGraph