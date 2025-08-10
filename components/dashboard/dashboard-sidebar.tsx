'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
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
  { name: 'Network Graph', href: '/dashboard/network', icon: Network },
  { name: 'AI Insights', href: '/dashboard/insights', icon: TrendingUp },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Risk Analysis', href: '/dashboard/risk', icon: AlertTriangle },
];

const managementNavigation = [
  { name: 'Team & Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Contact', href: '/dashboard/contact', icon: Users },
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
          'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out',
          isActive
            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500 shadow-sm'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm',
          mobile && 'px-4 py-3 mx-2'
        )}
        onClick={() => mobile && setMobileMenuOpen(false)}
      >
        <item.icon
          className={cn(
            'mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200',
            isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
          )}
          aria-hidden="true"
        />
        <span className="truncate">{item.name}</span>
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
          className="p-2 bg-white shadow-sm border border-gray-200 hover:bg-gray-50"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5 text-gray-600" />
          ) : (
            <Menu className="h-5 w-5 text-gray-600" />
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
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:transform-none lg:static lg:inset-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-4 py-4 border-b border-gray-200 lg:hidden">
            <Logo size="md" />
          </div>

          {/* Desktop Logo */}
          <div className="hidden lg:flex items-center px-4 py-6 border-b border-gray-100">
            <Logo size="md" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
            <div className="space-y-1">
              {navigation.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
            </div>

            <div className="pt-8">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Management
              </h3>
              <div className="space-y-1">
                {managementNavigation.map((item) => (
                  <NavLink key={item.name} item={item} />
                ))}
              </div>
            </div>
          </nav>

          {/* Usage Info */}
          <div className="flex-shrink-0 p-4 border-t border-gray-100">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
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
              <div className="mb-3">
                <div className="bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: '25%' }} />
                </div>
              </div>
              <Button size="sm" className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}