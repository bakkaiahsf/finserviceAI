import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/stripe/stripe-client';
import { quotaManager } from '@/lib/quota/quota-manager';
import { auditLogger } from '@/lib/audit/audit-logger';
import { createAdminSupabaseClient } from '@/lib/auth/supabase-client';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Process the webhook
    const result = await stripeService.handleWebhook(body, signature, webhookSecret);
    
    if (!result.handled) {
      console.log(`Webhook event ${result.event.type} was not handled`);
      return NextResponse.json({ received: true, handled: false });
    }

    // Handle specific webhook events with our business logic
    await handleWebhookEvent(result.event);

    // Log successful webhook processing
    await auditLogger.logEvent({
      user_id: null, // System event
      action: 'webhook_processed',
      resource_type: 'stripe_webhook',
      resource_id: result.event.id,
      details: {
        event_type: result.event.type,
        action: result.action,
        processed_at: new Date().toISOString()
      },
      ip_address: request.ip || 'unknown',
      user_agent: request.headers.get('user-agent') || 'stripe-webhook'
    });

    return NextResponse.json({ 
      received: true, 
      handled: true,
      event_type: result.event.type,
      action: result.action 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    
    // Log webhook error
    try {
      await auditLogger.logEvent({
        user_id: null,
        action: 'webhook_error',
        resource_type: 'stripe_webhook',
        resource_id: null,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        ip_address: request.ip || 'unknown',
        user_agent: request.headers.get('user-agent') || 'stripe-webhook'
      });
    } catch (auditError) {
      console.error('Failed to log webhook error:', auditError);
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Webhook processing failed',
        received: true,
        handled: false
      },
      { status: 400 }
    );
  }
}

async function handleWebhookEvent(event: any) {
  const supabase = createAdminSupabaseClient();

  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object, supabase);
      break;
    
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object, supabase);
      break;
    
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object, supabase);
      break;
    
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object, supabase);
      break;
    
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object, supabase);
      break;
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

async function handleSubscriptionCreated(subscription: any, supabase: any) {
  console.log('Processing subscription created:', subscription.id);
  
  try {
    // Find the team/user associated with this customer
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    if (teamError || !team) {
      console.error('Failed to find team for subscription:', teamError);
      return;
    }

    // Determine the plan from the subscription
    const priceId = subscription.items.data[0]?.price?.id;
    const planId = getPlanIdFromPriceId(priceId);

    if (!planId) {
      console.error('Unable to determine plan from price ID:', priceId);
      return;
    }

    // Update team with subscription details
    const { error: updateError } = await supabase
      .from('teams')
      .update({
        stripe_subscription_id: subscription.id,
        plan_name: planId,
        subscription_status: subscription.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', team.id);

    if (updateError) {
      console.error('Failed to update team subscription:', updateError);
      return;
    }

    // Reset quotas for the new subscription period
    const { data: teamMembers, error: membersError } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', team.id);

    if (!membersError && teamMembers) {
      for (const member of teamMembers) {
        await quotaManager.resetQuotas(member.user_id);
      }
    }

    console.log(`Successfully processed subscription created for team ${team.id}`);

  } catch (error) {
    console.error('Error handling subscription created:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: any, supabase: any) {
  console.log('Processing subscription updated:', subscription.id);
  
  try {
    // Find the team associated with this subscription
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (teamError || !team) {
      console.error('Failed to find team for subscription update:', teamError);
      return;
    }

    // Determine the new plan from the subscription
    const priceId = subscription.items.data[0]?.price?.id;
    const planId = getPlanIdFromPriceId(priceId);

    if (!planId) {
      console.error('Unable to determine plan from price ID:', priceId);
      return;
    }

    // Update team with new subscription details
    const { error: updateError } = await supabase
      .from('teams')
      .update({
        plan_name: planId,
        subscription_status: subscription.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', team.id);

    if (updateError) {
      console.error('Failed to update team subscription:', updateError);
      return;
    }

    console.log(`Successfully processed subscription updated for team ${team.id}`);

  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: any, supabase: any) {
  console.log('Processing subscription deleted:', subscription.id);
  
  try {
    // Find the team associated with this subscription
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (teamError || !team) {
      console.error('Failed to find team for subscription deletion:', teamError);
      return;
    }

    // Update team to free plan
    const { error: updateError } = await supabase
      .from('teams')
      .update({
        plan_name: 'free',
        subscription_status: 'cancelled',
        stripe_subscription_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', team.id);

    if (updateError) {
      console.error('Failed to update team after subscription deletion:', updateError);
      return;
    }

    console.log(`Successfully processed subscription deleted for team ${team.id}`);

  } catch (error) {
    console.error('Error handling subscription deleted:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice: any, supabase: any) {
  console.log('Processing payment succeeded:', invoice.id);
  
  try {
    // Find the subscription
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) {
      console.log('Invoice is not for a subscription, skipping quota reset');
      return;
    }

    // Find the team associated with this subscription
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (teamError || !team) {
      console.error('Failed to find team for payment success:', teamError);
      return;
    }

    // Reset quotas for all team members for the new billing period
    const { data: teamMembers, error: membersError } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', team.id);

    if (!membersError && teamMembers) {
      for (const member of teamMembers) {
        await quotaManager.resetQuotas(member.user_id);
      }
    }

    console.log(`Successfully reset quotas after payment for team ${team.id}`);

  } catch (error) {
    console.error('Error handling payment succeeded:', error);
    throw error;
  }
}

async function handlePaymentFailed(invoice: any, supabase: any) {
  console.log('Processing payment failed:', invoice.id);
  
  try {
    // Find the subscription
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) {
      console.log('Invoice is not for a subscription, skipping');
      return;
    }

    // Find the team associated with this subscription
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (teamError || !team) {
      console.error('Failed to find team for payment failure:', teamError);
      return;
    }

    // Update subscription status
    const { error: updateError } = await supabase
      .from('teams')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('id', team.id);

    if (updateError) {
      console.error('Failed to update team after payment failure:', updateError);
      return;
    }

    // TODO: Send notification emails to team admins
    // TODO: Implement grace period logic

    console.log(`Successfully processed payment failed for team ${team.id}`);

  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
}

function getPlanIdFromPriceId(priceId: string): string | null {
  const planMapping = {
    [process.env.STRIPE_PRO_PRICE_ID!]: 'pro',
    [process.env.STRIPE_PROPLUS_PRICE_ID!]: 'proplus',
    [process.env.STRIPE_EXPERT_PRICE_ID!]: 'expert'
  };

  return planMapping[priceId] || null;
}