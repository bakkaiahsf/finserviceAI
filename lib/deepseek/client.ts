import OpenAI from 'openai'

export interface CompanyData {
  company_number: string
  company_name: string
  company_status?: string
  company_type?: string
  incorporation_date?: string
  registered_office?: any
  sic_codes?: number[]
  officers?: any[]
  pscs?: any[]
}

export interface Summary {
  text: string
  key_points: string[]
  business_activities: string[]
  risk_factors: string[]
  compliance_notes: string[]
}

export interface Analysis {
  complexity_score: number
  ownership_structure: string
  beneficial_ownership: string[]
  compliance_issues: string[]
  recommendations: string[]
}

export interface RiskProfile {
  risk_score: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  risk_factors: string[]
  regulatory_concerns: string[]
  recommendations: string[]
}

class DeepSeekService {
  private client: OpenAI
  private readonly maxRetries = 3
  private readonly retryDelay = 1000

  constructor() {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY environment variable is required')
    }

    this.client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com/v1',
    })
  }

  async summarizeCompanyData(companyData: CompanyData): Promise<Summary> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a financial compliance expert. Summarize this company data focusing on:
            1. Key business activities and operations
            2. Corporate structure and ownership
            3. Compliance risks for UK financial institutions
            4. Notable regulatory considerations
            
            Return a structured summary with key points, business activities, risk factors, and compliance notes.`,
          },
          {
            role: 'user',
            content: JSON.stringify(companyData),
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      })

      const content = response.choices[0].message.content
      if (!content) {
        throw new Error('No content received from DeepSeek API')
      }

      return this.parseSummaryResponse(content)
    } catch (error) {
      console.error('DeepSeek API error in summarizeCompanyData:', error)
      throw new Error(`Failed to summarize company data: ${error}`)
    }
  }

  async analyzeOwnershipComplexity(hierarchyData: any): Promise<Analysis> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'deepseek-reasoner',
        messages: [
          {
            role: 'system',
            content: `Analyze this corporate ownership structure for:
            1. Overall complexity and risk assessment
            2. Beneficial ownership transparency
            3. Potential AML/KYC compliance issues
            4. Regulatory concerns for financial institutions
            
            Provide a complexity score (0-100) and detailed analysis.`,
          },
          {
            role: 'user',
            content: JSON.stringify(hierarchyData),
          },
        ],
        temperature: 0.2,
        max_tokens: 1500,
      })

      const content = response.choices[0].message.content
      if (!content) {
        throw new Error('No content received from DeepSeek API')
      }

      return this.parseAnalysisResponse(content)
    } catch (error) {
      console.error('DeepSeek API error in analyzeOwnershipComplexity:', error)
      throw new Error(`Failed to analyze ownership complexity: ${error}`)
    }
  }

  async generateRiskAssessment(entityData: any): Promise<RiskProfile> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Generate a comprehensive risk assessment for this entity focusing on:
            1. Regulatory compliance risks (score 0-100)
            2. Beneficial ownership transparency
            3. Jurisdictional and operational risks
            4. AML/KYC compliance considerations
            
            Provide a numerical risk score and risk level (LOW/MEDIUM/HIGH/VERY_HIGH) with detailed reasoning.`,
          },
          {
            role: 'user',
            content: JSON.stringify(entityData),
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      })

      const content = response.choices[0].message.content
      if (!content) {
        throw new Error('No content received from DeepSeek API')
      }

      return this.parseRiskAssessment(content)
    } catch (error) {
      console.error('DeepSeek API error in generateRiskAssessment:', error)
      throw new Error(`Failed to generate risk assessment: ${error}`)
    }
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (retries > 0) {
        console.log(`Retrying operation, ${retries} attempts remaining`)
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay))
        return this.retryOperation(operation, retries - 1)
      }
      throw error
    }
  }

  private parseSummaryResponse(content: string): Summary {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content)
      if (parsed.text && parsed.key_points) {
        return parsed
      }
    } catch {
      // If not JSON, parse text manually
    }

    // Fallback parsing for plain text responses
    const lines = content.split('\n').filter((line) => line.trim())
    
    return {
      text: content,
      key_points: this.extractBulletPoints(content, 'Key Points:') || [],
      business_activities: this.extractBulletPoints(content, 'Business Activities:') || [],
      risk_factors: this.extractBulletPoints(content, 'Risk Factors:') || [],
      compliance_notes: this.extractBulletPoints(content, 'Compliance:') || [],
    }
  }

  private parseAnalysisResponse(content: string): Analysis {
    const complexityMatch = content.match(/complexity.*?(\d+)/i)
    const complexity_score = complexityMatch ? parseInt(complexityMatch[1]) : 50

    return {
      complexity_score,
      ownership_structure: this.extractSection(content, 'Ownership Structure:') || 'Not available',
      beneficial_ownership: this.extractBulletPoints(content, 'Beneficial Ownership:') || [],
      compliance_issues: this.extractBulletPoints(content, 'Compliance Issues:') || [],
      recommendations: this.extractBulletPoints(content, 'Recommendations:') || [],
    }
  }

  private parseRiskAssessment(content: string): RiskProfile {
    const riskScoreMatch = content.match(/risk score.*?(\d+)/i)
    const risk_score = riskScoreMatch ? parseInt(riskScoreMatch[1]) : 50

    let risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' = 'MEDIUM'
    if (risk_score <= 25) risk_level = 'LOW'
    else if (risk_score <= 50) risk_level = 'MEDIUM'
    else if (risk_score <= 75) risk_level = 'HIGH'
    else risk_level = 'VERY_HIGH'

    return {
      risk_score,
      risk_level,
      risk_factors: this.extractBulletPoints(content, 'Risk Factors:') || [],
      regulatory_concerns: this.extractBulletPoints(content, 'Regulatory Concerns:') || [],
      recommendations: this.extractBulletPoints(content, 'Recommendations:') || [],
    }
  }

  private extractBulletPoints(text: string, section: string): string[] {
    const sectionIndex = text.toLowerCase().indexOf(section.toLowerCase())
    if (sectionIndex === -1) return []

    const afterSection = text.substring(sectionIndex + section.length)
    const lines = afterSection.split('\n')
    const bulletPoints: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+\./)) {
        bulletPoints.push(trimmed.replace(/^[-•\d.]\s*/, ''))
      } else if (trimmed && bulletPoints.length > 0) {
        // Stop at next section or empty line
        break
      }
    }

    return bulletPoints
  }

  private extractSection(text: string, section: string): string | null {
    const sectionIndex = text.toLowerCase().indexOf(section.toLowerCase())
    if (sectionIndex === -1) return null

    const afterSection = text.substring(sectionIndex + section.length)
    const nextSectionMatch = afterSection.match(/\n\n[A-Z][^:]*:/)
    
    if (nextSectionMatch) {
      return afterSection.substring(0, nextSectionMatch.index).trim()
    }
    
    return afterSection.split('\n\n')[0].trim()
  }
}

export const deepseekService = new DeepSeekService()