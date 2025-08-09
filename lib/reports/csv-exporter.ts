// CSV export functionality for data analysis and external processing

import type { CompanyProfile, Officer, PersonWithSignificantControl } from '@/lib/companies-house/types';
import type { CompanyInsight } from '@/lib/ai/deepseek-client';
import type { GraphData, CompanyNode, RelationshipEdge } from '@/lib/graph/types';

interface CSVExportOptions {
  includeHeaders: boolean;
  delimiter: ',' | ';' | '\t';
  dateFormat: 'ISO' | 'UK' | 'US';
  includeMetadata: boolean;
  encoding: 'UTF-8' | 'UTF-16' | 'ASCII';
}

interface ExportMetadata {
  exportedBy: string;
  exportedAt: string;
  recordCount: number;
  source: 'companies_house' | 'ai_insights' | 'network_analysis';
  version: string;
}

class CSVExporter {
  private defaultOptions: CSVExportOptions = {
    includeHeaders: true,
    delimiter: ',',
    dateFormat: 'ISO',
    includeMetadata: true,
    encoding: 'UTF-8'
  };

  /**
   * Export company profiles to CSV
   */
  async exportCompanies(
    companies: CompanyProfile[],
    options: Partial<CSVExportOptions> = {},
    metadata?: Partial<ExportMetadata>
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    const meta: ExportMetadata = {
      exportedBy: metadata?.exportedBy || 'system',
      exportedAt: new Date().toISOString(),
      recordCount: companies.length,
      source: 'companies_house',
      version: '1.0',
      ...metadata
    };

    let csv = '';

    // Add metadata header if requested
    if (opts.includeMetadata) {
      csv += this.generateMetadataHeader(meta, opts.delimiter);
      csv += '\n\n';
    }

    // Add column headers
    if (opts.includeHeaders) {
      const headers = [
        'Company Number',
        'Company Name',
        'Status',
        'Type',
        'Jurisdiction',
        'Incorporation Date',
        'Cessation Date',
        'SIC Codes',
        'Address Line 1',
        'Address Line 2',
        'Locality',
        'Postal Code',
        'Country',
        'Has Charges',
        'Has Insolvency History',
        'Accounts Overdue',
        'Last Accounts Date',
        'Can File'
      ];
      csv += headers.join(opts.delimiter) + '\n';
    }

    // Add company data
    for (const company of companies) {
      const row = [
        this.escapeCsvField(company.company_number, opts.delimiter),
        this.escapeCsvField(company.company_name, opts.delimiter),
        this.escapeCsvField(company.company_status, opts.delimiter),
        this.escapeCsvField(company.type, opts.delimiter),
        this.escapeCsvField(company.jurisdiction, opts.delimiter),
        this.formatDate(company.date_of_creation, opts.dateFormat),
        this.formatDate(company.date_of_cessation, opts.dateFormat),
        this.escapeCsvField(company.sic_codes?.join('|') || '', opts.delimiter),
        this.escapeCsvField(company.registered_office_address?.address_line_1 || '', opts.delimiter),
        this.escapeCsvField(company.registered_office_address?.address_line_2 || '', opts.delimiter),
        this.escapeCsvField(company.registered_office_address?.locality || '', opts.delimiter),
        this.escapeCsvField(company.registered_office_address?.postal_code || '', opts.delimiter),
        this.escapeCsvField(company.registered_office_address?.country || '', opts.delimiter),
        company.has_charges ? 'Yes' : 'No',
        company.has_insolvency_history ? 'Yes' : 'No',
        company.accounts?.overdue ? 'Yes' : 'No',
        this.formatDate(company.accounts?.last_accounts?.made_up_to, opts.dateFormat),
        company.can_file ? 'Yes' : 'No'
      ];
      csv += row.join(opts.delimiter) + '\n';
    }

    return csv;
  }

  /**
   * Export officers to CSV
   */
  async exportOfficers(
    officers: Officer[],
    companyNumber?: string,
    options: Partial<CSVExportOptions> = {},
    metadata?: Partial<ExportMetadata>
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    const meta: ExportMetadata = {
      exportedBy: metadata?.exportedBy || 'system',
      exportedAt: new Date().toISOString(),
      recordCount: officers.length,
      source: 'companies_house',
      version: '1.0',
      ...metadata
    };

    let csv = '';

    // Add metadata header
    if (opts.includeMetadata) {
      csv += this.generateMetadataHeader(meta, opts.delimiter);
      if (companyNumber) {
        csv += `# Company Number${opts.delimiter}${companyNumber}\n`;
      }
      csv += '\n\n';
    }

    // Add headers
    if (opts.includeHeaders) {
      const headers = [
        'Name',
        'Officer Role',
        'Appointed Date',
        'Resigned Date',
        'Nationality',
        'Country of Residence',
        'Occupation',
        'Date of Birth Month',
        'Date of Birth Year',
        'Address Line 1',
        'Address Line 2',
        'Locality',
        'Postal Code',
        'Country'
      ];
      csv += headers.join(opts.delimiter) + '\n';
    }

    // Add officer data
    for (const officer of officers) {
      const row = [
        this.escapeCsvField(officer.name, opts.delimiter),
        this.escapeCsvField(officer.officer_role, opts.delimiter),
        this.formatDate(officer.appointed_on, opts.dateFormat),
        this.formatDate(officer.resigned_on, opts.dateFormat),
        this.escapeCsvField(officer.nationality || '', opts.delimiter),
        this.escapeCsvField(officer.country_of_residence || '', opts.delimiter),
        this.escapeCsvField(officer.occupation || '', opts.delimiter),
        officer.date_of_birth?.month?.toString() || '',
        officer.date_of_birth?.year?.toString() || '',
        this.escapeCsvField(officer.address?.address_line_1 || '', opts.delimiter),
        this.escapeCsvField(officer.address?.address_line_2 || '', opts.delimiter),
        this.escapeCsvField(officer.address?.locality || '', opts.delimiter),
        this.escapeCsvField(officer.address?.postal_code || '', opts.delimiter),
        this.escapeCsvField(officer.address?.country || '', opts.delimiter)
      ];
      csv += row.join(opts.delimiter) + '\n';
    }

    return csv;
  }

  /**
   * Export AI insights to CSV
   */
  async exportInsights(
    insights: CompanyInsight[],
    options: Partial<CSVExportOptions> = {},
    metadata?: Partial<ExportMetadata>
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    const meta: ExportMetadata = {
      exportedBy: metadata?.exportedBy || 'system',
      exportedAt: new Date().toISOString(),
      recordCount: insights.length,
      source: 'ai_insights',
      version: '1.0',
      ...metadata
    };

    let csv = '';

    // Add metadata header
    if (opts.includeMetadata) {
      csv += this.generateMetadataHeader(meta, opts.delimiter);
      csv += '\n\n';
    }

    // Add headers
    if (opts.includeHeaders) {
      const headers = [
        'Generated At',
        'Summary',
        'Risk Score',
        'Confidence',
        'Data Quality',
        'Key Findings',
        'Risk Factors Count',
        'High Risk Factors',
        'Medium Risk Factors',
        'Low Risk Factors',
        'Opportunities Count',
        'Recommendations Count',
        'Tokens Used'
      ];
      csv += headers.join(opts.delimiter) + '\n';
    }

    // Add insights data
    for (const insight of insights) {
      const highRiskFactors = insight.riskFactors.filter(r => r.severity === 'high').length;
      const mediumRiskFactors = insight.riskFactors.filter(r => r.severity === 'medium').length;
      const lowRiskFactors = insight.riskFactors.filter(r => r.severity === 'low').length;

      const row = [
        this.formatDate(insight.generatedAt, opts.dateFormat),
        this.escapeCsvField(insight.summary, opts.delimiter),
        insight.riskScore.toString(),
        insight.confidence.toString(),
        this.escapeCsvField(insight.dataQuality, opts.delimiter),
        this.escapeCsvField(insight.keyFindings.join(' | '), opts.delimiter),
        insight.riskFactors.length.toString(),
        highRiskFactors.toString(),
        mediumRiskFactors.toString(),
        lowRiskFactors.toString(),
        insight.opportunities.length.toString(),
        insight.recommendations.length.toString(),
        insight.tokensUsed.toString()
      ];
      csv += row.join(opts.delimiter) + '\n';
    }

    return csv;
  }

  /**
   * Export network graph data to CSV (separate files for nodes and edges)
   */
  async exportNetworkNodes(
    graphData: GraphData,
    options: Partial<CSVExportOptions> = {},
    metadata?: Partial<ExportMetadata>
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    const meta: ExportMetadata = {
      exportedBy: metadata?.exportedBy || 'system',
      exportedAt: new Date().toISOString(),
      recordCount: graphData.nodes.length,
      source: 'network_analysis',
      version: '1.0',
      ...metadata
    };

    let csv = '';

    // Add metadata header
    if (opts.includeMetadata) {
      csv += this.generateMetadataHeader(meta, opts.delimiter);
      csv += `# Total Edges${opts.delimiter}${graphData.edges.length}\n`;
      csv += '\n\n';
    }

    // Add headers
    if (opts.includeHeaders) {
      const headers = [
        'Node ID',
        'Node Type',
        'Label',
        'Company Number',
        'Company Name',
        'Company Status',
        'Officer Name',
        'Officer Role',
        'PSC Name',
        'Address',
        'Level',
        'Position X',
        'Position Y',
        'Has Error'
      ];
      csv += headers.join(opts.delimiter) + '\n';
    }

    // Add node data
    for (const node of graphData.nodes) {
      const row = [
        this.escapeCsvField(node.id, opts.delimiter),
        this.escapeCsvField(node.type, opts.delimiter),
        this.escapeCsvField(node.data.label, opts.delimiter),
        this.escapeCsvField(node.data.companyNumber || '', opts.delimiter),
        this.escapeCsvField(node.data.companyName || '', opts.delimiter),
        this.escapeCsvField(node.data.companyStatus || '', opts.delimiter),
        this.escapeCsvField(node.data.officerName || '', opts.delimiter),
        this.escapeCsvField(node.data.officerRole || '', opts.delimiter),
        this.escapeCsvField(node.data.pscName || '', opts.delimiter),
        this.escapeCsvField(node.data.address || '', opts.delimiter),
        node.data.level?.toString() || '0',
        node.position.x.toString(),
        node.position.y.toString(),
        node.data.error ? 'Yes' : 'No'
      ];
      csv += row.join(opts.delimiter) + '\n';
    }

    return csv;
  }

  /**
   * Export network edges to CSV
   */
  async exportNetworkEdges(
    graphData: GraphData,
    options: Partial<CSVExportOptions> = {},
    metadata?: Partial<ExportMetadata>
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    const meta: ExportMetadata = {
      exportedBy: metadata?.exportedBy || 'system',
      exportedAt: new Date().toISOString(),
      recordCount: graphData.edges.length,
      source: 'network_analysis',
      version: '1.0',
      ...metadata
    };

    let csv = '';

    // Add metadata header
    if (opts.includeMetadata) {
      csv += this.generateMetadataHeader(meta, opts.delimiter);
      csv += `# Total Nodes${opts.delimiter}${graphData.nodes.length}\n`;
      csv += '\n\n';
    }

    // Add headers
    if (opts.includeHeaders) {
      const headers = [
        'Edge ID',
        'Source Node',
        'Target Node',
        'Relationship Type',
        'Label',
        'Strength',
        'Start Date',
        'End Date',
        'Description'
      ];
      csv += headers.join(opts.delimiter) + '\n';
    }

    // Add edge data
    for (const edge of graphData.edges) {
      const row = [
        this.escapeCsvField(edge.id, opts.delimiter),
        this.escapeCsvField(edge.source, opts.delimiter),
        this.escapeCsvField(edge.target, opts.delimiter),
        this.escapeCsvField(edge.data?.relationship || '', opts.delimiter),
        this.escapeCsvField(edge.data?.label || '', opts.delimiter),
        edge.data?.strength?.toString() || '',
        this.formatDate(edge.data?.startDate, opts.dateFormat),
        this.formatDate(edge.data?.endDate, opts.dateFormat),
        this.escapeCsvField(edge.data?.description || '', opts.delimiter)
      ];
      csv += row.join(opts.delimiter) + '\n';
    }

    return csv;
  }

  /**
   * Export comprehensive report data to multiple CSV files (ZIP format)
   */
  async exportComprehensiveReport(
    data: {
      companies?: CompanyProfile[];
      officers?: Officer[];
      insights?: CompanyInsight[];
      networkData?: GraphData;
    },
    options: Partial<CSVExportOptions> = {},
    metadata?: Partial<ExportMetadata>
  ): Promise<{ [filename: string]: string }> {
    const files: { [filename: string]: string } = {};
    const timestamp = new Date().toISOString().split('T')[0];

    // Export companies
    if (data.companies && data.companies.length > 0) {
      files[`companies_${timestamp}.csv`] = await this.exportCompanies(
        data.companies, 
        options, 
        { ...metadata, source: 'companies_house' }
      );
    }

    // Export officers
    if (data.officers && data.officers.length > 0) {
      files[`officers_${timestamp}.csv`] = await this.exportOfficers(
        data.officers, 
        undefined, 
        options, 
        { ...metadata, source: 'companies_house' }
      );
    }

    // Export insights
    if (data.insights && data.insights.length > 0) {
      files[`ai_insights_${timestamp}.csv`] = await this.exportInsights(
        data.insights, 
        options, 
        { ...metadata, source: 'ai_insights' }
      );
    }

    // Export network data
    if (data.networkData) {
      files[`network_nodes_${timestamp}.csv`] = await this.exportNetworkNodes(
        data.networkData, 
        options, 
        { ...metadata, source: 'network_analysis' }
      );
      files[`network_edges_${timestamp}.csv`] = await this.exportNetworkEdges(
        data.networkData, 
        options, 
        { ...metadata, source: 'network_analysis' }
      );
    }

    return files;
  }

  /**
   * Create a CSV export summary with statistics
   */
  createExportSummary(
    exportData: { [filename: string]: string },
    metadata: ExportMetadata
  ): string {
    const opts = this.defaultOptions;
    let summary = '';

    // Header
    summary += `# Export Summary Report\n`;
    summary += `# Generated: ${metadata.exportedAt}\n`;
    summary += `# Exported by: ${metadata.exportedBy}\n`;
    summary += `# Version: ${metadata.version}\n`;
    summary += `\n`;

    // File statistics
    if (opts.includeHeaders) {
      summary += `Filename${opts.delimiter}Records${opts.delimiter}Size (bytes)${opts.delimiter}Type\n`;
    }

    for (const [filename, content] of Object.entries(exportData)) {
      const lines = content.split('\n').length - 1;
      const size = new Blob([content]).size;
      const type = filename.includes('companies') ? 'Company Data' :
                   filename.includes('officers') ? 'Officer Data' :
                   filename.includes('insights') ? 'AI Insights' :
                   filename.includes('nodes') ? 'Network Nodes' :
                   filename.includes('edges') ? 'Network Edges' : 'Unknown';

      summary += `${filename}${opts.delimiter}${lines}${opts.delimiter}${size}${opts.delimiter}${type}\n`;
    }

    return summary;
  }

  private generateMetadataHeader(metadata: ExportMetadata, delimiter: string): string {
    return [
      `# Nexus AI Business Intelligence Export`,
      `# Export Date${delimiter}${metadata.exportedAt}`,
      `# Exported By${delimiter}${metadata.exportedBy}`,
      `# Record Count${delimiter}${metadata.recordCount}`,
      `# Data Source${delimiter}${metadata.source}`,
      `# Version${delimiter}${metadata.version}`
    ].join('\n');
  }

  private escapeCsvField(value: string, delimiter: string): string {
    if (!value) return '';
    
    // Convert to string and handle null/undefined
    const str = String(value);
    
    // If field contains delimiter, newline, or quote, wrap in quotes and escape internal quotes
    if (str.includes(delimiter) || str.includes('\n') || str.includes('"')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    
    return str;
  }

  private formatDate(dateString: string | undefined, format: CSVExportOptions['dateFormat']): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      switch (format) {
        case 'UK':
          return date.toLocaleDateString('en-GB');
        case 'US':
          return date.toLocaleDateString('en-US');
        case 'ISO':
        default:
          return date.toISOString().split('T')[0];
      }
    } catch {
      return dateString; // Return original if parsing fails
    }
  }

  /**
   * Validate CSV content for common issues
   */
  validateCsvContent(csvContent: string, options: Partial<CSVExportOptions> = {}): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    statistics: {
      totalRows: number;
      totalColumns: number;
      emptyFields: number;
      encoding: string;
    };
  } {
    const opts = { ...this.defaultOptions, ...options };
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const lines = csvContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    const totalRows = lines.length;
    
    if (totalRows === 0) {
      errors.push('CSV content is empty');
      return {
        isValid: false,
        errors,
        warnings,
        statistics: { totalRows: 0, totalColumns: 0, emptyFields: 0, encoding: opts.encoding }
      };
    }
    
    let totalColumns = 0;
    let emptyFields = 0;
    
    // Check header row if present
    if (opts.includeHeaders && totalRows > 0) {
      const headerColumns = lines[0].split(opts.delimiter).length;
      totalColumns = headerColumns;
      
      // Validate all rows have same number of columns
      for (let i = 1; i < lines.length; i++) {
        const rowColumns = lines[i].split(opts.delimiter).length;
        if (rowColumns !== headerColumns) {
          warnings.push(`Row ${i + 1} has ${rowColumns} columns, expected ${headerColumns}`);
        }
        
        // Count empty fields
        const fields = lines[i].split(opts.delimiter);
        emptyFields += fields.filter(field => !field.trim()).length;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      statistics: {
        totalRows: totalRows - (opts.includeHeaders ? 1 : 0), // Exclude header from row count
        totalColumns,
        emptyFields,
        encoding: opts.encoding
      }
    };
  }
}

export const csvExporter = new CSVExporter();
export type { CSVExportOptions, ExportMetadata };