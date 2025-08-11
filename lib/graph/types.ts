// Graph visualization types for React Flow company relationship mapping

import type { Node, Edge } from 'reactflow';

export interface CompanyNode extends Node {
  id: string;
  type: 'company' | 'officer' | 'psc' | 'address';
  data: {
    label: string;
    companyNumber?: string;
    companyName?: string;
    companyStatus?: string;
    companyType?: string;
    officerName?: string;
    officerRole?: string;
    appointedDate?: string;
    resignedDate?: string;
    pscName?: string;
    controlType?: string[];
    address?: string;
    level: number; // 0 = root, 1 = first hop, 2 = second hop, 3 = third hop
    expanded?: boolean;
    loading?: boolean;
    error?: string;
  };
  position: {
    x: number;
    y: number;
  };
}

export interface RelationshipEdge {
  id: string;
  source: string;
  target: string;
  type?: 'default' | 'step' | 'smoothstep' | 'straight';
  data?: {
    relationship: 'officer' | 'psc' | 'address' | 'ownership';
    label?: string;
    strength?: number; // 0-1, how strong the relationship is
    startDate?: string;
    endDate?: string;
    description?: string;
  };
}

export interface GraphData {
  nodes: CompanyNode[];
  edges: RelationshipEdge[];
}

export interface NetworkAnalysis {
  totalNodes: number;
  totalEdges: number;
  networkDensity: number;
  centralNodes: Array<{
    id: string;
    name: string;
    connections: number;
    centrality: number;
  }>;
  clusters: Array<{
    id: string;
    nodes: string[];
    description: string;
  }>;
  riskFactors: Array<{
    type: 'circular_ownership' | 'complex_structure' | 'dormant_companies' | 'rapid_changes';
    description: string;
    affectedNodes: string[];
    severity: 'low' | 'medium' | 'high';
  }>;
}

export interface GraphViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface GraphFilters {
  showOfficers: boolean;
  showPSCs: boolean;
  showAddresses: boolean;
  showInactive: boolean;
  showResigned: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  companyTypes?: string[];
  officerRoles?: string[];
  maxHops: number;
}

export interface GraphLayout {
  type: 'hierarchical' | 'force' | 'circular' | 'grid' | 'custom';
  direction?: 'TB' | 'BT' | 'LR' | 'RL'; // Top-Bottom, Bottom-Top, Left-Right, Right-Left
  spacing?: {
    nodeSpacing: number;
    levelSpacing: number;
  };
}

export interface GraphExportOptions {
  format: 'png' | 'svg' | 'pdf' | 'json' | 'csv';
  includeMetadata: boolean;
  resolution?: number;
  background?: string;
}

export interface GraphSearchResult {
  nodeId: string;
  nodeType: 'company' | 'officer' | 'psc' | 'address';
  name: string;
  description: string;
  distance: number; // Distance from root node
}

export interface GraphStats {
  totalCompanies: number;
  activeCompanies: number;
  totalOfficers: number;
  totalPSCs: number;
  averageConnections: number;
  maxDepth: number;
  strongestConnection: {
    source: string;
    target: string;
    strength: number;
  };
}

export type NodeType = 'company' | 'officer' | 'psc' | 'address';
export type RelationshipType = 'officer' | 'psc' | 'address' | 'ownership';
export type LayoutType = 'hierarchical' | 'force' | 'circular' | 'grid' | 'custom';
export type ExportFormat = 'png' | 'svg' | 'pdf' | 'json' | 'csv';

// Color schemes for different node types
export const NODE_COLORS = {
  company: {
    active: '#22c55e',
    inactive: '#94a3b8',
    dissolved: '#ef4444',
    liquidation: '#f97316',
  },
  officer: {
    active: '#3b82f6',
    resigned: '#6b7280',
  },
  psc: {
    active: '#8b5cf6',
    ceased: '#6b7280',
  },
  address: {
    default: '#f59e0b',
  },
} as const;

// Node sizes based on importance/connections
export const NODE_SIZES = {
  small: { width: 120, height: 60 },
  medium: { width: 160, height: 80 },
  large: { width: 200, height: 100 },
} as const;

// Edge styles for different relationship types
export const EDGE_STYLES = {
  officer: {
    stroke: '#3b82f6',
    strokeWidth: 2,
    strokeDasharray: undefined,
  },
  psc: {
    stroke: '#8b5cf6',
    strokeWidth: 3,
    strokeDasharray: undefined,
  },
  address: {
    stroke: '#f59e0b',
    strokeWidth: 1,
    strokeDasharray: '5,5',
  },
  ownership: {
    stroke: '#ef4444',
    strokeWidth: 4,
    strokeDasharray: undefined,
  },
} as const;