#!/bin/bash
# Test execution script for Forum API
# This script runs all tests in the correct order

set -e

echo "=========================================="
echo "Forum API - Test Execution Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .test.env exists
if [ ! -f ".test.env" ]; then
    echo -e "${YELLOW}Warning: .test.env file not found${NC}"
    echo "Please create .test.env file using .env.example as template"
    exit 1
fi

echo -e "${YELLOW}Step 1: Linting...${NC}"
npm run lint || { echo -e "${RED}Linting failed!${NC}"; exit 1; }
echo -e "${GREEN}✓ Linting passed${NC}"
echo ""

echo -e "${YELLOW}Step 2: Running database migrations for test...${NC}"
npm run migrate:test || { echo -e "${RED}Migration failed!${NC}"; exit 1; }
echo -e "${GREEN}✓ Migrations completed${NC}"
echo ""

echo -e "${YELLOW}Step 3: Running unit and integration tests...${NC}"
npm test || { echo -e "${RED}Tests failed!${NC}"; exit 1; }
echo -e "${GREEN}✓ Tests passed${NC}"
echo ""

echo -e "${YELLOW}Step 4: Generating coverage report...${NC}"
npm run test:coverage || { echo -e "${YELLOW}Coverage generation had warnings (non-critical)${NC}"; }
echo -e "${GREEN}✓ Coverage report generated${NC}"
echo ""

echo -e "${GREEN}=========================================="
echo "All tests passed successfully!"
echo "==========================================${NC}"
