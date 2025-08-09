// PDF report generation using Puppeteer for professional business intelligence reports

import puppeteer, { Browser, Page } from 'puppeteer';
import type { CompanyProfile, Officer } from '@/lib/companies-house/types';
import type { CompanyInsight } from '@/lib/ai/deepseek-client';
import type { GraphData } from '@/lib/graph/types';

interface ReportData {
  company: CompanyProfile;
  officers?: Officer[];
  insights?: CompanyInsight;
  networkGraph?: GraphData;
  metadata: {
    generatedBy: string;
    generatedAt: string;
    reportType: 'company_profile' | 'due_diligence' | 'network_analysis' | 'comprehensive';
    version: string;
    requestId: string;
  };
}

interface PDFOptions {
  format: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  includeCharts: boolean;
  includeCoverPage: boolean;
  includeTableOfContents: boolean;
  watermark?: string;
  headerText?: string;
  footerText?: string;
}

class PDFReportGenerator {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Generate a comprehensive company report
   */
  async generateCompanyReport(
    reportData: ReportData, 
    options: PDFOptions = this.getDefaultOptions()
  ): Promise<Buffer> {
    await this.initialize();
    
    if (!this.browser) {
      throw new Error('Failed to initialize browser');
    }

    const page = await this.browser.newPage();

    try {
      // Set page format and size
      await page.setViewport({ width: 1200, height: 1600 });

      // Generate HTML content
      const htmlContent = this.generateHTML(reportData, options);
      
      // Set HTML content
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: options.format,
        landscape: options.orientation === 'landscape',
        printBackground: true,
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm'
        },
        displayHeaderFooter: !!(options.headerText || options.footerText),
        headerTemplate: options.headerText ? 
          `<div style="font-size: 10px; padding: 10px; width: 100%; text-align: center;">${options.headerText}</div>` : 
          undefined,
        footerTemplate: options.footerText ?
          `<div style="font-size: 10px; padding: 10px; width: 100%; text-align: center;">${options.footerText} - Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>` :
          '<div style="font-size: 10px; padding: 10px; width: 100%; text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
      });

      return pdfBuffer;
    } finally {
      await page.close();
    }
  }

  /**
   * Generate network analysis report
   */
  async generateNetworkReport(
    graphData: GraphData,
    companyName: string,
    metadata: ReportData['metadata'],
    options: PDFOptions = this.getDefaultOptions()
  ): Promise<Buffer> {
    const reportData: ReportData = {
      company: {
        company_name: companyName,
        company_number: 'NETWORK_ANALYSIS',
        company_status: 'active',
        jurisdiction: 'england-wales',
        date_of_creation: '',
        etag: '',
        kind: 'network-analysis',
        registered_office_address: {},
        type: 'network-analysis',
        links: { self: '' },
        can_file: false
      },
      networkGraph: graphData,
      metadata
    };

    return this.generateCompanyReport(reportData, {
      ...options,
      includeCharts: true
    });
  }

  private generateHTML(reportData: ReportData, options: PDFOptions): string {
    const { company, officers, insights, networkGraph, metadata } = reportData;

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Business Intelligence Report - ${company.company_name}</title>
      <style>
        ${this.getCSS()}
      </style>
    </head>
    <body>
    `;

    // Cover Page
    if (options.includeCoverPage) {
      html += this.generateCoverPage(company, metadata);
    }

    // Table of Contents
    if (options.includeTableOfContents) {
      html += this.generateTableOfContents(reportData);
    }

    // Executive Summary
    html += this.generateExecutiveSummary(company, insights);

    // Company Profile
    html += this.generateCompanyProfile(company);

    // Officers Section
    if (officers && officers.length > 0) {
      html += this.generateOfficersSection(officers);
    }

    // AI Insights
    if (insights) {
      html += this.generateInsightsSection(insights);
    }

    // Network Analysis
    if (networkGraph) {
      html += this.generateNetworkSection(networkGraph);
    }

    // Appendix
    html += this.generateAppendix(metadata);

    // Watermark
    if (options.watermark) {
      html += `<div class="watermark">${options.watermark}</div>`;
    }

    html += `
    </body>
    </html>
    `;

    return html;
  }

  private generateCoverPage(company: CompanyProfile, metadata: ReportData['metadata']): string {
    const reportTypeDisplayName = metadata.reportType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return `
    <div class="page cover-page">
      <div class="cover-header">
        <h1>NEXUS AI</h1>
        <p>Business Intelligence Platform</p>
      </div>
      
      <div class="cover-content">
        <h2 class="report-title">${reportTypeDisplayName} Report</h2>
        <h3 class="company-name">${company.company_name}</h3>
        <p class="company-number">Company Number: ${company.company_number}</p>
        
        <div class="report-details">
          <p><strong>Generated:</strong> ${new Date(metadata.generatedAt).toLocaleString('en-GB')}</p>
          <p><strong>Report ID:</strong> ${metadata.requestId}</p>
          <p><strong>Version:</strong> ${metadata.version}</p>
        </div>
      </div>
      
      <div class="cover-footer">
        <p class="confidential">CONFIDENTIAL BUSINESS INTELLIGENCE REPORT</p>
        <p class="disclaimer">This report contains confidential information and is intended solely for the use of the recipient. Any unauthorized disclosure or use is prohibited.</p>
      </div>
    </div>
    <div class="page-break"></div>
    `;
  }

  private generateTableOfContents(reportData: ReportData): string {
    const { officers, insights, networkGraph } = reportData;
    
    let toc = `
    <div class="page table-of-contents">
      <h2>Table of Contents</h2>
      <ul class="toc-list">
        <li><a href="#executive-summary">1. Executive Summary</a></li>
        <li><a href="#company-profile">2. Company Profile</a></li>
    `;

    let sectionNumber = 3;
    
    if (officers && officers.length > 0) {
      toc += `<li><a href="#officers">3. Officers & Management</a></li>`;
      sectionNumber++;
    }
    
    if (insights) {
      toc += `<li><a href="#ai-insights">${sectionNumber}. AI Business Insights</a></li>`;
      sectionNumber++;
    }
    
    if (networkGraph) {
      toc += `<li><a href="#network-analysis">${sectionNumber}. Network Analysis</a></li>`;
      sectionNumber++;
    }
    
    toc += `
        <li><a href="#appendix">${sectionNumber}. Appendix</a></li>
      </ul>
    </div>
    <div class="page-break"></div>
    `;

    return toc;
  }

  private generateExecutiveSummary(company: CompanyProfile, insights?: CompanyInsight): string {
    return `
    <div class="section" id="executive-summary">
      <h2>1. Executive Summary</h2>
      
      <div class="summary-grid">
        <div class="summary-card">
          <h4>Company Status</h4>
          <p class="status-${company.company_status}">${company.company_status.toUpperCase()}</p>
        </div>
        
        <div class="summary-card">
          <h4>Company Type</h4>
          <p>${company.type?.replace(/-/g, ' ').toUpperCase()}</p>
        </div>
        
        <div class="summary-card">
          <h4>Incorporation Date</h4>
          <p>${new Date(company.date_of_creation).toLocaleDateString('en-GB')}</p>
        </div>
        
        ${insights ? `
        <div class="summary-card risk-card">
          <h4>AI Risk Score</h4>
          <p class="risk-score risk-${this.getRiskCategory(insights.riskScore)}">${insights.riskScore}/100</p>
        </div>
        ` : ''}
      </div>
      
      ${insights ? `
      <div class="ai-summary">
        <h3>Key Business Intelligence</h3>
        <p>${insights.summary}</p>
        
        <div class="confidence-indicator">
          <p>Analysis Confidence: <strong>${insights.confidence}%</strong> | 
          Data Quality: <strong>${insights.dataQuality}</strong></p>
        </div>
      </div>
      ` : ''}
    </div>
    `;
  }

  private generateCompanyProfile(company: CompanyProfile): string {
    const address = company.registered_office_address;
    const addressString = address ? [
      address.premises,
      address.address_line_1,
      address.address_line_2,
      address.locality,
      address.postal_code,
      address.country
    ].filter(Boolean).join(', ') : 'Not available';

    return `
    <div class="section" id="company-profile">
      <h2>2. Company Profile</h2>
      
      <div class="profile-grid">
        <div class="profile-section">
          <h3>Basic Information</h3>
          <table class="info-table">
            <tr><td><strong>Company Name:</strong></td><td>${company.company_name}</td></tr>
            <tr><td><strong>Company Number:</strong></td><td>${company.company_number}</td></tr>
            <tr><td><strong>Status:</strong></td><td class="status-${company.company_status}">${company.company_status}</td></tr>
            <tr><td><strong>Type:</strong></td><td>${company.type}</td></tr>
            <tr><td><strong>Jurisdiction:</strong></td><td>${company.jurisdiction}</td></tr>
            <tr><td><strong>Incorporation Date:</strong></td><td>${new Date(company.date_of_creation).toLocaleDateString('en-GB')}</td></tr>
            ${company.date_of_cessation ? `<tr><td><strong>Cessation Date:</strong></td><td>${new Date(company.date_of_cessation).toLocaleDateString('en-GB')}</td></tr>` : ''}
          </table>
        </div>
        
        <div class="profile-section">
          <h3>Registered Office Address</h3>
          <p class="address">${addressString}</p>
          
          <h3>Business Activities</h3>
          ${company.sic_codes && company.sic_codes.length > 0 ? `
            <ul class="sic-codes">
              ${company.sic_codes.map(code => `<li>SIC Code: ${code}</li>`).join('')}
            </ul>
          ` : '<p>No SIC codes available</p>'}
        </div>
      </div>
      
      <div class="profile-section">
        <h3>Corporate Information</h3>
        <div class="info-grid">
          <div class="info-card">
            <h4>Charges</h4>
            <p>${company.has_charges ? 'Has charges registered' : 'No charges'}</p>
          </div>
          <div class="info-card">
            <h4>Insolvency History</h4>
            <p>${company.has_insolvency_history ? 'Has insolvency history' : 'No insolvency history'}</p>
          </div>
          <div class="info-card">
            <h4>Filing Status</h4>
            <p>${company.accounts?.overdue ? 'Accounts overdue' : 'Filings up to date'}</p>
          </div>
        </div>
      </div>
    </div>
    `;
  }

  private generateOfficersSection(officers: Officer[]): string {
    const activeOfficers = officers.filter(o => !o.resigned_on);
    const resignedOfficers = officers.filter(o => o.resigned_on);

    return `
    <div class="section" id="officers">
      <h2>3. Officers & Management</h2>
      
      <div class="officers-summary">
        <p><strong>Total Officers:</strong> ${officers.length} | 
        <strong>Active:</strong> ${activeOfficers.length} | 
        <strong>Resigned:</strong> ${resignedOfficers.length}</p>
      </div>
      
      <h3>Active Officers</h3>
      <table class="officers-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Appointed</th>
            <th>Nationality</th>
          </tr>
        </thead>
        <tbody>
          ${activeOfficers.map(officer => `
            <tr>
              <td><strong>${officer.name}</strong></td>
              <td>${officer.officer_role}</td>
              <td>${new Date(officer.appointed_on).toLocaleDateString('en-GB')}</td>
              <td>${officer.nationality || 'Not specified'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      ${resignedOfficers.length > 0 ? `
      <h3>Former Officers</h3>
      <table class="officers-table resigned">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Appointed</th>
            <th>Resigned</th>
          </tr>
        </thead>
        <tbody>
          ${resignedOfficers.slice(0, 10).map(officer => `
            <tr>
              <td>${officer.name}</td>
              <td>${officer.officer_role}</td>
              <td>${new Date(officer.appointed_on).toLocaleDateString('en-GB')}</td>
              <td>${officer.resigned_on ? new Date(officer.resigned_on).toLocaleDateString('en-GB') : 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${resignedOfficers.length > 10 ? `<p><em>Showing 10 of ${resignedOfficers.length} resigned officers</em></p>` : ''}
      ` : ''}
    </div>
    `;
  }

  private generateInsightsSection(insights: CompanyInsight): string {
    return `
    <div class="section" id="ai-insights">
      <h2>4. AI Business Insights</h2>
      
      <div class="insights-header">
        <div class="insight-metric">
          <h4>Risk Score</h4>
          <div class="risk-score-large risk-${this.getRiskCategory(insights.riskScore)}">${insights.riskScore}</div>
          <p class="risk-label">${this.getRiskLabel(insights.riskScore)}</p>
        </div>
        
        <div class="insight-metric">
          <h4>Confidence</h4>
          <div class="confidence-score">${insights.confidence}%</div>
          <p>Analysis confidence</p>
        </div>
        
        <div class="insight-metric">
          <h4>Data Quality</h4>
          <div class="data-quality">${insights.dataQuality}</div>
          <p>Source data assessment</p>
        </div>
      </div>
      
      <div class="insights-content">
        <h3>Key Findings</h3>
        <ul class="findings-list">
          ${insights.keyFindings.map(finding => `<li>${finding}</li>`).join('')}
        </ul>
        
        <h3>Risk Analysis</h3>
        <div class="risk-factors">
          ${insights.riskFactors.map(risk => `
            <div class="risk-factor severity-${risk.severity}">
              <h4>${risk.risk}</h4>
              <p><strong>Category:</strong> ${risk.category} | <strong>Severity:</strong> ${risk.severity}</p>
              <p>${risk.explanation}</p>
            </div>
          `).join('')}
        </div>
        
        <h3>Business Opportunities</h3>
        <ul class="opportunities-list">
          ${insights.opportunities.map(opp => `<li>${opp}</li>`).join('')}
        </ul>
        
        <h3>Strategic Recommendations</h3>
        <ol class="recommendations-list">
          ${insights.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ol>
      </div>
    </div>
    `;
  }

  private generateNetworkSection(graphData: GraphData): string {
    const companyNodes = graphData.nodes.filter(n => n.type === 'company').length;
    const officerNodes = graphData.nodes.filter(n => n.type === 'officer').length;
    const pscNodes = graphData.nodes.filter(n => n.type === 'psc').length;
    const addressNodes = graphData.nodes.filter(n => n.type === 'address').length;

    return `
    <div class="section" id="network-analysis">
      <h2>5. Network Analysis</h2>
      
      <div class="network-summary">
        <h3>Network Overview</h3>
        <div class="network-stats">
          <div class="stat-card">
            <h4>Total Entities</h4>
            <div class="stat-number">${graphData.nodes.length}</div>
          </div>
          <div class="stat-card">
            <h4>Connections</h4>
            <div class="stat-number">${graphData.edges.length}</div>
          </div>
          <div class="stat-card">
            <h4>Companies</h4>
            <div class="stat-number">${companyNodes}</div>
          </div>
          <div class="stat-card">
            <h4>Officers</h4>
            <div class="stat-number">${officerNodes}</div>
          </div>
        </div>
      </div>
      
      <div class="network-breakdown">
        <h3>Entity Breakdown</h3>
        <table class="network-table">
          <tr><td>Companies:</td><td>${companyNodes}</td></tr>
          <tr><td>Officers:</td><td>${officerNodes}</td></tr>
          <tr><td>PSCs:</td><td>${pscNodes}</td></tr>
          <tr><td>Addresses:</td><td>${addressNodes}</td></tr>
        </table>
      </div>
      
      <div class="network-insights">
        <h3>Network Insights</h3>
        <p>This network analysis reveals the interconnected relationships between companies, officers, and controlling parties. 
        The visualization helps identify potential conflicts of interest, ownership structures, and key decision-makers 
        across the corporate network.</p>
        
        <p><strong>Note:</strong> Network graphs provide a visual representation but should be analyzed in conjunction 
        with detailed due diligence processes for comprehensive risk assessment.</p>
      </div>
    </div>
    `;
  }

  private generateAppendix(metadata: ReportData['metadata']): string {
    return `
    <div class="section" id="appendix">
      <h2>6. Appendix</h2>
      
      <h3>Report Metadata</h3>
      <table class="metadata-table">
        <tr><td><strong>Report ID:</strong></td><td>${metadata.requestId}</td></tr>
        <tr><td><strong>Generated By:</strong></td><td>${metadata.generatedBy}</td></tr>
        <tr><td><strong>Generated At:</strong></td><td>${new Date(metadata.generatedAt).toLocaleString('en-GB')}</td></tr>
        <tr><td><strong>Report Type:</strong></td><td>${metadata.reportType}</td></tr>
        <tr><td><strong>Version:</strong></td><td>${metadata.version}</td></tr>
      </table>
      
      <h3>Data Sources</h3>
      <ul>
        <li><strong>Companies House API:</strong> Official UK company information and filings</li>
        <li><strong>DeepSeek AI:</strong> Business intelligence analysis and risk assessment</li>
        <li><strong>Nexus AI Platform:</strong> Data aggregation and network analysis</li>
      </ul>
      
      <h3>Disclaimers</h3>
      <div class="disclaimers">
        <p><strong>Data Accuracy:</strong> This report is based on publicly available information from Companies House 
        and AI analysis. While every effort is made to ensure accuracy, users should verify critical information 
        independently.</p>
        
        <p><strong>AI Analysis:</strong> AI-generated insights are provided for informational purposes and should not 
        replace professional judgment or due diligence processes.</p>
        
        <p><strong>Confidentiality:</strong> This report may contain confidential information. Distribution should be 
        limited to authorized personnel only.</p>
        
        <p><strong>Report Validity:</strong> Information in this report is current as of the generation date. 
        Company information may change over time.</p>
      </div>
      
      <div class="signature-section">
        <p><strong>Generated by Nexus AI Business Intelligence Platform</strong></p>
        <p>Report ID: ${metadata.requestId}</p>
        <p>© ${new Date().getFullYear()} Nexus AI. All rights reserved.</p>
      </div>
    </div>
    `;
  }

  private getCSS(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Arial', sans-serif;
        line-height: 1.6;
        color: #333;
        font-size: 12px;
      }
      
      .page {
        page-break-after: always;
        min-height: 100vh;
        padding: 20px;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      /* Cover Page */
      .cover-page {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        text-align: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      
      .cover-header h1 {
        font-size: 48px;
        margin-bottom: 10px;
        font-weight: bold;
      }
      
      .cover-header p {
        font-size: 18px;
        opacity: 0.9;
      }
      
      .cover-content {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      
      .report-title {
        font-size: 32px;
        margin-bottom: 20px;
        text-transform: uppercase;
      }
      
      .company-name {
        font-size: 28px;
        margin-bottom: 10px;
      }
      
      .company-number {
        font-size: 16px;
        opacity: 0.8;
        margin-bottom: 40px;
      }
      
      .report-details p {
        margin: 5px 0;
        font-size: 14px;
      }
      
      .cover-footer {
        margin-top: 40px;
      }
      
      .confidential {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      
      .disclaimer {
        font-size: 10px;
        opacity: 0.8;
        max-width: 600px;
        margin: 0 auto;
      }
      
      /* Table of Contents */
      .table-of-contents h2 {
        border-bottom: 2px solid #667eea;
        padding-bottom: 10px;
        margin-bottom: 30px;
      }
      
      .toc-list {
        list-style: none;
      }
      
      .toc-list li {
        margin: 15px 0;
        padding: 10px;
        border-left: 3px solid #667eea;
        background: #f8f9fa;
      }
      
      .toc-list a {
        text-decoration: none;
        color: #333;
        font-weight: 500;
      }
      
      /* Sections */
      .section {
        margin-bottom: 40px;
      }
      
      .section h2 {
        color: #667eea;
        border-bottom: 2px solid #667eea;
        padding-bottom: 10px;
        margin-bottom: 25px;
        font-size: 24px;
      }
      
      .section h3 {
        color: #555;
        margin-bottom: 15px;
        font-size: 18px;
      }
      
      .section h4 {
        color: #666;
        margin-bottom: 10px;
        font-size: 14px;
      }
      
      /* Summary Grid */
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }
      
      .summary-card {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        border-left: 4px solid #667eea;
        text-align: center;
      }
      
      .summary-card h4 {
        font-size: 12px;
        text-transform: uppercase;
        color: #666;
        margin-bottom: 10px;
      }
      
      .summary-card p {
        font-size: 16px;
        font-weight: bold;
      }
      
      .risk-card {
        border-left-color: #dc3545;
      }
      
      .risk-score {
        font-size: 24px;
        font-weight: bold;
      }
      
      .risk-low { color: #28a745; }
      .risk-medium { color: #ffc107; }
      .risk-high { color: #dc3545; }
      
      .status-active { color: #28a745; font-weight: bold; }
      .status-dissolved { color: #dc3545; font-weight: bold; }
      .status-liquidation { color: #fd7e14; font-weight: bold; }
      
      /* Tables */
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      
      table th,
      table td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }
      
      table th {
        background-color: #f8f9fa;
        font-weight: bold;
      }
      
      .info-table td:first-child {
        width: 200px;
        font-weight: 500;
      }
      
      /* Profile Grid */
      .profile-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-bottom: 30px;
      }
      
      .profile-section {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
      }
      
      .info-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        margin-top: 20px;
      }
      
      .info-card {
        background: white;
        padding: 15px;
        border-radius: 6px;
        border: 1px solid #e9ecef;
      }
      
      .info-card h4 {
        margin-bottom: 8px;
        color: #667eea;
      }
      
      /* AI Insights */
      .insights-header {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin-bottom: 30px;
      }
      
      .insight-metric {
        text-align: center;
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
      }
      
      .risk-score-large {
        font-size: 36px;
        font-weight: bold;
        margin: 10px 0;
      }
      
      .confidence-score,
      .data-quality {
        font-size: 24px;
        font-weight: bold;
        color: #667eea;
        margin: 10px 0;
      }
      
      .findings-list,
      .opportunities-list,
      .recommendations-list {
        margin-bottom: 25px;
      }
      
      .findings-list li,
      .opportunities-list li,
      .recommendations-list li {
        margin-bottom: 8px;
        padding-left: 10px;
      }
      
      .risk-factor {
        background: #f8f9fa;
        padding: 15px;
        margin-bottom: 15px;
        border-radius: 6px;
        border-left: 4px solid #6c757d;
      }
      
      .risk-factor.severity-low { border-left-color: #28a745; }
      .risk-factor.severity-medium { border-left-color: #ffc107; }
      .risk-factor.severity-high { border-left-color: #dc3545; }
      
      /* Network Analysis */
      .network-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-bottom: 30px;
      }
      
      .stat-card {
        background: #667eea;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 8px;
      }
      
      .stat-number {
        font-size: 28px;
        font-weight: bold;
        margin-top: 10px;
      }
      
      /* Disclaimers */
      .disclaimers p {
        margin-bottom: 15px;
        text-align: justify;
      }
      
      .signature-section {
        margin-top: 40px;
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid #ddd;
      }
      
      /* Watermark */
      .watermark {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 72px;
        color: rgba(102, 126, 234, 0.1);
        z-index: -1;
        font-weight: bold;
      }
      
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .page-break { page-break-before: always; }
      }
    `;
  }

  private getDefaultOptions(): PDFOptions {
    return {
      format: 'A4',
      orientation: 'portrait',
      includeCharts: true,
      includeCoverPage: true,
      includeTableOfContents: true,
      footerText: 'Nexus AI Business Intelligence Report'
    };
  }

  private getRiskCategory(score: number): string {
    if (score <= 30) return 'low';
    if (score <= 60) return 'medium';
    return 'high';
  }

  private getRiskLabel(score: number): string {
    if (score <= 30) return 'Low Risk';
    if (score <= 60) return 'Medium Risk';
    return 'High Risk';
  }
}

export const pdfGenerator = new PDFReportGenerator();
export type { ReportData, PDFOptions };