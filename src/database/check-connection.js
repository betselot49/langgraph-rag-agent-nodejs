import weaviate from 'weaviate-client';

/**
 * Check Weaviate database connection
 * Verifies that Weaviate is running and accessible
 */
async function checkWeaviateConnection() {
  try {
    console.log('🔍 Checking Weaviate connection...\n');
    
    const client = await weaviate.connectToLocal({
      host: 'localhost',
      port: 8080,
    });

    const isReady = await client.isReady();
    
    if (isReady) {
      console.log('✅ Weaviate is connected and ready!');
      
      // Get metadata
      const meta = await client.getMeta();
      console.log('📊 Weaviate version:', meta.version);
      console.log('📊 Hostname:', meta.hostname);
      console.log('\n✨ Connection test successful!\n');
    } else {
      console.log('❌ Weaviate is not ready');
      process.exit(1);
    }
    
    await client.close();
  } catch (error) {
    console.error('❌ Error connecting to Weaviate:', error.message);
    console.log('\n💡 Make sure Weaviate is running with: docker-compose up -d\n');
    process.exit(1);
  }
}

checkWeaviateConnection();

