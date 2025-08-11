// Quick test script to validate Companies House API key
const apiKey = '34a93948-f011-4c7b-a421-9ff9196c2776';
const baseUrl = 'https://api.company-information.service.gov.uk';

async function testCompaniesHouseAPI() {
  console.log('🔍 Testing Companies House API...\n');

  const credentials = Buffer.from(`${apiKey}:`).toString('base64');
  
  const headers = {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Nexus-AI/1.0'
  };

  try {
    // Test 1: Search for Tesco
    console.log('1️⃣ Testing search for "Tesco"...');
    const searchUrl = `${baseUrl}/search/companies?q=Tesco&items_per_page=5`;
    
    const searchResponse = await fetch(searchUrl, { headers });
    console.log(`   Status: ${searchResponse.status} ${searchResponse.statusText}`);
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log(`   ✅ Found ${searchData.total_results} companies`);
      if (searchData.items && searchData.items.length > 0) {
        const tesco = searchData.items[0];
        console.log(`   📋 First result: ${tesco.title} (${tesco.company_number})`);
        
        // Test 2: Get company profile
        console.log('\n2️⃣ Testing company profile fetch...');
        const profileUrl = `${baseUrl}/company/${tesco.company_number}`;
        
        const profileResponse = await fetch(profileUrl, { headers });
        console.log(`   Status: ${profileResponse.status} ${profileResponse.statusText}`);
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log(`   ✅ Company: ${profileData.company_name}`);
          console.log(`   📍 Status: ${profileData.company_status}`);
          console.log(`   🏢 Type: ${profileData.type}`);
          console.log(`   📅 Incorporated: ${profileData.date_of_creation}`);
          
          // Test 3: Get officers
          console.log('\n3️⃣ Testing officers fetch...');
          const officersUrl = `${baseUrl}/company/${tesco.company_number}/officers?items_per_page=5`;
          
          const officersResponse = await fetch(officersUrl, { headers });
          console.log(`   Status: ${officersResponse.status} ${officersResponse.statusText}`);
          
          if (officersResponse.ok) {
            const officersData = await officersResponse.json();
            console.log(`   ✅ Found ${officersData.total_results} officers`);
            if (officersData.items && officersData.items.length > 0) {
              console.log(`   👤 First officer: ${officersData.items[0].name}`);
            }
          } else {
            console.log(`   ❌ Officers request failed`);
          }
        } else {
          const errorData = await profileResponse.json();
          console.log(`   ❌ Profile request failed: ${errorData.error || errorData.message}`);
        }
      }
    } else {
      const errorData = await searchResponse.json();
      console.log(`   ❌ Search failed: ${errorData.error || errorData.message}`);
    }

    console.log('\n✅ Companies House API test completed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testCompaniesHouseAPI();