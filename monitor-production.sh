#!/bin/bash

# 🚀 OKBUDDY PRODUCTION MONITORING TOOLKIT
# ========================================
# Easy access to all production monitoring tools

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$SCRIPT_DIR/scripts"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

show_header() {
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     🚀 OKBUDDY PRODUCTION MONITOR     ║${NC}"
    echo -e "${BLUE}║          https://www.okbuddy.io        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
}

show_menu() {
    echo -e "${CYAN}Available Commands:${NC}"
    echo ""
    echo -e "${GREEN}1. collect${NC}     - Collect current production data"
    echo -e "${GREEN}2. live${NC}        - Start live monitoring dashboard"
    echo -e "${GREEN}3. analyze${NC}     - Analyze collected logs and generate insights"
    echo -e "${GREEN}4. export${NC}      - Export data to CSV for external analysis"
    echo -e "${GREEN}5. status${NC}      - Quick status check"
    echo -e "${GREEN}6. help${NC}        - Show detailed help"
    echo ""
    echo -e "${YELLOW}Usage: ./monitor-production.sh [command] [options]${NC}"
    echo ""
}

collect_data() {
    echo -e "${PURPLE}📊 COLLECTING PRODUCTION DATA${NC}"
    echo "================================="
    
    local days=${1:-7}
    echo -e "Collecting data for the last ${CYAN}${days}${NC} days..."
    echo ""
    
    node "$SCRIPTS_DIR/production-log-collector.js" --days "$days"
}

start_live_monitor() {
    echo -e "${RED}🔴 STARTING LIVE MONITOR${NC}"
    echo "========================"
    echo -e "Monitoring ${CYAN}https://www.okbuddy.io${NC} in real-time..."
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""
    
    node "$SCRIPTS_DIR/live-monitor.js"
}

analyze_logs() {
    echo -e "${PURPLE}🧠 ANALYZING PRODUCTION LOGS${NC}"
    echo "============================="
    
    local export_flag=""
    local days=7
    
    # Parse arguments
    for arg in "$@"; do
        case $arg in
            --export-csv)
                export_flag="--export-csv"
                ;;
            --days=*)
                days="${arg#*=}"
                ;;
        esac
    done
    
    echo -e "Analyzing data for the last ${CYAN}${days}${NC} days..."
    if [[ -n "$export_flag" ]]; then
        echo -e "Will export results to ${CYAN}CSV${NC}"
    fi
    echo ""
    
    node "$SCRIPTS_DIR/analyze-logs.js" $export_flag --days "$days"
}

export_data() {
    echo -e "${GREEN}📄 EXPORTING DATA TO CSV${NC}"
    echo "========================"
    
    analyze_logs --export-csv "$@"
}

quick_status() {
    echo -e "${BLUE}⚡ QUICK STATUS CHECK${NC}"
    echo "===================="
    echo ""
    
    echo -e "${CYAN}🌐 Testing production endpoint...${NC}"
    
    if curl -s --max-time 10 "https://www.okbuddy.io/api/analytics/dashboard?environment=production&days=1" > /dev/null; then
        echo -e "${GREEN}✅ Production site is responding${NC}"
        
        # Get quick metrics
        local response=$(curl -s --max-time 10 "https://www.okbuddy.io/api/analytics/dashboard?environment=production&days=1")
        local sessions=$(echo "$response" | grep -o '"totalSessions":[0-9]*' | cut -d':' -f2 || echo "0")
        local errors=$(echo "$response" | grep -o '"totalErrors":[0-9]*' | cut -d':' -f2 || echo "0")
        
        echo -e "${CYAN}📊 Quick Metrics:${NC}"
        echo -e "   Sessions: ${sessions}"
        echo -e "   Errors: ${errors}"
        
        if [[ "$sessions" -gt 0 ]]; then
            echo -e "${GREEN}🎉 User activity detected!${NC}"
        else
            echo -e "${YELLOW}⏳ No user activity yet - share the site with friends!${NC}"
        fi
    else
        echo -e "${RED}❌ Production site is not responding${NC}"
        echo -e "${YELLOW}💡 Check your internet connection or Vercel deployment status${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}📁 Local log files:${NC}"
    local log_dir="$SCRIPT_DIR/logs/production-analysis"
    if [[ -d "$log_dir" ]]; then
        local file_count=$(find "$log_dir" -name "*.json" | wc -l)
        echo -e "   Found ${file_count} analysis files in logs/production-analysis/"
    else
        echo -e "   No log files found - run 'collect' to start gathering data"
    fi
}

show_help() {
    show_header
    echo -e "${CYAN}DETAILED HELP${NC}"
    echo "============="
    echo ""
    echo -e "${GREEN}COMMANDS:${NC}"
    echo ""
    echo -e "${YELLOW}collect [days]${NC}"
    echo "   Collect production data from the last N days (default: 7)"
    echo "   Example: ./monitor-production.sh collect 3"
    echo ""
    echo -e "${YELLOW}live${NC}"
    echo "   Start real-time monitoring dashboard"
    echo "   Updates every 30 seconds, press Ctrl+C to stop"
    echo ""
    echo -e "${YELLOW}analyze [--export-csv] [--days=N]${NC}"
    echo "   Analyze collected logs and generate insights"
    echo "   --export-csv: Also export data to CSV format"
    echo "   --days=N: Analyze last N days (default: 7)"
    echo "   Example: ./monitor-production.sh analyze --export-csv --days=14"
    echo ""
    echo -e "${YELLOW}export [--days=N]${NC}"
    echo "   Export data to CSV for external analysis"
    echo "   Example: ./monitor-production.sh export --days=30"
    echo ""
    echo -e "${YELLOW}status${NC}"
    echo "   Quick health check of production site and local logs"
    echo ""
    echo -e "${GREEN}WORKFLOW:${NC}"
    echo ""
    echo "1. Share https://www.okbuddy.io with friends to generate user data"
    echo "2. Run 'collect' to gather initial data"
    echo "3. Use 'live' to monitor in real-time"
    echo "4. Run 'analyze' regularly to get insights"
    echo "5. Use 'export' to get data for external tools"
    echo ""
    echo -e "${GREEN}FILES CREATED:${NC}"
    echo ""
    echo "• logs/production-analysis/ - All collected data and reports"
    echo "• *.json files - Raw data and analysis reports"
    echo "• *.csv files - Exported data for spreadsheets"
    echo ""
}

# Main script logic
case "${1:-help}" in
    collect)
        show_header
        collect_data "${2:-7}"
        ;;
    live)
        show_header
        start_live_monitor
        ;;
    analyze)
        show_header
        shift # Remove 'analyze' from arguments
        analyze_logs "$@"
        ;;
    export)
        show_header
        shift # Remove 'export' from arguments
        export_data "$@"
        ;;
    status)
        show_header
        quick_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_header
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        show_menu
        echo -e "${YELLOW}💡 Run './monitor-production.sh help' for detailed information${NC}"
        exit 1
        ;;
esac
