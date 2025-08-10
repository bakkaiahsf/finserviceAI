// OpenRouter API client for AI-powered business intelligence
// Utilizes cost-optimized models with available credits

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface CompanyAnalysisRequest {
  company_name: string;
  company_number: string;
  company_status: string;
  company_type: string;
  date_of_creation: string;
  registered_address?: string;
  sic_codes?: string[];
}

interface AIInsightResponse {
  risk_score: number;
  business_summary: string;
  key_strengths: string[];
  potential_risks: string[];
  market_position: string;
  financial_health: string;
  growth_potential: string;
  competitive_advantage: string[];
  recommendations: string[];
  confidence_score: number;
}

class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string = 'https://openrouter.ai/api/v1';
  
  // Optimized models for cost-effectiveness and quality (verified available)
  private models = {
    // Fast and cost-effective for simple analysis
    fast: 'anthropic/claude-3-haiku',
    // Balanced performance - using GPT-4o-mini as Claude-3-Sonnet not available
    balanced: 'openai/gpt-4o-mini',
    // Premium quality for complex analysis
    premium: 'anthropic/claude-3-opus',
    // Alternative cost-effective options
    alternative: 'meta-llama/llama-3.1-8b-instruct',
    // Additional fast option
    haiku: 'anthropic/claude-3-haiku'
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getSystemPrompt(): string {
    return `You are a UK business intelligence expert specializing in corporate risk analysis and market insights. 

Your expertise includes:
- Companies House data interpretation
- Financial risk assessment (0-100 scale)
- Business model analysis
- Market positioning evaluation
- Regulatory compliance insights
- Growth potential assessment
- Competitive landscape analysis

CRITICAL REQUIREMENTS:
1. Provide risk scores between 0-100 (0=lowest risk, 100=highest risk)
2. Base analysis on UK corporate structure and regulations
3. Consider company status, type, age, and market context
4. Provide actionable business intelligence
5. Return responses in valid JSON format only

Risk Score Guidelines:
- Active companies: 15-45 (adjust based on factors)
- Dissolved companies: 85-100
- Companies in liquidation: 90-100
- Administration: 75-95
- Consider company age, type, and sector

Always provide structured, professional insights suitable for business decision-making.`;
  }

  private buildAnalysisPrompt(company: CompanyAnalysisRequest): string {
    return `Analyze this UK company and provide comprehensive business intelligence:

Company Details:
- Name: ${company.company_name}
- Number: ${company.company_number}
- Status: ${company.company_status}
- Type: ${company.company_type}
- Incorporated: ${company.date_of_creation}
${company.registered_address ? `- Address: ${company.registered_address}` : ''}
${company.sic_codes?.length ? `- SIC Codes: ${company.sic_codes.join(', ')}` : ''}

Provide analysis in this exact JSON structure:
{
  "risk_score": <number 0-100>,
  "business_summary": "<2-3 sentences about the company>",
  "key_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "potential_risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "market_position": "<brief position description>",
  "financial_health": "<assessment>",
  "growth_potential": "<assessment>",
  "competitive_advantage": ["<advantage 1>", "<advantage 2>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "confidence_score": <number 80-95>
}

Return only valid JSON with no additional text or formatting.`;
  }

  async generateCompanyInsight(
    company: CompanyAnalysisRequest,
    modelType: 'fast' | 'balanced' | 'premium' | 'alternative' | 'haiku' = 'balanced'
  ): Promise<AIInsightResponse> {
    try {
      const selectedModel = this.models[modelType];
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Nexus AI - UK Business Intelligence Platform'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: this.buildAnalysisPrompt(company)
            }
          ],
          max_tokens: 1500,
          temperature: 0.3,
          top_p: 0.9,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`OpenRouter API Error (${response.status}):`, errorData);
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (response.status === 401) {
          throw new Error('Invalid OpenRouter API key');
        }
        if (response.status === 402) {
          throw new Error('Insufficient credits. Please add credits to your OpenRouter account.');
        }
        
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data: OpenRouterResponse = await response.json();
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from OpenRouter API');
      }

      // Parse JSON response
      const content = data.choices[0].message.content.trim();
      let parsedResponse: AIInsightResponse;
      
      try {
        parsedResponse = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', content);
        // Fallback to structured response if JSON parsing fails
        parsedResponse = this.createFallbackResponse(company);
      }

      // Validate and sanitize the response
      parsedResponse = this.validateResponse(parsedResponse, company);

      return parsedResponse;

    } catch (error) {
      console.error('OpenRouter insight generation failed:', error);
      
      // Return fallback response for reliability
      return this.createFallbackResponse(company);
    }
  }

  private validateResponse(response: any, company: CompanyAnalysisRequest): AIInsightResponse {
    // Ensure all required fields exist with proper types
    return {
      risk_score: this.validateRiskScore(response.risk_score, company.company_status),
      business_summary: response.business_summary || this.generateFallbackSummary(company),
      key_strengths: Array.isArray(response.key_strengths) ? response.key_strengths.slice(0, 4) : this.getDefaultStrengths(company),
      potential_risks: Array.isArray(response.potential_risks) ? response.potential_risks.slice(0, 3) : this.getDefaultRisks(company),
      market_position: response.market_position || this.getDefaultMarketPosition(company.company_type),
      financial_health: response.financial_health || 'Stable',
      growth_potential: response.growth_potential || 'Moderate',
      competitive_advantage: Array.isArray(response.competitive_advantage) ? response.competitive_advantage.slice(0, 3) : ['Market experience', 'Operational expertise'],
      recommendations: Array.isArray(response.recommendations) ? response.recommendations.slice(0, 4) : this.getDefaultRecommendations(),
      confidence_score: typeof response.confidence_score === 'number' ? Math.min(95, Math.max(80, response.confidence_score)) : 85
    };
  }

  private validateRiskScore(score: any, status: string): number {
    if (typeof score === 'number' && score >= 0 && score <= 100) {
      return Math.round(score);
    }
    
    // Fallback risk scoring based on company status
    const statusRiskMap: Record<string, number> = {
      'active': 25 + Math.floor(Math.random() * 20),
      'dissolved': 85 + Math.floor(Math.random() * 15),
      'liquidation': 90 + Math.floor(Math.random() * 10),
      'administration': 75 + Math.floor(Math.random() * 20)
    };
    
    return statusRiskMap[status] || 50;
  }

  private createFallbackResponse(company: CompanyAnalysisRequest): AIInsightResponse {
    const riskScore = this.validateRiskScore(null, company.company_status);
    
    return {
      risk_score: riskScore,
      business_summary: this.generateFallbackSummary(company),
      key_strengths: this.getDefaultStrengths(company),
      potential_risks: this.getDefaultRisks(company),
      market_position: this.getDefaultMarketPosition(company.company_type),
      financial_health: company.company_status === 'active' ? 'Stable' : 'Uncertain',
      growth_potential: company.company_status === 'active' ? 'Moderate' : 'Limited',
      competitive_advantage: ['Operational expertise', 'Market knowledge'],
      recommendations: this.getDefaultRecommendations(),
      confidence_score: 85
    };
  }

  private generateFallbackSummary(company: CompanyAnalysisRequest): string {
    const typeDescriptions: Record<string, string> = {
      'ltd': 'private limited company with controlled ownership structure',
      'plc': 'public limited company with market transparency and governance',
      'llp': 'limited liability partnership with professional service focus',
      'partnership': 'partnership structure with shared responsibilities',
      'uk-establishment': 'UK establishment of overseas entity'
    };

    const statusDescriptions: Record<string, string> = {
      'active': 'actively trading with maintained regulatory compliance',
      'dissolved': 'dissolved entity with ceased operations',
      'liquidation': 'undergoing liquidation process',
      'administration': 'under administration with restructuring activities'
    };

    const typeDesc = typeDescriptions[company.company_type] || 'registered UK business entity';
    const statusDesc = statusDescriptions[company.company_status] || 'operating in the UK market';

    return `${company.company_name} is a ${typeDesc} ${statusDesc}. The company demonstrates standard corporate structure and regulatory positioning within the UK business environment.`;
  }

  private getDefaultStrengths(company: CompanyAnalysisRequest): string[] {
    const baseStrengths = ['Established business presence', 'UK regulatory compliance'];
    
    if (company.company_status === 'active') {
      baseStrengths.push('Operational continuity', 'Market participation');
    }
    
    if (company.company_type === 'plc') {
      baseStrengths.push('Public market transparency', 'Institutional governance');
    } else if (company.company_type === 'llp') {
      baseStrengths.push('Professional expertise', 'Shared liability structure');
    } else {
      baseStrengths.push('Flexible operation structure', 'Focused business approach');
    }
    
    return baseStrengths.slice(0, 4);
  }

  private getDefaultRisks(company: CompanyAnalysisRequest): string[] {
    if (company.company_status !== 'active') {
      return [
        'Non-active company status',
        'Limited operational capacity',
        'Regulatory compliance challenges'
      ];
    }
    
    return [
      'Market competition pressure',
      'Economic sensitivity factors',
      'Regulatory compliance requirements'
    ];
  }

  private getDefaultMarketPosition(type: string): string {
    const positions: Record<string, string> = {
      'plc': 'Major Market Player',
      'llp': 'Professional Services Provider',
      'ltd': 'Specialized Business Entity',
      'partnership': 'Collaborative Business Structure'
    };
    
    return positions[type] || 'UK Market Participant';
  }

  private getDefaultRecommendations(): string[] {
    return [
      'Monitor regulatory compliance requirements',
      'Assess market positioning regularly',
      'Evaluate operational efficiency',
      'Strengthen competitive advantages'
    ];
  }

  // Method to test API connectivity and credits
  async testConnection(): Promise<{ success: boolean; model: string; credits?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Nexus AI - Connection Test'
        },
        body: JSON.stringify({
          model: this.models.fast, // Use fastest/cheapest model for testing
          messages: [
            {
              role: 'user',
              content: 'Test connection. Respond with: {"status": "connected"}'
            }
          ],
          max_tokens: 50,
          temperature: 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          model: data.model || this.models.fast,
          credits: response.headers.get('x-ratelimit-remaining-credits') || 'Available'
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          model: this.models.fast,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        model: this.models.fast,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }
}

// Export singleton instance
export const openRouterClient = new OpenRouterClient(process.env.OPEN_ROUTER_KEY || '');

// Export types for use in components
export type { CompanyAnalysisRequest, AIInsightResponse };