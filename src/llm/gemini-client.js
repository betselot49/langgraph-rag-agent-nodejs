import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate API key
if (!process.env.GOOGLE_API_KEY) {
  console.error('❌ Error: GOOGLE_API_KEY is not set in environment variables');
  console.log('💡 Please create a .env file with your Google API key:');
  console.log('   GOOGLE_API_KEY=your_api_key_here');
  console.log('\n   Get your API key from: https://makersuite.google.com/app/apikey\n');
  process.exit(1);
}

/**
 * Initialize Gemini LLM with standard configuration
 * @param {Object} options - Configuration options
 * @param {string} options.modelName - Gemini model name (default: gemini-2.5-flash)
 * @param {number} options.temperature - Temperature for response randomness (0-1)
 * @param {number} options.maxTokens - Maximum tokens in response
 * @returns {ChatGoogleGenerativeAI} Configured Gemini model instance
 */
export function getGeminiModel(options = {}) {
  const {
    modelName = 'gemini-2.5-flash',
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  const model = new ChatGoogleGenerativeAI({
    model: modelName,
    temperature,
    maxOutputTokens: maxTokens,
    apiKey: process.env.GOOGLE_API_KEY,
  });

  return model;
}

/**
 * Test the Gemini API connection with a simple prompt
 */
async function testGeminiConnection() {
  try {
    console.log('🔍 Testing Gemini API connection...\n');
    
    const model = getGeminiModel({ temperature: 0.3 });
    
    // Simple test prompt
    const testPrompt = 'Say "Hello! I am Google Gemini and I am working correctly." in a friendly way.';
    
    console.log('📤 Sending test prompt to Gemini...');
    const response = await model.invoke(testPrompt);
    
    console.log('✅ Gemini API connection successful!\n');
    console.log('📥 Response from Gemini:');
    console.log('-'.repeat(50));
    console.log(response.content);
    console.log('-'.repeat(50));
    
    console.log('\n🎉 Gemini integration test completed successfully!\n');
    return true;
  } catch (error) {
    console.error('❌ Error testing Gemini API:', error.message);
    
    if (error.message.includes('API key') || error.message.includes('401')) {
      console.log('\n💡 Please check your GOOGLE_API_KEY in the .env file');
      console.log('   Get your API key from: https://makersuite.google.com/app/apikey\n');
    } else if (error.message.includes('quota') || error.message.includes('429')) {
      console.log('\n💡 You may have exceeded your API quota');
    } else {
      console.log('\n💡 Error details:', error);
    }
    
    return false;
  }
}

/**
 * Create a simple chat completion
 * @param {string} prompt - The prompt to send to Gemini
 * @param {Object} options - Model configuration options
 * @returns {Promise<string>} The response content
 */
export async function chat(prompt, options = {}) {
  try {
    const model = getGeminiModel(options);
    const response = await model.invoke(prompt);
    return response.content;
  } catch (error) {
    console.error('❌ Error in chat:', error.message);
    throw error;
  }
}

// Export for use in other modules
export default {
  getGeminiModel,
  chat,
  testGeminiConnection,
};

// Run test if called directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  testGeminiConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

