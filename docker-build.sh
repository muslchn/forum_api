#!/bin/bash

# Forum API - Docker Build Script
# Best practices for building and running Docker images

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="forum-api"
IMAGE_NAME="${PROJECT_NAME}:latest"
CONTAINER_NAME="${PROJECT_NAME}-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi

print_status "Building Docker image for ${PROJECT_NAME}..."

# Build the Docker image
docker build \
    --tag "${IMAGE_NAME}" \
    --file "${SCRIPT_DIR}/Dockerfile" \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    "${SCRIPT_DIR}"

print_status "Docker image built successfully: ${IMAGE_NAME}"

# Optional: Start with docker-compose
if command -v docker-compose &> /dev/null; then
    read -p "Start services with docker-compose? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Starting services..."
        docker-compose up -d
        print_status "Services started. Access API at http://localhost:3000"
    fi
fi

print_status "Done!"
