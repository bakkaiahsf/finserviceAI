import { NextRequest, NextResponse } from 'next/server';
import { stripeService, PRICING_TIERS } from '@/lib/stripe/stripe-client';
import { auditLogger } from '@/lib/audit/audit-logger';
import { createServerSupabaseClient } from '@/lib/auth/supabase-client';
import { z } from 'zod';

const checkoutSchema = z.object({
  planId: z.string(),
  teamId: z.string(),
  trialDays: z.number().optional()
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, teamId, trialDays } = checkoutSchema.parse(body);

    // Validate plan exists
    const tier = PRICING_TIERS.find(t => t.id === planId);
    if (!tier || !tier.stripePriceId) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // Get team and verify user has permission
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select(`
        *,
        team_members!inner(user_id, role)
      `)
      .eq('id', teamId)
      .eq('team_members.user_id', user.id)
      .in('team_members.role', ['admin', 'owner'])
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found or insufficient permissions' }, { status: 404 });
    }

    let customerId = team.stripe_customer_id;

    // Create Stripe customer if needed
    if (!customerId) {
      const customer = await stripeService.createCustomer(
        user.email!,
        user.user_metadata?.full_name,
        {
          team_id: teamId,
          user_id: user.id
        }
      );
      
      customerId = customer.id;
      
      // Update team with customer ID
      await supabase
        .from('teams')
        .update({ stripe_customer_id: customerId })
        .eq('id', teamId);
    }

    // Create checkout session
    const session = await stripeService.createCheckoutSession(
      customerId,
      tier.stripePriceId,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription/pricing`,
      trialDays
    );

    // Log checkout initiation
    await auditLogger.logEvent({
      user_id: user.id,
      action: 'checkout_initiated',
      resource_type: 'subscription',
      resource_id: teamId,
      details: {
        plan_id: planId,
        plan_name: tier.name,
        price: tier.price,
        trial_days: trialDays,
        session_id: session.id
      },
      ip_address: request.ip || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Checkout error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}