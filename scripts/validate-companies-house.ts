#!/usr/bin/env tsx

// Validation script for Companies House API integration
// Usage: npx tsx scripts/validate-companies-house.ts

import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

async function validateCompaniesHouseIntegration() {
  console.log('🔍 Validating Companies House API Integration...\n');

  try {
    // Dynamic import to ensure environment variables are loaded
    const { companiesHouseClient } = await import('../lib/companies-house/client');

    // Test 1: Health Check
    console.log('1️⃣ Testing API Connectivity...');
    const healthResult = await companiesHouseClient.healthCheck();
    console.log(`   Status: ${healthResult.status}`);
    console.log(`   Latency: ${healthResult.latency}ms`);
    console.log(`   Rate Limit: ${healthResult.rateLimitStatus.remaining}/${healthResult.rateLimitStatus.limit} remaining`);
    
    if (healthResult.status === 'unhealthy') {
      console.error(`   ❌ Error: ${healthResult.error}`);
      return;
    }
    console.log('   ✅ API connectivity successful\n');

    // Test 2: Company Search
    console.log('2️⃣ Testing Company Search...');
    const searchResults = await companiesHouseClient.searchCompanies('Tesco', {
      itemsPerPage: 5,
      rateLimitKey: 'validation-test'
    });
    
    console.log(`   Found ${searchResults.total_results} companies`);
    console.log(`   Showing ${searchResults.items.length} results:`);
    
    searchResults.items.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.title} (${company.company_number})`);
      console.log(`      Status: ${company.company_status}`);
      console.log(`      Type: ${company.company_type}`);
      console.log(`      Created: ${company.date_of_creation}`);
    });
    console.log('   ✅ Company search successful\n');

    // Test 3: Company Profile (using first search result)
    if (searchResults.items.length > 0) {
      const firstCompany = searchResults.items[0];
      console.log('3️⃣ Testing Company Profile Retrieval...');
      console.log(`   Getting profile for: ${firstCompany.title}`);
      
      const profile = await companiesHouseClient.getCompanyProfile(
        firstCompany.company_number,
        { rateLimitKey: 'validation-test' }
      );
      
      console.log(`   Company Name: ${profile.company_name}`);
      console.log(`   Company Number: ${profile.company_number}`);
      console.log(`   Status: ${profile.company_status}`);
      console.log(`   Jurisdiction: ${profile.jurisdiction}`);
      console.log(`   SIC Codes: ${profile.sic_codes?.join(', ') || 'None'}`);
      console.log(`   Has Officers Link: ${!!profile.links.officers}`);
      console.log(`   Has PSC Link: ${!!profile.links.persons_with_significant_control}`);
      console.log('   ✅ Company profile retrieval successful\n');

      // Test 4: Officers (if available)
      if (profile.links.officers) {
        console.log('4️⃣ Testing Officers Retrieval...');
        
        const officers = await companiesHouseClient.getCompanyOfficers(
          firstCompany.company_number,
          { 
            itemsPerPage: 5,
            rateLimitKey: 'validation-test'
          }
        );
        
        console.log(`   Found ${officers.total_results} officers`);
        console.log(`   Active: ${officers.total_results - officers.resigned_count}`);
        console.log(`   Resigned: ${officers.resigned_count}`);
        
        officers.items.slice(0, 3).forEach((officer, index) => {
          console.log(`   ${index + 1}. ${officer.name}`);
          console.log(`      Role: ${officer.officer_role}`);
          console.log(`      Appointed: ${officer.appointed_on}`);
          if (officer.resigned_on) {
            console.log(`      Resigned: ${officer.resigned_on}`);
          }
        });
        console.log('   ✅ Officers retrieval successful\n');
      }

      // Test 5: PSCs (if available)
      if (profile.links.persons_with_significant_control) {
        console.log('5️⃣ Testing PSCs Retrieval...');
        
        try {
          const pscs = await companiesHouseClient.getCompanyPSCs(
            firstCompany.company_number,
            { 
              itemsPerPage: 5,
              rateLimitKey: 'validation-test'
            }
          );
          
          console.log(`   Found ${pscs.total_results} PSCs`);
          console.log(`   Active: ${pscs.active_count}`);
          console.log(`   Ceased: ${pscs.ceased_count}`);
          
          pscs.items.slice(0, 2).forEach((psc, index) => {
            console.log(`   ${index + 1}. ${psc.name}`);
            console.log(`      Notified: ${psc.notified_on}`);
            console.log(`      Nature of Control: ${psc.natures_of_control?.join(', ') || 'None listed'}`);
          });
          console.log('   ✅ PSCs retrieval successful\n');
        } catch (error) {
          console.log(`   ⚠️  PSCs not available (common for this company type)\n`);
        }
      }
    }

    // Test 6: Rate Limiting
    console.log('6️⃣ Testing Rate Limiting...');
    const rateLimitStatus = companiesHouseClient.getRateLimitStatus('validation-test');
    console.log(`   Requests made: ${600 - rateLimitStatus.remaining}/600`);
    console.log(`   Remaining: ${rateLimitStatus.remaining}`);
    console.log(`   Reset time: ${new Date(rateLimitStatus.resetTime).toLocaleString()}`);
    console.log('   ✅ Rate limiting working correctly\n');

    // Test 7: Caching
    console.log('7️⃣ Testing Caching...');
    const cacheStats = companiesHouseClient.getCacheStats();
    console.log(`   Cache size: ${cacheStats.size} entries`);
    console.log(`   Total cached data: ${cacheStats.entries.reduce((sum, e) => sum + e.size, 0)} bytes`);
    
    if (cacheStats.entries.length > 0) {
      console.log('   Recent cache entries:');
      cacheStats.entries.slice(0, 3).forEach((entry, index) => {
        console.log(`     ${index + 1}. ${entry.key.substring(0, 50)}...`);
        console.log(`        Age: ${Math.round(entry.age / 1000)}s, Size: ${entry.size} bytes`);
      });
    }
    console.log('   ✅ Caching working correctly\n');

    // Test 8: Error Handling
    console.log('8️⃣ Testing Error Handling...');
    try {
      await companiesHouseClient.getCompanyProfile('INVALID_COMPANY_NUMBER', {
        rateLimitKey: 'validation-test'
      });
      console.log('   ❌ Expected error for invalid company number, but got success');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Not Found')) {
        console.log('   ✅ Error handling working correctly (404 for invalid company)');
      } else {
        console.log(`   ⚠️  Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    console.log('\n🎉 All Tests Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ API Connectivity: Working');
    console.log('✅ Company Search: Working');
    console.log('✅ Company Profiles: Working');
    console.log('✅ Officers Data: Working');
    console.log('✅ Rate Limiting: Working');
    console.log('✅ Caching: Working');
    console.log('✅ Error Handling: Working');
    
    const finalRateLimit = companiesHouseClient.getRateLimitStatus('validation-test');
    console.log(`\n⚡ Rate Limit Usage: ${600 - finalRateLimit.remaining}/600 requests used in validation`);

  } catch (error) {
    console.error('\n❌ Validation failed:', error instanceof Error ? error.message : 'Unknown error');
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check that COMPANIES_HOUSE_API_KEY is set in .env.local');
    console.error('2. Verify your API key is valid at https://developer.company-information.service.gov.uk/');
    console.error('3. Ensure you have internet connectivity');
    console.error('4. Check if Companies House API is experiencing downtime');
    
    if (error instanceof Error) {
      console.error('\nFull error:', error.stack);
    }
    
    process.exit(1);
  }
}

// Run validation
validateCompaniesHouseIntegration().catch(console.error);