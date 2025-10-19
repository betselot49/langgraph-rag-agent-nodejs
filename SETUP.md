# Setup Guide

Complete setup instructions for the LangGraph Hierarchical Agent System.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop
   - Verify: `docker --version`

3. **Git** (optional, for cloning)
   - Download from: https://git-scm.com/

## Step-by-Step Setup

### Step 1: Install Node.js Dependencies

Navigate to the project directory and install dependencies:

```bash
cd upwork-challange
npm install
```

This will install:
- `@langchain/google-genai` - Gemini integration
- `@langchain/langgraph` - State graph framework
- `langchain` - LLM abstraction
- `weaviate-client` - Database client
- `dotenv` - Environment variables
- `zod` - Schema validation

### Step 2: Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
GOOGLE_API_KEY=your_actual_api_key_here
WEAVIATE_HOST=http://localhost:8080
```

Replace `your_actual_api_key_here` with your actual Gemini API key.

**Important**: Never commit the `.env` file to version control. It's already in `.gitignore`.

### Step 4: Start Weaviate Database

Start the Weaviate container using Docker Compose:

```bash
docker-compose up -d
```

This will:
- Pull the Weaviate image (if not already downloaded)
- Start Weaviate on port 8080
- Create a persistent volume for data storage

Verify Weaviate is running:

```bash
npm run check-db
```

Expected output:
```
✅ Weaviate is connected and ready!
📊 Weaviate version: 1.27.0
```

### Step 5: Initialize Database

Create the schema and insert fictional data:

```bash
npm run setup-db
```

This will:
- Create the `QACollection` with multi-tenancy enabled
- Create 3 tenants (tenant1, tenant2, tenant3)
- Insert 5 fictional Q&A entries
- Test data retrieval

Expected output:
```
✅ QACollection schema created successfully!
✅ Created tenant: tenant1
✅ Created tenant: tenant2
✅ Created tenant: tenant3
✅ Inserted data into tenant1: FILE-001
...
🎉 Weaviate setup completed successfully!
```

### Step 6: Test Gemini Integration

Verify your API key is working:

```bash
npm run test:gemini
```

Expected output:
```
✅ Gemini API connection successful!
📥 Response from Gemini: Hello! I am Google Gemini and I am working correctly. 😊
```

### Step 7: Run Component Tests

Test all components:

```bash
npm run test:all
```

This will test:
- RAG Agent (4 tests)
- Chart.js Tool (5 tests)
- Delegating Agent (4 tests)
- LangGraph (4 tests)

All tests should pass ✅

### Step 8: Start the Application

Launch the interactive CLI:

```bash
npm start
```

You should see the banner and prompt:
```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        LangGraph Hierarchical Agent System                   ║
║        with RAG & Chart.js Integration                       ║
║                                                              ║
║        Powered by: Gemini + Weaviate + LangGraph            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

[tenant1] > 
```

## Testing the System

### Test 1: Knowledge Retrieval (RAG)

```
[tenant1] > What is the capital of France?
```

Should return:
- Answer from the database
- File ID: FILE-001
- References with full document

### Test 2: Chart Generation

```
[tenant1] > Create a bar chart: Q1 100, Q2 150, Q3 120
```

Should return:
- Confirmation message
- Chart.js configuration

### Test 3: Combined Request

```
[tenant1] > Tell me about photosynthesis and show a pie chart
```

Should return:
- Answer from database (FILE-002)
- Chart.js configuration
- Both executed in parallel

### Test 4: Tenant Switching

```
[tenant1] > tenant tenant2
[tenant2] > Who wrote Romeo and Juliet?
```

Should return answer from tenant2 data (FILE-004)

## Troubleshooting

### Problem: "Cannot find module"

**Solution**: Install dependencies
```bash
npm install
```

### Problem: "Docker daemon is not running"

**Solution**: Start Docker Desktop application

### Problem: "Weaviate not ready"

**Solution**: 
1. Restart Docker container:
```bash
docker-compose down
docker-compose up -d
```
2. Wait 10 seconds
3. Verify: `npm run check-db`

### Problem: "GOOGLE_API_KEY is not set"

**Solution**:
1. Create `.env` file in project root
2. Add your API key:
```
GOOGLE_API_KEY=your_key_here
```
3. Get your key from: https://makersuite.google.com/app/apikey

### Problem: "API quota exceeded"

**Solution**:
- You're on Google's free tier
- Wait 1 minute between requests
- Check your quota at: https://console.cloud.google.com/

### Problem: "No search results"

**Solution**:
1. Reinitialize database:
```bash
npm run setup-db
```
2. Verify data was inserted
3. Check you're using the correct tenant

### Problem: Port 8080 already in use

**Solution**:
1. Stop existing Weaviate:
```bash
docker stop weaviate
docker rm weaviate
```
2. Start fresh:
```bash
docker-compose up -d
```

## Database Management

### View Docker Containers

```bash
docker ps
```

### View Weaviate Logs

```bash
docker logs weaviate
```

### Stop Weaviate

```bash
docker-compose down
```

### Reset Database (Delete All Data)

```bash
docker-compose down -v
docker-compose up -d
npm run setup-db
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `WEAVIATE_HOST` | Weaviate host URL | `http://localhost:8080` |

## Multi-Tenant Data

### Tenant 1 Data:
- FILE-001: "What is the capital of France?"
- FILE-002: "How does photosynthesis work?"

### Tenant 2 Data:
- FILE-003: "What is the speed of light?"
- FILE-004: "Who wrote Romeo and Juliet?"

### Tenant 3 Data:
- FILE-005: "What is artificial intelligence?"

## Google Gemini Free Tier Limits

- **15 requests per minute**
- **1 million tokens per minute**
- **1,500 requests per day**

Perfect for development and testing!

## Next Steps

After successful setup:

1. ✅ Try example queries from README.md
2. ✅ Experiment with combined RAG + Chart requests
3. ✅ Switch between tenants
4. ✅ Add your own data to the database
5. ✅ Explore the code in `src/` directory

## Getting Help

If you encounter issues:

1. Check this SETUP.md file
2. Review README.md
3. Check error messages carefully
4. Verify all prerequisites are installed
5. Ensure Docker is running
6. Confirm API key is correct

## Success Criteria

You've successfully set up the system when:

✅ `npm install` completes without errors  
✅ Docker container is running  
✅ `npm run check-db` shows Weaviate is ready  
✅ `npm run setup-db` creates schema and inserts data  
✅ `npm run test:gemini` connects to Gemini successfully  
✅ `npm run test:all` passes all tests  
✅ `npm start` launches interactive mode  
✅ Test queries return expected results  

---

**Setup Time**: ~5-10 minutes

**You're all set! Enjoy using the LangGraph Hierarchical Agent System! 🚀**

