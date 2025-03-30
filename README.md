# R Interpreter

A natural language to R code execution system that allows you to interact with R programming through conversation.

## Features

- **Natural Language Interface**: Ask questions in plain English about data analysis, statistics, or visualization
- **R Code Generation**: Uses Claude 3.7 Sonnet to generate executable R code
- **Sandboxed Execution**: Safely executes R code in an isolated E2B sandbox environment
- **Interactive Visualizations**: View and interact with generated plots
- **Conversation Context**: Maintains conversation history for contextual responses
- **File Upload**: Upload your own data files for analysis (CSV, Excel, JSON, etc.)
- **Package Installation**: Install and use any R package from CRAN
- **Data Export**: Save and download analysis results

## Architecture

The application follows a hybrid architecture with:

- **Frontend**: Next.js/React for a modern, responsive UI
- **Backend**: Python FastAPI service for orchestration
- **LLM**: Claude 3.7 Sonnet API for natural language to R code translation
- **Sandbox**: E2B sandbox for safe R code execution

## Prerequisites

- Python 3.8+ with pip
- Node.js 18+ with npm
- Anthropic API key for Claude
- E2B API key for sandbox execution

## Setup

### Local Development Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd r_interpreter
   ```

2. Set up environment variables:
   ```
   cp .env.example .env
   # Edit .env file with your API keys
   ```

3. Run the application:
   ```
   ./run.sh
   ```

   This will start both the backend and frontend services.

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Production Deployment

For production deployment, you have several options:

#### Docker Compose Deployment (Recommended)

1. Set up environment variables:
   ```
   cp .env.example .env
   # Edit .env file with your API keys
   ```

2. Run the deployment script:
   ```
   ./deploy.sh
   ```

3. Access the application:
   ```
   Backend: http://your-server-ip:8000
   Frontend: http://your-server-ip:3000
   ```

#### Cloud Deployment

See the detailed [Deployment Guide](./frontend/src/components/rsandbox-2/DEPLOYMENT.md) for options including:

- Heroku deployment
- Digital Ocean App Platform
- Vercel + separate backend
- Netlify + separate backend

## Using the Application

### Basic Usage
1. Type your R-related question in the chat input
2. The system will generate and execute R code
3. View the results, including console output and plots

### Working with Your Own Data
1. Click the "Upload File" button in the header
2. Select a file from your computer (CSV, Excel, JSON, etc.)
3. After upload, ask questions about the data
4. Example: "Analyze the trends in the data I just uploaded"

### Installing Packages
You can request any package from CRAN. The system will install it automatically.
Example: "Can you use the tidymodels package to build a prediction model?"

### Creating Visualizations
Ask for specific plots or let the system choose appropriate visualizations.
Example: "Create a scatter plot matrix of the iris dataset colored by species"

### Exporting Results
Results can be saved to files for download.
Example: "Save the model as an RDS file so I can download it"

## Project Structure

```
/r_interpreter
├── /backend                # Python FastAPI backend
│   ├── /app                # Main application module
│   ├── /api                # API routes and endpoints
│   ├── /models             # Data models and schemas
│   ├── /services           # Business logic services
│   └── /utils              # Utility functions
│
├── /frontend               # Next.js frontend
│   ├── /src
│   │   ├── /app            # Next.js app router
│   │   ├── /components     # UI components
│   │   ├── /lib            # Frontend utilities
│   │   └── /types          # TypeScript type definitions
│   └── /public             # Static assets
│
└── run.sh                  # Combined startup script
```

## API Endpoints

- `POST /api/conversation`: Process a user message and generate a response
- `POST /api/sandbox/execute`: Execute R code in the sandbox
- `POST /api/sandbox/upload-file`: Upload a file to the sandbox
- `GET /api/sandbox/info`: Get information about the sandbox environment

## Component Interactions

1. User enters a natural language query or uploads a file
2. The query/file is processed by the backend
3. Claude API generates R code based on the query and context
4. The generated code is executed in the E2B sandbox
5. Results (output, plots, file operations) are returned to the frontend
6. The UI displays the response, including any visualizations

## Technical Details

### Sandbox Persistence
- Each conversation maintains a persistent R environment
- Package installations and data operations persist within a conversation
- Starting a new conversation creates a fresh environment

### File Handling
- Uploaded files are stored in an "uploads" directory in the sandbox
- Files can be processed using standard R packages (readr, readxl, etc.)
- Analysis results can be saved as new files

### Package Management
- R packages are installed from CRAN repositories
- Common packages for data science are available
- Installation happens within the sandbox environment

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

[MIT License](LICENSE)