#!/bin/bash
# OkBuddy Page Rendering Validation Script
# Prevents pages from showing raw text instead of styled UI

echo "🚨 OkBuddy Page Rendering Validation"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

echo ""
echo "📋 Checking for FORBIDDEN anti-patterns..."

# Check for loading state gates
echo -n "❌ Loading State Gates: "
LOADING_STATES=$(grep -r "useState.*[Ll]oad\|setIsLoaded\|setMounted\|setReady" app/ 2>/dev/null || true)
if [[ -n "$LOADING_STATES" ]]; then
    echo -e "${RED}FOUND${NC}"
    echo "$LOADING_STATES"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}NONE${NC}"
fi

# Check for conditional rendering
echo -n "❌ Conditional Page Rendering: "
CONDITIONAL_RENDERING=$(grep -r "return.*null\|return.*Loading\|return mounted" app/ 2>/dev/null || true)
if [[ -n "$CONDITIONAL_RENDERING" ]]; then
    echo -e "${RED}FOUND${NC}"
    echo "$CONDITIONAL_RENDERING"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}NONE${NC}"
fi

# Check for service worker in components
echo -n "❌ Service Worker in Components: "
SERVICE_WORKER=$(grep -r "serviceWorker.*getRegistrations" app/ 2>/dev/null || true)
if [[ -n "$SERVICE_WORKER" ]]; then
    echo -e "${RED}FOUND${NC}"
    echo "$SERVICE_WORKER"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}NONE${NC}"
fi

echo ""
echo "🛠️ Checking build and SSR..."

# Check build
echo -n "✅ Build Status: "
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}SUCCESS${NC}"
else
    echo -e "${RED}FAILED${NC}"
    ERRORS=$((ERRORS+1))
fi

# Check if dev server is running
echo -n "🌐 Dev Server: "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}RUNNING${NC}"
    
    # Check SSR output
    echo -n "🎨 SSR Styled Content: "
    if curl -s http://localhost:3000 | grep -q "class="; then
        echo -e "${GREEN}VERIFIED${NC}"
    else
        echo -e "${RED}NO CLASSES FOUND${NC}"
        ERRORS=$((ERRORS+1))
    fi
else
    echo -e "${YELLOW}NOT RUNNING${NC} (Run 'npm run dev' to test SSR)"
fi

echo ""
echo "📊 Validation Summary"
echo "==================="

if [[ $ERRORS -eq 0 ]]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
    echo "🎉 All OkBuddy pages follow correct rendering patterns!"
else
    echo -e "${RED}❌ $ERRORS ISSUES FOUND${NC}"
    echo ""
    echo "🔧 Quick fixes:"
    echo "1. Remove loading state logic: useState/useEffect for rendering"
    echo "2. Remove conditional returns: if (!loaded) return null"
    echo "3. Move service worker logic outside components"
    echo "4. Ensure components render JSX immediately"
    echo ""
    echo "📖 See /Heimdall/cursor-guide.md for detailed instructions"
fi

echo ""
echo "🚨 Remember: Never add loading state gates to page components!"
echo "✅ Always render content immediately for proper SSR"

exit $ERRORS 