// Test DeepSeek AI API integration
const DEEPSEEK_API_KEY = 'sk-49965f2109f044c18be9c17a383963f7';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

async function testDeepSeekAPI() {
  console.log('🤖 Testing DeepSeek AI API...\n');

  try {
    const systemPrompt = `You are a UK business intelligence expert specializing in corporate analysis. 
Your task is to provide comprehensive, factual analysis of UK companies based on Companies House data.

Key capabilities:
- Risk assessment and scoring (0-100 scale)
- Business model analysis
- Financial health indicators
- Regulatory compliance insights
- Market position evaluation
- Growth potential assessment

Always provide structured, actionable insights suitable for business professionals.`;

    const testCompanyData = {
      company_name: "TESCO PLC",
      company_number: "00445790",
      company_status: "active",
      type: "plc",
      date_of_creation: "1947-11-27",
      sic_codes: ["47110"],
      registered_office_address: {
        address_line_1: "Tesco House",
        address_line_2: "Shire Park",
        locality: "Welwyn Garden City",
        postal_code: "AL7 1GA"
      }
    };

    const userPrompt = `Analyze this UK company and provide a comprehensive business intelligence summary:

Company: ${testCompanyData.company_name}
Company Number: ${testCompanyData.company_number}
Status: ${testCompanyData.company_status}
Type: ${testCompanyData.type}
Incorporated: ${testCompanyData.date_of_creation}
SIC Codes: ${testCompanyData.sic_codes.join(', ')}

Please provide:
1. Business Overview (2-3 sentences)
2. Risk Score (0-100) with rationale
3. Key Strengths (3 points)
4. Potential Risks (3 points)
5. Market Position Summary
6. Recommended Actions

Format as structured JSON.`;

    console.log('📝 Testing company analysis request...');
    
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
        stream: false
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ DeepSeek API Response:');
      console.log(`Model: ${data.model}`);
      console.log(`Usage: ${data.usage.prompt_tokens} prompt + ${data.usage.completion_tokens} completion = ${data.usage.total_tokens} total tokens`);
      console.log('\n🔍 AI Analysis:');
      console.log(data.choices[0].message.content);
      
    } else {
      const errorData = await response.json();
      console.log(`❌ API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ DeepSeek test failed:', error.message);
  }
}

testDeepSeekAPI();