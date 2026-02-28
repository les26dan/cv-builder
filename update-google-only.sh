#!/bin/bash

echo "🔐 Updating Google OAuth credentials only..."

echo -n "Enter Google Client Secret: "
read -s GOOGLE_CLIENT_SECRET
echo ""

# Update .env.local with Google credentials
sed -i.bak "s/GOOGLE_CLIENT_ID=.*/GOOGLE_CLIENT_ID=\"48074307177-en1o9913i3ekj4qc4sjve1ivmli8n372.apps.googleusercontent.com\"/" .env.local
sed -i.bak "s/GOOGLE_CLIENT_SECRET=.*/GOOGLE_CLIENT_SECRET=\"$GOOGLE_CLIENT_SECRET\"/" .env.local

echo "✅ Google OAuth credentials updated!"
echo ""
echo "🔍 Testing Google OAuth..."

# Restart server to pick up new credentials
./stop-server && ./start-server &
sleep 3

# Test Google OAuth endpoint
GOOGLE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/auth/google/signin")
if [ "$GOOGLE_RESPONSE" = "302" ]; then
    echo "✅ Google OAuth working! Try: http://localhost:3000/login"
else
    echo "❌ Google OAuth failed (HTTP $GOOGLE_RESPONSE)"
fi