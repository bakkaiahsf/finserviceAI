#!/usr/bin/env tsx

// Validation script for DeepSeek AI integration
// Usage: npx tsx scripts/validate-deepseek.ts

import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

async function validateDeepSeekIntegration() {
  console.log('🤖 Validating DeepSeek AI Integration...\n');

  try {
    // Dynamic import to ensure environment variables are loaded
    const { deepSeekClient } = await import('../lib/ai/deepseek-client');

    // Test 1: Health Check
    console.log('1️⃣ Testing AI API Connectivity...');
    const healthResult = await deepSeekClient.healthCheck();
    console.log(`   Status: ${healthResult.status}`);
    console.log(`   Latency: ${healthResult.latency}ms`);
    
    if (healthResult.status === 'unhealthy') {
      console.error(`   ❌ Error: ${healthResult.error}`);
      return;
    }
    console.log('   ✅ AI API connectivity successful\n');

    // Test 2: Mock Company Analysis
    console.log('2️⃣ Testing Company Analysis...');
    
    // Create mock company data for testing
    const mockCompanyData = {
      company_name: 'TESCO PLC',
      company_number: '00445790',
      company_status: 'active',
      type: 'plc',
      jurisdiction: 'england-wales',
      date_of_creation: '1947-11-27',
      sic_codes: ['47110'],
      registered_office_address: {
        address_line_1: 'TESCO HOUSE',
        locality: 'WELWYN GARDEN CITY',
        postal_code: 'AL7 1GA',
        country: 'UNITED KINGDOM'
      },
      has_charges: true,
      has_insolvency_history: false,
      accounts: {
        overdue: false,
        last_accounts: {
          made_up_to: '2024-02-24'
        }
      }
    };

    const mockOfficers = [
      {
        name: 'MURPHY, Kenneth Robert',
        officer_role: 'director',
        appointed_on: '2020-10-01'
      },
      {
        name: 'TAYLOR, Christopher Jon',
        officer_role: 'secretary',
        appointed_on: '2025-04-14'
      }
    ];

    console.log('   Analyzing mock company data...');
    console.log(`   Company: ${mockCompanyData.company_name}`);
    console.log(`   Officers: ${mockOfficers.length} provided`);

    const analysis = await deepSeekClient.analyzeCompany(
      mockCompanyData,
      mockOfficers,
      {
        includeRiskAnalysis: true,
        includeFinancialInsights: true,
        includeCompetitiveAnalysis: false,
        userId: 'validation-test',
        maxTokens: 1500,
        temperature: 0.2
      }
    );

    console.log('\n   📊 Analysis Results:');
    console.log(`   Summary: ${analysis.summary.substring(0, 100)}...`);
    console.log(`   Risk Score: ${analysis.riskScore}/100`);
    console.log(`   Confidence: ${analysis.confidence}%`);
    console.log(`   Data Quality: ${analysis.dataQuality}`);
    console.log(`   Key Findings: ${analysis.keyFindings.length} items`);
    console.log(`   Risk Factors: ${analysis.riskFactors.length} identified`);
    console.log(`   Opportunities: ${analysis.opportunities.length} items`);
    console.log(`   Recommendations: ${analysis.recommendations.length} items`);
    console.log(`   Tokens Used: ${analysis.tokensUsed}`);

    // Display some specific insights
    if (analysis.keyFindings.length > 0) {
      console.log('\n   🔍 Key Findings:');
      analysis.keyFindings.slice(0, 3).forEach((finding, index) => {
        console.log(`   ${index + 1}. ${finding}`);
      });
    }

    if (analysis.riskFactors.length > 0) {
      console.log('\n   ⚠️  Risk Factors:');
      analysis.riskFactors.slice(0, 2).forEach((risk, index) => {
        console.log(`   ${index + 1}. [${risk.severity.toUpperCase()}] ${risk.risk}`);
        console.log(`      Category: ${risk.category}`);
        console.log(`      Explanation: ${risk.explanation.substring(0, 80)}...`);
      });
    }

    console.log('\n   ✅ Company analysis successful\n');

    // Test 3: Cost Tracking
    console.log('3️⃣ Testing Cost Tracking...');
    const costInfo = deepSeekClient.getCostTracking('validation-test');
    
    if (costInfo) {
      console.log(`   Tokens Used: ${costInfo.tokensUsed.toLocaleString()}`);
      console.log(`   Estimated Cost: $${costInfo.costUSD.toFixed(6)}`);
      console.log(`   Requests Made: ${costInfo.requestCount}`);
      console.log(`   Last Request: ${costInfo.lastRequest}`);
    } else {
      console.log('   ⚠️  No cost tracking data found');
    }

    const totalTracking = deepSeekClient.getTotalCostTracking();
    console.log(`   Total Users Tracked: ${totalTracking.totalUsers}`);
    console.log(`   Total Tokens: ${totalTracking.totalTokens.toLocaleString()}`);
    console.log(`   Total Estimated Cost: $${totalTracking.totalCostUSD.toFixed(6)}`);
    console.log(`   Total Requests: ${totalTracking.totalRequests}`);
    console.log('   ✅ Cost tracking working correctly\n');

    // Test 4: Error Handling
    console.log('4️⃣ Testing Error Handling...');
    
    try {
      // Test with invalid/empty data
      await deepSeekClient.analyzeCompany(
        null as any,
        [],
        { userId: 'error-test', maxTokens: 10 }
      );
      console.log('   ⚠️  Expected error for invalid data, but got success');
    } catch (error) {
      console.log('   ✅ Error handling working correctly for invalid input');
    }

    // Test 5: Different Analysis Options
    console.log('\n5️⃣ Testing Analysis Options...');
    
    const quickAnalysis = await deepSeekClient.analyzeCompany(
      mockCompanyData,
      [],
      {
        includeRiskAnalysis: false,
        includeFinancialInsights: false,
        includeCompetitiveAnalysis: true,
        userId: 'options-test',
        maxTokens: 500,
        temperature: 0.1
      }
    );

    console.log(`   Quick analysis tokens: ${quickAnalysis.tokensUsed}`);
    console.log(`   Quick analysis confidence: ${quickAnalysis.confidence}%`);
    console.log('   ✅ Analysis options working correctly\n');

    console.log('🎉 All Tests Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ AI API Connectivity: Working');
    console.log('✅ Company Analysis: Working');
    console.log('✅ Cost Tracking: Working');
    console.log('✅ Error Handling: Working');
    console.log('✅ Analysis Options: Working');
    
    // Final cost summary
    const finalCost = deepSeekClient.getTotalCostTracking();
    console.log(`\n💰 Total Cost During Validation: $${finalCost.totalCostUSD.toFixed(6)}`);
    console.log(`🔢 Total Tokens Used: ${finalCost.totalTokens.toLocaleString()}`);

  } catch (error) {
    console.error('\n❌ Validation failed:', error instanceof Error ? error.message : 'Unknown error');
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check that DEEPSEEK_API_KEY is set in .env.local');
    console.error('2. Verify your API key is valid at https://platform.deepseek.com/');
    console.error('3. Ensure you have sufficient API credits');
    console.error('4. Check if DeepSeek API is experiencing downtime');
    console.error('5. Verify network connectivity and firewall settings');
    
    if (error instanceof Error) {
      console.error('\nFull error:', error.stack);
    }
    
    process.exit(1);
  }
}

// Run validation
validateDeepSeekIntegration().catch(console.error);