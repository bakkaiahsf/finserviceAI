'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Users,
  Bell,
  Download,
  Save,
  MoreHorizontal
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('team');
  const [notifications, setNotifications] = useState({
    emailReports: true,
    riskAlerts: true,
    systemUpdates: false,
    marketingEmails: false
  });

  const tabs = [
    { id: 'team', label: 'Team', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
          <Settings className="h-8 w-8" />
          <span>Team & Settings</span>
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your team members and configure account preferences
        </p>
      </div>

      {/* Settings Navigation */}
      <div className="flex flex-wrap gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Team Management */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Team Management</span>
              </CardTitle>
              <CardDescription>Manage your team members and their access permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Team Members */}
              <div>
                <Label className="text-base font-medium">Current Team Members</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                        JS
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">John Smith</p>
                        <p className="text-sm text-gray-600">john.smith@company.com</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">Owner</Badge>
                      <Button variant="ghost" size="sm" disabled>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-medium">
                        ED
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Emma Davis</p>
                        <p className="text-sm text-gray-600">emma.davis@company.com</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800">Admin</Badge>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                        MT
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Michael Thompson</p>
                        <p className="text-sm text-gray-600">mike.thompson@company.com</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-gray-100 text-gray-800">Viewer</Badge>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Invite New Member */}
              <div>
                <Label className="text-base font-medium">Invite Team Member</Label>
                <div className="mt-3 flex space-x-2">
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    className="flex-1"
                  />
                  <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Send Invite
                  </Button>
                </div>
              </div>

              {/* Team Permissions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <Label className="text-base font-medium">Permission Levels</Label>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Owner</span>
                    <span className="text-gray-600">Full access to all features and team management</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Admin</span>
                    <span className="text-gray-600">Access to all features, can invite team members</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Viewer</span>
                    <span className="text-gray-600">Read-only access to company data and insights</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>General Settings</span>
              </CardTitle>
              <CardDescription>Configure your account and application preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Settings */}
              <div>
                <Label className="text-base font-medium">Profile Information</Label>
                <div className="mt-3 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" defaultValue="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" defaultValue="Smith" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue="john.smith@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" defaultValue="Business Analytics Ltd" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notification Preferences */}
              <div>
                <Label className="text-base font-medium">Notifications</Label>
                <div className="mt-3 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="emailReports">Email Reports</Label>
                      <p className="text-sm text-gray-600">Receive weekly analysis reports and insights</p>
                    </div>
                    <Switch
                      id="emailReports"
                      checked={notifications.emailReports}
                      onCheckedChange={(checked) => setNotifications({...notifications, emailReports: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="riskAlerts">Risk Alerts</Label>
                      <p className="text-sm text-gray-600">Get notified about high-risk company changes</p>
                    </div>
                    <Switch
                      id="riskAlerts"
                      checked={notifications.riskAlerts}
                      onCheckedChange={(checked) => setNotifications({...notifications, riskAlerts: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="systemUpdates">System Updates</Label>
                      <p className="text-sm text-gray-600">Platform maintenance and feature announcements</p>
                    </div>
                    <Switch
                      id="systemUpdates"
                      checked={notifications.systemUpdates}
                      onCheckedChange={(checked) => setNotifications({...notifications, systemUpdates: checked})}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Security Settings */}
              <div>
                <Label className="text-base font-medium">Security</Label>
                <div className="mt-3 space-y-4">
                  <div>
                    <Label>Password</Label>
                    <div className="flex space-x-2 mt-2">
                      <Input type="password" value="••••••••••••" disabled className="flex-1" />
                      <Button variant="outline">Change Password</Button>
                    </div>
                  </div>
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                      <Button variant="outline" size="sm">Enable 2FA</Button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Data Management */}
              <div>
                <Label className="text-base font-medium">Data Management</Label>
                <div className="mt-3 space-y-4">
                  <div>
                    <Label>Export Data</Label>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-gray-600">Download all your account data and search history</p>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}