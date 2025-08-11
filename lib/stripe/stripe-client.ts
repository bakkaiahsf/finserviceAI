// Stripe integration for subscription management

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_build', {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  interval: 'month' | 'year';
  features: string[];
  limits: {
    searchesPerMonth: number;
    aiAnalysesPerMonth: number;
    networkGraphs: number;
    pdfReports: number;
    csvExports: number;
    teamMembers: number;
    apiCalls: number;
  };
  stripePriceId?: string;
  recommended?: boolean;
}

export interface SubscriptionStatus {
  id: string;
  userId: string;
  planId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  usage: {
    searches: number;
    aiAnalyses: number;
    networkGraphs: number;
    pdfReports: number;
    csvExports: number;
    apiCalls: number;
  };
  lastUpdated: string;
}

// Pricing tiers for Nexus AI
export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started with basic business intelligence',
    price: 0,
    interval: 'month',
    features: [
      'Basic company search',
      'Company profiles',
      'Officer information',
      'Standard exports',
      'Community support'
    ],
    limits: {
      searchesPerMonth: 100,
      aiAnalysesPerMonth: 5,
      networkGraphs: 3,
      pdfReports: 2,
      csvExports: 5,
      teamMembers: 1,
      apiCalls: 500
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Enhanced features for growing businesses and professionals',
    price: 2900, // $29/month
    interval: 'month',
    features: [
      'Everything in Free',
      'Advanced search filters',
      'AI-powered risk analysis',
      'Network relationship mapping',
      'Priority support',
      'Bulk exports'
    ],
    limits: {
      searchesPerMonth: 1000,
      aiAnalysesPerMonth: 50,
      networkGraphs: 25,
      pdfReports: 50,
      csvExports: 100,
      teamMembers: 5,
      apiCalls: 5000
    },
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_test',
    recommended: true
  },
  {
    id: 'proplus',
    name: 'Pro Plus',
    description: 'Advanced analytics for data-driven organizations',
    price: 7900, // $79/month
    interval: 'month',
    features: [
      'Everything in Pro',
      'Advanced AI insights',
      'Custom report templates',
      'API access',
      'Compliance reporting',
      'Dedicated support'
    ],
    limits: {
      searchesPerMonth: 5000,
      aiAnalysesPerMonth: 200,
      networkGraphs: 100,
      pdfReports: 200,
      csvExports: 500,
      teamMembers: 15,
      apiCalls: 25000
    },
    stripePriceId: process.env.STRIPE_PROPLUS_PRICE_ID || 'price_proplus_test'
  },
  {
    id: 'expert',
    name: 'Expert',
    description: 'Enterprise-grade solution for large organizations',
    price: 19900, // $199/month
    interval: 'month',
    features: [
      'Everything in Pro Plus',
      'Unlimited searches',
      'White-label options',
      'Custom integrations',
      'SLA guarantee',
      'Account manager'
    ],
    limits: {
      searchesPerMonth: -1, // Unlimited
      aiAnalysesPerMonth: 1000,
      networkGraphs: 500,
      pdfReports: 1000,
      csvExports: 2000,
      teamMembers: 50,
      apiCalls: 100000
    },
    stripePriceId: process.env.STRIPE_EXPERT_PRICE_ID || 'price_expert_test'
  }
];

class StripeService {
  private static instance: StripeService;

  static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  /**
   * Create a customer in Stripe
   */
  async createCustomer(email: string, name?: string, metadata: Record<string, string> = {}): Promise<Stripe.Customer> {
    return await stripe.customers.create({
      email,
      name,
      metadata: {
        ...metadata,
        created_by: 'nexus_ai'
      }
    });
  }

  /**
   * Create a subscription for a customer
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    trialDays?: number
  ): Promise<Stripe.Subscription> {
    const subscriptionData: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        created_by: 'nexus_ai'
      }
    };

    if (trialDays) {
      subscriptionData.trial_period_days = trialDays;
    }

    return await stripe.subscriptions.create(subscriptionData);
  }

  /**
   * Update a subscription
   */
  async updateSubscription(
    subscriptionId: string,
    priceId: string
  ): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    return await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: priceId,
      }],
      proration_behavior: 'create_prorations',
    });
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<Stripe.Subscription> {
    if (immediately) {
      return await stripe.subscriptions.cancel(subscriptionId);
    } else {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
  }

  /**
   * Reactivate a cancelled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  /**
   * Create a billing portal session
   */
  async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  /**
   * Create a checkout session
   */
  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    trialDays?: number
  ): Promise<Stripe.Checkout.Session> {
    const sessionData: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        created_by: 'nexus_ai'
      }
    };

    if (trialDays) {
      sessionData.subscription_data = {
        trial_period_days: trialDays
      };
    }

    return await stripe.checkout.sessions.create(sessionData);
  }

  /**
   * Retrieve subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice', 'customer', 'items.data.price']
    });
  }

  /**
   * Get customer with subscriptions
   */
  async getCustomerWithSubscriptions(customerId: string): Promise<{
    customer: Stripe.Customer;
    subscriptions: Stripe.Subscription[];
  }> {
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      expand: ['data.items.data.price']
    });

    return {
      customer,
      subscriptions: subscriptions.data
    };
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(
    payload: string,
    signature: string,
    webhookSecret: string
  ): Promise<{
    event: Stripe.Event;
    handled: boolean;
    action?: string;
  }> {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    let handled = false;
    let action: string | undefined;

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        action = 'subscription_created';
        handled = await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        action = 'subscription_updated';
        handled = await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        action = 'subscription_cancelled';
        handled = await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        action = 'payment_succeeded';
        handled = await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        action = 'payment_failed';
        handled = await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { event, handled, action };
  }

  /**
   * Get pricing tier by plan ID
   */
  getPricingTier(planId: string): PricingTier | undefined {
    return PRICING_TIERS.find(tier => tier.id === planId);
  }

  /**
   * Check if usage is within plan limits
   */
  checkUsageLimits(usage: SubscriptionStatus['usage'], planId: string): {
    withinLimits: boolean;
    violations: Array<{
      metric: string;
      current: number;
      limit: number;
      exceeded: boolean;
    }>;
  } {
    const tier = this.getPricingTier(planId);
    if (!tier) {
      return { withinLimits: false, violations: [] };
    }

    const violations = [
      { metric: 'searches', current: usage.searches, limit: tier.limits.searchesPerMonth },
      { metric: 'aiAnalyses', current: usage.aiAnalyses, limit: tier.limits.aiAnalysesPerMonth },
      { metric: 'networkGraphs', current: usage.networkGraphs, limit: tier.limits.networkGraphs },
      { metric: 'pdfReports', current: usage.pdfReports, limit: tier.limits.pdfReports },
      { metric: 'csvExports', current: usage.csvExports, limit: tier.limits.csvExports },
      { metric: 'apiCalls', current: usage.apiCalls, limit: tier.limits.apiCalls },
    ].map(item => ({
      ...item,
      exceeded: item.limit !== -1 && item.current > item.limit // -1 means unlimited
    }));

    return {
      withinLimits: violations.every(v => !v.exceeded),
      violations: violations.filter(v => v.exceeded)
    };
  }

  // Private webhook handlers
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<boolean> {
    console.log('Subscription created:', subscription.id);
    // TODO: Update database with new subscription
    return true;
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<boolean> {
    console.log('Subscription updated:', subscription.id);
    // TODO: Update database with subscription changes
    return true;
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<boolean> {
    console.log('Subscription cancelled:', subscription.id);
    // TODO: Update database to reflect cancellation
    return true;
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<boolean> {
    console.log('Payment succeeded for invoice:', invoice.id);
    // TODO: Reset usage quotas for new billing period
    return true;
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<boolean> {
    console.log('Payment failed for invoice:', invoice.id);
    // TODO: Handle failed payment (notifications, grace period, etc.)
    return true;
  }
}

export const stripeService = StripeService.getInstance();
export { stripe };