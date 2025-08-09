// Companies House API Client with rate limiting, error handling, and caching

import { rateLimiter, withRateLimit, type RateLimitOptions } from './rate-limiter';
import type {
  CompanySearchResponse,
  CompanyProfile,
  OfficersResponse,
  PSCResponse,
  CompaniesHouseError,
  RateLimitInfo
} from './types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CompaniesHouseClient {
  private static instance: CompaniesHouseClient;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly baseUrl = 'https://api.company-information.service.gov.uk';
  private readonly apiKey: string;
  private readonly defaultCacheTTL = 5 * 60 * 1000; // 5 minutes
  
  private constructor() {
    this.apiKey = process.env.COMPANIES_HOUSE_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Companies House API key is required');
    }
  }

  static getInstance(): CompaniesHouseClient {
    if (!CompaniesHouseClient.instance) {
      CompaniesHouseClient.instance = new CompaniesHouseClient();
    }
    return CompaniesHouseClient.instance;
  }

  private getHeaders(): HeadersInit {
    const credentials = Buffer.from(`${this.apiKey}:`).toString('base64');
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Nexus-AI/1.0'
    };
  }

  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? new URLSearchParams(params).toString() : '';
    return `${endpoint}?${paramString}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.defaultCacheTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: {
      params?: Record<string, any>;
      cacheTTL?: number;
      useCache?: boolean;
      rateLimitKey?: string;
    } = {}
  ): Promise<T> {
    const { params, cacheTTL = this.defaultCacheTTL, useCache = true, rateLimitKey = 'global' } = options;
    
    // Build URL with params
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Check cache first
    const cacheKey = this.getCacheKey(endpoint, params);
    if (useCache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Apply rate limiting
    const rateLimitedFetch = withRateLimit(async () => {
      const response = await fetch(url.toString(), {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      return response.json();
    }, { key: rateLimitKey });

    const data = await rateLimitedFetch();
    
    // Cache successful response
    if (useCache) {
      this.setCache(cacheKey, data, cacheTTL);
    }
    
    return data;
  }

  private async handleApiError(response: Response): Promise<never> {
    const status = response.status;
    let errorData: CompaniesHouseError;

    try {
      errorData = await response.json();
    } catch {
      errorData = {
        error: 'Unknown error',
        type: 'api_error',
        message: response.statusText
      };
    }

    switch (status) {
      case 400:
        throw new Error(`Bad Request: ${errorData.message || 'Invalid request parameters'}`);
      case 401:
        throw new Error('Unauthorized: Invalid or missing API key');
      case 403:
        throw new Error('Forbidden: Access denied to this resource');
      case 404:
        throw new Error('Not Found: The requested resource does not exist');
      case 429:
        throw new Error('Rate Limit Exceeded: Too many requests');
      case 500:
        throw new Error('Internal Server Error: Companies House API is experiencing issues');
      case 502:
      case 503:
      case 504:
        throw new Error('Service Unavailable: Companies House API is temporarily unavailable');
      default:
        throw new Error(`API Error (${status}): ${errorData.message || 'Unknown error'}`);
    }
  }

  /**
   * Search for companies
   * @param query - Search term (company name, number, etc.)
   * @param options - Search options
   */
  async searchCompanies(
    query: string,
    options: {
      itemsPerPage?: number;
      startIndex?: number;
      restrictions?: string;
      rateLimitKey?: string;
    } = {}
  ): Promise<CompanySearchResponse> {
    const { itemsPerPage = 20, startIndex = 0, restrictions, rateLimitKey } = options;
    
    const params: Record<string, any> = {
      q: query,
      items_per_page: Math.min(itemsPerPage, 100), // API max is 100
      start_index: startIndex
    };
    
    if (restrictions) {
      params.restrictions = restrictions;
    }

    return this.makeRequest<CompanySearchResponse>('/search/companies', {
      params,
      rateLimitKey,
      cacheTTL: 10 * 60 * 1000 // Cache search results for 10 minutes
    });
  }

  /**
   * Get company profile by company number
   */
  async getCompanyProfile(
    companyNumber: string,
    options: {
      rateLimitKey?: string;
      useCache?: boolean;
    } = {}
  ): Promise<CompanyProfile> {
    const { rateLimitKey, useCache = true } = options;
    
    return this.makeRequest<CompanyProfile>(`/company/${companyNumber}`, {
      rateLimitKey,
      useCache,
      cacheTTL: 30 * 60 * 1000 // Cache company profiles for 30 minutes
    });
  }

  /**
   * Get company officers
   */
  async getCompanyOfficers(
    companyNumber: string,
    options: {
      itemsPerPage?: number;
      startIndex?: number;
      orderBy?: 'appointed_on' | 'resigned_on' | 'surname';
      registerView?: boolean;
      registerType?: string;
      rateLimitKey?: string;
    } = {}
  ): Promise<OfficersResponse> {
    const { 
      itemsPerPage = 35, 
      startIndex = 0, 
      orderBy,
      registerView,
      registerType,
      rateLimitKey 
    } = options;
    
    const params: Record<string, any> = {
      items_per_page: Math.min(itemsPerPage, 100),
      start_index: startIndex
    };
    
    if (orderBy) params.order_by = orderBy;
    if (registerView !== undefined) params.register_view = registerView;
    if (registerType) params.register_type = registerType;

    return this.makeRequest<OfficersResponse>(`/company/${companyNumber}/officers`, {
      params,
      rateLimitKey,
      cacheTTL: 60 * 60 * 1000 // Cache officers for 1 hour
    });
  }

  /**
   * Get persons with significant control (PSCs)
   */
  async getCompanyPSCs(
    companyNumber: string,
    options: {
      itemsPerPage?: number;
      startIndex?: number;
      registerView?: boolean;
      rateLimitKey?: string;
    } = {}
  ): Promise<PSCResponse> {
    const { itemsPerPage = 25, startIndex = 0, registerView, rateLimitKey } = options;
    
    const params: Record<string, any> = {
      items_per_page: Math.min(itemsPerPage, 100),
      start_index: startIndex
    };
    
    if (registerView !== undefined) params.register_view = registerView;

    return this.makeRequest<PSCResponse>(`/company/${companyNumber}/persons-with-significant-control`, {
      params,
      rateLimitKey,
      cacheTTL: 60 * 60 * 1000 // Cache PSCs for 1 hour
    });
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(key: string = 'global'): RateLimitInfo {
    const status = rateLimiter.getRateLimitStatus(key);
    return {
      requests: 600 - status.remaining,
      resetTime: status.resetTime,
      remaining: status.remaining,
      limit: status.total
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; size: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      size: JSON.stringify(entry.data).length
    }));

    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses to calculate
      entries
    };
  }

  /**
   * Health check - test API connectivity
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    rateLimitStatus: RateLimitInfo;
    error?: string;
  }> {
    const start = Date.now();
    
    try {
      // Try to search for a common company to test connectivity
      await this.searchCompanies('Google', { 
        itemsPerPage: 1,
        rateLimitKey: 'health-check'
      });
      
      const latency = Date.now() - start;
      const rateLimitStatus = this.getRateLimitStatus('health-check');
      
      return {
        status: 'healthy',
        latency,
        rateLimitStatus
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        rateLimitStatus: this.getRateLimitStatus('health-check'),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const companiesHouseClient = CompaniesHouseClient.getInstance();

// Export types and utilities
export type { CompanySearchResponse, CompanyProfile, OfficersResponse, PSCResponse } from './types';
export { rateLimiter } from './rate-limiter';