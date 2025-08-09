'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Search,
  MapPin,
  Calendar,
  Users,
  Activity,
  AlertCircle,
  Loader2,
  ArrowRight,
  Filter,
  ExternalLink
} from 'lucide-react';
import type { CompanySearchResult } from '@/lib/companies-house/types';

interface SearchResponse {
  items: CompanySearchResult[];
  total_results: number;
  items_per_page: number;
  page_number: number;
  start_index: number;
}

export default function CompanySearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const itemsPerPage = 20;

  const handleSearch = async (page = 1) => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const startIndex = (page - 1) * itemsPerPage;
      const response = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}&items_per_page=${itemsPerPage}&start_index=${startIndex}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Search failed');
      }

      const data = await response.json();
      setResults(data);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyClick = (companyNumber: string) => {
    router.push(`/dashboard/companies/${companyNumber}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'dissolved':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'liquidation':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'administration':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getCompanyTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      'ltd': 'Private Limited Company',
      'plc': 'Public Limited Company',
      'llp': 'Limited Liability Partnership',
      'partnership': 'Partnership',
      'sole-trader': 'Sole Trader',
      'uk-establishment': 'UK Establishment',
      'other': 'Other'
    };
    return typeMap[type] || type.replace('-', ' ').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return dateString;
    }
  };

  const totalPages = results ? Math.ceil(results.total_results / itemsPerPage) : 0;
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Company Search</h1>
        <p className="mt-2 text-gray-600">
          Search UK companies using Companies House data
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search Companies</span>
          </CardTitle>
          <CardDescription>
            Enter company name, registration number, or keywords to find UK companies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(1);
            }}
            className="flex space-x-4"
          >
            <div className="flex-1">
              <Input
                type="text"
                placeholder="e.g., Tesco, Google, 00445790..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
                className="text-base"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !query.trim()}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </form>

          {/* Quick Examples */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Try:</span>
            {['Tesco', 'Google UK', 'Microsoft', 'BP PLC'].map((example) => (
              <Button
                key={example}
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-xs text-blue-600 hover:text-blue-800"
                onClick={() => {
                  setQuery(example);
                  handleSearch(1);
                }}
              >
                {example}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Search Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Search Results
              </h2>
              <p className="text-sm text-gray-600">
                Found {results.total_results.toLocaleString()} companies 
                {query && ` for "${query}"`}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {results.items.map((company) => (
              <Card 
                key={company.company_number}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleCompanyClick(company.company_number)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Company Name & Number */}
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="flex-shrink-0 mt-1">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {company.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Company No: {company.company_number}
                          </p>
                        </div>
                      </div>

                      {/* Status & Type */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(company.company_status)}
                        >
                          <Activity className="mr-1 h-3 w-3" />
                          {company.company_status.replace('-', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-gray-700">
                          {getCompanyTypeDisplay(company.company_type)}
                        </Badge>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Created: {formatDate(company.date_of_creation)}</span>
                        </div>
                        
                        {company.address && (
                          <div className="flex items-center space-x-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">
                              {[
                                company.address.premises,
                                company.address.address_line_1,
                                company.address.locality,
                                company.address.postal_code
                              ].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}

                        {company.date_of_cessation && (
                          <div className="flex items-center space-x-2 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>Ceased: {formatDate(company.date_of_cessation)}</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {company.description && (
                        <p className="mt-3 text-sm text-gray-700 line-clamp-2">
                          {company.description}
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0 ml-4">
                      <Button variant="ghost" size="sm">
                        View Details
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, results.total_results)} of {results.total_results.toLocaleString()} results
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasPrevPage || loading}
                  onClick={() => handleSearch(currentPage - 1)}
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(5, totalPages))].map((_, index) => {
                    const pageNum = currentPage <= 3 ? index + 1 : currentPage - 2 + index;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        className="min-w-[40px]"
                        disabled={loading}
                        onClick={() => handleSearch(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2 text-gray-400">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-w-[40px]"
                        disabled={loading}
                        onClick={() => handleSearch(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasNextPage || loading}
                  onClick={() => handleSearch(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}