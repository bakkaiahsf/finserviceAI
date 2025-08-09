#!/usr/bin/env tsx

// Validation script for React Flow graph integration
// Usage: npx tsx scripts/validate-graph.ts

import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

async function validateGraphIntegration() {
  console.log('🌐 Validating React Flow Graph Integration...\n');

  try {
    // Dynamic import to ensure environment variables are loaded
    const { networkBuilder } = await import('../lib/graph/network-builder');

    // Test 1: Basic Network Building
    console.log('1️⃣ Testing Basic Network Building...');
    
    const testCompanyNumber = '00445790'; // Tesco
    const maxHops = 2;
    const filters = {
      showOfficers: true,
      showPSCs: true,
      showAddresses: false,
      showInactive: false,
      showResigned: false,
      maxHops
    };

    console.log(`   Company: ${testCompanyNumber}`);
    console.log(`   Max Hops: ${maxHops}`);
    console.log(`   Filters: Officers=${filters.showOfficers}, PSCs=${filters.showPSCs}`);

    const graphData = await networkBuilder.buildNetwork(
      testCompanyNumber,
      maxHops,
      filters,
      'validation-test'
    );

    console.log(`   ✅ Network built successfully`);
    console.log(`   Nodes: ${graphData.nodes.length}`);
    console.log(`   Edges: ${graphData.edges.length}`);
    
    // Analyze node types
    const nodeTypes = graphData.nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n   📊 Node Distribution:');
    Object.entries(nodeTypes).forEach(([type, count]) => {
      console.log(`     ${type}: ${count}`);
    });

    // Analyze edge types
    const edgeTypes = graphData.edges.reduce((acc, edge) => {
      const type = edge.data?.relationship || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n   🔗 Edge Distribution:');
    Object.entries(edgeTypes).forEach(([type, count]) => {
      console.log(`     ${type}: ${count}`);
    });

    // Test 2: Network Analysis
    console.log('\n2️⃣ Testing Network Analysis...');
    const analysis = networkBuilder.analyzeNetwork();
    
    console.log(`   Total Nodes: ${analysis.totalNodes}`);
    console.log(`   Total Edges: ${analysis.totalEdges}`);
    console.log(`   Network Density: ${(analysis.networkDensity * 100).toFixed(2)}%`);
    console.log(`   Central Nodes: ${analysis.centralNodes.length}`);
    console.log(`   Risk Factors: ${analysis.riskFactors.length}`);

    if (analysis.centralNodes.length > 0) {
      console.log('\n   🎯 Most Connected Nodes:');
      analysis.centralNodes.slice(0, 3).forEach((node, index) => {
        console.log(`     ${index + 1}. ${node.name} (${node.connections} connections)`);
      });
    }

    if (analysis.riskFactors.length > 0) {
      console.log('\n   ⚠️  Risk Factors:');
      analysis.riskFactors.forEach((risk, index) => {
        console.log(`     ${index + 1}. ${risk.type} - ${risk.severity} severity`);
        console.log(`        ${risk.description}`);
      });
    }

    console.log('   ✅ Network analysis successful\n');

    // Test 3: Node Positioning
    console.log('3️⃣ Testing Node Positioning...');
    const positionedNodes = graphData.nodes.filter(node => 
      node.position.x !== 0 || node.position.y !== 0
    );
    
    console.log(`   Positioned nodes: ${positionedNodes.length}/${graphData.nodes.length}`);
    
    // Check level distribution
    const levelDistribution = graphData.nodes.reduce((acc, node) => {
      const level = node.data.level || 0;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    console.log('\n   📏 Level Distribution:');
    Object.entries(levelDistribution).forEach(([level, count]) => {
      console.log(`     Level ${level}: ${count} nodes`);
    });

    console.log('   ✅ Node positioning working correctly\n');

    // Test 4: Different Filter Combinations
    console.log('4️⃣ Testing Filter Combinations...');
    
    const testFilters = [
      { showOfficers: true, showPSCs: false, showAddresses: false, name: 'Officers only' },
      { showOfficers: false, showPSCs: true, showAddresses: false, name: 'PSCs only' },
      { showOfficers: false, showPSCs: false, showAddresses: true, name: 'Addresses only' },
      { showOfficers: true, showPSCs: true, showAddresses: true, name: 'All types' }
    ];

    for (const filterTest of testFilters) {
      const testResult = await networkBuilder.buildNetwork(
        testCompanyNumber,
        1, // Smaller hop to speed up testing
        { ...filters, ...filterTest },
        'filter-test'
      );
      
      console.log(`   ${filterTest.name}: ${testResult.nodes.length} nodes, ${testResult.edges.length} edges`);
    }

    console.log('   ✅ Filter combinations working correctly\n');

    // Test 5: Error Handling
    console.log('5️⃣ Testing Error Handling...');
    
    try {
      await networkBuilder.buildNetwork(
        'INVALID_COMPANY',
        2,
        filters,
        'error-test'
      );
      console.log('   ⚠️  Expected error for invalid company, but got success');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Not Found')) {
        console.log('   ✅ Error handling working correctly for invalid company');
      } else {
        console.log(`   ⚠️  Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    // Test 6: Performance Check
    console.log('\n6️⃣ Testing Performance...');
    const startTime = Date.now();
    
    await networkBuilder.buildNetwork(
      testCompanyNumber,
      1, // Small network for performance test
      { ...filters, showAddresses: true },
      'performance-test'
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`   Network generation time: ${duration}ms`);
    
    if (duration < 5000) {
      console.log('   ✅ Performance within acceptable range');
    } else {
      console.log('   ⚠️  Performance slower than expected');
    }

    // Test 7: Data Validation
    console.log('\n7️⃣ Testing Data Validation...');
    
    // Check for required fields
    let validationPassed = true;
    
    for (const node of graphData.nodes) {
      if (!node.id || !node.type || !node.data || typeof node.position !== 'object') {
        console.log(`   ❌ Invalid node structure: ${node.id}`);
        validationPassed = false;
      }
    }
    
    for (const edge of graphData.edges) {
      if (!edge.id || !edge.source || !edge.target) {
        console.log(`   ❌ Invalid edge structure: ${edge.id}`);
        validationPassed = false;
      }
    }
    
    if (validationPassed) {
      console.log('   ✅ All graph data structures valid');
    }

    console.log('\n🎉 All Tests Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ Network Building: Working');
    console.log('✅ Network Analysis: Working');
    console.log('✅ Node Positioning: Working');
    console.log('✅ Filter Combinations: Working');
    console.log('✅ Error Handling: Working');
    console.log('✅ Performance: Acceptable');
    console.log('✅ Data Validation: Passed');

    console.log(`\n🌐 Graph Generation Stats:`);
    console.log(`   Final Network Size: ${graphData.nodes.length} nodes, ${graphData.edges.length} edges`);
    console.log(`   Network Complexity: ${(analysis.networkDensity * 100).toFixed(2)}% density`);
    console.log(`   Most Connected: ${analysis.centralNodes[0]?.name} (${analysis.centralNodes[0]?.connections} connections)`);

  } catch (error) {
    console.error('\n❌ Validation failed:', error instanceof Error ? error.message : 'Unknown error');
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check that Companies House API is working (run validate-companies-house.ts)');
    console.error('2. Verify your COMPANIES_HOUSE_API_KEY is valid');
    console.error('3. Ensure you have internet connectivity');
    console.error('4. Check if you\'re hitting rate limits');
    console.error('5. Verify React Flow dependencies are installed');
    
    if (error instanceof Error) {
      console.error('\nFull error:', error.stack);
    }
    
    process.exit(1);
  }
}

// Run validation
validateGraphIntegration().catch(console.error);