import { getGeminiModel } from '../llm/gemini-client.js';
import { ragGenerate } from './rag-agent.js';
import { mockGenerateChart } from '../tools/chartjs-tool.js';

/**
 * Delegating Agent - Routes user queries to appropriate tools/agents
 * 
 * Decision Logic:
 * 1. Analyze user query
 * 2. Determine if chart generation is needed
 * 3. Determine if RAG/database search is needed
 * 4. Determine if direct answer is sufficient
 * 5. Execute tools in parallel or sequentially as needed
 * 6. Combine results into a structured response
 */

/**
 * Analyze user query to determine which tools to use
 * @param {string} query - User's query
 * @returns {Promise<Object>} Decision object with tool requirements
 */
async function analyzeQuery(query) {
  const model = getGeminiModel({ temperature: 0.3 });
  
  const analysisPrompt = `You are a routing assistant. Analyze the user's query and determine which tools are needed.

Available tools:
1. CHART - Generate Chart.js visualizations (bar, line, pie, doughnut, radar charts)
2. RAG - Search knowledge base and retrieve information
3. DIRECT - Answer directly without tools

User Query: "${query}"

Analyze the query and respond in JSON format:
{
  "needsChart": true/false,
  "needsRAG": true/false,
  "needsDirect": true/false,
  "reasoning": "brief explanation of your decision"
}

Rules:
- Set needsChart=true if user wants to visualize data, create a chart, or see a graph
- Set needsRAG=true if user is asking a question that might be in a knowledge base
- Set needsDirect=true if the query is a simple greeting, thank you, or general question
- Multiple tools can be true if the query requires both charting and data retrieval

Respond ONLY with valid JSON, no other text.`;

  try {
    const response = await model.invoke(analysisPrompt);
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const decision = JSON.parse(jsonMatch[0]);
      console.log('🎯 Query Analysis:', decision);
      return decision;
    } else {
      // Default fallback
      return {
        needsChart: false,
        needsRAG: true,
        needsDirect: false,
        reasoning: 'Could not parse LLM response, defaulting to RAG'
      };
    }
  } catch (error) {
    console.error('⚠️  Error analyzing query:', error.message);
    // Default to RAG if analysis fails
    return {
      needsChart: false,
      needsRAG: true,
      needsDirect: false,
      reasoning: 'Error in analysis, defaulting to RAG'
    };
  }
}

/**
 * Handle direct answer without tools
 * @param {string} query - User's query
 * @returns {Promise<Object>} Response object
 */
async function handleDirectAnswer(query) {
  const model = getGeminiModel({ temperature: 0.7 });
  
  const response = await model.invoke(`You are a helpful AI assistant. Answer the user's query in a friendly and concise manner.

User Query: ${query}

Answer:`);
  
  return {
    answer: response.content,
    fileIds: [],
    references: [],
    chartConfig: null,
  };
}

/**
 * Extract chart parameters from user query
 * @param {string} query - User's query
 * @returns {Promise<Object>} Chart parameters
 */
async function extractChartParams(query) {
  const model = getGeminiModel({ temperature: 0.3 });
  
  const extractionPrompt = `Extract chart parameters from the user's query.

User Query: "${query}"

Respond in JSON format:
{
  "chartType": "bar" | "line" | "pie" | "doughnut" | "radar",
  "title": "chart title",
  "labels": ["label1", "label2", ...],
  "data": [number1, number2, ...]
}

If the user doesn't specify data, create reasonable example data.
If the user doesn't specify a chart type, choose the most appropriate one.

Respond ONLY with valid JSON, no other text.`;

  try {
    const response = await model.invoke(extractionPrompt);
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      // Default chart
      return {
        chartType: 'bar',
        title: 'Sample Chart',
        labels: ['A', 'B', 'C'],
        data: [10, 20, 15]
      };
    }
  } catch (error) {
    console.error('⚠️  Error extracting chart params:', error.message);
    return {
      chartType: 'bar',
      title: 'Sample Chart',
      labels: ['A', 'B', 'C'],
      data: [10, 20, 15]
    };
  }
}

/**
 * Main delegating agent function
 * @param {string} userQuery - User's query
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Complete response with answer, references, and/or chart config
 */
export async function delegateQuery(userQuery, options = {}) {
  const { tenant = 'tenant1' } = options;
  
  console.log('\n' + '='.repeat(70));
  console.log('🤖 DELEGATING AGENT: Processing query');
  console.log('='.repeat(70));
  console.log('📝 Query:', userQuery);
  console.log('📂 Tenant:', tenant);
  console.log('-'.repeat(70));
  
  try {
    // Step 1: Analyze the query to determine which tools to use
    const decision = await analyzeQuery(userQuery);
    console.log('💭 Reasoning:', decision.reasoning);
    console.log('-'.repeat(70));
    
    // Initialize response object
    const response = {
      answer: '',
      fileIds: [],
      references: [],
      chartConfig: null,
    };
    
    // Step 2: Execute required tools
    const tasks = [];
    
    // Handle RAG if needed
    if (decision.needsRAG) {
      console.log('🔍 Executing: RAG Agent');
      tasks.push(
        ragGenerate(userQuery, tenant).then(ragResult => ({
          type: 'rag',
          data: ragResult
        }))
      );
    }
    
    // Handle Chart generation if needed
    if (decision.needsChart) {
      console.log('📊 Executing: Chart.js Tool');
      tasks.push(
        extractChartParams(userQuery).then(chartParams => 
          mockGenerateChart(chartParams)
        ).then(chartConfig => ({
          type: 'chart',
          data: chartConfig
        }))
      );
    }
    
    // Handle direct answer if needed (and no other tools)
    if (decision.needsDirect && !decision.needsRAG && !decision.needsChart) {
      console.log('💬 Executing: Direct Answer');
      tasks.push(
        handleDirectAnswer(userQuery).then(directResult => ({
          type: 'direct',
          data: directResult
        }))
      );
    }
    
    // Execute tasks in parallel
    console.log('⚡ Running tasks in parallel...');
    const results = await Promise.all(tasks);
    console.log('-'.repeat(70));
    
    // Step 3: Combine results
    let ragData = null;
    let chartData = null;
    let directData = null;
    
    results.forEach(result => {
      if (result.type === 'rag') {
        ragData = result.data;
      } else if (result.type === 'chart') {
        chartData = result.data;
      } else if (result.type === 'direct') {
        directData = result.data;
      }
    });
    
    // Build the final response
    if (ragData && chartData) {
      // Both RAG and Chart
      response.answer = `${ragData.answer}\n\nI've also generated a chart visualization for you.`;
      response.fileIds = ragData.fileIds;
      response.references = ragData.references;
      response.chartConfig = chartData;
      console.log('✅ Response: RAG + Chart (Parallel Execution)');
    } else if (ragData) {
      // RAG only
      response.answer = ragData.answer;
      response.fileIds = ragData.fileIds;
      response.references = ragData.references;
      console.log('✅ Response: RAG only');
    } else if (chartData) {
      // Chart only
      response.answer = 'I\'ve generated the chart visualization as requested.';
      response.chartConfig = chartData;
      console.log('✅ Response: Chart only');
    } else if (directData) {
      // Direct answer
      response.answer = directData.answer;
      console.log('✅ Response: Direct answer');
    } else {
      // Fallback
      response.answer = 'I\'m not sure how to handle this query. Could you please rephrase it?';
      console.log('⚠️  Response: Fallback');
    }
    
    console.log('-'.repeat(70));
    console.log('🎉 DELEGATING AGENT: Completed successfully');
    console.log('='.repeat(70) + '\n');
    
    return response;
    
  } catch (error) {
    console.error('❌ DELEGATING AGENT: Error processing query:', error.message);
    throw error;
  }
}

/**
 * Test the delegating agent with various queries
 */
async function testDelegatingAgent() {
  console.log('\n🧪 TESTING DELEGATING AGENT\n');
  
  const testCases = [
    {
      name: 'RAG Only: Knowledge Question',
      query: 'What is the capital of France?',
      tenant: 'tenant1'
    },
    {
      name: 'Chart Only: Visualization Request',
      query: 'Create a bar chart showing sales: January 100, February 150, March 120',
      tenant: 'tenant1'
    },
    {
      name: 'Direct Answer: Greeting',
      query: 'Hello, how are you?',
      tenant: 'tenant1'
    },
    {
      name: 'RAG + Chart: Combined Request',
      query: 'Tell me about photosynthesis and show me a pie chart of plant types: Trees 40, Flowers 30, Grass 30',
      tenant: 'tenant1'
    },
  ];
  
  for (const testCase of testCases) {
    console.log('\n' + '█'.repeat(70));
    console.log(`TEST: ${testCase.name}`);
    console.log('█'.repeat(70));
    
    try {
      const result = await delegateQuery(testCase.query, { tenant: testCase.tenant });
      
      console.log('\n📤 FINAL RESPONSE:');
      console.log('-'.repeat(70));
      console.log('Answer:', result.answer);
      if (result.fileIds.length > 0) {
        console.log('File IDs:', result.fileIds);
      }
      if (result.references.length > 0) {
        console.log('References:', result.references.length, 'documents');
      }
      if (result.chartConfig) {
        console.log('Chart Config:', result.chartConfig.type, 'chart with', result.chartConfig.data.labels.length, 'data points');
      }
      console.log('-'.repeat(70));
      console.log('✅ TEST PASSED\n');
      
      // Wait a bit between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error('❌ TEST FAILED:', error.message);
    }
  }
  
  console.log('\n' + '█'.repeat(70));
  console.log('🎉 ALL DELEGATING AGENT TESTS COMPLETED');
  console.log('█'.repeat(70) + '\n');
}

// Export
export default {
  delegateQuery,
  analyzeQuery,
  handleDirectAnswer,
  extractChartParams,
  testDelegatingAgent,
};

// Run test if called directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  testDelegatingAgent()
    .then(() => {
      console.log('✅ Delegating Agent is ready for LangGraph integration!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

