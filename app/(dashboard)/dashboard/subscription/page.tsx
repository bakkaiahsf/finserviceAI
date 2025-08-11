'use client';

import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PricingPlans } from '@/components/subscription/pricing-plans';
import { SubscriptionDashboard } from '@/components/subscription/subscription-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

// This would typically come from auth context or server session
const DEMO_USER_ID = 'demo-user';
const DEMO_TEAM_ID = 'demo-team';

function SubscriptionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const handleSelectPlan = async (planId: string) => {
    console.log('Selected plan:', planId);
    // This would integrate with the Stripe checkout flow
    // For demo purposes, we'll just log it
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600 mt-2">
          Manage your Nexus AI subscription and monitor your usage
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="plans">Pricing Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Suspense fallback={<SubscriptionSkeleton />}>
            <SubscriptionDashboard userId={DEMO_USER_ID} />
          </Suspense>
        </TabsContent>

        <TabsContent value="plans">
          <PricingPlans
            currentPlan="free" // This would come from the user's current subscription
            onSelectPlan={handleSelectPlan}
          />
        </TabsContent>
      </Tabs>

      {/* Demo Notice */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Demo Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800">
            This is a demonstration of the subscription management system. 
            In a production environment, this would be connected to your 
            actual Stripe subscription and usage data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}