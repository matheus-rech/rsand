# R Interpreter Deployment Guide

This is a quick reference guide for deploying the R Interpreter. For more detailed instructions, see the full [deployment guide](./frontend/src/components/rsandbox-2/DEPLOYMENT.md).

## Prerequisites

- Docker and Docker Compose (for containerized deployment)
- Python 3.8+ (for backend-only deployment)
- Node.js 18+ (for frontend-only deployment)
- API keys:
  - E2B API key
  - Anthropic API key
  - (Optional) OpenAI API key

## Quick Start: Docker Compose Deployment

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd r_interpreter
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your API keys
   ```

3. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

4. Access the application:
   ```
   Backend: http://your-server-ip:8000
   Frontend: http://your-server-ip:3000
   ```

## Manual Docker Compose Deployment

If you prefer to manually control the deployment:

1. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your API keys
   ```

2. Build the Docker images:
   ```bash
   docker-compose build
   ```

3. Start the services:
   ```bash
   docker-compose up -d
   ```

4. View logs:
   ```bash
   docker-compose logs -f
   ```

5. Stop the services:
   ```bash
   docker-compose down
   ```

## Separate Component Deployment

### Backend-Only Deployment

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set environment variables:
   ```bash
   export E2B_API_KEY=your_e2b_api_key
   export ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

4. Start the backend:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

### Frontend-Only Deployment

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set environment variables (create `.env.local`):
   ```
   NEXT_PUBLIC_BACKEND_API_URL=http://your-backend-url:8000
   ```

4. Build and start the frontend:
   ```bash
   npm run build
   npm start
   ```

## Checking Deployment Status

1. Backend health check:
   ```bash
   curl http://your-server-ip:8000/api/health
   ```

2. View backend logs:
   ```bash
   docker-compose logs backend
   ```

3. View frontend logs:
   ```bash
   docker-compose logs frontend
   ```

## Troubleshooting

### Common Issues

1. **API Connection Issues**:
   - Verify API keys are correctly set in .env file
   - Check network connectivity to API services

2. **Docker Errors**:
   - Ensure Docker and Docker Compose are installed
   - Check disk space and permissions

3. **Application Errors**:
   - View logs with `docker-compose logs`
   - Check for errors in browser console

### Getting Help

If you encounter issues not covered here, please:

1. Check the detailed [deployment guide](./frontend/src/components/rsandbox-2/DEPLOYMENT.md)
2. Open an issue on the project repository