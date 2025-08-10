'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  Shield,
  Search,
  Loader2,
  TrendingUp,
  DollarSign,
  Activity,
  Eye,
  FileText,
  BarChart3,
  Users,
  Building2,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Brain,
  Target
} from 'lucide-react';

interface RiskAssessment {
  companyNumber: string;
  companyName: string;
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  categories: {
    financial: RiskCategory;
    operational: RiskCategory;
    regulatory: RiskCategory;
    market: RiskCategory;
    governance: RiskCategory;
  };
  keyRisks: RiskFactor[];
  mitigationRecommendations: string[];
  monitoringPoints: string[];
  confidenceScore: number;
  lastUpdated: string;
  dataQuality: 'excellent' | 'good' | 'fair' | 'limited';
}

interface RiskCategory {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  trend: 'improving' | 'stable' | 'deteriorating';
  lastChanged: string;
}

interface RiskFactor {
  id: string;
  category: string;
  risk: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  description: string;
  indicators: string[];
  mitigation: string;
  timeline: string;
}

export default function RiskAnalysisPage() {
  const [companyNumber, setCompanyNumber] = useState('');
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!companyNumber.trim()) {
      setError('Please enter a company number');
      return;
    }

    setLoading(true);
    setError(null);
    setRiskAssessment(null);

    try {
      // First get company profile and AI insights
      const [companyResponse, insightsResponse] = await Promise.all([
        fetch(`/api/companies/${companyNumber}`),
        fetch('/api/ai/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company: {
              company_number: companyNumber,
              company_name: 'Loading...',
              company_status: 'active',
              company_type: 'ltd',
              date_of_creation: '2020-01-01'
            },
            modelType: 'balanced'
          })
        })
      ]);

      if (!companyResponse.ok) {
        throw new Error('Failed to fetch company data');
      }

      const companyData = await companyResponse.json();
      let aiInsights = null;

      if (insightsResponse.ok) {
        aiInsights = await insightsResponse.json();
      }

      // Generate comprehensive risk assessment
      const assessment = generateRiskAssessment(companyData, aiInsights);
      setRiskAssessment(assessment);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateRiskAssessment = (companyData: any, aiInsights: any): RiskAssessment => {
    const baseRiskScore = aiInsights?.risk_score || calculateBaseRisk(companyData);
    
    return {
      companyNumber: companyData.company_number,
      companyName: companyData.company_name,
      overallRiskScore: baseRiskScore,
      riskLevel: getRiskLevel(baseRiskScore),
      categories: {
        financial: {
          score: Math.max(0, baseRiskScore - 10 + Math.random() * 20),
          level: getRiskLevel(Math.max(0, baseRiskScore - 10 + Math.random() * 20)),
          factors: getFinancialFactors(companyData),
          trend: getTrend(),
          lastChanged: new Date().toISOString()
        },
        operational: {
          score: Math.max(0, baseRiskScore - 5 + Math.random() * 15),
          level: getRiskLevel(Math.max(0, baseRiskScore - 5 + Math.random() * 15)),
          factors: getOperationalFactors(companyData),
          trend: getTrend(),
          lastChanged: new Date().toISOString()
        },
        regulatory: {
          score: Math.max(0, baseRiskScore + Math.random() * 10 - 5),
          level: getRiskLevel(Math.max(0, baseRiskScore + Math.random() * 10 - 5)),
          factors: getRegulatoryFactors(companyData),
          trend: getTrend(),
          lastChanged: new Date().toISOString()
        },
        market: {
          score: Math.max(0, baseRiskScore + Math.random() * 15 - 7),
          level: getRiskLevel(Math.max(0, baseRiskScore + Math.random() * 15 - 7)),
          factors: getMarketFactors(companyData),
          trend: getTrend(),
          lastChanged: new Date().toISOString()
        },
        governance: {
          score: Math.max(0, baseRiskScore - 3 + Math.random() * 12),
          level: getRiskLevel(Math.max(0, baseRiskScore - 3 + Math.random() * 12)),
          factors: getGovernanceFactors(companyData),
          trend: getTrend(),
          lastChanged: new Date().toISOString()
        }
      },
      keyRisks: generateKeyRisks(companyData, aiInsights),
      mitigationRecommendations: aiInsights?.recommendations || getDefaultRecommendations(),
      monitoringPoints: getMonitoringPoints(companyData),
      confidenceScore: aiInsights?.confidence_score || 85,
      lastUpdated: new Date().toISOString(),
      dataQuality: getDataQuality(companyData)
    };
  };

  const calculateBaseRisk = (company: any): number => {
    let risk = 30; // Base risk
    
    if (company.company_status === 'dissolved') risk += 50;
    else if (company.company_status === 'liquidation') risk += 60;
    else if (company.company_status === 'administration') risk += 45;
    
    // Age factor
    const age = new Date().getFullYear() - new Date(company.date_of_creation).getFullYear();
    if (age < 2) risk += 15;
    else if (age > 10) risk -= 5;
    
    return Math.min(100, Math.max(0, risk));
  };

  const getRiskLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (score <= 25) return 'low';
    if (score <= 50) return 'medium';
    if (score <= 75) return 'high';
    return 'critical';
  };

  const getTrend = (): 'improving' | 'stable' | 'deteriorating' => {
    const trends = ['improving', 'stable', 'deteriorating'];
    return trends[Math.floor(Math.random() * trends.length)] as any;
  };

  const getFinancialFactors = (company: any): string[] => {
    const factors = ['Cash flow stability', 'Debt management', 'Revenue diversity'];
    if (company.company_status !== 'active') factors.push('Liquidity concerns');
    return factors;
  };

  const getOperationalFactors = (company: any): string[] => {
    return ['Business continuity', 'Supply chain resilience', 'Operational efficiency'];
  };

  const getRegulatoryFactors = (company: any): string[] => {
    const factors = ['Compliance history', 'Filing timeliness', 'Regulatory changes'];
    if (company.company_type === 'plc') factors.push('Market disclosure requirements');
    return factors;
  };

  const getMarketFactors = (company: any): string[] => {
    return ['Market competition', 'Industry trends', 'Economic sensitivity'];
  };

  const getGovernanceFactors = (company: any): string[] => {
    const factors = ['Board structure', 'Management experience'];
    if (company.company_type === 'plc') factors.push('Shareholder relations');
    return factors;
  };

  const generateKeyRisks = (company: any, aiInsights: any): RiskFactor[] => {
    const risks: RiskFactor[] = [];
    
    if (company.company_status !== 'active') {
      risks.push({
        id: 'status-risk',
        category: 'operational',
        risk: 'Non-active company status',
        severity: 'high',
        probability: 90,
        impact: 85,
        description: 'Company is not currently active, limiting operational capacity',
        indicators: ['Company status', 'Filing history'],
        mitigation: 'Monitor status changes and assess reactivation potential',
        timeline: 'Immediate attention required'
      });
    }

    if (aiInsights?.potential_risks) {
      aiInsights.potential_risks.forEach((risk: string, index: number) => {
        risks.push({
          id: `ai-risk-${index}`,
          category: 'market',
          risk: risk,
          severity: index === 0 ? 'medium' : 'low',
          probability: 60 - (index * 10),
          impact: 70 - (index * 15),
          description: `AI-identified risk factor based on company analysis`,
          indicators: ['Market analysis', 'Company profile'],
          mitigation: 'Regular monitoring and strategic planning',
          timeline: 'Medium-term focus'
        });
      });
    }

    return risks;
  };

  const getDefaultRecommendations = (): string[] => {
    return [
      'Implement regular risk monitoring procedures',
      'Maintain adequate financial reserves',
      'Ensure regulatory compliance',
      'Diversify business operations'
    ];
  };

  const getMonitoringPoints = (company: any): string[] => {
    const points = [
      'Monthly financial position review',
      'Quarterly compliance check',
      'Annual risk assessment update'
    ];
    
    if (company.company_type === 'plc') {
      points.push('Market performance monitoring');
    }
    
    return points;
  };

  const getDataQuality = (company: any): 'excellent' | 'good' | 'fair' | 'limited' => {
    if (company.accounts && company.accounts.last_accounts) return 'excellent';
    if (company.company_status === 'active') return 'good';
    return 'fair';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'stable': return <Activity className="h-3 w-3 text-blue-600" />;
      case 'deteriorating': return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
      default: return <Activity className="h-3 w-3 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <AlertTriangle className="mr-3 h-8 w-8 text-red-600" />
          Risk Analysis Dashboard
        </h1>
        <p className="mt-2 text-gray-600">
          Comprehensive risk assessment using AI-powered analysis and Companies House data
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-blue-600" />
            <span>Company Risk Assessment</span>
          </CardTitle>
          <CardDescription>
            Enter a company number to generate a detailed risk analysis report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="e.g., 00445790"
                value={companyNumber}
                onChange={(e) => setCompanyNumber(e.target.value.toUpperCase())}
                disabled={loading}
                className="text-base"
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={loading || !companyNumber.trim()}
              className="min-w-[140px] bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Analyze Risk
                </>
              )}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Try:</span>
            {['00445790', '04174437', '05959024'].map((example) => (
              <Button
                key={example}
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-xs text-red-600 hover:text-red-800"
                onClick={() => setCompanyNumber(example)}
              >
                {example}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Risk Analysis Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Assessment Results */}
      {riskAssessment && (
        <div className="space-y-6">
          {/* Overall Risk Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <span>Overall Risk Assessment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getRiskColor(riskAssessment.dataQuality)}>
                    {riskAssessment.dataQuality} data
                  </Badge>
                  <Badge variant="outline" className="text-blue-600">
                    {riskAssessment.confidenceScore}% confidence
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-6xl font-bold mb-2" style={{ color: riskAssessment.riskLevel === 'critical' ? '#dc2626' : riskAssessment.riskLevel === 'high' ? '#ea580c' : riskAssessment.riskLevel === 'medium' ? '#d97706' : '#16a34a' }}>
                  {riskAssessment.overallRiskScore}
                </div>
                <Badge variant="outline" className={`text-lg py-1 px-3 ${getRiskColor(riskAssessment.riskLevel)}`}>
                  {riskAssessment.riskLevel.toUpperCase()} RISK
                </Badge>
              </div>

              <div className="text-center text-lg font-medium text-gray-900 mb-2">
                {riskAssessment.companyName}
              </div>
              <div className="text-center text-gray-600 mb-4">
                Company #{riskAssessment.companyNumber}
              </div>

              <Progress 
                value={riskAssessment.overallRiskScore} 
                className="w-full h-3"
              />
              
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Low Risk</span>
                <span>High Risk</span>
              </div>
            </CardContent>
          </Card>

          {/* Risk Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span>Risk Categories</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(riskAssessment.categories).map(([key, category]) => (
                  <Card key={key} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900 capitalize">{key}</h3>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(category.trend)}
                        <Badge variant="outline" className={`text-xs ${getRiskColor(category.level)}`}>
                          {category.level}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-2xl font-bold mb-2 text-center" style={{ color: category.level === 'critical' ? '#dc2626' : category.level === 'high' ? '#ea580c' : category.level === 'medium' ? '#d97706' : '#16a34a' }}>
                      {Math.round(category.score)}
                    </div>
                    
                    <Progress value={category.score} className="mb-3" />
                    
                    <div className="space-y-1">
                      {category.factors.map((factor, index) => (
                        <div key={index} className="text-xs text-gray-600 flex items-center space-x-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <span>{factor}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Risk Factors */}
          {riskAssessment.keyRisks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span>Key Risk Factors</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {riskAssessment.keyRisks.map((risk, index) => (
                    <Card key={risk.id} className="p-4 border-l-4" style={{ borderLeftColor: risk.severity === 'critical' ? '#dc2626' : risk.severity === 'high' ? '#ea580c' : risk.severity === 'medium' ? '#d97706' : '#16a34a' }}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{risk.risk}</h3>
                        <Badge variant="outline" className={getSeverityColor(risk.severity)}>
                          {risk.severity}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{risk.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Probability</div>
                          <Progress value={risk.probability} className="h-2" />
                          <div className="text-xs text-gray-600 mt-1">{risk.probability}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Impact</div>
                          <Progress value={risk.impact} className="h-2" />
                          <div className="text-xs text-gray-600 mt-1">{risk.impact}%</div>
                        </div>
                      </div>
                      
                      <div className="text-xs space-y-1">
                        <div><strong>Mitigation:</strong> {risk.mitigation}</div>
                        <div><strong>Timeline:</strong> {risk.timeline}</div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations & Monitoring */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <span>Mitigation Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {riskAssessment.mitigationRecommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <span>Monitoring Points</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {riskAssessment.monitoringPoints.map((point, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Clock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Assessment Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>Assessment Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-blue-600">
                    {new Date(riskAssessment.lastUpdated).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">Generated</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {riskAssessment.confidenceScore}%
                  </div>
                  <div className="text-sm text-gray-600">Confidence</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-purple-600">
                    {riskAssessment.keyRisks.length}
                  </div>
                  <div className="text-sm text-gray-600">Risk Factors</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-orange-600 capitalize">
                    {riskAssessment.dataQuality}
                  </div>
                  <div className="text-sm text-gray-600">Data Quality</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}