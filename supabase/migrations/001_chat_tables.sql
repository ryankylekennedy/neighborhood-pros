-- AI Chat Messenger Feature - Database Migration
-- Creates tables for conversations, messages, and AI context caching
-- Run this in Supabase Dashboard > SQL Editor

-- =====================================================
-- TABLE: conversations
-- Purpose: Store chat threads/sessions
-- =====================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('service_assistant', 'sales_assistant')),
  title TEXT, -- Auto-generated from first message
  metadata JSONB DEFAULT '{}', -- Store user context, preferences, state
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_type ON conversations(conversation_type);

-- =====================================================
-- TABLE: messages
-- Purpose: Store individual chat messages
-- =====================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- Store tool calls, business references, etc.
  tokens_used INTEGER, -- Track token usage for cost monitoring
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- =====================================================
-- TABLE: ai_context_cache
-- Purpose: Cache business/neighborhood data for AI to reduce DB queries
-- =====================================================

CREATE TABLE ai_context_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL CHECK (context_type IN ('neighborhood', 'favorites', 'businesses', 'categories')),
  context_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_ai_context_user_id ON ai_context_cache(user_id);
CREATE INDEX idx_ai_context_expires ON ai_context_cache(expires_at);
CREATE INDEX idx_ai_context_type ON ai_context_cache(context_type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_context_cache ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies: conversations
-- Users can only access their own conversations
-- =====================================================

CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- RLS Policies: messages
-- Users can only access messages in their own conversations
-- =====================================================

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Note: Users typically won't update or delete individual messages
-- Messages are immutable for conversation integrity
-- If needed, add UPDATE/DELETE policies similar to INSERT

-- =====================================================
-- RLS Policies: ai_context_cache
-- Users can only access their own cached context
-- =====================================================

CREATE POLICY "Users can view their own context cache"
  ON ai_context_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own context cache"
  ON ai_context_cache FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS (Optional but useful)
-- =====================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update conversations.updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired cache entries (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_context_cache
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION QUERIES (Optional - for testing)
-- =====================================================

-- Uncomment to verify tables were created:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('conversations', 'messages', 'ai_context_cache');

-- Uncomment to verify RLS policies:
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('conversations', 'messages', 'ai_context_cache');
