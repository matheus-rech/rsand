#!/bin/bash
# Deployment script for R Interpreter

# Display header
echo "=========================================="
echo "R Interpreter - Deployment Script"
echo "=========================================="

# Check for Docker and Docker Compose
echo "Checking dependencies..."
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed. Aborting."; exit 1; }

# Check for required environment variables
if [ -z "$E2B_API_KEY" ]; then
  echo "Warning: E2B_API_KEY environment variable is not set."
  echo "Please set it before running the deployment:"
  echo "export E2B_API_KEY=your_api_key_here"
  echo ""
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "Warning: ANTHROPIC_API_KEY environment variable is not set."
  echo "Please set it before running the deployment:"
  echo "export ANTHROPIC_API_KEY=your_api_key_here"
  echo ""
fi

# Ask for confirmation
read -p "Do you want to proceed with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Deployment aborted."
  exit 1
fi

# Run tests if requested
read -p "Do you want to run tests before deployment? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Running backend tests..."
  cd backend
  python -m pytest
  BACKEND_TEST_STATUS=$?
  cd ..

  echo "Running frontend tests..."
  cd frontend
  npm test
  FRONTEND_TEST_STATUS=$?
  cd ..

  if [ $BACKEND_TEST_STATUS -ne 0 ] || [ $FRONTEND_TEST_STATUS -ne 0 ]; then
    echo "Tests failed! Do you want to continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "Deployment aborted due to test failures."
      exit 1
    fi
  fi
fi

# Build and start the Docker containers
echo "Starting deployment..."
docker-compose build
docker-compose up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 5

# Check if services are running
echo "Checking service status..."
BACKEND_RUNNING=$(docker-compose ps | grep backend | grep Up | wc -l)
FRONTEND_RUNNING=$(docker-compose ps | grep frontend | grep Up | wc -l)

if [ "$BACKEND_RUNNING" -eq 1 ] && [ "$FRONTEND_RUNNING" -eq 1 ]; then
  echo "=========================================="
  echo "Deployment successful!"
  echo "Backend running at: http://localhost:8000"
  echo "Frontend running at: http://localhost:3000"
  echo "=========================================="
else
  echo "=========================================="
  echo "Deployment may have issues. Please check Docker logs:"
  echo "docker-compose logs backend"
  echo "docker-compose logs frontend"
  echo "=========================================="
fi

echo "To stop the services, run: docker-compose down"