#!/bin/bash

echo "🔐 Testing OkBuddy Authentication & Protected Pages"
echo ""

# Function to test page with session cookie
test_with_auth() {
  local url=$1
  local page_name=$2
  
  # Test without authentication (should redirect)
  local no_auth_status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  
  # Test with mock session cookie (simulates authenticated user)
  local mock_session='{"id":"test-user-123","email":"test@example.com","name":"Test User","provider":"email"}'
  local auth_status=$(curl -s -o /dev/null -w "%{http_code}" -H "Cookie: user_session=$(echo $mock_session | base64)" "$url")
  
  echo "   $page_name:"
  echo "     Without auth: $no_auth_status (should be 307 redirect)"
  echo "     With auth: $auth_status (should be 200 or higher)"
  echo ""
}

echo "🌐 Testing Public Pages (should always work):"
echo "   Landing Page: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/)"
echo "   Login Page: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login/)"
echo "   Register Page: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/register/)"
echo ""

echo "🔒 Testing Protected Pages (should redirect without auth):"
test_with_auth "http://localhost:3000/cv-workspace/" "CV Workspace"
test_with_auth "http://localhost:3000/cv-upload/" "CV Upload"  
test_with_auth "http://localhost:3000/cv-guided-editing/" "CV Guided Editing"
test_with_auth "http://localhost:3000/admin/" "Admin Dashboard"

echo "✅ Authentication flow testing complete!"
echo ""
echo "📝 Expected Results:"
echo "  • Public pages: 200 (working)"
echo "  • Protected pages without auth: 307 (redirecting to login)"
echo "  • Protected pages with auth: 200+ (working)"
echo ""
echo "🚀 If all tests show expected results, the authentication system is working correctly!" 