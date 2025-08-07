/**
 * Companies House API Integration
 * Official API for UK company information
 * Rate limits: 600 requests per 5 minutes per API key
 */

import { z } from 'zod'

const API_BASE_URL = 'https://api.company-information.service.gov.uk'

// Rate limiting implementation
class RateLimiter {
  private requests: number[] = []
  private readonly maxRequests = 600
  private readonly timeWindow = 5 * 60 * 1000 // 5 minutes

  canMakeRequest(): boolean {
    const now = Date.now()
    // Remove requests older than time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow)
    return this.requests.length < this.maxRequests
  }

  recordRequest(): void {
    this.requests.push(Date.now())
  }

  getRemainingRequests(): number {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.timeWindow)
    return Math.max(0, this.maxRequests - this.requests.length)
  }
}

const rateLimiter = new RateLimiter()

// Validation schemas
const AddressSchema = z.object({
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  locality: z.string().optional(),
  region: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  premises: z.string().optional(),
})

const CompanyProfileSchema = z.object({
  company_number: z.string(),
  company_name: z.string(),
  company_status: z.string().optional(),
  company_type: z.string().optional(),
  date_of_creation: z.string().optional(),
  registered_office_address: AddressSchema.optional(),
  sic_codes: z.array(z.string()).optional(),
  accounts: z.object({
    accounting_reference_date: z.object({
      day: z.string(),
      month: z.string(),
    }).optional(),
    last_accounts: z.object({
      made_up_to: z.string().optional(),
      type: z.string().optional(),
    }).optional(),
    next_due: z.string().optional(),
    next_made_up_to: z.string().optional(),
    overdue: z.boolean().optional(),
  }).optional(),
  confirmation_statement: z.object({
    last_made_up_to: z.string().optional(),
    next_due: z.string().optional(),
    next_made_up_to: z.string().optional(),
    overdue: z.boolean().optional(),
  }).optional(),
})

const CompanySearchSchema = z.object({
  items: z.array(z.object({
    company_number: z.string(),
    title: z.string(),
    company_status: z.string().optional(),
    company_type: z.string().optional(),
    date_of_creation: z.string().optional(),
    address: AddressSchema.optional(),
    description: z.string().optional(),
    description_identifier: z.array(z.string()).optional(),
  })),
  total_results: z.number(),
  start_index: z.number(),
  items_per_page: z.number(),
})

const OfficerSchema = z.object({
  name: z.string(),
  officer_role: z.string(),
  appointed_on: z.string().optional(),
  resigned_on: z.string().optional(),
  nationality: z.string().optional(),
  country_of_residence: z.string().optional(),
  date_of_birth: z.object({
    month: z.number(),
    year: z.number(),
  }).optional(),
  address: AddressSchema.optional(),
  occupation: z.string().optional(),
})

const PersonWithSignificantControlSchema = z.object({
  name: z.string(),
  name_elements: z.object({
    forename: z.string().optional(),
    other_forenames: z.string().optional(),
    surname: z.string().optional(),
    title: z.string().optional(),
  }).optional(),
  nationality: z.string().optional(),
  country_of_residence: z.string().optional(),
  date_of_birth: z.object({
    month: z.number(),
    year: z.number(),
  }).optional(),
  address: AddressSchema.optional(),
  natures_of_control: z.array(z.string()),
  notified_on: z.string().optional(),
  ceased_on: z.string().optional(),
  identification: z.object({
    country_registered: z.string().optional(),
    legal_authority: z.string().optional(),
    legal_form: z.string().optional(),
    place_registered: z.string().optional(),
    registration_number: z.string().optional(),
  }).optional(),
})

export type CompanyProfile = z.infer<typeof CompanyProfileSchema>
export type CompanySearchResult = z.infer<typeof CompanySearchSchema>
export type Officer = z.infer<typeof OfficerSchema>
export type PersonWithSignificantControl = z.infer<typeof PersonWithSignificantControlSchema>

class CompaniesHouseAPI {
  private readonly apiKey: string
  private readonly baseUrl = API_BASE_URL

  constructor() {
    const apiKey = process.env.COMPANIES_HOUSE_API_KEY
    if (!apiKey) {
      throw new Error('COMPANIES_HOUSE_API_KEY environment variable is required')
    }
    this.apiKey = apiKey
  }

  private async makeRequest<T>(endpoint: string, schema: z.ZodSchema<T>): Promise<T> {
    if (!rateLimiter.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please wait before making more requests.')
    }

    const url = `${this.baseUrl}${endpoint}`
    const auth = Buffer.from(`${this.apiKey}:`).toString('base64')

    try {
      rateLimiter.recordRequest()
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'User-Agent': 'Nexus-AI/1.0 (Corporate Intelligence Platform)',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Companies House API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      return schema.parse(data)
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Companies House API response validation failed:', error.errors)
        throw new Error('Invalid response format from Companies House API')
      }
      throw error
    }
  }

  /**
   * Search for companies by name or number
   */
  async searchCompanies(
    query: string, 
    options: {
      itemsPerPage?: number
      startIndex?: number
      restrictions?: string[]
    } = {}
  ): Promise<CompanySearchResult> {
    const params = new URLSearchParams({
      q: query,
      items_per_page: String(options.itemsPerPage || 20),
      start_index: String(options.startIndex || 0),
    })

    if (options.restrictions && options.restrictions.length > 0) {
      params.append('restrictions', options.restrictions.join(','))
    }

    return this.makeRequest(
      `/search/companies?${params.toString()}`,
      CompanySearchSchema
    )
  }

  /**
   * Get detailed company profile
   */
  async getCompanyProfile(companyNumber: string): Promise<CompanyProfile> {
    const cleanCompanyNumber = companyNumber.replace(/\s+/g, '').toUpperCase()
    
    return this.makeRequest(
      `/company/${cleanCompanyNumber}`,
      CompanyProfileSchema
    )
  }

  /**
   * Get company officers
   */
  async getCompanyOfficers(
    companyNumber: string,
    options: {
      itemsPerPage?: number
      startIndex?: number
      orderBy?: 'appointed_on' | 'resigned_on' | 'surname'
    } = {}
  ): Promise<{ items: Officer[], total_results: number }> {
    const cleanCompanyNumber = companyNumber.replace(/\s+/g, '').toUpperCase()
    
    const params = new URLSearchParams({
      items_per_page: String(options.itemsPerPage || 35),
      start_index: String(options.startIndex || 0),
    })

    if (options.orderBy) {
      params.append('order_by', options.orderBy)
    }

    const schema = z.object({
      items: z.array(OfficerSchema),
      total_results: z.number(),
      start_index: z.number(),
      items_per_page: z.number(),
    })

    return this.makeRequest(
      `/company/${cleanCompanyNumber}/officers?${params.toString()}`,
      schema
    )
  }

  /**
   * Get persons with significant control (PSCs)
   */
  async getPersonsWithSignificantControl(
    companyNumber: string,
    options: {
      itemsPerPage?: number
      startIndex?: number
    } = {}
  ): Promise<{ items: PersonWithSignificantControl[], total_results: number }> {
    const cleanCompanyNumber = companyNumber.replace(/\s+/g, '').toUpperCase()
    
    const params = new URLSearchParams({
      items_per_page: String(options.itemsPerPage || 25),
      start_index: String(options.startIndex || 0),
    })

    const schema = z.object({
      items: z.array(PersonWithSignificantControlSchema),
      total_results: z.number(),
      start_index: z.number(),
      items_per_page: z.number(),
    })

    return this.makeRequest(
      `/company/${cleanCompanyNumber}/persons-with-significant-control?${params.toString()}`,
      schema
    )
  }

  /**
   * Get company filing history
   */
  async getFilingHistory(
    companyNumber: string,
    options: {
      itemsPerPage?: number
      startIndex?: number
      category?: string
    } = {}
  ): Promise<any> {
    const cleanCompanyNumber = companyNumber.replace(/\s+/g, '').toUpperCase()
    
    const params = new URLSearchParams({
      items_per_page: String(options.itemsPerPage || 25),
      start_index: String(options.startIndex || 0),
    })

    if (options.category) {
      params.append('category', options.category)
    }

    // Using generic schema for filing history as it has many variations
    const schema = z.object({
      items: z.array(z.any()),
      total_count: z.number(),
      start_index: z.number(),
      items_per_page: z.number(),
    })

    return this.makeRequest(
      `/company/${cleanCompanyNumber}/filing-history?${params.toString()}`,
      schema
    )
  }

  /**
   * Get rate limit information
   */
  getRateLimitInfo(): {
    remainingRequests: number
    maxRequests: number
    timeWindowMinutes: number
  } {
    return {
      remainingRequests: rateLimiter.getRemainingRequests(),
      maxRequests: 600,
      timeWindowMinutes: 5,
    }
  }

  /**
   * Comprehensive company data fetch
   * Gets profile, officers, PSCs in one operation with error handling
   */
  async getCompanyData(companyNumber: string): Promise<{
    profile: CompanyProfile
    officers: Officer[]
    pscs: PersonWithSignificantControl[]
    filings: any[]
    metadata: {
      fetchedAt: string
      rateLimitRemaining: number
    }
  }> {
    const cleanCompanyNumber = companyNumber.replace(/\s+/g, '').toUpperCase()
    
    try {
      // Fetch all data in parallel for efficiency
      const [profile, officersData, pscsData, filingsData] = await Promise.allSettled([
        this.getCompanyProfile(cleanCompanyNumber),
        this.getCompanyOfficers(cleanCompanyNumber),
        this.getPersonsWithSignificantControl(cleanCompanyNumber),
        this.getFilingHistory(cleanCompanyNumber, { itemsPerPage: 10 })
      ])

      return {
        profile: profile.status === 'fulfilled' ? profile.value : {} as CompanyProfile,
        officers: officersData.status === 'fulfilled' ? officersData.value.items : [],
        pscs: pscsData.status === 'fulfilled' ? pscsData.value.items : [],
        filings: filingsData.status === 'fulfilled' ? filingsData.value.items : [],
        metadata: {
          fetchedAt: new Date().toISOString(),
          rateLimitRemaining: rateLimiter.getRemainingRequests(),
        }
      }
    } catch (error) {
      console.error(`Error fetching comprehensive data for company ${cleanCompanyNumber}:`, error)
      throw error
    }
  }
}

export const companiesHouseAPI = new CompaniesHouseAPI()

// Utility functions for data transformation
export const transformCompanyForDatabase = (profile: CompanyProfile) => ({
  company_number: profile.company_number,
  company_name: profile.company_name,
  company_status: profile.company_status,
  company_type: profile.company_type,
  incorporation_date: profile.date_of_creation ? new Date(profile.date_of_creation) : null,
  registered_office: profile.registered_office_address,
  sic_codes: profile.sic_codes?.map(code => parseInt(code)).filter(code => !isNaN(code)) || [],
  source_data: profile,
  reconciliation_confidence: 1.0, // High confidence for official source
})

export const transformOfficerForDatabase = (officer: Officer, companyId: string) => ({
  name: {
    full_name: officer.name,
    // Could parse into first/last name if needed
  },
  nationality: officer.nationality,
  country_of_residence: officer.country_of_residence,
  date_of_birth: officer.date_of_birth ? 
    new Date(officer.date_of_birth.year, officer.date_of_birth.month - 1, 15) : null,
  address: officer.address,
  occupation: officer.occupation,
  source_data: officer,
  reconciliation_confidence: 1.0,
})

export const transformPSCForDatabase = (psc: PersonWithSignificantControl, companyId: string) => ({
  name: {
    full_name: psc.name,
    title: psc.name_elements?.title,
    forename: psc.name_elements?.forename,
    surname: psc.name_elements?.surname,
    other_forenames: psc.name_elements?.other_forenames,
  },
  nationality: psc.nationality,
  country_of_residence: psc.country_of_residence,
  date_of_birth: psc.date_of_birth ? 
    new Date(psc.date_of_birth.year, psc.date_of_birth.month - 1, 15) : null,
  address: psc.address,
  source_data: {
    ...psc,
    natures_of_control: psc.natures_of_control,
    identification: psc.identification,
  },
  reconciliation_confidence: 1.0,
})