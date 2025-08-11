// Test OpenRouter API integration with optimized models
const OPEN_ROUTER_KEY = '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';
const OPEN_ROUTER_URL = 'https://openrouter.ai/api/v1';

async function testOpenRouterAPI() {
  console.log('🚀 Testing OpenRouter API with optimized models...\n');

  const models = {
    fast: 'anthropic/claude-3-haiku',
    balanced: 'anthropic/claude-3-sonnet', 
    premium: 'anthropic/claude-3-opus',
    gpt4: 'openai/gpt-4o-mini',
    alternative: 'meta-llama/llama-3.1-8b-instruct'
  };

  try {
    // Test 1: Connection Test
    console.log('1️⃣ Testing API connection...');
    const testResponse = await fetch(`${OPEN_ROUTER_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPEN_ROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Nexus AI - OpenRouter Connection Test'
      },
      body: JSON.stringify({
        model: models.fast,
        messages: [
          {
            role: 'user',
            content: 'Test connection. Respond with: {"status": "connected", "cost": "minimal"}'
          }
        ],
        max_tokens: 50,
        temperature: 0
      })
    });

    console.log(`   Status: ${testResponse.status} ${testResponse.statusText}`);
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log(`   ✅ Connection successful!`);
      console.log(`   📊 Model: ${testData.model || models.fast}`);
      console.log(`   💰 Usage: ${testData.usage?.total_tokens || 'N/A'} tokens`);
      
      // Check for credits info in headers
      const creditsRemaining = testResponse.headers.get('x-ratelimit-remaining-credits');
      if (creditsRemaining) {
        console.log(`   💳 Credits remaining: ${creditsRemaining}`);
      }
    } else {
      const errorData = await testResponse.text();
      console.log(`   ❌ Connection failed: ${errorData}`);
      return;
    }

    // Test 2: AI Business Intelligence Analysis
    console.log('\n2️⃣ Testing AI business intelligence generation...');
    
    const systemPrompt = `You are a UK business intelligence expert specializing in corporate risk analysis. 

Provide risk assessment (0-100 scale), business summaries, key strengths, potential risks, and strategic recommendations based on UK company data.

Return responses in valid JSON format only.`;

    const testCompany = {
      company_name: "TESCO PLC",
      company_number: "00445790",
      company_status: "active", 
      company_type: "plc",
      date_of_creation: "1947-11-27",
      registered_address: "Tesco House, Shire Park, Welwyn Garden City, AL7 1GA",
      sic_codes: ["47110"]
    };

    const userPrompt = `Analyze this UK company:

Company: ${testCompany.company_name}
Number: ${testCompany.company_number}
Status: ${testCompany.company_status}
Type: ${testCompany.company_type}
Incorporated: ${testCompany.date_of_creation}
Address: ${testCompany.registered_address}
SIC: ${testCompany.sic_codes.join(', ')}

Provide analysis in JSON:
{
  "risk_score": <0-100>,
  "business_summary": "<summary>",
  "key_strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "potential_risks": ["<risk1>", "<risk2>", "<risk3>"],
  "market_position": "<position>",
  "recommendations": ["<rec1>", "<rec2>", "<rec3>"],
  "confidence_score": <80-95>
}`;

    // Test with balanced model (Claude-3-Sonnet)
    const analysisResponse = await fetch(`${OPEN_ROUTER_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPEN_ROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Nexus AI - Business Intelligence Analysis'
      },
      body: JSON.stringify({
        model: models.balanced,
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
        top_p: 0.9
      })
    });

    console.log(`   Status: ${analysisResponse.status} ${analysisResponse.statusText}`);
    
    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json();
      console.log(`   ✅ AI Analysis successful!`);
      console.log(`   📊 Model: ${analysisData.model}`);
      console.log(`   💰 Usage: ${analysisData.usage.prompt_tokens} prompt + ${analysisData.usage.completion_tokens} completion = ${analysisData.usage.total_tokens} total tokens`);
      
      const aiResponse = analysisData.choices[0].message.content;
      console.log('\n🔍 AI Business Intelligence Analysis:');
      console.log('═'.repeat(50));
      
      try {
        const parsedAnalysis = JSON.parse(aiResponse);
        console.log(`📈 Risk Score: ${parsedAnalysis.risk_score}/100`);
        console.log(`📋 Business Summary: ${parsedAnalysis.business_summary}`);
        console.log(`💪 Key Strengths: ${parsedAnalysis.key_strengths?.join(', ')}`);
        console.log(`⚠️  Potential Risks: ${parsedAnalysis.potential_risks?.join(', ')}`);
        console.log(`🎯 Market Position: ${parsedAnalysis.market_position}`);
        console.log(`✨ Confidence Score: ${parsedAnalysis.confidence_score}%`);
        console.log(`💡 Recommendations:`);
        parsedAnalysis.recommendations?.forEach((rec, i) => {
          console.log(`   ${i + 1}. ${rec}`);
        });
      } catch (parseError) {
        console.log('Raw AI Response (JSON parsing failed):');
        console.log(aiResponse);
      }
      
      // Calculate estimated costs
      const totalTokens = analysisData.usage.total_tokens;
      const estimatedCost = totalTokens * 0.000015; // Rough estimate for Claude-3-Sonnet
      console.log(`\n💰 Estimated cost: $${estimatedCost.toFixed(6)} (${totalTokens} tokens)`);
      
    } else {
      const errorData = await analysisResponse.text();
      console.log(`   ❌ AI Analysis failed: ${errorData}`);
    }

    // Test 3: Model Comparison
    console.log('\n3️⃣ Testing different models for cost optimization...');
    
    const simplePrompt = 'Analyze risk for UK company TESCO PLC (active, plc). Return risk score 0-100 only.';
    
    for (const [modelType, modelName] of Object.entries(models)) {
      try {
        console.log(`\n   Testing ${modelType} model (${modelName})...`);
        
        const modelResponse = await fetch(`${OPEN_ROUTER_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPEN_ROUTER_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': `Nexus AI - ${modelType} Model Test`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: 'user',
                content: simplePrompt
              }
            ],
            max_tokens: 100,
            temperature: 0.1
          })
        });

        if (modelResponse.ok) {
          const modelData = await modelResponse.json();
          const tokens = modelData.usage?.total_tokens || 0;
          const response = modelData.choices[0]?.message?.content || 'No response';
          console.log(`   ✅ ${modelType}: ${tokens} tokens - "${response.substring(0, 50)}..."`);
        } else {
          console.log(`   ❌ ${modelType}: Failed (${modelResponse.status})`);
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`   ❌ ${modelType}: Error - ${error.message}`);
      }
    }

    console.log('\n🎉 OpenRouter API testing completed!');
    console.log('\n📊 Model Recommendations:');
    console.log('   • Fast analysis: Claude-3-Haiku (lowest cost)');
    console.log('   • Balanced quality: Claude-3-Sonnet (recommended)');
    console.log('   • Premium insights: Claude-3-Opus (highest quality)');
    console.log('   • Alternative: GPT-4o-mini or Llama (cost-effective)');

  } catch (error) {
    console.error('❌ OpenRouter test failed:', error.message);
  }
}

testOpenRouterAPI();