'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Lightbulb,
  DollarSign,
  Activity,
  Loader2,
  RefreshCw,
  Settings,
  BarChart3,
  Shield,
  Zap
} from 'lucide-react';

interface CompanyInsight {
  summary: string;
  keyFindings: string[];
  riskScore: number;
  riskFactors: Array<{
    category: 'financial' | 'operational' | 'regulatory' | 'market';
    risk: string;
    severity: 'low' | 'medium' | 'high';
    explanation: string;
  }>;
  opportunities: string[];
  recommendations: string[];
  confidence: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'limited';
  generatedAt: string;
  tokensUsed: number;
}

interface CostInfo {
  tokensUsed: number;
  costUSD: number;
  requestCount: number;
  lastRequest: string;
}

export default function AIInsightsPage() {
  const [companyNumber, setCompanyNumber] = useState('');
  const [insights, setInsights] = useState<CompanyInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [costInfo, setCostInfo] = useState<CostInfo | null>(null);
  const [analysisOptions, setAnalysisOptions] = useState({
    includeRiskAnalysis: true,
    includeFinancialInsights: true,
    includeCompetitiveAnalysis: false,
    maxTokens: 2000,
    temperature: 0.3
  });

  const handleAnalyze = async () => {
    if (!companyNumber.trim()) {
      setError('Please enter a company number');
      return;
    }

    setLoading(true);
    setError(null);
    setInsights(null);

    try {
      const response = await fetch(`/api/companies/${companyNumber}/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisOptions)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Analysis failed');
      }

      const data = await response.json();
      setInsights(data.insights);
      setCostInfo(data.metadata.costTracking);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return 'bg-green-100 text-green-800 border-green-200';
    if (score <= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getRiskLabel = (score: number) => {
    if (score <= 30) return 'Low Risk';
    if (score <= 60) return 'Medium Risk';
    return 'High Risk';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial': return DollarSign;
      case 'operational': return Activity;
      case 'regulatory': return Shield;
      case 'market': return BarChart3;
      default: return AlertTriangle;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Business Insights</h1>
        <p className="mt-2 text-gray-600">
          Generate comprehensive AI-powered analysis of UK companies
        </p>
      </div>

      {/* Analysis Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>Generate AI Analysis</span>
          </CardTitle>
          <CardDescription>
            Enter a company number to generate detailed business intelligence insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Input */}
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
              className="min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>

          {/* Analysis Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Analysis Options</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={analysisOptions.includeRiskAnalysis}
                    onChange={(e) => setAnalysisOptions(prev => ({
                      ...prev,
                      includeRiskAnalysis: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">Include Risk Analysis</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={analysisOptions.includeFinancialInsights}
                    onChange={(e) => setAnalysisOptions(prev => ({
                      ...prev,
                      includeFinancialInsights: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">Include Financial Insights</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={analysisOptions.includeCompetitiveAnalysis}
                    onChange={(e) => setAnalysisOptions(prev => ({
                      ...prev,
                      includeCompetitiveAnalysis: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">Include Competitive Analysis</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Advanced Settings</h4>
              <div className="space-y-2">
                <div>
                  <label className="text-sm text-gray-600">Max Tokens</label>
                  <Input
                    type="number"
                    min="500"
                    max="4000"
                    value={analysisOptions.maxTokens}
                    onChange={(e) => setAnalysisOptions(prev => ({
                      ...prev,
                      maxTokens: parseInt(e.target.value) || 2000
                    }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Temperature (0-1)</label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={analysisOptions.temperature}
                    onChange={(e) => setAnalysisOptions(prev => ({
                      ...prev,
                      temperature: parseFloat(e.target.value) || 0.3
                    }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Examples */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Try:</span>
            {['00445790', '04174437', '00445790'].map((example) => (
              <Button
                key={example}
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-xs text-purple-600 hover:text-purple-800"
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
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Analysis Error</h3>
                <p className="text-sm text-red-700">{error}</p>
                {error.includes('Insufficient Balance') && (
                  <p className="text-xs text-red-600 mt-1">
                    Please add credits to your DeepSeek API account to continue using AI analysis.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {insights && (
        <div className="space-y-6">
          {/* Analysis Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span>Executive Summary</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getConfidenceColor(insights.confidence)}>
                    {insights.confidence}% Confidence
                  </Badge>
                  <Badge variant="outline">
                    {insights.dataQuality} Data
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{insights.summary}</p>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{insights.riskScore}</div>
                  <Badge variant="outline" className={getRiskColor(insights.riskScore)}>
                    {getRiskLabel(insights.riskScore)}
                  </Badge>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{insights.tokensUsed}</div>
                  <div className="text-sm text-gray-600">Tokens Used</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Findings */}
          {insights.keyFindings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  <span>Key Findings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {insights.keyFindings.map((finding, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <p className="text-gray-700">{finding}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Risk Analysis */}
          {insights.riskFactors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span>Risk Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.riskFactors.map((risk, index) => {
                    const CategoryIcon = getCategoryIcon(risk.category);
                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <CategoryIcon className="h-4 w-4 text-gray-500" />
                            <h4 className="font-medium text-gray-900">{risk.risk}</h4>
                          </div>
                          <Badge variant="outline" className={getSeverityColor(risk.severity)}>
                            {risk.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Category:</span> {risk.category}
                        </p>
                        <p className="text-sm text-gray-700">{risk.explanation}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Opportunities & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opportunities */}
            {insights.opportunities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <span>Opportunities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insights.opportunities.map((opportunity, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Zap className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {insights.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    <span>Recommendations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insights.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <RefreshCw className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Cost Information */}
          {costInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span>Usage & Cost Tracking</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {costInfo.tokensUsed.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Tokens</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600">
                      ${costInfo.costUSD.toFixed(6)}
                    </div>
                    <div className="text-sm text-gray-600">Total Cost</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-purple-600">
                      {costInfo.requestCount}
                    </div>
                    <div className="text-sm text-gray-600">Requests Made</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-600">
                      {new Date(costInfo.lastRequest).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600">Last Analysis</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Analysis Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Generated: {new Date(insights.generatedAt).toLocaleString()}</p>
                <p>Analysis ID: {insights.generatedAt.split('T')[0].replace(/-/g, '')}</p>
                <p>Model: DeepSeek Chat v1.0</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}