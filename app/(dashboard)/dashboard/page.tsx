'use client';

import { useAuth } from '@/lib/auth/auth-context';

// Client-side dashboard page
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowUpRight,
  Building2,
  Search,
  TrendingUp,
  Users,
  AlertTriangle,
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


  const quickActions = [
    {
      name: 'Company Search & Intelligence',
      description: 'Search 15M+ UK companies • View profiles, officers, PSCs • Real-time Companies House data',
      href: '/dashboard/search',
      icon: Search,
      color: 'bg-blue-600',
      stats: '1,247 companies analyzed',
    },
    {
      name: 'AI Risk Assessment',
      description: 'OpenRouter AI analysis • Risk scoring (0-100) • Compliance insights • Pattern detection',
      href: '/dashboard/insights',
      icon: TrendingUp,
      color: 'bg-emerald-600',
      stats: '342 insights generated',
    },
    {
      name: '3-Level Network Mapping',
      description: 'Interactive relationship graphs • Directors, PSCs, ownership • Up to 3 hops deep',
      href: '/dashboard/network',
      icon: Users,
      color: 'bg-purple-600',
      stats: 'React Flow visualization',
    },
    {
      name: 'Compliance & Reports',
      description: 'PDF/CSV exports • Audit trails • Regulatory compliance • Evidence packages',
      href: '/dashboard/risk',
      icon: FileText,
      color: 'bg-orange-600',
      stats: '12 risk alerts active',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 lg:space-y-10">
      {/* Welcome Section with Modern Gradient Design */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-2xl p-6 sm:p-8 lg:p-10 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20"></div>
        </div>
        
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                UK Business Intelligence Hub
              </h1>
              <p className="mt-4 text-lg sm:text-xl text-blue-100 leading-relaxed">
                Real-time insights into 15M+ UK companies
              </p>
              <p className="mt-2 text-base text-blue-200">
                AI-powered risk analysis • 3-level relationship mapping • Enterprise intelligence
              </p>
              
              {/* Quick Stats - Only shown when authenticated */}
              {user && (
                <div className="mt-6 flex flex-wrap gap-4 sm:gap-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-blue-100">Live API Data</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-blue-100">OpenRouter AI Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-sm text-blue-100">Enhanced Analysis</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-shrink-0">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/30">
                <p className="text-sm text-blue-100 mb-1">Welcome back,</p>
                <p className="text-2xl font-bold text-white">{user?.user_metadata?.full_name?.split(' ')[0] || 'User'}</p>
                <p className="text-sm text-blue-200 mt-1">Free Plan</p>
                {user && (
                  <div className="mt-3 flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full"></div>
                    <span className="text-xs text-blue-100">Enhanced AI Analysis</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const gradients = [
            'from-blue-500 to-cyan-500',
            'from-emerald-500 to-teal-500', 
            'from-purple-500 to-pink-500',
            'from-orange-500 to-red-500'
          ];
          
          return (
            <Card key={stat.name} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index]} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
              
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {stat.name}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${gradients[index]} shadow-sm`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              
              <CardContent className="relative">
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      stat.changeType === 'positive'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-500">from last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Business Intelligence Hub - Modern Cards */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Intelligence Tools</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Access critical UK company data with one click • Enterprise-grade analysis and reporting</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {quickActions.map((action, index) => {
            const cardGradients = [
              'from-blue-500 to-cyan-400',
              'from-emerald-500 to-teal-400', 
              'from-purple-500 to-pink-400',
              'from-orange-500 to-red-400'
            ];
            
            return (
              <Card key={action.name} className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-1">
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${cardGradients[index]} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                  <div className={`absolute inset-0 bg-gradient-to-br ${cardGradients[index]} rounded-full transform translate-x-16 -translate-y-16`}></div>
                </div>
                
                <CardHeader className="relative pb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-4 rounded-2xl bg-gradient-to-br ${cardGradients[index]} shadow-lg group-hover:shadow-xl transition-shadow`}>
                        <action.icon className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                          {action.name}
                        </CardTitle>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${cardGradients[index]} text-white shadow-sm`}>
                          {action.stats}
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-6 w-6 text-gray-400 group-hover:text-gray-600 group-hover:scale-110 transition-all" />
                  </div>
                </CardHeader>
                
                <CardContent className="relative pt-0">
                  <CardDescription className="text-base leading-relaxed text-gray-600 mb-6">
                    {action.description}
                  </CardDescription>
                  <Button 
                    size="lg" 
                    className={`w-full bg-gradient-to-r ${cardGradients[index]} hover:opacity-90 border-0 shadow-lg hover:shadow-xl transition-all font-semibold`}
                  >
                    Access Now 
                    <ArrowUpRight className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Company Access - Cleaner Design */}
      <div className="mb-4">
        <div className="text-center mb-5">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Company Access</h3>
          <p className="text-gray-600 max-w-xl mx-auto">Search 15M+ UK companies instantly or access popular companies with one click</p>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Enhanced Search Card */}
          <Card className="lg:col-span-2 group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-400 opacity-5 group-hover:opacity-8 transition-opacity"></div>
            
            <CardHeader className="relative pb-6">
              <CardTitle className="text-2xl font-bold flex items-center text-gray-900 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 mr-4 shadow-lg">
                  <Search className="h-6 w-6 text-white" />
                </div>
                Instant Company Search
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                Search by company name, number, or officer name for immediate AI-powered results
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative">
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <input
                  type="text"
                  placeholder="e.g., Tesco PLC, 00445790, John Smith..."
                  className="flex-1 px-5 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm"
                />
                <Button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                  Search Now
                </Button>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 mr-2">Try:</span>
                {['British Airways', 'Tesco PLC', '00345815'].map((example) => (
                  <button
                    key={example}
                    className="text-xs px-3 py-1 bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-full transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Popular Companies Card */}
          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-400 opacity-5 group-hover:opacity-8 transition-opacity"></div>
            
            <CardHeader className="relative pb-6">
              <CardTitle className="text-xl font-bold flex items-center text-gray-900 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 mr-3 shadow-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                Popular Companies
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                One-click access to frequently analyzed companies
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative space-y-3">
              {['TESCO PLC', 'VODAFONE GROUP', 'BP PLC', 'HSBC HOLDINGS'].map((company, index) => (
                <Button
                  key={company}
                  variant="ghost"
                  className="w-full justify-start text-left hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 p-4 rounded-xl group/button transition-all"
                >
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 mr-3 group-hover/button:shadow-md transition-shadow">
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 group-hover/button:text-emerald-700 transition-colors">
                        {company}
                      </div>
                      <div className="text-xs text-gray-500">
                        Click to analyze
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}