'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Download,
  Search,
  Loader2,
  Plus,
  Eye,
  Calendar,
  Building2,
  Users,
  BarChart3,
  AlertTriangle,
  Settings,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Share2,
  Archive,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface Report {
  id: string;
  title: string;
  type: 'company_profile' | 'risk_assessment' | 'network_analysis' | 'compliance_check' | 'custom';
  status: 'generating' | 'completed' | 'failed' | 'scheduled';
  companyNumber?: string;
  companyName?: string;
  createdAt: string;
  completedAt?: string;
  generatedBy: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  fileSize?: string;
  downloadUrl?: string;
  description: string;
  tags: string[];
  aiInsights?: boolean;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'company_profile' | 'risk_assessment' | 'network_analysis' | 'compliance_check' | 'custom';
  sections: string[];
  estimatedTime: string;
  aiEnhanced: boolean;
  popular: boolean;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([
    {
      id: '1',
      title: 'Tesco PLC - Comprehensive Analysis',
      type: 'company_profile',
      status: 'completed',
      companyNumber: '00445790',
      companyName: 'TESCO PLC',
      createdAt: '2024-01-15T10:30:00Z',
      completedAt: '2024-01-15T10:35:00Z',
      generatedBy: 'AI Analysis Engine',
      format: 'pdf',
      fileSize: '2.4 MB',
      downloadUrl: '/reports/tesco-analysis.pdf',
      description: 'Complete company profile with AI insights, risk analysis, and network mapping',
      tags: ['retail', 'plc', 'ftse100'],
      aiInsights: true
    },
    {
      id: '2',
      title: 'Network Analysis - Tech Startups Cluster',
      type: 'network_analysis',
      status: 'completed',
      createdAt: '2024-01-14T16:20:00Z',
      completedAt: '2024-01-14T16:45:00Z',
      generatedBy: 'Network Builder',
      format: 'excel',
      fileSize: '1.8 MB',
      downloadUrl: '/reports/network-analysis.xlsx',
      description: 'Interconnected company relationships in the tech startup ecosystem',
      tags: ['network', 'startups', 'technology'],
      aiInsights: false
    },
    {
      id: '3',
      title: 'Risk Assessment Report - Construction Sector',
      type: 'risk_assessment',
      status: 'generating',
      createdAt: '2024-01-16T09:15:00Z',
      generatedBy: 'Risk Analysis AI',
      format: 'pdf',
      description: 'Comprehensive risk analysis for construction industry companies',
      tags: ['risk', 'construction', 'sector-analysis'],
      aiInsights: true
    }
  ]);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showNewReportForm, setShowNewReportForm] = useState(false);
  const [newReportData, setNewReportData] = useState({
    companyNumber: '',
    title: '',
    type: 'company_profile' as Report['type'],
    format: 'pdf' as Report['format'],
    includeAI: true,
    description: '',
    tags: ''
  });

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'company-deep-dive',
      name: 'Company Deep Dive',
      description: 'Comprehensive analysis including profile, officers, financials, and AI insights',
      type: 'company_profile',
      sections: ['Company Profile', 'Officers & PSCs', 'Financial Analysis', 'Risk Assessment', 'AI Business Intelligence'],
      estimatedTime: '3-5 minutes',
      aiEnhanced: true,
      popular: true
    },
    {
      id: 'risk-assessment',
      name: 'Risk Assessment Report',
      description: 'Detailed risk analysis with mitigation recommendations',
      type: 'risk_assessment',
      sections: ['Executive Summary', 'Risk Categories', 'Key Risk Factors', 'Mitigation Strategies'],
      estimatedTime: '2-3 minutes',
      aiEnhanced: true,
      popular: true
    },
    {
      id: 'network-mapping',
      name: 'Network Relationship Map',
      description: 'Visual and tabular representation of company relationships',
      type: 'network_analysis',
      sections: ['Network Visualization', 'Relationship Matrix', 'Key Connections', 'Network Analysis'],
      estimatedTime: '4-6 minutes',
      aiEnhanced: false,
      popular: false
    },
    {
      id: 'compliance-check',
      name: 'Compliance Status Check',
      description: 'Regulatory compliance assessment and filing status',
      type: 'compliance_check',
      sections: ['Filing History', 'Compliance Status', 'Outstanding Requirements', 'Regulatory Alerts'],
      estimatedTime: '1-2 minutes',
      aiEnhanced: false,
      popular: false
    }
  ];

  const handleGenerateReport = async () => {
    if (!newReportData.companyNumber.trim() || !newReportData.title.trim()) {
      alert('Please fill in required fields');
      return;
    }

    const newReport: Report = {
      id: Date.now().toString(),
      title: newReportData.title,
      type: newReportData.type,
      status: 'generating',
      companyNumber: newReportData.companyNumber,
      companyName: 'Loading...',
      createdAt: new Date().toISOString(),
      generatedBy: newReportData.includeAI ? 'AI Analysis Engine' : 'Standard Generator',
      format: newReportData.format,
      description: newReportData.description || `${newReportData.type.replace('_', ' ')} report for company ${newReportData.companyNumber}`,
      tags: newReportData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      aiInsights: newReportData.includeAI
    };

    setReports(prev => [newReport, ...prev]);
    setShowNewReportForm(false);
    
    // Reset form
    setNewReportData({
      companyNumber: '',
      title: '',
      type: 'company_profile',
      format: 'pdf',
      includeAI: true,
      description: '',
      tags: ''
    });

    // Simulate report generation
    setTimeout(() => {
      setReports(prev => prev.map(report => 
        report.id === newReport.id 
          ? { 
              ...report, 
              status: 'completed' as const, 
              completedAt: new Date().toISOString(),
              fileSize: '2.1 MB',
              downloadUrl: `/reports/generated-${newReport.id}.${newReport.format}`
            }
          : report
      ));
    }, 3000 + Math.random() * 2000);
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'generating': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'generating': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: Report['type']) => {
    switch (type) {
      case 'company_profile': return <Building2 className="h-4 w-4" />;
      case 'risk_assessment': return <AlertTriangle className="h-4 w-4" />;
      case 'network_analysis': return <BarChart3 className="h-4 w-4" />;
      case 'compliance_check': return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDownload = (report: Report) => {
    console.log(`Downloading report: ${report.title}`);
    // In a real app, this would trigger actual file download
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FileText className="mr-3 h-8 w-8 text-blue-600" />
            Reports & Analysis
          </h1>
          <p className="mt-2 text-gray-600">
            Generate comprehensive reports with AI insights and export in multiple formats
          </p>
        </div>
        <Button 
          onClick={() => setShowNewReportForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{reports.length}</div>
                <div className="text-sm text-gray-600">Total Reports</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Loader2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'generating').length}
                </div>
                <div className="text-sm text-gray-600">Processing</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.aiInsights).length}
                </div>
                <div className="text-sm text-gray-600">AI Enhanced</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Report Form */}
      {showNewReportForm && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-blue-600" />
              <span>Generate New Report</span>
            </CardTitle>
            <CardDescription>
              Create a comprehensive analysis report for any UK company
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Company Number *</label>
                <Input
                  placeholder="e.g., 00445790"
                  value={newReportData.companyNumber}
                  onChange={(e) => setNewReportData(prev => ({ ...prev, companyNumber: e.target.value.toUpperCase() }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Report Title *</label>
                <Input
                  placeholder="e.g., Tesco PLC - Q1 Analysis"
                  value={newReportData.title}
                  onChange={(e) => setNewReportData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Report Type</label>
                <select 
                  value={newReportData.type}
                  onChange={(e) => setNewReportData(prev => ({ ...prev, type: e.target.value as Report['type'] }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="company_profile">Company Profile</option>
                  <option value="risk_assessment">Risk Assessment</option>
                  <option value="network_analysis">Network Analysis</option>
                  <option value="compliance_check">Compliance Check</option>
                  <option value="custom">Custom Report</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Format</label>
                <select 
                  value={newReportData.format}
                  onChange={(e) => setNewReportData(prev => ({ ...prev, format: e.target.value as Report['format'] }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="excel">Excel Spreadsheet</option>
                  <option value="csv">CSV Data</option>
                  <option value="json">JSON Data</option>
                </select>
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newReportData.includeAI}
                    onChange={(e) => setNewReportData(prev => ({ ...prev, includeAI: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Include AI Insights</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
              <Textarea
                placeholder="Brief description of the report purpose..."
                value={newReportData.description}
                onChange={(e) => setNewReportData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Tags (comma-separated)</label>
              <Input
                placeholder="e.g., retail, analysis, quarterly"
                value={newReportData.tags}
                onChange={(e) => setNewReportData(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowNewReportForm(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateReport}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <span>Report Templates</span>
          </CardTitle>
          <CardDescription>
            Quick-start templates for common report types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(template.type)}
                      <h3 className="font-medium text-sm">{template.name}</h3>
                    </div>
                    {template.popular && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                        Popular
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-3">{template.description}</p>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">
                      <strong>Sections:</strong> {template.sections.slice(0, 2).join(', ')}
                      {template.sections.length > 2 && ' +' + (template.sections.length - 2) + ' more'}
                    </div>
                    <div className="text-xs text-gray-500">
                      <strong>Time:</strong> {template.estimatedTime}
                    </div>
                    {template.aiEnhanced && (
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                        AI Enhanced
                      </Badge>
                    )}
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-3 text-xs"
                    onClick={() => {
                      setNewReportData(prev => ({ 
                        ...prev, 
                        type: template.type,
                        title: `${template.name} - ${new Date().toLocaleDateString()}`,
                        includeAI: template.aiEnhanced
                      }));
                      setShowNewReportForm(true);
                    }}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Archive className="h-5 w-5 text-gray-600" />
              <span>Generated Reports</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-1 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-1 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getTypeIcon(report.type)}
                        <h3 className="font-semibold text-gray-900">{report.title}</h3>
                        <Badge variant="outline" className={getStatusColor(report.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(report.status)}
                            <span>{report.status}</span>
                          </div>
                        </Badge>
                        {report.aiInsights && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            AI Enhanced
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {report.companyNumber && (
                          <span>Company: {report.companyNumber}</span>
                        )}
                        <span>Created: {formatDate(report.createdAt)}</span>
                        {report.completedAt && (
                          <span>Completed: {formatDate(report.completedAt)}</span>
                        )}
                        {report.fileSize && (
                          <span>Size: {report.fileSize}</span>
                        )}
                        <span>Format: {report.format.toUpperCase()}</span>
                      </div>
                      
                      {report.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {report.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-gray-50">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {report.status === 'completed' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleDownload(report)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}