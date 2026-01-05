# AI Chat - Quick Start Guide

## 🎯 What You Need to Do (15 minutes)

The AI chat feature is **95% complete**. Here are the final steps:

### Option 1: Guided Deployment (Recommended)

Run the deployment script and follow the prompts:

```bash
./deploy-chat.sh
```

This script will guide you through each step interactively.

### Option 2: Manual Deployment

Follow these steps in order:

---

## Step 1: Apply Database Migration (3 min)

1. Open Supabase Dashboard → SQL Editor:
   https://supabase.com/dashboard/project/kpgzmpqkcuymlstgxyde/sql/new

2. Copy the contents of `supabase/migrations/001_chat_tables.sql`

3. Paste into the SQL Editor

4. Click **Run**

5. Verify: Check **Table Editor** - you should see 3 new tables:
   - `conversations`
   - `messages`
   - `ai_context_cache`

---

## Step 2: Get Anthropic API Key (5 min)

1. Go to https://console.anthropic.com/

2. Sign up or log in

3. Click **Settings** → **API Keys**

4. Click **Create Key**

5. Copy the key (starts with `sk-ant-`)

6. **Save it somewhere** - you won't see it again!

### Pricing:
- Claude 3.5 Sonnet: $3/MTok input, $15/MTok output
- Estimated: $40-50/month for 100 users

---

## Step 3: Add API Key to Supabase (2 min)

1. Go to Supabase Dashboard → Settings → Secrets:
   https://supabase.com/dashboard/project/kpgzmpqkcuymlstgxyde/settings/vault/secrets

2. Click **New Secret**

3. Enter:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** Your API key from Step 2

4. Click **Add Secret**

---

## Step 4: Deploy Edge Function (5 min)

### Option A: Using the script (easiest)
```bash
./deploy-chat.sh
```

### Option B: Manual commands
```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref kpgzmpqkcuymlstgxyde

# Deploy the function
npx supabase functions deploy chat-completion
```

---

## Step 5: Test It! (5 min)

1. Open your app: http://localhost:5173/

2. **Sign up** as a new user (or log in)

3. Look for the **chat button** in the bottom-right corner

4. Click it to open the chat

5. Send a message: "Hello!"

6. You should get a response from the AI assistant

### Expected Behavior:
- **Homeowner** (no business): Gets Service Assistant
- **Business Owner**: Gets Sales Assistant

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Chat widget appears when logged in
- [ ] Chat opens and closes smoothly
- [ ] Can type and send messages
- [ ] AI responds within 3-5 seconds
- [ ] Messages persist across page navigation
- [ ] No errors in browser console
- [ ] No errors in Supabase Edge Function logs

---

## 🐛 Troubleshooting

### Chat widget doesn't appear
- Make sure you're logged in
- Check browser console for errors
- Verify `ChatProvider` is in App.jsx

### AI doesn't respond
- Check Supabase Edge Function logs:
  https://supabase.com/dashboard/project/kpgzmpqkcuymlstgxyde/functions/chat-completion/logs

- Verify `ANTHROPIC_API_KEY` is set in Supabase secrets
- Test the edge function directly with curl

### "Database error" messages
- Verify migration was applied successfully
- Check RLS policies are enabled
- Ensure user is authenticated

### Edge function deployment fails
- Make sure you're logged in: `npx supabase login`
- Verify project link: `npx supabase link --project-ref kpgzmpqkcuymlstgxyde`
- Check function syntax: `deno check supabase/functions/chat-completion/index.ts`

---

## 🧪 Running Tests

After deployment, run the E2E tests:

```bash
npm run test:e2e -- tests/chat.spec.js
```

This will test:
- Widget visibility
- Open/close functionality
- Message sending
- Navigation persistence
- Mobile responsiveness

---

## 📊 Monitoring

### Watch API Usage
Monitor costs at: https://console.anthropic.com/settings/usage

### Check Edge Function Logs
View logs at: https://supabase.com/dashboard/project/kpgzmpqkcuymlstgxyde/functions/chat-completion/logs

### Database Activity
Check messages at: https://supabase.com/dashboard/project/kpgzmpqkcuymlstgxyde/editor

---

## 🚀 What's Next?

Once deployed, you can:

1. **Customize AI Prompts:** Edit system prompts in `chat-completion/index.ts`
2. **Add Features:** Conversation history, delete conversations, export chats
3. **Optimize Costs:** Implement caching, rate limiting, context trimming
4. **Analytics:** Track conversation quality, user satisfaction, conversion rates

---

## 📚 Full Documentation

For detailed information, see:
- `CHAT_DEPLOYMENT_GUIDE.md` - Complete deployment guide
- Implementation plan in `.claude/plans/harmonic-yawning-scroll.md`

---

## Need Help?

- **Supabase Docs:** https://supabase.com/docs
- **Anthropic Docs:** https://docs.anthropic.com/
- **Edge Function Logs:** Check for specific error messages
- **Browser Console:** Look for frontend errors

---

**Estimated Total Time:** 15-20 minutes

Let's get your AI chat live! 🎉
