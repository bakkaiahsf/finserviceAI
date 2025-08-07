/**
 * DeepSeek AI Service for Corporate Intelligence
 * Entity matching, summarization, and risk assessment
 */

import { z } from 'zod'

// Validation schemas for AI responses
const EntityMatchSchema = z.object({
  confidence: z.number().min(0).max(1),
  matchType: z.enum(['exact', 'fuzzy', 'semantic', 'none']),
  explanation: z.string(),
  alternativeMatches: z.array(z.object({
    entity: z.string(),
    confidence: z.number()
  })).optional()
})

const CompanySummarySchema = z.object({
  executiveSummary: z.string(),
  keyInsights: z.array(z.string()),
  businessModel: z.string(),
  financialHighlights: z.array(z.string()),
  riskFactors: z.array(z.string()),
  compliance: z.object({
    status: z.enum(['compliant', 'warning', 'risk']),
    issues: z.array(z.string()),
    recommendations: z.array(z.string())
  })
})

const RiskAssessmentSchema = z.object({
  overallRisk: z.enum(['low', 'medium', 'high', 'critical']),
  riskScore: z.number().min(0).max(100),
  categories: z.object({
    financial: z.number().min(0).max(100),
    operational: z.number().min(0).max(100),
    compliance: z.number().min(0).max(100),
    reputational: z.number().min(0).max(100)
  }),
  keyRisks: z.array(z.object({
    category: z.string(),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    likelihood: z.enum(['unlikely', 'possible', 'likely', 'certain']),
    mitigation: z.string()
  })),
  recommendations: z.array(z.string())
})

export type EntityMatch = z.infer<typeof EntityMatchSchema>
export type CompanySummary = z.infer<typeof CompanySummarySchema>
export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>

class DeepSeekService {
  private readonly apiKey: string
  private readonly baseUrl = 'https://api.deepseek.com/v1'

  constructor() {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY environment variable is required')
    }
    this.apiKey = apiKey
  }

  private async makeRequest(messages: any[], temperature: number = 0.3): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature,
          max_tokens: 4000,
          response_format: { type: 'json_object' }
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error('DeepSeek API request failed:', error)
      throw error
    }
  }

  /**
   * Match entities using AI semantic analysis
   */
  async matchEntities(entity1: string, entity2: string, context?: string): Promise<EntityMatch> {
    const messages = [
      {
        role: 'system',
        content: `You are an expert in corporate entity matching. Analyze two entity names and determine if they refer to the same company, person, or organization. Consider:
        - Exact matches
        - Fuzzy matches (typos, abbreviations)
        - Semantic matches (different names, same entity)
        - Corporate structure relationships
        
        Respond in JSON format with confidence score (0-1), match type, explanation, and alternative matches if relevant.`
      },
      {
        role: 'user',
        content: `Entity 1: "${entity1}"
        Entity 2: "${entity2}"
        ${context ? `Context: ${context}` : ''}
        
        Please analyze if these entities match and provide your assessment in JSON format.`
      }
    ]

    const response = await this.makeRequest(messages)
    return EntityMatchSchema.parse(JSON.parse(response))
  }

  /**
   * Generate comprehensive company summary with AI analysis
   */
  async generateCompanySummary(companyData: any): Promise<CompanySummary> {
    const messages = [
      {
        role: 'system',
        content: `You are a senior financial analyst specializing in corporate intelligence. Analyze company data and provide a comprehensive summary including:
        - Executive summary
        - Key business insights
        - Business model analysis
        - Financial highlights
        - Risk factors
        - Compliance assessment
        
        Focus on beneficial ownership, corporate structure, and regulatory compliance. Respond in JSON format.`
      },
      {
        role: 'user',
        content: `Company Data:
        ${JSON.stringify(companyData, null, 2)}
        
        Please provide a comprehensive analysis in JSON format.`
      }
    ]

    const response = await this.makeRequest(messages, 0.4)
    return CompanySummarySchema.parse(JSON.parse(response))
  }

  /**
   * Assess company risk using AI analysis
   */
  async assessCompanyRisk(companyData: any, relationships: any[] = []): Promise<RiskAssessment> {
    const messages = [
      {
        role: 'system',
        content: `You are a risk assessment expert specializing in corporate analysis. Evaluate company risk across multiple dimensions:
        
        Financial Risk: Cash flow, debt levels, profitability
        Operational Risk: Business model, market position, dependencies
        Compliance Risk: Regulatory issues, governance, transparency
        Reputational Risk: Public perception, ESG factors, controversies
        
        Provide overall risk rating (low/medium/high/critical), category scores (0-100), specific risks with severity/likelihood, and mitigation recommendations. Respond in JSON format.`
      },
      {
        role: 'user',
        content: `Company Data:
        ${JSON.stringify(companyData, null, 2)}
        
        Relationships:
        ${JSON.stringify(relationships, null, 2)}
        
        Please assess the risk profile in JSON format.`
      }
    ]

    const response = await this.makeRequest(messages, 0.2)
    return RiskAssessmentSchema.parse(JSON.parse(response))
  }

  /**
   * Analyze corporate network and identify patterns
   */
  async analyzeNetworkPatterns(networkData: any[]): Promise<{
    patterns: Array<{
      type: string
      description: string
      entities: string[]
      riskLevel: 'low' | 'medium' | 'high'
      confidence: number
    }>
    insights: string[]
    recommendations: string[]
  }> {
    const messages = [
      {
        role: 'system',
        content: `You are an expert in corporate network analysis. Analyze relationship patterns in corporate structures and identify:
        - Circular ownership patterns
        - Complex shareholding structures  
        - Potential shell company networks
        - Jurisdiction shopping patterns
        - Beneficial ownership obfuscation
        
        Provide insights about potential risks, compliance issues, and recommendations. Respond in JSON format.`
      },
      {
        role: 'user',
        content: `Network Data:
        ${JSON.stringify(networkData, null, 2)}
        
        Please analyze patterns and provide insights in JSON format.`
      }
    ]

    const response = await this.makeRequest(messages, 0.3)
    return JSON.parse(response)
  }

  /**
   * Generate executive briefing summary
   */
  async generateExecutiveBriefing(companyData: any, riskAssessment: RiskAssessment): Promise<{
    title: string
    summary: string
    keyFindings: string[]
    actionItems: string[]
    riskHighlights: string[]
    nextSteps: string[]
  }> {
    const messages = [
      {
        role: 'system',
        content: `You are preparing an executive briefing for senior leadership. Create a concise, high-level summary focusing on:
        - Key business insights
        - Critical risk factors
        - Immediate action items
        - Strategic recommendations
        
        Use executive language, be direct and actionable. Respond in JSON format.`
      },
      {
        role: 'user',
        content: `Company Data:
        ${JSON.stringify(companyData, null, 2)}
        
        Risk Assessment:
        ${JSON.stringify(riskAssessment, null, 2)}
        
        Please create an executive briefing in JSON format.`
      }
    ]

    const response = await this.makeRequest(messages, 0.4)
    return JSON.parse(response)
  }

  /**
   * Smart search suggestions using AI
   */
  async generateSearchSuggestions(query: string, context: any[] = []): Promise<string[]> {
    const messages = [
      {
        role: 'system',
        content: `You are a corporate intelligence search expert. Given a search query and context, suggest related searches that would provide comprehensive corporate intelligence. Focus on:
        - Related companies
        - Key personnel
        - Parent/subsidiary relationships
        - Beneficial owners
        - Industry connections
        
        Return an array of search suggestions as JSON.`
      },
      {
        role: 'user',
        content: `Query: "${query}"
        Context: ${JSON.stringify(context)}
        
        Please provide search suggestions as a JSON array.`
      }
    ]

    const response = await this.makeRequest(messages, 0.5)
    const parsed = JSON.parse(response)
    return Array.isArray(parsed) ? parsed : parsed.suggestions || []
  }

  /**
   * Cost tracking for AI usage
   */
  getUsageStats(): {
    requestsToday: number
    estimatedCost: number
    remainingQuota: number
  } {
    // Implement usage tracking logic
    return {
      requestsToday: 0,
      estimatedCost: 0,
      remainingQuota: 1000
    }
  }
}

export const deepSeekService = new DeepSeekService()