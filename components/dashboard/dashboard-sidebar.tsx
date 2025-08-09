'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Building2,
  FileText,
  Home,
  Network,
  Search,
  Settings,
  Users,
  CreditCard,
  Shield,
  Menu,
  X,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Company Search', href: '/dashboard/search', icon: Search },
  { name: 'Companies', href: '/dashboard/companies', icon: Building2 },
  { name: 'Network Graph', href: '/dashboard/network', icon: Network },
  { name: 'AI Insights', href: '/dashboard/insights', icon: TrendingUp },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Risk Analysis', href: '/dashboard/risk', icon: AlertTriangle },
];

const managementNavigation = [
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Subscription', href: '/dashboard/subscription', icon: CreditCard },
  { name: 'Compliance', href: '/dashboard/compliance', icon: Shield },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardSidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const NavLink = ({ 
    item, 
    mobile = false 
  }: { 
    item: typeof navigation[0]; 
    mobile?: boolean;
  }) => {
    const isActive = pathname === item.href;
    
    return (
      <Link
        href={item.href}
        className={cn(
          'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
          isActive
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
          mobile && 'px-3 py-3'
        )}
        onClick={() => mobile && setMobileMenuOpen(false)}
      >
        <item.icon
          className={cn(
            'mr-3 flex-shrink-0 h-5 w-5',
            isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
          )}
          aria-hidden="true"
        />
        {item.name}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:transform-none lg:static lg:inset-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-4 py-4 border-b border-gray-200 lg:hidden">
            <h1 className="text-xl font-bold text-blue-600">Nexus AI</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            <div className="space-y-1">
              {navigation.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
            </div>

            <div className="pt-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Management
              </h3>
              <div className="mt-2 space-y-1">
                {managementNavigation.map((item) => (
                  <NavLink key={item.name} item={item} />
                ))}
              </div>
            </div>
          </nav>

          {/* Usage Info */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-900">Free Plan</p>
                    <p className="text-xs text-blue-700">25 / 100 searches used</p>
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <div className="bg-blue-200 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '25%' }} />
                </div>
              </div>
              <div className="mt-2">
                <Button size="sm" className="w-full text-xs">
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}