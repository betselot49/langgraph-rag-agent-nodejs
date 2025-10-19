# LangGraph Hierarchical Agent System

A sophisticated Node.js application implementing a hierarchical agent system using LangGraph, with integrated RAG (Retrieval-Augmented Generation) capabilities powered by Weaviate vector database and Google Gemini LLM.

## 🌟 Features

- **🤖 Intelligent Query Routing**: Automatically determines whether to use RAG, Chart generation, or direct answers
- **📊 Chart.js Integration**: Generates Chart.js configurations from natural language
- **🔍 RAG System**: Retrieves and augments responses with knowledge from Weaviate
- **🎯 Multi-Tenant Support**: Isolated data contexts across different tenants
- **⚡ Parallel Execution**: Runs multiple tools simultaneously for efficiency
- **🧠 Powered by Gemini**: Uses Google's Gemini 2.5 Flash for LLM capabilities

## 📋 Requirements

- **Node.js**: Version 18 or higher
- **Docker**: For running Weaviate vector database
- **Google Gemini API Key**: Free tier available at [Google AI Studio](https://makersuite.google.com/app/apikey)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
GOOGLE_API_KEY=your_google_gemini_api_key_here
WEAVIATE_HOST=http://localhost:8080
```

Get your API key from: [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. Start Weaviate Database

```bash
docker-compose up -d
```

Verify the connection:

```bash
npm run check-db
```

### 4. Initialize Database Schema and Data

```bash
npm run setup-db
```

This creates the multi-tenant schema and inserts 5 fictional Q&A entries.

### 5. Run the Application

```bash
npm start
```

## 📖 Usage

### Interactive Mode

```bash
npm start
```

Available commands:
- `help` - Show available commands
- `tenant <id>` - Switch tenant (tenant1, tenant2, tenant3)
- `clear` - Clear the screen
- `exit` - Exit the application

### Example Queries

**Knowledge Retrieval (RAG):**
```
[tenant1] > What is the capital of France?
[tenant1] > Tell me about photosynthesis
```

**Chart Generation:**
```
[tenant1] > Create a bar chart showing sales: Jan 100, Feb 150, Mar 120
[tenant1] > Generate a line chart of temperatures
```

**Combined Requests:**
```
[tenant1] > Tell me about AI and show a pie chart of AI types
```

**Simple Conversation:**
```
[tenant1] > Hello, how are you?
```

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                  LangGraph State Graph                  │
│                                                          │
│  START → Delegating Agent Node → END                   │
│                       │                                  │
│                       ├→ Chart.js Tool                  │
│                       ├→ RAG Agent                      │
│                       └→ Direct Answer                  │
└─────────────────────────────────────────────────────────┘
```

### Delegating Agent Workflow

1. **Query Analysis**: Uses Gemini to determine required tools
2. **Parallel Execution**: Runs multiple tools simultaneously when needed
3. **Result Combination**: Merges outputs into unified response
4. **Structured Response**: Returns answer, references, and/or chart config

### Data Flow

```
User Query
    ↓
LangGraph State Graph
    ↓
Delegating Agent (analyzes query)
    ↓
┌───────────┬──────────────┬──────────────┐
│  RAG      │  Chart.js    │  Direct      │
│  Agent    │  Tool        │  Answer      │
└───────────┴──────────────┴──────────────┘
    ↓
Combined Response
{
  answer: "...",
  fileIds: ["FILE-001"],
  references: [...],
  chartConfig: {...}
}
```

## 🧪 Testing

### Run All Tests

```bash
npm run test:all
```

### Individual Component Tests

```bash
npm run test:rag         # Test RAG agent
npm run test:chart       # Test Chart.js tool
npm run test:delegating  # Test delegating agent
npm run test:graph       # Test LangGraph integration
```

### Database Tests

```bash
npm run check-db         # Verify Weaviate connection
npm run setup-db         # Reinitialize database
```

## 📁 Project Structure

```
upwork-challange/
├── src/
│   ├── agents/
│   │   ├── delegating-agent.js       # Main orchestrator
│   │   └── rag-agent.js              # RAG implementation
│   ├── database/
│   │   ├── weaviate-setup.js         # Schema & data setup
│   │   └── check-connection.js       # Health check
│   ├── graph/
│   │   └── agent-graph.js            # LangGraph state graph
│   ├── llm/
│   │   └── gemini-client.js          # Gemini API integration
│   ├── tools/
│   │   └── chartjs-tool.js           # Chart.js tool
│   └── index.js                       # Main entry point
├── docker-compose.yml                 # Weaviate configuration
├── package.json                       # Dependencies
├── .env                               # Environment variables
└── README.md                          # This file
```

## 🔧 Configuration

### Multi-Tenant Data

The system supports three tenants with different data:

- **tenant1**: France, Photosynthesis questions
- **tenant2**: Speed of light, Shakespeare questions  
- **tenant3**: Artificial Intelligence questions

Switch tenants in interactive mode:
```
[tenant1] > tenant tenant2
✅ Switched to tenant2
[tenant2] > 
```

### Weaviate Schema

```javascript
{
  collection: "QACollection",
  multiTenancy: true,
  properties: [
    { name: "fileId", type: "text" },      // Not indexed
    { name: "question", type: "text" },    // BM25 searchable
    { name: "answer", type: "text" }       // BM25 searchable
  ]
}
```

## 📊 Response Format

All queries return a structured response:

```javascript
{
  answer: string,              // Generated answer text
  fileIds: string[],           // Source file IDs (RAG)
  references: [{               // Full references (RAG)
    fileId: string,
    question: string,
    answer: string
  }],
  chartConfig: {               // Chart.js config (if applicable)
    type: string,
    data: {...},
    options: {...}
  }
}
```

## 🛠️ Development

### Available NPM Scripts

```bash
npm start              # Start interactive mode
npm run setup-db       # Initialize database
npm run check-db       # Verify database connection
npm run test:all       # Run all tests
npm run test:rag       # Test RAG agent
npm run test:chart     # Test Chart.js tool
npm run test:delegating # Test delegating agent
npm run test:graph     # Test LangGraph
```

### Adding New Data

Edit `src/database/weaviate-setup.js` to add more Q&A entries:

```javascript
{
  tenant: 'tenant1',
  data: {
    fileId: 'FILE-006',
    question: 'Your question here',
    answer: 'Your answer here'
  }
}
```

Then run:
```bash
npm run setup-db
```

## 🎯 Key Features Demonstrated

### 1. Intelligent Query Routing
Uses Gemini LLM to analyze queries and determine:
- Does it need chart generation?
- Does it need RAG retrieval?
- Can it be answered directly?

### 2. Parallel Tool Execution
When both RAG and Chart are needed, they execute simultaneously:
```javascript
const tasks = [ragTask, chartTask];
const results = await Promise.all(tasks);
```

### 3. Multi-Tenant RAG
Isolated data per tenant with BM25 text search:
```javascript
const result = await ragGenerate(query, 'tenant2');
```

### 4. LangGraph State Management
Clean state flow through the graph:
```javascript
START → Delegating Node → END
```

## 🐛 Troubleshooting

### Weaviate Not Running
```bash
docker-compose up -d
npm run check-db
```

### API Key Issues
- Check `.env` file exists
- Verify `GOOGLE_API_KEY` is set correctly
- Get your key from: https://makersuite.google.com/app/apikey

### No Search Results
- Verify database has data: `npm run setup-db`
- Check correct tenant is selected
- BM25 search is keyword-based (not semantic)

## 📝 Example Queries by Type

### Knowledge Retrieval
```
What is the capital of France?
Tell me about photosynthesis
What is artificial intelligence?
Who wrote Romeo and Juliet?
```

### Chart Generation
```
Create a bar chart showing: Jan 100, Feb 150, Mar 120
Generate a line chart of temperature data
Show me a pie chart: Red 40, Blue 35, Yellow 25
```

### Combined Requests
```
Tell me about AI and create a pie chart of AI types
Explain photosynthesis and show a bar chart of growth stages
```

## 📄 License

MIT

## 🙏 Acknowledgments

- **LangChain & LangGraph**: Agent framework
- **Google Gemini**: LLM capabilities
- **Weaviate**: Vector database
- **Chart.js**: Visualization library

---

**Built with ❤️ using Node.js, LangGraph, Weaviate, and Google Gemini**

