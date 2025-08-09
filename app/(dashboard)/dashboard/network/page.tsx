'use client';

import { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Network,
  Search,
  Download,
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  AlertTriangle,
  Building2,
  Users,
  MapPin,
  Eye,
  EyeOff,
  Filter,
  BarChart3
} from 'lucide-react';
import type { 
  CompanyNode, 
  RelationshipEdge, 
  GraphData, 
  GraphFilters, 
  NetworkAnalysis 
} from '@/lib/graph/types';
import { NODE_COLORS, EDGE_STYLES } from '@/lib/graph/types';

// Custom node components
const CompanyNodeComponent = ({ data }: { data: any }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return NODE_COLORS.company.active;
      case 'dissolved':
        return NODE_COLORS.company.dissolved;
      case 'liquidation':
        return NODE_COLORS.company.liquidation;
      default:
        return NODE_COLORS.company.inactive;
    }
  };

  return (
    <div
      className="px-4 py-2 shadow-md rounded-md bg-white border-2 min-w-[120px] text-center"
      style={{ borderColor: getStatusColor(data.companyStatus || 'active') }}
    >
      <div className="font-bold text-sm text-gray-900">{data.companyName || data.label}</div>
      <div className="text-xs text-gray-600">{data.companyNumber}</div>
      {data.companyStatus && (
        <Badge variant="outline" className="text-xs mt-1">
          {data.companyStatus}
        </Badge>
      )}
    </div>
  );
};

const OfficerNodeComponent = ({ data }: { data: any }) => {
  return (
    <div className="px-3 py-2 shadow-md rounded-md bg-blue-50 border-2 border-blue-300 min-w-[100px] text-center">
      <div className="font-medium text-sm text-blue-900">{data.officerName || data.label}</div>
      <div className="text-xs text-blue-700">{data.officerRole}</div>
      {data.resignedDate && (
        <div className="text-xs text-red-600">Resigned</div>
      )}
    </div>
  );
};

const PSCNodeComponent = ({ data }: { data: any }) => {
  return (
    <div className="px-3 py-2 shadow-md rounded-md bg-purple-50 border-2 border-purple-300 min-w-[100px] text-center">
      <div className="font-medium text-sm text-purple-900">{data.pscName || data.label}</div>
      <div className="text-xs text-purple-700">PSC</div>
    </div>
  );
};

const AddressNodeComponent = ({ data }: { data: any }) => {
  return (
    <div className="px-3 py-2 shadow-md rounded-md bg-yellow-50 border-2 border-yellow-300 min-w-[100px] text-center">
      <div className="font-medium text-sm text-yellow-900">
        <MapPin className="inline h-3 w-3 mr-1" />
        Address
      </div>
      <div className="text-xs text-yellow-700 truncate max-w-[120px]">
        {data.address?.split(',')[0] || data.label}
      </div>
    </div>
  );
};

const nodeTypes = {
  company: CompanyNodeComponent,
  officer: OfficerNodeComponent,
  psc: PSCNodeComponent,
  address: AddressNodeComponent,
};

function NetworkGraph() {
  const [companyNumber, setCompanyNumber] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkAnalysis, setNetworkAnalysis] = useState<NetworkAnalysis | null>(null);
  const [filters, setFilters] = useState<GraphFilters>({
    showOfficers: true,
    showPSCs: true,
    showAddresses: false,
    showInactive: false,
    showResigned: false,
    maxHops: 2
  });

  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const generateNetwork = async () => {
    if (!companyNumber.trim()) {
      setError('Please enter a company number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/graph/network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyNumber,
          maxHops: filters.maxHops,
          filters
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate network');
      }

      const data = await response.json();
      
      // Convert to ReactFlow format
      const flowNodes = data.graph.nodes.map((node: CompanyNode) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      }));

      const flowEdges = data.graph.edges.map((edge: RelationshipEdge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'default',
        style: EDGE_STYLES[edge.data?.relationship || 'officer'],
        label: edge.data?.label,
        data: edge.data,
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
      setNetworkAnalysis(data.analysis);

      // Fit the view to show all nodes
      setTimeout(() => fitView({ duration: 800 }), 100);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const exportNetwork = async (format: 'png' | 'svg' | 'json') => {
    // Implementation would depend on chosen export library
    console.log(`Exporting network as ${format}`);
  };

  const resetView = () => {
    fitView({ duration: 800 });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Network className="mr-2 h-6 w-6 text-purple-600" />
              Company Network Graph
            </h1>
            <p className="text-gray-600">Visualize company relationships and ownership structures</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => exportNetwork('png')}>
              <Download className="mr-1 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={resetView}>
              <RotateCcw className="mr-1 h-4 w-4" />
              Reset View
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r bg-white p-4 overflow-y-auto">
          {/* Input Section */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Generate Network</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Input
                  placeholder="Company number (e.g., 00445790)"
                  value={companyNumber}
                  onChange={(e) => setCompanyNumber(e.target.value.toUpperCase())}
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Relationship Depth</label>
                <Slider
                  value={[filters.maxHops]}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, maxHops: value[0] }))}
                  max={3}
                  min={1}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {filters.maxHops} hop{filters.maxHops !== 1 ? 's' : ''}
                </div>
              </div>

              <Button 
                onClick={generateNetwork}
                disabled={loading || !companyNumber.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Network className="mr-2 h-4 w-4" />
                    Generate Graph
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Filter className="mr-1 h-4 w-4" />
                Display Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.showOfficers}
                  onChange={(e) => setFilters(prev => ({ ...prev, showOfficers: e.target.checked }))}
                />
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Show Officers</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.showPSCs}
                  onChange={(e) => setFilters(prev => ({ ...prev, showPSCs: e.target.checked }))}
                />
                <Building2 className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Show PSCs</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.showAddresses}
                  onChange={(e) => setFilters(prev => ({ ...prev, showAddresses: e.target.checked }))}
                />
                <MapPin className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Show Addresses</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.showInactive}
                  onChange={(e) => setFilters(prev => ({ ...prev, showInactive: e.target.checked }))}
                />
                <EyeOff className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Show Inactive Companies</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.showResigned}
                  onChange={(e) => setFilters(prev => ({ ...prev, showResigned: e.target.checked }))}
                />
                <Eye className="h-4 w-4 text-red-500" />
                <span className="text-sm">Show Resigned Officers</span>
              </label>
            </CardContent>
          </Card>

          {/* Network Analysis */}
          {networkAnalysis && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <BarChart3 className="mr-1 h-4 w-4" />
                  Network Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-bold text-blue-900">{networkAnalysis.totalNodes}</div>
                    <div className="text-xs text-blue-700">Nodes</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-bold text-green-900">{networkAnalysis.totalEdges}</div>
                    <div className="text-xs text-green-700">Connections</div>
                  </div>
                </div>

                <div className="text-center p-2 bg-purple-50 rounded">
                  <div className="font-bold text-purple-900">
                    {(networkAnalysis.networkDensity * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-purple-700">Network Density</div>
                </div>

                {networkAnalysis.centralNodes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-2">Most Connected</h4>
                    <div className="space-y-1">
                      {networkAnalysis.centralNodes.slice(0, 3).map((node, index) => (
                        <div key={node.id} className="text-xs p-2 bg-gray-50 rounded">
                          <div className="font-medium">{node.name}</div>
                          <div className="text-gray-500">{node.connections} connections</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {networkAnalysis.riskFactors.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-red-600 mb-2 flex items-center">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Risk Factors
                    </h4>
                    <div className="space-y-1">
                      {networkAnalysis.riskFactors.map((risk, index) => (
                        <div key={index} className="text-xs p-2 bg-red-50 rounded">
                          <div className="font-medium text-red-900">{risk.type.replace('_', ' ')}</div>
                          <div className="text-red-700">{risk.description}</div>
                          <Badge variant="outline" className={`mt-1 text-xs ${
                            risk.severity === 'high' ? 'text-red-800 bg-red-100' :
                            risk.severity === 'medium' ? 'text-yellow-800 bg-yellow-100' :
                            'text-green-800 bg-green-100'
                          }`}>
                            {risk.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-4 h-4 rounded border-2" style={{ borderColor: NODE_COLORS.company.active, backgroundColor: 'white' }}></div>
                <span>Active Company</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-4 h-4 rounded border-2 border-blue-300 bg-blue-50"></div>
                <span>Officer</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-4 h-4 rounded border-2 border-purple-300 bg-purple-50"></div>
                <span>PSC</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-4 h-4 rounded border-2 border-yellow-300 bg-yellow-50"></div>
                <span>Address</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Graph Area */}
        <div className="flex-1 relative">
          {error && (
            <div className="absolute top-4 left-4 right-4 z-10">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <div>
                      <div className="font-medium text-red-900">Network Generation Error</div>
                      <div className="text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ duration: 800 }}
            className="bg-gray-50"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                switch (node.type) {
                  case 'company': return NODE_COLORS.company.active;
                  case 'officer': return '#3b82f6';
                  case 'psc': return '#8b5cf6';
                  case 'address': return '#f59e0b';
                  default: return '#6b7280';
                }
              }}
              className="bg-white border border-gray-200 rounded"
            />
          </ReactFlow>

          {nodes.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Network className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Network Generated</h3>
                <p className="text-sm">Enter a company number and click "Generate Graph" to visualize relationships</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NetworkPage() {
  return (
    <ReactFlowProvider>
      <NetworkGraph />
    </ReactFlowProvider>
  );
}