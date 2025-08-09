'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Trash2, Loader2 } from 'lucide-react';

export default function SecurityPage() {
  const [passwordState, setPasswordState] = React.useState<any>({});
  const [deleteState, setDeleteState] = React.useState<any>({});
  const [isPasswordPending, setIsPasswordPending] = React.useState(false);
  const [isDeletePending, setIsDeletePending] = React.useState(false);
  
  const handlePasswordUpdate = async (formData: FormData) => {
    setIsPasswordPending(true);
    setTimeout(() => {
      setPasswordState({ success: 'Password updated successfully' });
      setIsPasswordPending(false);
    }, 1000);
  };
  
  const handleDeleteAccount = async (formData: FormData) => {
    setIsDeletePending(true);
    setTimeout(() => {
      setDeleteState({ success: 'Account deletion initiated' });
      setIsDeletePending(false);
    }, 1000);
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Security Settings
      </h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" action={handlePasswordUpdate}>
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  name="currentPassword"
                  type="password"
                  required
                />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                />
              </div>
              {passwordState.error && (
                <p className="text-red-500 text-sm">{passwordState.error}</p>
              )}
              {passwordState.success && (
                <p className="text-green-500 text-sm">{passwordState.success}</p>
              )}
              <Button
                type="submit"
                disabled={isPasswordPending}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isPasswordPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </p>
            <details className="mb-4">
              <summary className="cursor-pointer text-sm font-medium">
                What happens when I delete my account?
              </summary>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p>• Your profile and account data will be permanently deleted</p>
                <p>• All your saved data will be removed</p>
                <p>• You will lose access to all premium features</p>
                <p>• This action cannot be reversed</p>
              </div>
            </details>
            
            <form className="space-y-4" action={handleDeleteAccount}>
              <div>
                <Label htmlFor="delete-password">
                  Enter your password to confirm
                </Label>
                <Input
                  id="delete-password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                />
              </div>
              {deleteState.error && (
                <p className="text-red-500 text-sm">{deleteState.error}</p>
              )}
              {deleteState.success && (
                <p className="text-green-500 text-sm">{deleteState.success}</p>
              )}
              <Button
                type="submit"
                variant="destructive"
                disabled={isDeletePending}
              >
                {isDeletePending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}