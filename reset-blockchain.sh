#!/bin/bash

# Stop all containers
echo "Stopping containers..."
docker compose down

# Remove any persistent volumes
echo "Removing volumes..."
docker volume prune -f

# Clean up any dangling images
echo "Cleaning images..."
docker image prune -f

# Start a fresh instance
echo "Starting fresh environment..."
docker compose up --build -d

echo "Blockchain reset completed. The application is running in the background."
echo "To view logs, run: docker compose logs -f"