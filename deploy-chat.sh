#!/bin/bash

# AI Chat Feature - Deployment Script
# This script guides you through deploying the chat feature

set -e

echo "================================================"
echo "AI Chat Feature - Deployment Guide"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Database Migration${NC}"
echo "You need to manually apply the database migration in Supabase Dashboard."
echo ""
echo "Instructions:"
echo "1. Go to: https://supabase.com/dashboard/project/kpgzmpqkcuymlstgxyde"
echo "2. Navigate to SQL Editor (left sidebar)"
echo "3. Click 'New Query'"
echo "4. Copy and paste the contents of: supabase/migrations/001_chat_tables.sql"
echo "5. Click 'Run'"
echo ""
read -p "Have you completed the database migration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${RED}Please complete the database migration before continuing.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Database migration completed${NC}"
echo ""

echo -e "${YELLOW}Step 2: Anthropic API Key${NC}"
echo "You need to get an API key from Anthropic."
echo ""
echo "Instructions:"
echo "1. Go to: https://console.anthropic.com/"
echo "2. Sign up or log in"
echo "3. Navigate to 'API Keys'"
echo "4. Click 'Create Key'"
echo "5. Copy the API key (starts with 'sk-ant-')"
echo ""
read -p "Do you have your Anthropic API key ready? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${RED}Please get your API key before continuing.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Anthropic API key obtained${NC}"
echo ""

echo -e "${YELLOW}Step 3: Add API Key to Supabase Secrets${NC}"
echo "You need to add the Anthropic API key to Supabase."
echo ""
echo "Instructions:"
echo "1. Go to: https://supabase.com/dashboard/project/kpgzmpqkcuymlstgxyde/settings/vault/secrets"
echo "2. Click 'New Secret'"
echo "3. Name: ANTHROPIC_API_KEY"
echo "4. Value: Your API key from Step 2"
echo "5. Click 'Add Secret'"
echo ""
read -p "Have you added the API key to Supabase secrets? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${RED}Please add the API key to Supabase secrets before continuing.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ API key added to Supabase secrets${NC}"
echo ""

echo -e "${YELLOW}Step 4: Login to Supabase CLI${NC}"
echo "Logging in to Supabase..."
npx supabase login

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to login to Supabase. Please try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Logged in to Supabase${NC}"
echo ""

echo -e "${YELLOW}Step 5: Link to Supabase Project${NC}"
echo "Linking to your Supabase project..."
npx supabase link --project-ref kpgzmpqkcuymlstgxyde

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to link to Supabase project. Please check your project reference.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Linked to Supabase project${NC}"
echo ""

echo -e "${YELLOW}Step 6: Deploy Edge Function${NC}"
echo "Deploying the chat-completion edge function..."
npx supabase functions deploy chat-completion

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to deploy edge function.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Edge function deployed successfully${NC}"
echo ""

echo "================================================"
echo -e "${GREEN}Deployment Complete! 🎉${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Test the chat feature by logging into your app"
echo "2. Run E2E tests: npm run test:e2e -- tests/chat.spec.js"
echo "3. Monitor edge function logs in Supabase Dashboard"
echo "4. Check Anthropic Console for API usage"
echo ""
echo "Troubleshooting:"
echo "- Edge function logs: https://supabase.com/dashboard/project/kpgzmpqkcuymlstgxyde/functions"
echo "- Database tables: https://supabase.com/dashboard/project/kpgzmpqkcuymlstgxyde/editor"
echo "- Anthropic usage: https://console.anthropic.com/settings/usage"
echo ""
echo "Full documentation: See CHAT_DEPLOYMENT_GUIDE.md"
