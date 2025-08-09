'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SubscriptionStatus {
  team: {
    id: string;
    name: string;
    plan_name: string;
    subscription_status: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
  };
  plan: {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: string;
    features: string[];
    limits: Record<string, number>;
    recommended?: boolean;
  };
  usage: {
    current: any;
    limits: Record<string, number>;
    utilization: Record<string, number>;
    daysUntilReset: number;
    alerts: Array<{
      quotaType: string;
      usage: number;
      limit: number;
      percentage: number;
      severity: 'warning' | 'critical';
    }>;
  };
  billing: {
    hasPaymentMethod: boolean;
    canUpgrade: boolean;
    canDowngrade: boolean;
    nextBillingDate: string;
    portalAvailable: boolean;
  };
}

interface UseSubscriptionResult {
  subscription: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  createCheckout: (planId: string, trialDays?: number) => Promise<void>;
  openBillingPortal: () => Promise<void>;
}

export function useSubscription(teamId: string): UseSubscriptionResult {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/subscription/status?teamId=${teamId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch subscription');
      }

      const data = await response.json();
      setSubscription(data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Subscription fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = async () => {
    await fetchSubscription();
  };

  const createCheckout = async (planId: string, trialDays?: number) => {
    try {
      setError(null);

      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          teamId,
          trialDays
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create checkout';
      setError(errorMessage);
      console.error('Checkout error:', err);
      throw err;
    }
  };

  const openBillingPortal = async () => {
    try {
      setError(null);

      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to open billing portal');
      }

      const { url } = await response.json();
      
      // Open billing portal in new tab
      window.open(url, '_blank');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open billing portal';
      setError(errorMessage);
      console.error('Billing portal error:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (teamId) {
      fetchSubscription();
    }
  }, [teamId]);

  return {
    subscription,
    loading,
    error,
    refreshSubscription,
    createCheckout,
    openBillingPortal
  };
}

// Hook for checking if a feature is available based on current plan
export function useFeatureAccess(teamId: string) {
  const { subscription, loading } = useSubscription(teamId);

  const hasFeatureAccess = (feature: string): boolean => {
    if (loading || !subscription) return false;

    const plan = subscription.plan;
    return plan.features.some(f => f.toLowerCase().includes(feature.toLowerCase()));
  };

  const isWithinQuota = (quotaType: keyof typeof subscription.usage.limits): boolean => {
    if (loading || !subscription) return false;

    const usage = subscription.usage;
    const limit = usage.limits[quotaType];
    const current = usage.current[quotaType] || 0;

    if (limit === -1) return true; // Unlimited
    return current < limit;
  };

  const getQuotaUsage = (quotaType: keyof typeof subscription.usage.limits) => {
    if (loading || !subscription) {
      return { current: 0, limit: 0, remaining: 0, percentage: 0 };
    }

    const usage = subscription.usage;
    const limit = usage.limits[quotaType];
    const current = usage.current[quotaType] || 0;
    
    const remaining = limit === -1 ? Infinity : Math.max(0, limit - current);
    const percentage = limit === -1 ? 0 : Math.round((current / limit) * 100);

    return {
      current,
      limit,
      remaining,
      percentage,
      isUnlimited: limit === -1
    };
  };

  return {
    subscription,
    loading,
    hasFeatureAccess,
    isWithinQuota,
    getQuotaUsage,
    canUpgrade: subscription?.billing.canUpgrade ?? false,
    hasPaymentMethod: subscription?.billing.hasPaymentMethod ?? false
  };
}