'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowUpRight,
  Building2,
  Search,
  TrendingUp,
  Users,
  AlertTriangle,
  Activity,
  Clock,
  FileText
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      name: 'Total Companies',
      value: '1,247',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Building2,
    },
    {
      name: 'Searches This Month',
      value: '89',
      change: '+4.75%',
      changeType: 'positive' as const,
      icon: Search,
    },
    {
      name: 'AI Insights Generated',
      value: '342',
      change: '+54.02%',
      changeType: 'positive' as const,
      icon: TrendingUp,
    },
    {
      name: 'Risk Alerts',
      value: '12',
      change: '-8.1%',
      changeType: 'negative' as const,
      icon: AlertTriangle,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'search',
      company: 'TESCO PLC',
      action: 'Company profile viewed',
      time: '2 minutes ago',
      icon: Building2,
    },
    {
      id: 2,
      type: 'insight',
      company: 'VODAFONE GROUP PLC',
      action: 'AI risk analysis completed',
      time: '15 minutes ago',
      icon: TrendingUp,
    },
    {
      id: 3,
      type: 'network',
      company: 'BP PLC',
      action: 'Network graph generated',
      time: '1 hour ago',
      icon: Users,
    },
    {
      id: 4,
      type: 'report',
      company: 'HSBC HOLDINGS PLC',
      action: 'Compliance report exported',
      time: '3 hours ago',
      icon: FileText,
    },
  ];

  const quickActions = [
    {
      name: 'Search Companies',
      description: 'Find UK companies and their details',
      href: '/dashboard/search',
      icon: Search,
      color: 'bg-blue-500',
    },
    {
      name: 'Generate Insights',
      description: 'AI-powered company analysis',
      href: '/dashboard/insights',
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      name: 'Network Mapping',
      description: 'Visualize company relationships',
      href: '/dashboard/network',
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      name: 'Risk Analysis',
      description: 'Identify potential business risks',
      href: '/dashboard/risk',
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'User'}
        </h2>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your UK business intelligence today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-600 flex items-center mt-1">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium mr-1 ${
                    stat.changeType === 'positive'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {stat.change}
                </span>
                from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Card key={action.name} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {action.name}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  {action.description}
                </CardDescription>
                <Button size="sm" variant="ghost" className="mt-2 p-0 h-auto">
                  Get started <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity & Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Your latest interactions and analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <activity.icon className="h-4 w-4 text-gray-400 mt-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.company}
                    </p>
                    <p className="text-sm text-gray-600">
                      {activity.action}
                    </p>
                    <div className="flex items-center mt-1">
                      <Clock className="h-3 w-3 text-gray-400 mr-1" />
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-4">
              View all activity
            </Button>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-500" />
              <span>System Status</span>
            </CardTitle>
            <CardDescription>
              Service health and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Companies House API</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">DeepSeek AI Service</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rate Limiting</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  547/600 requests
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
