#!/bin/bash

# Pre-Deployment Checklist Script
# Verifies that all files are in place before deploying

echo "================================================"
echo "AI Chat Feature - Pre-Deployment Check"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ERRORS=0

# Check database migration file
echo -n "Checking database migration file... "
if [ -f "supabase/migrations/001_chat_tables.sql" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check edge function
echo -n "Checking edge function... "
if [ -f "supabase/functions/chat-completion/index.ts" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check React hooks
echo -n "Checking useChat hook... "
if [ -f "src/hooks/useChat.js" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo -n "Checking useChatWidget hook... "
if [ -f "src/hooks/useChatWidget.js" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo -n "Checking useChatContext hook... "
if [ -f "src/hooks/useChatContext.jsx" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check React components
echo -n "Checking ChatWidget component... "
if [ -f "src/components/Chat/ChatWidget.jsx" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo -n "Checking ChatInterface component... "
if [ -f "src/components/Chat/ChatInterface.jsx" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo -n "Checking MessageBubble component... "
if [ -f "src/components/Chat/MessageBubble.jsx" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo -n "Checking ChatInput component... "
if [ -f "src/components/Chat/ChatInput.jsx" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo -n "Checking TypingIndicator component... "
if [ -f "src/components/Chat/TypingIndicator.jsx" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check integration
echo -n "Checking App.jsx integration... "
if grep -q "ChatProvider" src/App.jsx && grep -q "ChatWidget" src/App.jsx; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Not integrated${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check environment variables
echo -n "Checking .env file... "
if grep -q "VITE_CHAT_ENABLED" .env; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Missing chat config${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check E2E tests
echo -n "Checking E2E tests... "
if [ -f "tests/chat.spec.js" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check Supabase CLI
echo -n "Checking Supabase CLI... "
if command -v npx &> /dev/null && npx supabase --version &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check dependencies
echo -n "Checking date-fns dependency... "
if grep -q "date-fns" package.json; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "================================================"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "You're ready to deploy. Next steps:"
    echo "1. Run: ./deploy-chat.sh"
    echo "2. Or follow: QUICK_START.md"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Found $ERRORS error(s)${NC}"
    echo ""
    echo "Please fix the errors above before deploying."
    echo ""
    exit 1
fi
