#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting CV Builder Unified Development Server${NC}"
echo ""

# Function to ensure we're in the correct directory
ensure_correct_directory() {
  local script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
  local project_dir="$(dirname "$script_dir")"
  
  echo -e "${YELLOW}📂 Ensuring correct directory...${NC}"
  
  if [ ! -f "$project_dir/package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found in $project_dir${NC}"
    echo "Please run this script from the CV Builder project root directory."
    exit 1
  fi
  
  cd "$project_dir"
  echo -e "${GREEN}✅ Working in: $(pwd)${NC}"
  echo ""
}

# Function to check if port is in use
check_port() {
  local port=$1
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    return 0
  else
    return 1
  fi
}

# Function to kill existing processes
cleanup_existing_servers() {
  echo -e "${YELLOW}🧹 Cleaning up existing servers...${NC}"
  
  # Kill any existing Next.js dev servers
  pkill -f "next dev" 2>/dev/null || true
  
  # Wait a moment for processes to terminate
  sleep 2
  
  # Check if port 3000 is still in use
  if check_port 3000; then
    echo -e "${YELLOW}⚠️ Port 3000 still in use. Attempting to free it...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
  fi
  
  echo -e "${GREEN}✅ Cleanup completed${NC}"
  echo ""
}

# Function to check dependencies
check_dependencies() {
  echo -e "${YELLOW}📦 Checking dependencies...${NC}"
  
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️ node_modules not found. Installing dependencies...${NC}"
    npm install
  fi
  
  echo -e "${GREEN}✅ Dependencies ready${NC}"
  echo ""
}

# Function to clear cache
clear_cache() {
  echo -e "${YELLOW}🗑️ Clearing Next.js cache...${NC}"
  
  rm -rf .next 2>/dev/null || true
  rm -rf node_modules/.cache 2>/dev/null || true
  
  echo -e "${GREEN}✅ Cache cleared${NC}"
  echo ""
}

# Function to wait for server to be ready
wait_for_server() {
  local port=3000
  local max_attempts=30
  local attempt=1
  
  echo -e "${YELLOW}⏳ Waiting for server to be ready on port $port...${NC}"
  
  while [ $attempt -le $max_attempts ]; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$port 2>/dev/null | grep -q "200\|302\|404\|308"; then
      echo -e "${GREEN}✅ Server is responding on port $port${NC}"
      return 0
    fi
    
    if [ $((attempt % 5)) -eq 0 ]; then
      echo -e "${YELLOW}   Attempt $attempt/$max_attempts - still waiting...${NC}"
    fi
    
    sleep 1
    ((attempt++))
  done
  
  echo -e "${RED}❌ Server failed to start within 30 seconds${NC}"
  return 1
}

# Function to display server info
show_server_info() {
  echo ""
  echo -e "${GREEN}🎉 CV Builder Server Started Successfully!${NC}"
  echo ""
  echo -e "${BLUE}📍 Server Information:${NC}"
  echo -e "   🌐 Local:     http://localhost:3000"
  echo -e "   📁 Directory: $(pwd)"
  echo -e "   ⏰ Started:   $(date)"
  echo ""
  echo -e "${BLUE}🔗 Quick Links:${NC}"
  echo -e "   🏠 Landing Page:     http://localhost:3000"
  echo -e "   🔐 Login:            http://localhost:3000/login"
  echo -e "   📝 Register:         http://localhost:3000/register"
  echo -e "   💼 CV Workspace:     http://localhost:3000/cv-workspace"
  echo -e "   📄 CV Upload:        http://localhost:3000/cv-upload"
  echo -e "   ✏️ CV Guided Edit:   http://localhost:3000/cv-guided-editing"
  echo ""
  echo -e "${BLUE}⚡ Management Commands:${NC}"
  echo -e "   📊 Status:    npm run status"
  echo -e "   🔍 Check:     npm run check"
  echo -e "   🔄 Restart:   npm run restart"
  echo -e "   🛑 Stop:      npm run stop"
  echo ""
  echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
}

# Function to run comprehensive health check
run_health_check() {
  echo -e "${YELLOW}🏥 Running health checks...${NC}"
  
  # Test key pages
  local pages=("/" "/login" "/register" "/cv-workspace")
  local all_passed=true
  
  for page in "${pages[@]}"; do
    local status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$page" 2>/dev/null || echo "000")
    
    case $status in
      200|302|308) 
        echo -e "   ✅ $page (Status: $status)"
        ;;
      *)
        echo -e "   ❌ $page (Status: $status)"
        all_passed=false
        ;;
    esac
  done
  
  if [ "$all_passed" = true ]; then
    echo -e "${GREEN}✅ All health checks passed${NC}"
  else
    echo -e "${YELLOW}⚠️ Some pages returned unexpected status codes${NC}"
  fi
  
  echo ""
}

# Main execution
main() {
  # Ensure we're in the right place
  ensure_correct_directory
  
  # Clean up any existing servers
  cleanup_existing_servers
  
  # Check dependencies
  check_dependencies
  
  # Clear cache for clean start
  clear_cache
  
  # Start the development server
  echo -e "${BLUE}🚀 Starting Next.js development server...${NC}"
  echo ""
  
  # Start server in background
  npm run dev &
  local server_pid=$!
  
  # Wait for server to be ready
  if wait_for_server; then
    # Run health check
    run_health_check
    
    # Show server information
    show_server_info
    
    # Wait for the server process (foreground)
    wait $server_pid
  else
    echo -e "${RED}❌ Failed to start server${NC}"
    kill $server_pid 2>/dev/null || true
    exit 1
  fi
}

# Handle script interruption
trap 'echo -e "\n${YELLOW}🛑 Stopping server...${NC}"; pkill -f "next dev" 2>/dev/null || true; exit 0' INT

# Run main function
main 