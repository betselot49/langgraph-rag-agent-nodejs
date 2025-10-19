#!/usr/bin/env node

import { runAgentGraph } from './graph/agent-graph.js';
import readline from 'readline';

/**
 * Main Application Entry Point
 * 
 * This is the main interface for the LangGraph Hierarchical Agent system.
 * Provides an interactive CLI for users to interact with the agent.
 */

// ASCII Art Banner
function printBanner() {
  console.log('\n' + '═'.repeat(70));
  console.log(`
  ╔══════════════════════════════════════════════════════════════╗
  ║                                                              ║
  ║        LangGraph Hierarchical Agent System                   ║
  ║        with RAG & Chart.js Integration                       ║
  ║                                                              ║
  ║        Powered by: Gemini + Weaviate + LangGraph            ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
  `);
  console.log('═'.repeat(70) + '\n');
}

/**
 * Display help information
 */
function printHelp() {
  console.log('📚 Available Commands:');
  console.log('  help         - Show this help message');
  console.log('  tenant <id>  - Switch tenant (tenant1, tenant2, tenant3)');
  console.log('  clear        - Clear the screen');
  console.log('  exit         - Exit the application');
  console.log('\n💡 Example Queries:');
  console.log('  • "What is the capital of France?"');
  console.log('  • "Create a bar chart showing: Jan 100, Feb 150, Mar 120"');
  console.log('  • "Tell me about photosynthesis and show a pie chart"');
  console.log('  • "Hello, how are you?"');
  console.log('\n');
}

/**
 * Format and display the response
 */
function displayResponse(result) {
  console.log('\n' + '─'.repeat(70));
  console.log('📤 RESPONSE:');
  console.log('─'.repeat(70));
  
  // Answer
  console.log('\n💬 Answer:');
  console.log(result.answer);
  
  // File IDs (if any)
  if (result.fileIds && result.fileIds.length > 0) {
    console.log('\n📎 Source File IDs:');
    result.fileIds.forEach((fileId, idx) => {
      console.log(`  ${idx + 1}. ${fileId}`);
    });
  }
  
  // References (if any)
  if (result.references && result.references.length > 0) {
    console.log('\n📚 References:');
    result.references.forEach((ref, idx) => {
      console.log(`\n  [${idx + 1}] File: ${ref.fileId}`);
      console.log(`      Q: ${ref.question}`);
      console.log(`      A: ${ref.answer.substring(0, 100)}${ref.answer.length > 100 ? '...' : ''}`);
    });
  }
  
  // Chart Config (if any)
  if (result.chartConfig) {
    console.log('\n📊 Chart Configuration:');
    console.log(`  Type: ${result.chartConfig.type}`);
    console.log(`  Title: ${result.chartConfig.options.plugins.title.text}`);
    console.log(`  Labels: ${result.chartConfig.data.labels.join(', ')}`);
    console.log(`  Data Points: ${result.chartConfig.data.datasets[0].data.join(', ')}`);
    console.log('\n  ℹ️  Full Chart.js config available in response object');
  }
  
  // Error (if any)
  if (result.error) {
    console.log('\n⚠️  Error:', result.error);
  }
  
  console.log('\n' + '─'.repeat(70) + '\n');
}

/**
 * Interactive mode
 */
async function interactiveMode() {
  let currentTenant = 'tenant1';
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `[${currentTenant}] > `,
  });
  
  console.log('🤖 Interactive mode started. Type "help" for commands or "exit" to quit.\n');
  rl.prompt();
  
  rl.on('line', async (line) => {
    const input = line.trim();
    
    if (!input) {
      rl.prompt();
      return;
    }
    
    // Handle commands
    if (input === 'exit' || input === 'quit') {
      console.log('\n👋 Goodbye!\n');
      rl.close();
      process.exit(0);
    }
    
    if (input === 'help') {
      printHelp();
      rl.prompt();
      return;
    }
    
    if (input.startsWith('tenant ')) {
      const newTenant = input.split(' ')[1];
      if (['tenant1', 'tenant2', 'tenant3'].includes(newTenant)) {
        currentTenant = newTenant;
        console.log(`✅ Switched to ${currentTenant}\n`);
      } else {
        console.log('❌ Invalid tenant. Use: tenant1, tenant2, or tenant3\n');
      }
      rl.setPrompt(`[${currentTenant}] > `);
      rl.prompt();
      return;
    }
    
    if (input === 'clear') {
      console.clear();
      printBanner();
      rl.prompt();
      return;
    }
    
    // Process as query
    try {
      console.log('\n⚙️  Processing your query...\n');
      const result = await runAgentGraph(input, { tenant: currentTenant });
      displayResponse(result);
    } catch (error) {
      console.error('❌ Error:', error.message);
      console.log('\n');
    }
    
    rl.prompt();
  });
  
  rl.on('close', () => {
    console.log('\n👋 Goodbye!\n');
    process.exit(0);
  });
}

/**
 * Main function
 */
async function main() {
  printBanner();
  
  // Check command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    // Show help
    console.log('Usage: node src/index.js [options]\n');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  (no args)      Start interactive mode\n');
    printHelp();
  } else {
    // Interactive mode
    await interactiveMode();
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!\n');
  process.exit(0);
});

// Run the application
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

