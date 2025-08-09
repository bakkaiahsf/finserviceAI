import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth/supabase-client';
import { quotaManager } from '@/lib/quota/quota-manager';
import { PRICING_TIERS } from '@/lib/stripe/stripe-client';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const teamId = url.searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

    // Get team and verify user has access
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select(`
        *,
        team_members!inner(user_id, role)
      `)
      .eq('id', teamId)
      .eq('team_members.user_id', user.id)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
    }

    // Get usage statistics
    const usageStats = await quotaManager.getUsageStats(user.id);
    const quotaAlerts = await quotaManager.checkQuotaAlerts(user.id);

    // Get pricing tier information
    const currentPlan = team.plan_name || 'free';
    const tier = PRICING_TIERS.find(t => t.id === currentPlan);

    if (!tier) {
      return NextResponse.json({ error: 'Invalid plan configuration' }, { status: 500 });
    }

    const response = {
      team: {
        id: team.id,
        name: team.name,
        plan_name: currentPlan,
        subscription_status: team.subscription_status || 'active',
        stripe_customer_id: team.stripe_customer_id,
        stripe_subscription_id: team.stripe_subscription_id
      },
      plan: {
        id: tier.id,
        name: tier.name,
        description: tier.description,
        price: tier.price,
        interval: tier.interval,
        features: tier.features,
        limits: tier.limits,
        recommended: tier.recommended
      },
      usage: {
        current: usageStats.current,
        limits: usageStats.limits,
        utilization: usageStats.utilization,
        daysUntilReset: usageStats.daysUntilReset,
        alerts: quotaAlerts
      },
      billing: {
        hasPaymentMethod: !!team.stripe_customer_id,
        canUpgrade: currentPlan !== 'expert',
        canDowngrade: currentPlan !== 'free',
        nextBillingDate: usageStats.current.period_end,
        portalAvailable: !!team.stripe_customer_id
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}