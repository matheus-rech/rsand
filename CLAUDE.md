# R Interpreter Project Guidelines

## Project Structure
- `r_interpreter/` - Main application with Python backend and Next.js frontend
  - `backend/` - FastAPI service that handles API requests and orchestration
  - `frontend/` - Next.js UI for user interaction
- `r_sandbox/` - JavaScript-based R execution environment using E2B

## Commands
- Run full app: `cd r_interpreter && ./run.sh`
- Backend only: `cd r_interpreter/backend && python -m uvicorn app.main:app --reload --port 8000`
- Frontend only: `cd r_interpreter/frontend && npm run dev`
- Lint frontend: `cd r_interpreter/frontend && npm run lint`
- Build frontend: `cd r_interpreter/frontend && npm run build`
- Run sandbox test: `cd r_sandbox && node test_sandbox.js`
- Run specific JS test: `cd r_sandbox && node test_file.js`

## Code Style
- **Python Backend**: PEP8, type hints, docstrings for all functions
- **Next.js Frontend**: TypeScript with explicit interfaces in `/src/types`
- **JavaScript Sandbox**: ES6+, async/await patterns, clear error handling
- **Naming**: 
  - Python: snake_case for variables/functions, PascalCase for classes
  - JS/TS: camelCase for variables/functions, PascalCase for components/interfaces
- **Imports**: Group by external, then internal modules with a blank line between
- **Error Handling**: Try/catch with specific error messages for all async operations

## Architecture
- **Frontend**: Next.js with Zustand for state management
- **Backend**: FastAPI with service pattern - routes thin, logic in services
- **Sandbox**: JavaScript E2B integration for R code execution
- **API Flow**: Frontend → Python Backend → JS Sandbox → R Execution
- **Claude Integration**: LLM generation through claude_service.py with context management