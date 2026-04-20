#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Load Test for The Training Hub${NC}"
echo "================================================"

# Check if Artillery is installed
if ! command -v artillery &> /dev/null; then
    echo -e "${YELLOW}Artillery not found. Installing...${NC}"
    npm install -g artillery
fi

# Check if server is running
echo -e "\n${YELLOW}Checking if server is running...${NC}"
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}❌ Server is not running on port 3000${NC}"
    echo "Please start the server first: npm run dev"
    exit 1
fi

echo -e "${GREEN}✓ Server is running${NC}"

# Create reports directory
mkdir -p load-test-reports

# Run the load test
echo -e "\n${YELLOW}Running load test...${NC}"
echo "This will take approximately 20 minutes"
echo "================================================"

artillery run \
  --output "load-test-reports/report-$(date +%Y%m%d-%H%M%S).json" \
  artillery-config.yml

# Generate HTML report
echo -e "\n${YELLOW}Generating HTML report...${NC}"
LATEST_REPORT=$(ls -t load-test-reports/*.json | head -1)

if [ -f "$LATEST_REPORT" ]; then
    artillery report \
      "$LATEST_REPORT" \
      --output "load-test-reports/report-$(date +%Y%m%d-%H%M%S).html"
    
    echo -e "${GREEN}✓ Report generated successfully${NC}"
    echo -e "View report: ${LATEST_REPORT%.json}.html"
else
    echo -e "${RED}❌ No report file found${NC}"
fi

echo -e "\n${GREEN}🎉 Load test complete!${NC}"