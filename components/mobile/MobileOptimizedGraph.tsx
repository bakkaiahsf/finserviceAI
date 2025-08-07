'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  useColorModeValue,
  useBreakpointValue,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Badge,
  Card,
  CardBody,
  Flex,
} from '@chakra-ui/react'
import {
  FaExpand,
  FaCompress,
  FaCog,
  FaInfoCircle,
  FaMobile,
  FaHandPointer as FaTouchApp,
} from 'react-icons/fa'
import CorporateGraph from '../visualization/CorporateGraph'
import { Node } from 'reactflow'

interface MobileOptimizedGraphProps {
  companyNumber?: string
  data?: any
  onNodeClick?: (node: Node) => void
  onNodeDoubleClick?: (node: Node) => void
}

export default function MobileOptimizedGraph({
  companyNumber,
  data,
  onNodeClick,
  onNodeDoubleClick,
}: MobileOptimizedGraphProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [touchMode, setTouchMode] = useState(false)

  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const isMobile = useBreakpointValue({ base: true, md: false })
  const graphHeight = useBreakpointValue({ 
    base: isFullscreen ? '100vh' : '400px', 
    md: isFullscreen ? '100vh' : '600px',
    lg: '700px'
  })

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Detect touch device
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    setTouchMode(isTouchDevice)
  }, [])

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node)
    if (isMobile) {
      onOpen() // Open drawer on mobile
    }
    onNodeClick?.(node)
  }

  const handleNodeDoubleClick = (node: Node) => {
    onNodeDoubleClick?.(node)
  }

  // Mobile-optimized controls
  const MobileControls = () => (
    <HStack 
      spacing={2} 
      position="absolute" 
      bottom={4} 
      left={4} 
      zIndex={10}
      bg={cardBg}
      p={2}
      borderRadius="lg"
      shadow="md"
    >
      <IconButton
        aria-label="Node info"
        icon={<FaInfoCircle />}
        size="sm"
        variant="ghost"
        onClick={onOpen}
        isDisabled={!selectedNode}
      />
      <IconButton
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        icon={isFullscreen ? <FaCompress /> : <FaExpand />}
        size="sm"
        variant="ghost"
        onClick={() => setIsFullscreen(!isFullscreen)}
      />
      <IconButton
        aria-label="Settings"
        icon={<FaCog />}
        size="sm"
        variant="ghost"
      />
    </HStack>
  )

  // Touch interaction hints
  const TouchHints = () => (
    <Box
      position="absolute"
      top={4}
      right={4}
      bg={cardBg}
      p={3}
      borderRadius="lg"
      shadow="md"
      maxW="250px"
      zIndex={10}
      display={touchMode ? 'block' : 'none'}
    >
      <VStack spacing={2} align="start">
        <HStack spacing={2}>
          <FaTouchApp size={14} />
          <Text fontSize="xs" fontWeight="bold">Touch Controls</Text>
        </HStack>
        <Text fontSize="xs">• Tap node to select</Text>
        <Text fontSize="xs">• Double tap to center</Text>
        <Text fontSize="xs">• Pinch to zoom</Text>
        <Text fontSize="xs">• Pan with two fingers</Text>
      </VStack>
    </Box>
  )

  // Mobile-optimized node details drawer
  const NodeDetailsDrawer = () => (
    <Drawer isOpen={isOpen} placement="bottom" onClose={onClose} size="sm">
      <DrawerOverlay />
      <DrawerContent borderTopRadius="xl">
        <DrawerCloseButton />
        <DrawerHeader pb={2}>
          {selectedNode?.type === 'company' ? 'Company Details' : 'Person Details'}
        </DrawerHeader>
        
        <DrawerBody pb={6}>
          {selectedNode && (
            <VStack spacing={4} align="stretch">
              <Card size="sm">
                <CardBody>
                  <VStack align="start" spacing={2}>
                    <Text fontWeight="bold" fontSize="lg">
                      {selectedNode.data.company_name || selectedNode.data.name}
                    </Text>
                    
                    {selectedNode.data.company_number && (
                      <HStack>
                        <Text fontSize="sm" color="gray.600">Reg:</Text>
                        <Text fontSize="sm" fontFamily="mono">
                          {selectedNode.data.company_number}
                        </Text>
                      </HStack>
                    )}

                    {selectedNode.data.company_status && (
                      <Badge
                        colorScheme={selectedNode.data.company_status === 'active' ? 'green' : 'red'}
                        size="sm"
                      >
                        {selectedNode.data.company_status}
                      </Badge>
                    )}

                    {selectedNode.data.role && (
                      <Badge colorScheme="purple" size="sm">
                        {selectedNode.data.role}
                      </Badge>
                    )}

                    {selectedNode.data.nationality && (
                      <HStack>
                        <Text fontSize="sm" color="gray.600">Nationality:</Text>
                        <Text fontSize="sm">{selectedNode.data.nationality}</Text>
                      </HStack>
                    )}

                    {selectedNode.data.ownership_percentage && (
                      <HStack>
                        <Text fontSize="sm" color="gray.600">Ownership:</Text>
                        <Text fontSize="sm">{selectedNode.data.ownership_percentage}%</Text>
                      </HStack>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {selectedNode.type === 'company' && selectedNode.data.company_number && (
                <Button
                  colorScheme="brand"
                  size="lg"
                  w="full"
                  onClick={() => {
                    handleNodeDoubleClick(selectedNode)
                    onClose()
                  }}
                >
                  Center on This Company
                </Button>
              )}
            </VStack>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )

  const containerStyle = isFullscreen ? {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    bg: cardBg
  } : {
    position: 'relative' as const,
    height: graphHeight
  }

  return (
    <Box {...containerStyle}>
      {/* Mobile Navigation Bar for Fullscreen */}
      {isFullscreen && isMobile && (
        <Flex
          justify="space-between"
          align="center"
          p={4}
          bg={cardBg}
          borderBottom="1px"
          borderColor={borderColor}
        >
          <Text fontWeight="bold">Corporate Network</Text>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<FaCompress />}
            onClick={() => setIsFullscreen(false)}
          >
            Exit
          </Button>
        </Flex>
      )}

      {/* Graph Container */}
      <Box 
        position="relative" 
        height={isFullscreen && isMobile ? 'calc(100vh - 80px)' : '100%'}
      >
        <CorporateGraph
          companyNumber={companyNumber}
          data={data}
          height="100%"
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
        />

        {/* Mobile Controls Overlay */}
        {isMobile && <MobileControls />}
        
        {/* Touch Interaction Hints */}
        {touchMode && <TouchHints />}

        {/* Connection Quality Indicator */}
        <Box
          position="absolute"
          top={4}
          left={4}
          bg={cardBg}
          p={2}
          borderRadius="md"
          shadow="sm"
          zIndex={10}
        >
          <HStack spacing={2}>
            <Box
              w={2}
              h={2}
              bg="green.400"
              borderRadius="full"
            />
            <Text fontSize="xs" color="gray.600">
              Live
            </Text>
          </HStack>
        </Box>
      </Box>

      {/* Mobile Node Details Drawer */}
      <NodeDetailsDrawer />

      {/* Responsive Legend */}
      {!isFullscreen && (
        <Box
          position={isMobile ? 'static' : 'absolute'}
          bottom={isMobile ? 0 : 4}
          right={isMobile ? 0 : 4}
          bg={cardBg}
          p={3}
          borderRadius="lg"
          shadow="md"
          mt={isMobile ? 4 : 0}
          zIndex={5}
        >
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
            {isMobile && (
              <HStack spacing={2}>
                <FaMobile size={12} />
                <Text fontSize="xs">Touch optimized</Text>
              </HStack>
            )}
          </VStack>
        </Box>
      )}
    </Box>
  )
}