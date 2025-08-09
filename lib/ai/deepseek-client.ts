// DeepSeek AI Client for company analysis and insights
// Provides company summaries, risk analysis, and business intelligence

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekRequest {
  model: string;
  messages: DeepSeekMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  stream?: boolean;
}

interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface DeepSeekError {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

interface AIAnalysisOptions {
  maxTokens?: number;
  temperature?: number;
  includeRiskAnalysis?: boolean;
  includeFinancialInsights?: boolean;
  includeCompetitiveAnalysis?: boolean;
  userId?: string;
}

interface CompanyInsight {
  summary: string;
  keyFindings: string[];
  riskScore: number; // 0-100, higher = more risky
  riskFactors: Array<{
    category: 'financial' | 'operational' | 'regulatory' | 'market';
    risk: string;
    severity: 'low' | 'medium' | 'high';
    explanation: string;
  }>;
  opportunities: string[];
  recommendations: string[];
  confidence: number; // 0-100, how confident the AI is in its analysis
  dataQuality: 'excellent' | 'good' | 'fair' | 'limited';
  generatedAt: string;
  tokensUsed: number;
}

interface CostTracker {
  userId: string;
  tokensUsed: number;
  costUSD: number;
  requestCount: number;
  lastRequest: string;
}

class DeepSeekClient {
  private static instance: DeepSeekClient;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.deepseek.com/v1';
  private readonly model = 'deepseek-chat';
  
  // DeepSeek pricing: ~$0.14 per 1M input tokens, ~$0.28 per 1M output tokens
  private readonly inputTokenCost = 0.14 / 1000000; // per token
  private readonly outputTokenCost = 0.28 / 1000000; // per token
  
  private costTracking: Map<string, CostTracker> = new Map();
  
  private constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('DeepSeek API key is required');
    }
  }

  static getInstance(): DeepSeekClient {
    if (!DeepSeekClient.instance) {
      DeepSeekClient.instance = new DeepSeekClient();
    }
    return DeepSeekClient.instance;
  }

  private async makeRequest(request: DeepSeekRequest): Promise<DeepSeekResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData: DeepSeekError = await response.json();
      throw new Error(`DeepSeek API Error (${response.status}): ${errorData.error.message}`);
    }

    return response.json();
  }

  private trackCost(userId: string, inputTokens: number, outputTokens: number): void {
    const cost = (inputTokens * this.inputTokenCost) + (outputTokens * this.outputTokenCost);
    const existing = this.costTracking.get(userId);
    
    if (existing) {
      existing.tokensUsed += inputTokens + outputTokens;
      existing.costUSD += cost;
      existing.requestCount += 1;
      existing.lastRequest = new Date().toISOString();
    } else {
      this.costTracking.set(userId, {
        userId,
        tokensUsed: inputTokens + outputTokens,
        costUSD: cost,
        requestCount: 1,
        lastRequest: new Date().toISOString(),
      });
    }
  }

  private buildSystemPrompt(): string {
    return `You are a senior financial analyst and business intelligence expert specializing in UK corporate analysis. You analyze company data from Companies House and provide comprehensive business insights.

Your analysis should be:
- Professional and objective
- Data-driven with specific observations
- Risk-aware but balanced
- Actionable for business decision-making

For each analysis, provide:
1. Executive Summary (2-3 sentences)
2. Key Findings (3-5 bullet points)
3. Risk Assessment (score 0-100, with specific factors)
4. Business Opportunities
5. Strategic Recommendations

Focus on:
- Financial health indicators
- Operational efficiency
- Regulatory compliance
- Market position
- Management quality
- Growth potential

Always specify your confidence level and data quality assessment.`;
  }

  private buildCompanyAnalysisPrompt(
    companyData: any, 
    officers: any[], 
    options: AIAnalysisOptions
  ): string {
    const company = companyData;
    const prompt = `
Analyze this UK company comprehensively:

**COMPANY PROFILE:**
- Name: ${company.company_name}
- Number: ${company.company_number}
- Status: ${company.company_status}
- Type: ${company.type}
- Jurisdiction: ${company.jurisdiction}
- Incorporation Date: ${company.date_of_creation}
- SIC Codes: ${company.sic_codes?.join(', ') || 'None specified'}

**REGISTERED OFFICE:**
${company.registered_office_address ? Object.values(company.registered_office_address).filter(Boolean).join(', ') : 'Not available'}

**KEY OFFICERS (${officers.length} total):**
${officers.slice(0, 5).map(officer => 
  `- ${officer.name}: ${officer.officer_role} (appointed: ${officer.appointed_on}${officer.resigned_on ? `, resigned: ${officer.resigned_on}` : ''})`
).join('\n')}

**ADDITIONAL CONTEXT:**
- Has Charges: ${company.has_charges ? 'Yes' : 'No'}
- Has Insolvency History: ${company.has_insolvency_history ? 'Yes' : 'No'}
- Filing Status: ${company.accounts?.overdue ? 'Overdue' : 'Up to date'}
- Last Accounts Date: ${company.accounts?.last_accounts?.made_up_to || 'Not available'}

${options.includeRiskAnalysis ? `
**RISK ANALYSIS REQUESTED:**
Provide detailed risk assessment including financial, operational, regulatory, and market risks.
` : ''}

${options.includeFinancialInsights ? `
**FINANCIAL ANALYSIS REQUESTED:**
Analyze financial health based on available data and filing patterns.
` : ''}

${options.includeCompetitiveAnalysis ? `
**COMPETITIVE ANALYSIS REQUESTED:**
Assess market position based on SIC codes and business description.
` : ''}

Provide your analysis in the following JSON format:
{
  "summary": "Executive summary in 2-3 sentences",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
  "riskScore": 45,
  "riskFactors": [
    {
      "category": "financial",
      "risk": "Risk description",
      "severity": "medium",
      "explanation": "Detailed explanation"
    }
  ],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "confidence": 85,
  "dataQuality": "good"
}`;

    return prompt;
  }

  /**
   * Analyze a company using AI to generate business insights
   */
  async analyzeCompany(
    companyData: any,
    officers: any[] = [],
    options: AIAnalysisOptions = {}
  ): Promise<CompanyInsight> {
    const {
      maxTokens = 2000,
      temperature = 0.3,
      includeRiskAnalysis = true,
      includeFinancialInsights = true,
      includeCompetitiveAnalysis = false,
      userId = 'anonymous'
    } = options;

    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: this.buildSystemPrompt()
      },
      {
        role: 'user',
        content: this.buildCompanyAnalysisPrompt(companyData, officers, options)
      }
    ];

    try {
      const request: DeepSeekRequest = {
        model: this.model,
        messages,
        max_tokens: maxTokens,
        temperature,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      };

      const response = await this.makeRequest(request);
      
      if (!response.choices || response.choices.length === 0) {
        throw new Error('No response generated from AI');
      }

      const content = response.choices[0].message.content;
      
      // Track costs
      this.trackCost(
        userId, 
        response.usage.prompt_tokens, 
        response.usage.completion_tokens
      );

      // Parse JSON response
      let analysis: Partial<CompanyInsight>;
      try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;
        analysis = JSON.parse(jsonStr);
      } catch (parseError) {
        // Fallback: create structured response from text
        analysis = this.parseUnstructuredResponse(content);
      }

      // Build final insight object
      const insight: CompanyInsight = {
        summary: analysis.summary || 'Analysis generated but summary not available',
        keyFindings: analysis.keyFindings || [],
        riskScore: analysis.riskScore || 50,
        riskFactors: analysis.riskFactors || [],
        opportunities: analysis.opportunities || [],
        recommendations: analysis.recommendations || [],
        confidence: analysis.confidence || 75,
        dataQuality: analysis.dataQuality || 'good',
        generatedAt: new Date().toISOString(),
        tokensUsed: response.usage.total_tokens
      };

      return insight;

    } catch (error) {
      console.error('DeepSeek analysis error:', error);
      
      // Return fallback insight
      return {
        summary: 'Analysis could not be completed due to technical issues',
        keyFindings: ['Technical error occurred during analysis'],
        riskScore: 50,
        riskFactors: [{
          category: 'operational',
          risk: 'Analysis system unavailable',
          severity: 'low',
          explanation: 'Unable to complete AI analysis at this time'
        }],
        opportunities: [],
        recommendations: ['Try analysis again later'],
        confidence: 0,
        dataQuality: 'limited',
        generatedAt: new Date().toISOString(),
        tokensUsed: 0
      };
    }
  }

  private parseUnstructuredResponse(content: string): Partial<CompanyInsight> {
    // Fallback parser for unstructured responses
    const lines = content.split('\n').filter(line => line.trim());
    
    return {
      summary: lines[0] || 'Summary not available',
      keyFindings: lines.slice(1, 4),
      riskScore: 50, // Default
      confidence: 60, // Lower confidence for unstructured
      dataQuality: 'fair'
    };
  }

  /**
   * Get cost tracking information for a user
   */
  getCostTracking(userId: string): CostTracker | null {
    return this.costTracking.get(userId) || null;
  }

  /**
   * Get total cost tracking across all users (admin function)
   */
  getTotalCostTracking(): {
    totalUsers: number;
    totalTokens: number;
    totalCostUSD: number;
    totalRequests: number;
  } {
    const trackers = Array.from(this.costTracking.values());
    
    return {
      totalUsers: trackers.length,
      totalTokens: trackers.reduce((sum, t) => sum + t.tokensUsed, 0),
      totalCostUSD: trackers.reduce((sum, t) => sum + t.costUSD, 0),
      totalRequests: trackers.reduce((sum, t) => sum + t.requestCount, 0)
    };
  }

  /**
   * Reset cost tracking for a user
   */
  resetCostTracking(userId: string): void {
    this.costTracking.delete(userId);
  }

  /**
   * Health check for DeepSeek API
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    error?: string;
  }> {
    const start = Date.now();
    
    try {
      const testRequest: DeepSeekRequest = {
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "API is working" in exactly those words.' }
        ],
        max_tokens: 10,
        temperature: 0
      };

      const response = await this.makeRequest(testRequest);
      const latency = Date.now() - start;

      if (response.choices[0]?.message?.content?.includes('API is working')) {
        return { status: 'healthy', latency };
      } else {
        return { 
          status: 'unhealthy', 
          latency, 
          error: 'Unexpected response content' 
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const deepSeekClient = DeepSeekClient.getInstance();

// Export types
export type { CompanyInsight, AIAnalysisOptions, CostTracker };