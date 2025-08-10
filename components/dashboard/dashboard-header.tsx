'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Bell, 
  Search, 
  Settings, 
  User, 
  LogOut,
  ChevronDown 
} from 'lucide-react';

export function DashboardHeader() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 lg:pl-64">
      <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
        {/* Mobile menu spacer */}
        <div className="w-12 lg:hidden"></div>
        
        {/* Logo - Only show on mobile/tablet when sidebar is hidden */}
        <div className="flex items-center lg:hidden">
          <div className="flex-shrink-0 mr-4">
            <Logo size="sm" showText={false} />
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-4 sm:mx-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies, officers, or insights..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
          </div>
        </div>

        {/* Right side items */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                    {user?.user_metadata?.full_name 
                      ? getInitials(user.user_metadata.full_name)
                      : user?.email?.charAt(0).toUpperCase() || 'U'
                    }
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-32">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
                <ChevronDown className="hidden sm:block h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}