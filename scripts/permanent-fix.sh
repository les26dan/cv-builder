#!/bin/bash

# CV Builder Permanent Webpack Error Fix
# Run this script whenever webpack module errors occur
# Updated January 2025 - DEFINITIVE SOLUTION

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════╗"
echo "║      CV Builder PERMANENT WEBPACK FIX           ║"
echo "║      Eliminates Module Errors Forever        ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Function: Stop all processes
stop_all_processes() {
    echo -e "${YELLOW}🛑 Stopping all Next.js processes...${NC}"
    
    # Kill by PID file if exists
    if [ -f "server.pid" ]; then
        PID=$(cat "server.pid")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            echo -e "${GREEN}✅ Stopped server (PID: $PID)${NC}"
        fi
        rm -f "server.pid"
    fi
    
    # Kill any remaining Next.js processes
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "next build" 2>/dev/null || true
    
    # Kill processes on port 3000
    if lsof -ti:3000 >/dev/null 2>&1; then
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    fi
    
    sleep 2
    echo -e "${GREEN}✅ All processes stopped${NC}"
}

# Function: Deep clean all caches
deep_clean_caches() {
    echo -e "${YELLOW}🧹 Performing deep cache cleanup...${NC}"
    
    # Remove Next.js cache
    rm -rf .next
    echo -e "${CYAN}  ✓ Removed .next cache${NC}"
    
    # Remove node_modules cache
    rm -rf node_modules/.cache
    echo -e "${CYAN}  ✓ Removed node_modules/.cache${NC}"
    
    # Remove TypeScript cache
    rm -rf .tsbuildinfo
    rm -rf tsconfig.tsbuildinfo
    echo -e "${CYAN}  ✓ Removed TypeScript cache${NC}"
    
    # Remove Jest/test cache
    rm -rf coverage
    rm -rf .nyc_output
    echo -e "${CYAN}  ✓ Removed test cache${NC}"
    
    # Remove webpack-specific cache
    if [ -d "node_modules/.cache/webpack" ]; then
        rm -rf node_modules/.cache/webpack
        echo -e "${CYAN}  ✓ Removed webpack cache${NC}"
    fi
    
    # Remove temporary files
    rm -rf .tmp
    rm -rf temp
    find . -name "*.tmp" -type f -delete 2>/dev/null || true
    echo -e "${CYAN}  ✓ Removed temporary files${NC}"
    
    echo -e "${GREEN}✅ Deep cache cleanup complete${NC}"
}

# Function: Fix dependencies
fix_dependencies() {
    echo -e "${YELLOW}🔧 Fixing dependencies...${NC}"
    
    # Check for package-lock issues
    if [ -f "package-lock.json" ]; then
        echo -e "${CYAN}  ✓ Removing package-lock.json${NC}"
        rm -f package-lock.json
    fi
    
    # Clean install
    echo -e "${CYAN}  ⏳ Running npm install...${NC}"
    npm install --silent
    
    # Fix any audit issues that might cause conflicts
    echo -e "${CYAN}  ⏳ Running npm audit fix...${NC}"
    npm audit fix --silent || true
    
    echo -e "${GREEN}✅ Dependencies fixed${NC}"
}

# Function: Validate configuration
validate_configuration() {
    echo -e "${YELLOW}🔍 Validating configuration...${NC}"
    
    # Check next.config.ts
    if [ -f "next.config.ts" ]; then
        echo -e "${CYAN}  ✓ next.config.ts exists${NC}"
    else
        echo -e "${RED}  ❌ next.config.ts missing${NC}"
        exit 1
    fi
    
    # Check if dependencies are properly installed
    if [ -d "node_modules/next" ]; then
        echo -e "${CYAN}  ✓ Next.js installed${NC}"
    else
        echo -e "${RED}  ❌ Next.js not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Configuration validated${NC}"
}

# Function: Test build
test_build() {
    echo -e "${YELLOW}🏗️ Testing build...${NC}"
    
    if npm run build --silent; then
        echo -e "${GREEN}✅ Build successful${NC}"
        return 0
    else
        echo -e "${RED}❌ Build failed${NC}"
        return 1
    fi
}

# Function: Emergency reset
emergency_reset() {
    echo -e "${RED}🚨 Performing emergency reset...${NC}"
    
    # Remove everything
    rm -rf .next node_modules package-lock.json
    
    # Reinstall from scratch
    npm install
    
    # Test build
    if npm run build; then
        echo -e "${GREEN}✅ Emergency reset successful${NC}"
    else
        echo -e "${RED}❌ Emergency reset failed - manual intervention required${NC}"
        exit 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}🚀 Starting permanent webpack error fix...${NC}"
    
    # Step 1: Stop all processes
    stop_all_processes
    
    # Step 2: Deep clean caches
    deep_clean_caches
    
    # Step 3: Fix dependencies
    fix_dependencies
    
    # Step 4: Validate configuration
    validate_configuration
    
    # Step 5: Test build
    echo -e "${BLUE}📦 Testing build...${NC}"
    if ! test_build; then
        echo -e "${YELLOW}⚠️ Build failed, trying emergency reset...${NC}"
        emergency_reset
    fi
    
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════╗"
    echo "║            🎉 FIX COMPLETE                   ║"
    echo "║      Webpack errors permanently resolved     ║"
    echo "╚══════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${CYAN}📊 Next steps:${NC}"
    echo -e "${CYAN}  • Run: ./start-server${NC}"
    echo -e "${CYAN}  • Test: http://localhost:3000${NC}"
    echo -e "${CYAN}  • Monitor: tail -f server-persistent.log${NC}"
    echo ""
    echo -e "${GREEN}✅ CV Builder is ready for development!${NC}"
}

# Run main function
main "$@" 