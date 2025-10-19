import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { getClient } from '../database/weaviate-setup.js';
import { getGeminiModel } from '../llm/gemini-client.js';

/**
 * Retrieve relevant documents from Weaviate using BM25 search
 * @param {string} query - The search query
 * @param {string} tenant - The tenant to search in (default: 'tenant1')
 * @param {number} limit - Maximum number of results to retrieve
 * @returns {Promise<Array>} Array of retrieved objects
 */
async function retrieveFromWeaviate(query, tenant = 'tenant1', limit = 5) {
  const client = await getClient();
  
  try {
    const collection = client.collections.get('QACollection');
    const tenantCollection = collection.withTenant(tenant);
    
    // Use BM25 keyword search (text-based search without embeddings)
    const result = await tenantCollection.query.bm25(query, {
      limit,
      returnProperties: ['fileId', 'question', 'answer'],
    });
    
    return result.objects;
    
  } catch (error) {
    console.error('❌ Error retrieving from Weaviate:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

/**
 * Fetch all objects from Weaviate for a specific tenant
 * @param {string} tenant - The tenant to fetch from
 * @returns {Promise<Array>} Array of all objects
 */
async function fetchAllFromWeaviate(tenant = 'tenant1') {
  const client = await getClient();
  
  try {
    const collection = client.collections.get('QACollection');
    const tenantCollection = collection.withTenant(tenant);
    
    const result = await tenantCollection.query.fetchObjects({
      limit: 100,
      returnProperties: ['fileId', 'question', 'answer'],
    });
    
    return result.objects;
    
  } catch (error) {
    console.error('❌ Error fetching objects from Weaviate:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

/**
 * Generate an answer using RAG (Retrieval-Augmented Generation)
 * @param {string} query - The user's query
 * @param {string} tenant - The tenant to search in
 * @returns {Promise<Object>} Object containing answer, fileIds, and references
 */
export async function ragGenerate(query, tenant = 'tenant1') {
  try {
    console.log(`🔍 RAG Agent: Processing query: "${query}"`);
    console.log(`📂 Searching in tenant: ${tenant}`);
    
    // Step 1: Retrieve relevant documents from Weaviate
    let retrievedDocs = await retrieveFromWeaviate(query, tenant, 5);
    
    // If no results with BM25, fall back to fetching all objects
    if (!retrievedDocs || retrievedDocs.length === 0) {
      console.log('⚠️  No BM25 results found, fetching all objects...');
      retrievedDocs = await fetchAllFromWeaviate(tenant);
    }
    
    if (!retrievedDocs || retrievedDocs.length === 0) {
      return {
        answer: 'I could not find any relevant information in the database to answer your question.',
        fileIds: [],
        references: [],
      };
    }
    
    console.log(`✅ Retrieved ${retrievedDocs.length} documents`);
    
    // Step 2: Extract fileIds and prepare context
    const fileIds = retrievedDocs.map(doc => doc.properties.fileId);
    const references = retrievedDocs.map(doc => ({
      fileId: doc.properties.fileId,
      question: doc.properties.question,
      answer: doc.properties.answer,
    }));
    
    // Step 3: Build context from retrieved documents
    const context = retrievedDocs
      .map((doc, idx) => {
        return `Document ${idx + 1} (File: ${doc.properties.fileId}):\nQuestion: ${doc.properties.question}\nAnswer: ${doc.properties.answer}`;
      })
      .join('\n\n');
    
    // Step 4: Generate answer using Gemini with retrieved context
    const prompt = `You are a helpful AI assistant. Answer the user's question based on the following retrieved documents.

Retrieved Documents:
${context}

User Question: ${query}

Instructions:
- Answer the question based on the retrieved documents above
- If the documents contain relevant information, use it to provide a comprehensive answer
- If the documents don't directly answer the question, try to provide related information
- Be concise but informative
- Do not mention that you're using retrieved documents, just answer naturally

Answer:`;

    const model = getGeminiModel({ temperature: 0.5 });
    const response = await model.invoke(prompt);
    
    const answer = response.content;
    
    console.log('✅ RAG Agent: Answer generated successfully\n');
    
    return {
      answer,
      fileIds,
      references,
    };
    
  } catch (error) {
    console.error('❌ RAG Agent error:', error.message);
    throw error;
  }
}

/**
 * Create the RAG tool for LangGraph
 * This tool can be called by the delegating agent to retrieve and generate answers
 */
export const ragTool = new DynamicStructuredTool({
  name: 'rag_search',
  description: `Search the knowledge base and generate an answer using Retrieval-Augmented Generation (RAG).
  Use this tool when the user asks a question that might be answered by information in the database.
  The tool retrieves relevant documents and generates a comprehensive answer.
  Returns an answer along with source file IDs and references.`,
  schema: z.object({
    query: z
      .string()
      .describe('The user\'s question or search query'),
    tenant: z
      .string()
      .optional()
      .default('tenant1')
      .describe('The tenant to search in (default: tenant1)'),
  }),
  func: async ({ query, tenant }) => {
    console.log('🤖 RAG Tool called with query:', query);
    
    const result = await ragGenerate(query, tenant || 'tenant1');
    
    // Return as JSON string for LangGraph compatibility
    return JSON.stringify({
      success: true,
      ...result,
    });
  },
});

/**
 * Test the RAG agent with sample queries
 */
async function testRAGAgent() {
  console.log('🧪 Testing RAG Agent...\n');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Test 1: Query about France
    console.log('📝 Test 1: Querying about France');
    console.log('-'.repeat(60));
    const result1 = await ragGenerate('What is the capital of France?', 'tenant1');
    console.log('Answer:', result1.answer);
    console.log('File IDs:', result1.fileIds);
    console.log('References:', result1.references.length, 'documents');
    
    // Test 2: Query about Shakespeare
    console.log('\n📝 Test 2: Querying about Shakespeare');
    console.log('-'.repeat(60));
    const result2 = await ragGenerate('Who wrote Romeo and Juliet?', 'tenant2');
    console.log('Answer:', result2.answer);
    console.log('File IDs:', result2.fileIds);
    console.log('References:', result2.references.length, 'documents');
    
    // Test 3: Query about AI
    console.log('\n📝 Test 3: Querying about Artificial Intelligence');
    console.log('-'.repeat(60));
    const result3 = await ragGenerate('What is artificial intelligence?', 'tenant3');
    console.log('Answer:', result3.answer);
    console.log('File IDs:', result3.fileIds);
    console.log('References:', result3.references.length, 'documents');
    
    // Test 4: Using the RAG tool
    console.log('\n📝 Test 4: Testing RAG Tool interface');
    console.log('-'.repeat(60));
    const toolResult = await ragTool.invoke({
      query: 'Tell me about photosynthesis',
      tenant: 'tenant1',
    });
    const parsed = JSON.parse(toolResult);
    console.log('Tool Success:', parsed.success);
    console.log('Answer:', parsed.answer);
    console.log('File IDs:', parsed.fileIds);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All RAG Agent tests completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Export everything
export default {
  ragGenerate,
  ragTool,
  retrieveFromWeaviate,
  fetchAllFromWeaviate,
  testRAGAgent,
};

// Run test if called directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  testRAGAgent()
    .then(() => {
      console.log('✅ RAG Agent is ready for integration!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

