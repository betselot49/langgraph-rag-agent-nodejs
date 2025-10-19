import { StateGraph, END, START } from '@langchain/langgraph';
import { delegateQuery } from '../agents/delegating-agent.js';

/**
 * State Schema for the Agent Graph
 * 
 * This defines the structure of data that flows through the graph
 */
class AgentState {
  constructor(data = {}) {
    this.query = data.query || '';           // User's input query
    this.tenant = data.tenant || 'tenant1';  // Tenant context
    this.answer = data.answer || '';         // Generated answer
    this.fileIds = data.fileIds || [];       // Source file IDs
    this.references = data.references || []; // Full references
    this.chartConfig = data.chartConfig || null; // Chart.js configuration
    this.error = data.error || null;         // Error information
    this.metadata = data.metadata || {};     // Additional metadata
  }
}

/**
 * Delegating Node - Main orchestration node
 * Routes the query to appropriate tools and generates response
 */
async function delegatingNode(state) {
  console.log('\n🎯 Delegating Node: Processing state');
  console.log('Query:', state.query);
  console.log('Tenant:', state.tenant);
  
  try {
    // Use the delegating agent to process the query
    const result = await delegateQuery(state.query, { tenant: state.tenant });
    
    // Update state with results
    return {
      ...state,
      answer: result.answer,
      fileIds: result.fileIds || [],
      references: result.references || [],
      chartConfig: result.chartConfig || null,
      metadata: {
        ...state.metadata,
        processed: true,
        timestamp: new Date().toISOString(),
      }
    };
    
  } catch (error) {
    console.error('❌ Error in delegating node:', error.message);
    return {
      ...state,
      error: error.message,
      answer: 'I encountered an error processing your request. Please try again.',
    };
  }
}

/**
 * Create the LangGraph state graph
 * 
 * Graph Structure:
 * START → Delegating Node → END
 * 
 * The delegating node handles all routing internally, so we keep
 * the graph structure simple and let the agent handle complexity.
 */
export function createAgentGraph() {
  console.log('🔧 Creating LangGraph Agent Graph...');
  
  // Define the state graph
  const workflow = new StateGraph({
    channels: {
      query: {
        value: (x, y) => y ?? x,
        default: () => '',
      },
      tenant: {
        value: (x, y) => y ?? x,
        default: () => 'tenant1',
      },
      answer: {
        value: (x, y) => y ?? x,
        default: () => '',
      },
      fileIds: {
        value: (x, y) => y ?? x,
        default: () => [],
      },
      references: {
        value: (x, y) => y ?? x,
        default: () => [],
      },
      chartConfig: {
        value: (x, y) => y ?? x,
        default: () => null,
      },
      error: {
        value: (x, y) => y ?? x,
        default: () => null,
      },
      metadata: {
        value: (x, y) => y ?? x,
        default: () => ({}),
      },
    },
  });
  
  // Add nodes
  workflow.addNode('delegating_agent', delegatingNode);
  
  // Define edges
  workflow.addEdge(START, 'delegating_agent');
  workflow.addEdge('delegating_agent', END);
  
  // Compile the graph
  const app = workflow.compile();
  
  console.log('✅ LangGraph Agent Graph created successfully!');
  
  return app;
}

/**
 * Execute a query through the agent graph
 * @param {string} query - User's query
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Final state with results
 */
export async function runAgentGraph(query, options = {}) {
  const { tenant = 'tenant1' } = options;
  
  console.log('\n' + '▓'.repeat(70));
  console.log('🚀 LANGGRAPH EXECUTION START');
  console.log('▓'.repeat(70));
  
  try {
    // Create the graph
    const app = createAgentGraph();
    
    // Initial state
    const initialState = {
      query,
      tenant,
      answer: '',
      fileIds: [],
      references: [],
      chartConfig: null,
      error: null,
      metadata: {
        startTime: new Date().toISOString(),
      },
    };
    
    console.log('\n📥 Initial State:');
    console.log('  Query:', initialState.query);
    console.log('  Tenant:', initialState.tenant);
    
    // Run the graph
    const result = await app.invoke(initialState);
    
    console.log('\n📤 Final State:');
    console.log('  Answer:', result.answer.substring(0, 80) + (result.answer.length > 80 ? '...' : ''));
    console.log('  File IDs:', result.fileIds);
    console.log('  References:', result.references.length, 'items');
    console.log('  Chart Config:', result.chartConfig ? 'Present' : 'None');
    console.log('  Error:', result.error || 'None');
    
    console.log('\n▓'.repeat(70));
    console.log('✅ LANGGRAPH EXECUTION COMPLETE');
    console.log('▓'.repeat(70) + '\n');
    
    return result;
    
  } catch (error) {
    console.error('❌ Error running agent graph:', error);
    throw error;
  }
}

/**
 * Test the LangGraph implementation with various scenarios
 */
async function testAgentGraph() {
  console.log('\n🧪 TESTING LANGGRAPH AGENT GRAPH\n');
  console.log('█'.repeat(70) + '\n');
  
  const testCases = [
    {
      name: 'Test 1: Simple Knowledge Question (RAG)',
      query: 'What is the capital of France?',
      tenant: 'tenant1',
    },
    {
      name: 'Test 2: Chart Generation Request',
      query: 'Create a line chart showing temperature: Monday 20, Tuesday 22, Wednesday 19, Thursday 23',
      tenant: 'tenant1',
    },
    {
      name: 'Test 3: Direct Greeting',
      query: 'Hello! Nice to meet you.',
      tenant: 'tenant1',
    },
    {
      name: 'Test 4: Combined RAG + Chart',
      query: 'Tell me about the speed of light and create a bar chart of distances: Earth to Moon 384400, Earth to Sun 149600000',
      tenant: 'tenant2',
    },
  ];
  
  const results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    console.log('═'.repeat(70));
    console.log(`${testCase.name}`);
    console.log('═'.repeat(70));
    
    try {
      const result = await runAgentGraph(testCase.query, { tenant: testCase.tenant });
      
      console.log('\n✅ TEST PASSED');
      console.log('─'.repeat(70));
      console.log('📊 Results Summary:');
      console.log('  • Answer Length:', result.answer.length, 'characters');
      console.log('  • File IDs:', result.fileIds.length, 'items');
      console.log('  • References:', result.references.length, 'items');
      console.log('  • Chart Config:', result.chartConfig ? '✓ Present' : '✗ None');
      console.log('  • Errors:', result.error ? '✗ Error occurred' : '✓ None');
      console.log('─'.repeat(70) + '\n');
      
      results.push({
        test: testCase.name,
        success: true,
        hasAnswer: result.answer.length > 0,
        hasReferences: result.fileIds.length > 0,
        hasChart: result.chartConfig !== null,
      });
      
      // Wait between tests to avoid rate limiting
      if (i < testCases.length - 1) {
        console.log('⏳ Waiting 2 seconds before next test...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      console.error('❌ TEST FAILED:', error.message);
      results.push({
        test: testCase.name,
        success: false,
        error: error.message,
      });
    }
  }
  
  // Summary
  console.log('\n' + '█'.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('█'.repeat(70));
  
  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  results.forEach((result, idx) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} Test ${idx + 1}: ${result.test}`);
    if (result.success) {
      console.log(`   └─ Answer: ${result.hasAnswer ? '✓' : '✗'} | References: ${result.hasReferences ? '✓' : '✗'} | Chart: ${result.hasChart ? '✓' : '✗'}`);
    } else {
      console.log(`   └─ Error: ${result.error}`);
    }
  });
  
  console.log('\n' + '─'.repeat(70));
  console.log(`Final Score: ${passedTests}/${totalTests} tests passed`);
  console.log('█'.repeat(70) + '\n');
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! LangGraph is working perfectly!\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
  }
}

// Export
export default {
  createAgentGraph,
  runAgentGraph,
  testAgentGraph,
  AgentState,
};

// Run test if called directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  testAgentGraph()
    .then(() => {
      console.log('✅ LangGraph Agent Graph is ready!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

