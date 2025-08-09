// Network builder for creating company relationship graphs

import { companiesHouseClient } from '@/lib/companies-house/client';
import type { CompanyProfile, Officer, PersonWithSignificantControl } from '@/lib/companies-house/types';
import type { 
  CompanyNode, 
  RelationshipEdge, 
  GraphData, 
  NetworkAnalysis,
  GraphFilters,
  NodeType
} from './types';
import { NODE_COLORS, NODE_SIZES } from './types';

interface NodePosition {
  x: number;
  y: number;
}

class NetworkBuilder {
  private nodes: Map<string, CompanyNode> = new Map();
  private edges: Map<string, RelationshipEdge> = new Map();
  private processedCompanies: Set<string> = new Set();
  private layout: { nodeSpacing: number; levelSpacing: number } = { nodeSpacing: 250, levelSpacing: 200 };

  /**
   * Build a network graph starting from a root company
   * @param rootCompanyNumber - The company to start from
   * @param maxHops - Maximum number of relationship hops (1-3)
   * @param filters - Filters to apply to the network
   * @param rateLimitKey - Rate limiting key for API calls
   */
  async buildNetwork(
    rootCompanyNumber: string,
    maxHops: number = 2,
    filters: GraphFilters,
    rateLimitKey: string = 'graph'
  ): Promise<GraphData> {
    this.reset();
    
    try {
      // Start with root company
      await this.processCompany(rootCompanyNumber, 0, maxHops, filters, rateLimitKey);
      
      // Apply layout positioning
      this.applyLayout();
      
      return {
        nodes: Array.from(this.nodes.values()),
        edges: Array.from(this.edges.values())
      };
    } catch (error) {
      console.error('Network building error:', error);
      throw error;
    }
  }

  private reset(): void {
    this.nodes.clear();
    this.edges.clear();
    this.processedCompanies.clear();
  }

  private async processCompany(
    companyNumber: string,
    currentLevel: number,
    maxHops: number,
    filters: GraphFilters,
    rateLimitKey: string
  ): Promise<void> {
    if (this.processedCompanies.has(companyNumber) || currentLevel > maxHops) {
      return;
    }

    this.processedCompanies.add(companyNumber);

    try {
      // Get company profile
      const company = await companiesHouseClient.getCompanyProfile(companyNumber, { rateLimitKey });
      
      // Create company node
      const companyNode = this.createCompanyNode(company, currentLevel);
      this.nodes.set(companyNode.id, companyNode);

      // Process relationships if not at max depth
      if (currentLevel < maxHops) {
        // Get officers
        if (filters.showOfficers) {
          await this.processOfficers(company, currentLevel, maxHops, filters, rateLimitKey);
        }

        // Get PSCs
        if (filters.showPSCs) {
          await this.processPSCs(company, currentLevel, maxHops, filters, rateLimitKey);
        }

        // Process address connections
        if (filters.showAddresses) {
          this.processAddressConnections(company, currentLevel);
        }
      }
    } catch (error) {
      console.error(`Error processing company ${companyNumber}:`, error);
      
      // Create error node
      const errorNode: CompanyNode = {
        id: `company-${companyNumber}`,
        type: 'company',
        data: {
          label: companyNumber,
          companyNumber,
          companyName: 'Error loading company',
          level: currentLevel,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        position: { x: 0, y: 0 }
      };
      this.nodes.set(errorNode.id, errorNode);
    }
  }

  private createCompanyNode(company: CompanyProfile, level: number): CompanyNode {
    const nodeId = `company-${company.company_number}`;
    
    return {
      id: nodeId,
      type: 'company',
      data: {
        label: company.company_name,
        companyNumber: company.company_number,
        companyName: company.company_name,
        companyStatus: company.company_status,
        companyType: company.type,
        level
      },
      position: { x: 0, y: 0 } // Will be set by layout
    };
  }

  private async processOfficers(
    company: CompanyProfile,
    currentLevel: number,
    maxHops: number,
    filters: GraphFilters,
    rateLimitKey: string
  ): Promise<void> {
    try {
      const officers = await companiesHouseClient.getCompanyOfficers(
        company.company_number,
        { rateLimitKey, itemsPerPage: 50 }
      );

      for (const officer of officers.items) {
        // Apply filters
        if (!filters.showResigned && officer.resigned_on) {
          continue;
        }

        if (filters.officerRoles && !filters.officerRoles.includes(officer.officer_role)) {
          continue;
        }

        // Create officer node
        const officerNode = this.createOfficerNode(officer, currentLevel + 1);
        this.nodes.set(officerNode.id, officerNode);

        // Create edge from company to officer
        const edge = this.createEdge(
          `company-${company.company_number}`,
          officerNode.id,
          'officer',
          `${officer.officer_role} since ${officer.appointed_on}`
        );
        this.edges.set(edge.id, edge);

        // Try to find other companies this officer is connected to
        if (currentLevel + 1 < maxHops) {
          await this.findOfficerConnections(officer, currentLevel + 1, maxHops, filters, rateLimitKey);
        }
      }
    } catch (error) {
      console.error('Error processing officers:', error);
    }
  }

  private async processPSCs(
    company: CompanyProfile,
    currentLevel: number,
    maxHops: number,
    filters: GraphFilters,
    rateLimitKey: string
  ): Promise<void> {
    try {
      const pscs = await companiesHouseClient.getCompanyPSCs(
        company.company_number,
        { rateLimitKey, itemsPerPage: 25 }
      );

      for (const psc of pscs.items) {
        // Apply filters
        if (!filters.showResigned && psc.ceased_on) {
          continue;
        }

        // Create PSC node
        const pscNode = this.createPSCNode(psc, currentLevel + 1);
        this.nodes.set(pscNode.id, pscNode);

        // Create edge from company to PSC
        const edge = this.createEdge(
          `company-${company.company_number}`,
          pscNode.id,
          'psc',
          `Control: ${psc.natures_of_control?.join(', ') || 'Unspecified'}`
        );
        this.edges.set(edge.id, edge);
      }
    } catch (error) {
      console.error('Error processing PSCs:', error);
    }
  }

  private processAddressConnections(company: CompanyProfile, level: number): void {
    if (!company.registered_office_address) return;

    const address = company.registered_office_address;
    const addressString = [
      address.premises,
      address.address_line_1,
      address.address_line_2,
      address.locality,
      address.postal_code
    ].filter(Boolean).join(', ');

    const addressId = `address-${this.hashString(addressString)}`;

    // Create or update address node
    if (!this.nodes.has(addressId)) {
      const addressNode: CompanyNode = {
        id: addressId,
        type: 'address',
        data: {
          label: addressString,
          address: addressString,
          level: level + 1
        },
        position: { x: 0, y: 0 }
      };
      this.nodes.set(addressId, addressNode);
    }

    // Create edge
    const edge = this.createEdge(
      `company-${company.company_number}`,
      addressId,
      'address',
      'Registered Office'
    );
    this.edges.set(edge.id, edge);
  }

  private createOfficerNode(officer: Officer, level: number): CompanyNode {
    const nodeId = `officer-${this.hashString(officer.name + officer.appointed_on)}`;
    
    return {
      id: nodeId,
      type: 'officer',
      data: {
        label: officer.name,
        officerName: officer.name,
        officerRole: officer.officer_role,
        appointedDate: officer.appointed_on,
        resignedDate: officer.resigned_on,
        level
      },
      position: { x: 0, y: 0 }
    };
  }

  private createPSCNode(psc: PersonWithSignificantControl, level: number): CompanyNode {
    const nodeId = `psc-${this.hashString(psc.name + psc.notified_on)}`;
    
    return {
      id: nodeId,
      type: 'psc',
      data: {
        label: psc.name,
        pscName: psc.name,
        controlType: psc.natures_of_control,
        level
      },
      position: { x: 0, y: 0 }
    };
  }

  private createEdge(
    source: string,
    target: string,
    relationshipType: 'officer' | 'psc' | 'address' | 'ownership',
    label?: string
  ): RelationshipEdge {
    return {
      id: `${source}-${target}`,
      source,
      target,
      type: 'default',
      data: {
        relationship: relationshipType,
        label,
        strength: this.calculateRelationshipStrength(relationshipType)
      }
    };
  }

  private calculateRelationshipStrength(type: 'officer' | 'psc' | 'address' | 'ownership'): number {
    // Strength based on relationship type
    switch (type) {
      case 'ownership':
      case 'psc':
        return 1.0; // Strongest
      case 'officer':
        return 0.8;
      case 'address':
        return 0.3; // Weakest
      default:
        return 0.5;
    }
  }

  private async findOfficerConnections(
    officer: Officer,
    currentLevel: number,
    maxHops: number,
    filters: GraphFilters,
    rateLimitKey: string
  ): Promise<void> {
    // This would require officer search functionality
    // For now, we'll skip this to avoid hitting rate limits
    // In a production system, you'd implement officer search across companies
  }

  private applyLayout(): void {
    const nodesByLevel: Map<number, CompanyNode[]> = new Map();
    
    // Group nodes by level
    for (const node of this.nodes.values()) {
      const level = node.data.level;
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(node);
    }

    // Position nodes hierarchically
    for (const [level, levelNodes] of nodesByLevel.entries()) {
      const nodesCount = levelNodes.length;
      const totalWidth = (nodesCount - 1) * this.layout.nodeSpacing;
      const startX = -totalWidth / 2;

      levelNodes.forEach((node, index) => {
        node.position = {
          x: startX + (index * this.layout.nodeSpacing),
          y: level * this.layout.levelSpacing
        };
      });
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString();
  }

  /**
   * Analyze the built network for insights
   */
  analyzeNetwork(): NetworkAnalysis {
    const nodes = Array.from(this.nodes.values());
    const edges = Array.from(this.edges.values());

    // Calculate network density
    const maxPossibleEdges = (nodes.length * (nodes.length - 1)) / 2;
    const networkDensity = maxPossibleEdges > 0 ? edges.length / maxPossibleEdges : 0;

    // Find central nodes (most connected)
    const connectionCounts = new Map<string, number>();
    for (const edge of edges) {
      connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1);
      connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + 1);
    }

    const centralNodes = Array.from(connectionCounts.entries())
      .map(([nodeId, connections]) => {
        const node = this.nodes.get(nodeId);
        return {
          id: nodeId,
          name: node?.data.label || nodeId,
          connections,
          centrality: connections / (nodes.length - 1)
        };
      })
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 5);

    // Identify risk factors
    const riskFactors: NetworkAnalysis['riskFactors'] = [];
    
    // Check for complex structures
    if (nodes.length > 20) {
      riskFactors.push({
        type: 'complex_structure',
        description: 'Complex corporate structure with many entities',
        affectedNodes: nodes.map(n => n.id),
        severity: 'medium'
      });
    }

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      networkDensity,
      centralNodes,
      clusters: [], // Would need clustering algorithm
      riskFactors
    };
  }
}

export const networkBuilder = new NetworkBuilder();