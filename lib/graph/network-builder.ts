/**
 * Network Graph Builder
 * Converts company data into React Flow nodes and edges
 */

import { Node, Edge, MarkerType } from 'reactflow'
import { CompanyProfile, Officer, PersonWithSignificantControl } from '@/lib/apis/companies-house'

interface NetworkData {
  profile: CompanyProfile
  officers: Officer[]
  pscs: PersonWithSignificantControl[]
  filings?: any[]
}

interface NetworkBuilderOptions {
  maxDepth?: number
  includeOfficers?: boolean
  includePSCs?: boolean
  includeInactive?: boolean
  centerCompany?: boolean
}

export class NetworkBuilder {
  private nodeIdCounter = 0
  private edgeIdCounter = 0

  private generateNodeId(): string {
    return `node_${++this.nodeIdCounter}`
  }

  private generateEdgeId(): string {
    return `edge_${++this.edgeIdCounter}`
  }

  /**
   * Build network graph from company data
   */
  buildNetwork(
    primaryData: NetworkData,
    relatedData: NetworkData[] = [],
    options: NetworkBuilderOptions = {}
  ): { nodes: Node[], edges: Edge[] } {
    const {
      maxDepth = 3,
      includeOfficers = true,
      includePSCs = true,
      includeInactive = false,
      centerCompany = true
    } = options

    const nodes: Node[] = []
    const edges: Edge[] = []

    // Reset counters
    this.nodeIdCounter = 0
    this.edgeIdCounter = 0

    // Level 1: Primary company (center)
    const primaryCompanyId = this.generateNodeId()
    const primaryNode = this.createCompanyNode(
      primaryCompanyId,
      primaryData.profile,
      { x: 500, y: 300 }, // Center position
      1
    )
    nodes.push(primaryNode)

    // Level 2: Add officers and PSCs
    if (includeOfficers && primaryData.officers) {
      this.addOfficersToGraph(
        nodes,
        edges,
        primaryCompanyId,
        primaryData.officers,
        includeInactive,
        2
      )
    }

    if (includePSCs && primaryData.pscs) {
      this.addPSCsToGraph(
        nodes,
        edges,
        primaryCompanyId,
        primaryData.pscs,
        includeInactive,
        2
      )
    }

    // Level 3: Add related companies if available
    if (maxDepth >= 3 && relatedData.length > 0) {
      this.addRelatedCompanies(
        nodes,
        edges,
        relatedData,
        primaryCompanyId,
        3
      )
    }

    // Apply layout algorithm
    this.applyHierarchicalLayout(nodes, centerCompany)

    return { nodes, edges }
  }

  private createCompanyNode(
    id: string,
    profile: CompanyProfile,
    position: { x: number, y: number },
    level: number
  ): Node {
    return {
      id,
      type: 'company',
      position,
      data: {
        company_name: profile.company_name,
        company_number: profile.company_number,
        company_type: profile.company_type,
        company_status: profile.company_status,
        date_of_creation: profile.date_of_creation,
        registered_office_address: profile.registered_office_address,
        sic_codes: profile.sic_codes,
        level,
        connectionCount: 0, // Will be calculated later
        riskLevel: this.calculateRiskLevel(profile),
      },
    }
  }

  private createPersonNode(
    id: string,
    person: Officer | PersonWithSignificantControl,
    position: { x: number, y: number },
    level: number,
    personType: 'officer' | 'psc'
  ): Node {
    const isOfficer = personType === 'officer'
    const officer = person as Officer
    const psc = person as PersonWithSignificantControl

    return {
      id,
      type: 'person',
      position,
      data: {
        name: isOfficer ? officer.name : psc.name,
        role: isOfficer ? officer.officer_role : 'Person with Significant Control',
        nationality: person.nationality,
        country_of_residence: person.country_of_residence,
        date_of_birth: person.date_of_birth,
        appointed_on: isOfficer ? officer.appointed_on : undefined,
        resigned_on: isOfficer ? officer.resigned_on : undefined,
        ownership_percentage: !isOfficer ? this.extractOwnershipPercentage(psc.natures_of_control) : undefined,
        natures_of_control: !isOfficer ? psc.natures_of_control : undefined,
        level,
        personType,
      },
    }
  }

  private addOfficersToGraph(
    nodes: Node[],
    edges: Edge[],
    companyNodeId: string,
    officers: Officer[],
    includeInactive: boolean,
    level: number
  ) {
    const activeOfficers = includeInactive 
      ? officers 
      : officers.filter(officer => !officer.resigned_on)

    activeOfficers.forEach((officer, index) => {
      const officerId = this.generateNodeId()
      
      // Position officers in a semi-circle below the company
      const angle = (index / Math.max(activeOfficers.length - 1, 1)) * Math.PI - Math.PI / 2
      const radius = 200
      const position = {
        x: 500 + Math.cos(angle) * radius,
        y: 500 + Math.sin(angle) * radius,
      }

      const officerNode = this.createPersonNode(
        officerId,
        officer,
        position,
        level,
        'officer'
      )
      nodes.push(officerNode)

      // Create edge from company to officer
      const edge: Edge = {
        id: this.generateEdgeId(),
        source: companyNodeId,
        target: officerId,
        type: 'smoothstep',
        label: officer.officer_role,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 1.5, stroke: '#8B5CF6' },
      }
      edges.push(edge)
    })
  }

  private addPSCsToGraph(
    nodes: Node[],
    edges: Edge[],
    companyNodeId: string,
    pscs: PersonWithSignificantControl[],
    includeInactive: boolean,
    level: number
  ) {
    const activePSCs = includeInactive 
      ? pscs 
      : pscs.filter(psc => !psc.ceased_on)

    activePSCs.forEach((psc, index) => {
      const pscId = this.generateNodeId()
      
      // Position PSCs in a semi-circle above the company
      const angle = (index / Math.max(activePSCs.length - 1, 1)) * Math.PI + Math.PI / 2
      const radius = 200
      const position = {
        x: 500 + Math.cos(angle) * radius,
        y: 100 + Math.sin(angle) * radius,
      }

      const pscNode = this.createPersonNode(
        pscId,
        psc,
        position,
        level,
        'psc'
      )
      nodes.push(pscNode)

      // Create edge from PSC to company
      const edge: Edge = {
        id: this.generateEdgeId(),
        source: pscId,
        target: companyNodeId,
        type: 'smoothstep',
        label: `${this.extractOwnershipPercentage(psc.natures_of_control)}% control`,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2, stroke: '#10B981' },
      }
      edges.push(edge)
    })
  }

  private addRelatedCompanies(
    nodes: Node[],
    edges: Edge[],
    relatedData: NetworkData[],
    primaryCompanyId: string,
    level: number
  ) {
    relatedData.forEach((data, index) => {
      const relatedCompanyId = this.generateNodeId()
      
      // Position related companies around the primary company
      const angle = (index / relatedData.length) * 2 * Math.PI
      const radius = 350
      const position = {
        x: 500 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius,
      }

      const relatedNode = this.createCompanyNode(
        relatedCompanyId,
        data.profile,
        position,
        level
      )
      nodes.push(relatedNode)

      // Create edge (relationship type would be determined by actual data)
      const edge: Edge = {
        id: this.generateEdgeId(),
        source: primaryCompanyId,
        target: relatedCompanyId,
        type: 'smoothstep',
        label: 'Related entity',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 1, stroke: '#3B82F6', strokeDasharray: '5,5' },
      }
      edges.push(edge)
    })
  }

  private applyHierarchicalLayout(nodes: Node[], centerCompany: boolean) {
    if (!centerCompany) return

    // Group nodes by level
    const nodesByLevel: { [level: number]: Node[] } = {}
    nodes.forEach(node => {
      const level = node.data.level || 1
      if (!nodesByLevel[level]) nodesByLevel[level] = []
      nodesByLevel[level].push(node)
    })

    // Apply hierarchical positioning
    Object.entries(nodesByLevel).forEach(([levelStr, levelNodes]) => {
      const level = parseInt(levelStr)
      const yPosition = level * 200
      const spacing = Math.min(300, 800 / Math.max(levelNodes.length, 1))
      const startX = 500 - ((levelNodes.length - 1) * spacing) / 2

      levelNodes.forEach((node, index) => {
        if (level === 1) {
          // Keep center company at center
          node.position = { x: 500, y: 300 }
        } else {
          node.position = {
            x: startX + (index * spacing),
            y: yPosition,
          }
        }
      })
    })
  }

  private calculateRiskLevel(profile: CompanyProfile): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0

    // Simple risk scoring algorithm
    if (profile.company_status !== 'active') riskScore += 30
    if (!profile.registered_office_address) riskScore += 20
    if (!profile.sic_codes || profile.sic_codes.length === 0) riskScore += 15
    
    // Date-based risk factors
    if (profile.date_of_creation) {
      const creationDate = new Date(profile.date_of_creation)
      const monthsOld = (Date.now() - creationDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      if (monthsOld < 12) riskScore += 25 // New companies are higher risk
    }

    if (riskScore >= 70) return 'critical'
    if (riskScore >= 50) return 'high'
    if (riskScore >= 30) return 'medium'
    return 'low'
  }

  private extractOwnershipPercentage(naturesOfControl: string[]): number {
    // Extract percentage from natures of control text
    for (const nature of naturesOfControl || []) {
      const match = nature.match(/(\d+)%/);
      if (match) {
        return parseInt(match[1])
      }
      
      // Common ownership descriptions
      if (nature.includes('more than 75%')) return 75
      if (nature.includes('more than 50%')) return 50
      if (nature.includes('more than 25%')) return 25
    }
    
    // Default assumption for PSCs
    return 25
  }

  /**
   * Create a sample British Airways-style network
   */
  createSampleNetwork(centerCompany: string = '07765187'): { nodes: Node[], edges: Edge[] } {
    const nodes: Node[] = [
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
          personType: 'officer',
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
          personType: 'officer',
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
          personType: 'psc',
        },
      },
    ]

    const edges: Edge[] = [
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

    return { nodes, edges }
  }
}

export const networkBuilder = new NetworkBuilder()