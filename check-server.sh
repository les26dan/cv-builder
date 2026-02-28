#!/bin/bash

# Always run from the OkBuddy project directory
cd "$(dirname "$0")" || exit 1

echo "🔍 Checking OkBuddy Server Status..."
echo "📁 Working from: $(pwd)"
echo ""

# Test key pages
echo "Testing pages:"
echo "   🏠 Landing:    $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>/dev/null || echo 'FAIL')"
echo "   🔐 Login:      $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login 2>/dev/null || echo 'FAIL')"
echo "   📝 Register:   $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/register 2>/dev/null || echo 'FAIL')"
echo "   💼 Workspace:  $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/cv-workspace 2>/dev/null || echo 'FAIL')"
echo "   📄 Upload:     $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/cv-upload 2>/dev/null || echo 'FAIL')"
echo ""

# Check if server is responding
if curl -s http://localhost:3000 >/dev/null 2>&1; then
  echo "✅ Server is responding on http://localhost:3000"
else
  echo "❌ Server is not responding"
  echo "💡 Try: npm run dev (from project directory)"
fi 