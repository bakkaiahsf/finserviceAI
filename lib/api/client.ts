'use client';

// Frontend API client for seamless backend communication

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}/api${endpoint}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          message: data.message
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message
      };
    } catch (error) {
      console.error('API Client Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // System Status
  async getSystemStatus() {
    return this.request('/status');
  }

  // Companies House API
  async searchCompany(query: string, limit: number = 10) {
    return this.request(`/companies/search?query=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async getCompanyProfile(companyNumber: string) {
    return this.request(`/companies/profile/${companyNumber}`);
  }

  async getCompanyOfficers(companyNumber: string) {
    return this.request(`/companies/officers/${companyNumber}`);
  }

  // AI Analysis
  async analyzeCompany(companyData: any) {
    return this.request('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ company: companyData }),
    });
  }

  async getRiskScore(companyNumber: string) {
    return this.request(`/ai/risk-score/${companyNumber}`);
  }

  // Network Graph
  async buildNetwork(companyNumber: string, depth: number = 2) {
    return this.request(`/graph/network/${companyNumber}?depth=${depth}`);
  }

  // Reports
  async generatePdfReport(companyNumber: string, options: any = {}) {
    return this.request('/reports/pdf', {
      method: 'POST',
      body: JSON.stringify({ companyNumber, options }),
    });
  }

  async exportCsv(data: any, type: string) {
    return this.request('/reports/csv', {
      method: 'POST',
      body: JSON.stringify({ data, type }),
    });
  }

  // Subscription Management
  async getSubscription() {
    return this.request('/subscription/current');
  }

  async getUsageQuota() {
    return this.request('/subscription/quota');
  }

  async createCheckoutSession(priceId: string) {
    return this.request('/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ priceId }),
    });
  }

  // Security & GDPR
  async getApiKeys() {
    return this.request('/api-keys');
  }

  async createApiKey(name: string, scopes: string[]) {
    return this.request('/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, scopes }),
    });
  }

  async requestDataExport() {
    return this.request('/gdpr/export-data', { method: 'POST' });
  }

  async deleteUserData() {
    return this.request('/gdpr/delete-data', { method: 'DELETE' });
  }

  // User Management
  async updateProfile(data: any) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAuditLogs(limit: number = 50) {
    return this.request(`/user/audit-logs?limit=${limit}`);
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// React hooks for common operations
export function useApiClient() {
  return apiClient;
}

// Custom hooks for specific features
import { useState, useEffect } from 'react';

export function useSystemStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await apiClient.getSystemStatus();
        if (response.success) {
          setStatus(response.data);
        } else {
          setError(response.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, []);

  return { status, loading, error };
}

export function useSubscriptionQuota() {
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const response = await apiClient.getUsageQuota();
        if (response.success) {
          setQuota(response.data);
        } else {
          setError(response.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchQuota();
  }, []);

  return { quota, loading, error, refetch: () => fetchQuota() };
}

// Utility functions for error handling
export function handleApiError(error: string | null, fallback: string = 'An error occurred') {
  return error || fallback;
}

export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true;
}