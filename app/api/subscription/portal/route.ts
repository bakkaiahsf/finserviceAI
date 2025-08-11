import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/stripe/stripe-client';
import { auditLogger } from '@/lib/audit/audit-logger';
import { createServerSupabaseClient } from '@/lib/auth/supabase-client';
import { z } from 'zod';

const portalSchema = z.object({
  teamId: z.string()
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
    const { teamId } = portalSchema.parse(body);

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

    if (teamError || !team || !team.stripe_customer_id) {
      return NextResponse.json({ error: 'Team not found, insufficient permissions, or no billing setup' }, { status: 404 });
    }

    // Create billing portal session
    const session = await stripeService.createPortalSession(
      team.stripe_customer_id,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`
    );

    // Log portal access
    await auditLogger.logEvent({
      user_id: user.id,
      action: 'billing_portal_accessed',
      resource_type: 'subscription',
      resource_id: teamId,
      details: {
        customer_id: team.stripe_customer_id,
        session_id: session.id,
        current_plan: team.plan_name || 'free'
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      success: true
    });

    return NextResponse.json({ 
      url: session.url 
    });

  } catch (error) {
    console.error('Portal error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}