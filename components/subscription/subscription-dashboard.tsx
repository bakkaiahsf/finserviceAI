'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCardIcon, 
  TrendingUpIcon, 
  AlertTriangleIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  RefreshCwIcon
} from 'lucide-react';
import { quotaManager, type QuotaUsage } from '@/lib/quota/quota-manager';
import { PRICING_TIERS, type PricingTier } from '@/lib/stripe/stripe-client';
import { cn } from '@/lib/utils';

interface SubscriptionDashboardProps {
  userId: string;
}

interface UsageStats {
  current: QuotaUsage;
  limits: PricingTier['limits'];
  utilization: {
    searches: number;
    ai_analyses: number;
    network_graphs: number;
    pdf_reports: number;
    csv_exports: number;
    api_calls: number;
  };
  daysUntilReset: number;
  planName: string;
}

interface QuotaAlert {
  quotaType: string;
  usage: number;
  limit: number;
  percentage: number;
  severity: 'warning' | 'critical';
}

export function SubscriptionDashboard({ userId }: SubscriptionDashboardProps) {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [alerts, setAlerts] = useState<QuotaAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      const [stats, quotaAlerts] = await Promise.all([
        quotaManager.getUsageStats(userId),
        quotaManager.checkQuotaAlerts(userId)
      ]);

      setUsageStats(stats);
      setAlerts(quotaAlerts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage data');
      console.error('Error fetching usage data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchUsageData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  const formatQuotaType = (type: string) => {
    const labels = {
      searches: 'Company Searches',
      ai_analyses: 'AI Risk Analyses', 
      network_graphs: 'Network Graphs',
      pdf_reports: 'PDF Reports',
      csv_exports: 'CSV Exports',
      api_calls: 'API Calls'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return 'Unlimited';
    return limit.toLocaleString();
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-orange-600 bg-orange-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Usage Data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchUsageData} variant="outline">
          <RefreshCwIcon className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!usageStats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Dashboard</h1>
          <p className="text-gray-600">Monitor your usage and manage your subscription</p>
        </div>
        <Button onClick={fetchUsageData} variant="outline" size="sm">
          <RefreshCwIcon className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Usage Alerts</h2>
          {alerts.map((alert, index) => (
            <Card key={index} className={cn(
              "border-l-4",
              alert.severity === 'critical' ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'
            )}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangleIcon className={cn(
                      "w-5 h-5",
                      alert.severity === 'critical' ? 'text-red-600' : 'text-orange-600'
                    )} />
                    <div>
                      <h3 className="font-medium">{formatQuotaType(alert.quotaType)} Usage Alert</h3>
                      <p className="text-sm text-gray-600">
                        {alert.usage.toLocaleString()} of {alert.limit.toLocaleString()} used ({alert.percentage}%)
                      </p>
                    </div>
                  </div>
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {alert.severity === 'critical' ? 'Critical' : 'Warning'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="usage" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="usage">Current Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing & Plan</TabsTrigger>
          <TabsTrigger value="history">Usage History</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-6">
          {/* Plan Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                Current Plan: {usageStats.planName}
              </CardTitle>
              <CardDescription>
                {usageStats.daysUntilReset} days until your usage resets
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Usage Metrics Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(usageStats.utilization).map(([key, percentage]) => {
              const current = usageStats.current[key as keyof QuotaUsage] as number;
              const limit = usageStats.limits[key === 'ai_analyses' ? 'aiAnalysesPerMonth' : 
                             key === 'network_graphs' ? 'networkGraphs' :
                             key === 'pdf_reports' ? 'pdfReports' :
                             key === 'csv_exports' ? 'csvExports' :
                             key === 'api_calls' ? 'apiCalls' :
                             'searchesPerMonth'] as number;

              return (
                <Card key={key}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {formatQuotaType(key)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{current.toLocaleString()}</span>
                      <Badge className={cn("text-xs", getUtilizationColor(percentage))}>
                        {percentage}%
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>of {formatLimit(limit)}</span>
                        <span>{limit === -1 ? 'Unlimited' : `${(limit - current).toLocaleString()} remaining`}</span>
                      </div>
                      <Progress 
                        value={limit === -1 ? 0 : percentage} 
                        className="h-2" 
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5" />
                Billing Information
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Current Plan</h3>
                  <p className="text-sm text-gray-600">{usageStats.planName} Plan</p>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Billing Cycle</h3>
                  <p className="text-sm text-gray-600">Monthly billing</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Next billing date</p>
                  <p className="font-medium">
                    {new Date(usageStats.current.period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button variant="outline">
                <ExternalLinkIcon className="w-4 h-4 mr-2" />
                Billing Portal
              </Button>
              <Button>
                Upgrade Plan
              </Button>
            </CardFooter>
          </Card>

          {/* Plan Features */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Features</CardTitle>
              <CardDescription>Your current plan includes:</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Monthly Limits</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Company Searches:</span>
                      <span>{formatLimit(usageStats.limits.searchesPerMonth)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Risk Analyses:</span>
                      <span>{formatLimit(usageStats.limits.aiAnalysesPerMonth)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network Graphs:</span>
                      <span>{formatLimit(usageStats.limits.networkGraphs)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PDF Reports:</span>
                      <span>{formatLimit(usageStats.limits.pdfReports)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CSV Exports:</span>
                      <span>{formatLimit(usageStats.limits.csvExports)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Team & API</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Team Members:</span>
                      <span>{formatLimit(usageStats.limits.teamMembers)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>API Calls:</span>
                      <span>{formatLimit(usageStats.limits.apiCalls)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="w-5 h-5" />
                Usage History
              </CardTitle>
              <CardDescription>
                Track your usage patterns over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Usage Analytics</h3>
                <p className="text-gray-600 mb-4">
                  Historical usage data and analytics will be available here
                </p>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}