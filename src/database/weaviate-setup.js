import weaviate from 'weaviate-client';

/**
 * Get Weaviate client connection
 * @returns {Promise} Weaviate client instance
 */
export async function getClient() {
  const client = await weaviate.connectToLocal({
    host: 'localhost',
    port: 8080,
  });
  return client;
}

/**
 * Create the QACollection schema with multi-tenancy
 */
async function createSchema() {
  const client = await getClient();
  
  try {
    console.log('🔧 Creating QACollection schema...');
    
    // Check if collection already exists
    const exists = await client.collections.exists('QACollection');
    
    if (exists) {
      console.log('⚠️  QACollection already exists. Deleting it first...');
      await client.collections.delete('QACollection');
    }
    
    // Create collection with multi-tenancy enabled
    await client.collections.create({
      name: 'QACollection',
      description: 'Question and Answer collection with multi-tenancy',
      multiTenancy: {
        enabled: true,
      },
      properties: [
        {
          name: 'fileId',
          dataType: 'text',
          description: 'The identifier for each file',
          indexSearchable: false,  // Not searchable as per requirements
          indexFilterable: true,    // Can filter by fileId
          tokenization: 'field',
        },
        {
          name: 'question',
          dataType: 'text',
          description: 'The question being asked',
          indexSearchable: true,    // Searchable
          tokenization: 'word',
        },
        {
          name: 'answer',
          dataType: 'text',
          description: 'The answer to the question',
          indexSearchable: true,    // Searchable
          tokenization: 'word',
        },
      ],
      // No vectorizer - using text-based search
      vectorizers: [],
    });
    
    console.log('✅ QACollection schema created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating schema:', error);
    throw error;
  } finally {
    await client.close();
  }
}

/**
 * Insert fictional Q&A data across multiple tenants
 */
async function insertData() {
  const client = await getClient();
  
  try {
    console.log('📝 Inserting fictional Q&A data...');
    
    const collection = client.collections.get('QACollection');
    
    // Create 3 tenants
    const tenants = ['tenant1', 'tenant2', 'tenant3'];
    
    for (const tenant of tenants) {
      await collection.tenants.create({ name: tenant });
      console.log(`✅ Created tenant: ${tenant}`);
    }
    
    // Fictional Q&A entries (5 total across 3 tenants)
    const qaEntries = [
      {
        tenant: 'tenant1',
        data: {
          fileId: 'FILE-001',
          question: 'What is the capital of France?',
          answer: 'The capital of France is Paris, which is also the largest city in the country.'
        }
      },
      {
        tenant: 'tenant1',
        data: {
          fileId: 'FILE-002',
          question: 'How does photosynthesis work?',
          answer: 'Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar.'
        }
      },
      {
        tenant: 'tenant2',
        data: {
          fileId: 'FILE-003',
          question: 'What is the speed of light?',
          answer: 'The speed of light in a vacuum is approximately 299,792,458 meters per second (or about 186,282 miles per second).'
        }
      },
      {
        tenant: 'tenant2',
        data: {
          fileId: 'FILE-004',
          question: 'Who wrote Romeo and Juliet?',
          answer: 'Romeo and Juliet was written by William Shakespeare, one of the most famous playwrights in history.'
        }
      },
      {
        tenant: 'tenant3',
        data: {
          fileId: 'FILE-005',
          question: 'What is artificial intelligence?',
          answer: 'Artificial Intelligence (AI) is the simulation of human intelligence processes by machines, especially computer systems, including learning, reasoning, and self-correction.'
        }
      }
    ];
    
    // Insert data for each tenant
    for (const entry of qaEntries) {
      const tenantCollection = collection.withTenant(entry.tenant);
      
      await tenantCollection.data.insert(entry.data);
      
      console.log(`✅ Inserted data into ${entry.tenant}: ${entry.data.fileId}`);
    }
    
    console.log('\n✅ All fictional data inserted successfully!');
    
  } catch (error) {
    console.error('❌ Error inserting data:', error);
    throw error;
  } finally {
    await client.close();
  }
}

/**
 * Query data using BM25 search (text-based search)
 * @param {string} query - Search query
 * @param {string} tenant - Tenant name
 * @param {number} limit - Maximum results to return
 * @returns {Promise<Array>} Array of retrieved objects
 */
export async function queryData(query, tenant = 'tenant1', limit = 5) {
  const client = await getClient();
  
  try {
    const collection = client.collections.get('QACollection');
    const tenantCollection = collection.withTenant(tenant);
    
    // Use BM25 search (keyword search without embeddings)
    const result = await tenantCollection.query.bm25(query, {
      limit,
      returnProperties: ['fileId', 'question', 'answer'],
    });
    
    return result.objects;
    
  } catch (error) {
    console.error('❌ Error querying data:', error);
    throw error;
  } finally {
    await client.close();
  }
}

/**
 * Fetch all objects from a tenant
 * @param {string} tenant - Tenant name
 * @returns {Promise<Array>} Array of all objects
 */
export async function fetchAllObjects(tenant = 'tenant1') {
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
    console.error('❌ Error fetching objects:', error);
    throw error;
  } finally {
    await client.close();
  }
}

/**
 * Test the setup by performing a sample query
 */
async function testSetup() {
  console.log('\n🧪 Testing data retrieval...\n');
  
  try {
    // Test BM25 search
    console.log('Testing BM25 search for "France" in tenant1:');
    const searchResults = await queryData('France', 'tenant1');
    searchResults.forEach((obj, idx) => {
      console.log(`\nResult ${idx + 1}:`);
      console.log(`  FileID: ${obj.properties.fileId}`);
      console.log(`  Question: ${obj.properties.question}`);
      console.log(`  Answer: ${obj.properties.answer.substring(0, 80)}...`);
    });
    
    // Test fetch all objects
    console.log('\n\nFetching all objects from tenant2:');
    const allObjects = await fetchAllObjects('tenant2');
    console.log(`Found ${allObjects.length} objects in tenant2`);
    allObjects.forEach((obj, idx) => {
      console.log(`\nObject ${idx + 1}:`);
      console.log(`  FileID: ${obj.properties.fileId}`);
      console.log(`  Question: ${obj.properties.question}`);
    });
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await createSchema();
    await insertData();
    await testSetup();
    
    console.log('\n🎉 Weaviate setup completed successfully!\n');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  main();
}

