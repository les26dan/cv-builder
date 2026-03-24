#!/bin/bash

echo "🧪 Testing OAuth flows..."
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Server not running. Starting server..."
    ./start-server
    echo "⏳ Waiting for server to start..."
    sleep 5
fi

echo "✅ Server is running"
echo ""

# Test Google OAuth initiation
echo "🟦 Testing Google OAuth initiation..."
GOOGLE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/auth/google/signin")
if [ "$GOOGLE_RESPONSE" = "302" ]; then
    echo "✅ Google OAuth signin endpoint working (redirects to Google)"
else
    echo "❌ Google OAuth signin failed (HTTP $GOOGLE_RESPONSE)"
fi

# Test LinkedIn OAuth initiation  
echo "🔵 Testing LinkedIn OAuth initiation..."
LINKEDIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/auth/linkedin/signin")
if [ "$LINKEDIN_RESPONSE" = "302" ]; then
    echo "✅ LinkedIn OAuth signin endpoint working (redirects to LinkedIn)"
else
    echo "❌ LinkedIn OAuth signin failed (HTTP $LINKEDIN_RESPONSE)"
fi

echo ""
echo "🌐 Manual Testing URLs:"
echo "Google OAuth:    http://localhost:3000/api/auth/google/signin"
echo "LinkedIn OAuth:  http://localhost:3000/api/auth/linkedin/signin"
echo "Login Page:      http://localhost:3000/login"
echo ""
echo "📝 Instructions:"
echo "1. Open http://localhost:3000/login in your browser"
echo "2. Click the Google or LinkedIn login buttons"
echo "3. Complete the OAuth flow"
echo "4. Verify you're logged in successfully"