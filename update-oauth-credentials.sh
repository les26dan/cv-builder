#!/bin/bash

echo "🔐 Updating OAuth credentials in .env.local..."

# Backup current .env.local
cp .env.local .env.local.backup

echo ""
echo "📋 PASTE YOUR CREDENTIALS WHEN PROMPTED:"
echo ""

# Get Google credentials
echo -n "Enter Google Client ID: "
read GOOGLE_CLIENT_ID
echo -n "Enter Google Client Secret: "
read -s GOOGLE_CLIENT_SECRET
echo ""

# Get LinkedIn credentials  
echo -n "Enter LinkedIn Client ID: "
read LINKEDIN_CLIENT_ID
echo -n "Enter LinkedIn Client Secret: "
read -s LINKEDIN_CLIENT_SECRET
echo ""

# Update .env.local file
sed -i.bak "s/GOOGLE_CLIENT_ID=.*/GOOGLE_CLIENT_ID=\"$GOOGLE_CLIENT_ID\"/" .env.local
sed -i.bak "s/GOOGLE_CLIENT_SECRET=.*/GOOGLE_CLIENT_SECRET=\"$GOOGLE_CLIENT_SECRET\"/" .env.local
sed -i.bak "s/LINKEDIN_CLIENT_ID=.*/LINKEDIN_CLIENT_ID=\"$LINKEDIN_CLIENT_ID\"/" .env.local
sed -i.bak "s/LINKEDIN_CLIENT_SECRET=.*/LINKEDIN_CLIENT_SECRET=\"$LINKEDIN_CLIENT_SECRET\"/" .env.local

echo "✅ OAuth credentials updated successfully!"
echo ""
echo "🔍 Validating setup..."
node validate-oauth-setup.js