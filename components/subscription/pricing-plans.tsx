'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckIcon, XIcon, StarIcon } from 'lucide-react';
import { PRICING_TIERS, type PricingTier } from '@/lib/stripe/stripe-client';
import { cn } from '@/lib/utils';

interface PricingPlansProps {
  currentPlan?: string;
  onSelectPlan: (planId: string) => Promise<void>;
  isLoading?: boolean;
}

export function PricingPlans({ currentPlan, onSelectPlan, isLoading = false }: PricingPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `£${(price / 100).toFixed(0)}`;
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return 'Unlimited';
    return limit.toLocaleString();
  };

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentPlan) return;
    
    setSelectedPlan(planId);
    try {
      await onSelectPlan(planId);
    } catch (error) {
      console.error('Failed to select plan:', error);
    } finally {
      setSelectedPlan(null);
    }
  };

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Unlock the full potential of UK business intelligence with our flexible pricing tiers
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {PRICING_TIERS.map((tier) => (
          <Card 
            key={tier.id} 
            className={cn(
              "relative transition-all duration-200 hover:shadow-lg",
              tier.recommended && "ring-2 ring-blue-600 shadow-xl scale-105",
              currentPlan === tier.id && "bg-blue-50 border-blue-200"
            )}
          >
            {tier.recommended && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white px-3 py-1">
                  <StarIcon className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-semibold">{tier.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(tier.price)}
                </span>
                {tier.price > 0 && (
                  <span className="text-gray-500 ml-1">/month</span>
                )}
              </div>
              <CardDescription className="mt-2 h-12 flex items-center justify-center">
                {tier.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Usage Limits */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Usage Limits</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Monthly searches:</span>
                    <span className="font-medium">{formatLimit(tier.limits.searchesPerMonth)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI analyses:</span>
                    <span className="font-medium">{formatLimit(tier.limits.aiAnalysesPerMonth)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network graphs:</span>
                    <span className="font-medium">{formatLimit(tier.limits.networkGraphs)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PDF reports:</span>
                    <span className="font-medium">{formatLimit(tier.limits.pdfReports)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CSV exports:</span>
                    <span className="font-medium">{formatLimit(tier.limits.csvExports)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Team members:</span>
                    <span className="font-medium">{formatLimit(tier.limits.teamMembers)}</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Features</h4>
                <div className="space-y-2">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                className={cn(
                  "w-full",
                  tier.recommended && "bg-blue-600 hover:bg-blue-700",
                  currentPlan === tier.id && "bg-green-600 hover:bg-green-700"
                )}
                variant={tier.recommended ? "default" : "outline"}
                onClick={() => handleSelectPlan(tier.id)}
                disabled={isLoading || selectedPlan === tier.id || currentPlan === tier.id}
              >
                {selectedPlan === tier.id ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : currentPlan === tier.id ? (
                  'Current Plan'
                ) : tier.price === 0 ? (
                  'Get Started Free'
                ) : (
                  `Upgrade to ${tier.name}`
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Plan Comparison */}
      <div className="mt-12 max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold text-center mb-6">Detailed Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-lg shadow">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Feature</th>
                {PRICING_TIERS.map(tier => (
                  <th key={tier.id} className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-900">
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Monthly Price', getValue: (tier: PricingTier) => formatPrice(tier.price) },
                { label: 'Company Searches', getValue: (tier: PricingTier) => formatLimit(tier.limits.searchesPerMonth) },
                { label: 'AI Risk Analyses', getValue: (tier: PricingTier) => formatLimit(tier.limits.aiAnalysesPerMonth) },
                { label: 'Network Graphs', getValue: (tier: PricingTier) => formatLimit(tier.limits.networkGraphs) },
                { label: 'PDF Reports', getValue: (tier: PricingTier) => formatLimit(tier.limits.pdfReports) },
                { label: 'CSV Data Exports', getValue: (tier: PricingTier) => formatLimit(tier.limits.csvExports) },
                { label: 'Team Members', getValue: (tier: PricingTier) => formatLimit(tier.limits.teamMembers) },
                { label: 'API Calls', getValue: (tier: PricingTier) => formatLimit(tier.limits.apiCalls) },
              ].map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-200 px-4 py-3 font-medium text-gray-900">
                    {row.label}
                  </td>
                  {PRICING_TIERS.map(tier => (
                    <td key={tier.id} className="border border-gray-200 px-4 py-3 text-center text-gray-700">
                      {row.getValue(tier)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-12 max-w-3xl mx-auto">
        <h3 className="text-2xl font-bold text-center mb-6">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h4 className="font-semibold text-gray-900 mb-2">Can I change my plan at any time?</h4>
            <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h4 className="font-semibold text-gray-900 mb-2">What happens if I exceed my usage limits?</h4>
            <p className="text-gray-600">Your account will be temporarily restricted until your next billing cycle, or you can upgrade to a higher plan to continue using the service.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h4 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h4>
            <p className="text-gray-600">All paid plans include a 14-day free trial. No credit card required to start your trial.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h4 className="font-semibold text-gray-900 mb-2">How is data security handled?</h4>
            <p className="text-gray-600">All data is encrypted in transit and at rest. We comply with GDPR and UK data protection regulations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}